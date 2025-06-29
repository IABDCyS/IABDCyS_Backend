import { Injectable, BadRequestException, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RoleUtilisateur, StatutUtilisateur, User as PrismaUser, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

type SafeUser = Omit<PrismaUser, 'password' | 'tokenVerificationEmail' | 'tokenResetMotDePasse' | 'expirationResetMotDePasse'>;

interface AuthResponse {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const { email, password, role = RoleUtilisateur.CANDIDAT, nom, prenom, telephone } = dto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await this.hashPassword(password);
    const verificationToken = this.generateToken();

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        nom,
        prenom,
        telephone,
        tokenVerificationEmail: verificationToken,
        statut: StatutUtilisateur.EN_ATTENTE,
      },
      select: {
        id: true,
        email: true,
        role: true,
        nom: true,
        prenom: true,
        statut: true,
        telephone: true,
        avatar: true,
        emailVerifie: true,
        creeA: true,
        modifieA: true,
        derniereConnexion: true,
      },
    });

    await this.createUserProfile(user.id, role);

    await this.mailService.sendVerificationEmail({
      to: [{ email: user.email, name: `${user.prenom} ${user.nom}` }],
      templateId: 1, // VERIFY_EMAIL template
      params: {
        verificationLink: `${this.config.get('FRONTEND_URL')}/verify-email?token=${verificationToken}`,
        userName: user.prenom,
      },
    });

    const token = this.generateJwtToken(user as SafeUser);

    const refreshToken = this.generateToken();
    return { 
      user: user as SafeUser, 
      accessToken: token,
      refreshToken
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        nom: true,
        prenom: true,
        statut: true,
        telephone: true,
        avatar: true,
        emailVerifie: true,
        creeA: true,
        modifieA: true,
        derniereConnexion: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.statut === StatutUtilisateur.EN_ATTENTE) {
      throw new BadRequestException('Please verify your email first');
    }

    if (user.statut === StatutUtilisateur.INACTIF) {
      throw new UnauthorizedException('Your account has been deactivated');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { derniereConnexion: new Date() },
    });

    const { password: _, ...userWithoutPassword } = user;
    const token = this.generateJwtToken(userWithoutPassword as SafeUser);

    const refreshToken = this.generateToken();
    return { 
      user: userWithoutPassword as SafeUser, 
      accessToken: token,
      refreshToken
    };
  }

  async getMe(userId: string): Promise<Omit<PrismaUser, 'password' | 'tokenVerificationEmail' | 'tokenResetMotDePasse' | 'expirationResetMotDePasse'>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        nom: true,
        prenom: true,
        statut: true,
        telephone: true,
        avatar: true,
        emailVerifie: true,
        creeA: true,
        modifieA: true,
        derniereConnexion: true,
        profilCandidat: true,
        profilCoordinateur: true,
        profilExaminateur: true,
        profilAdministrateur: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: { tokenVerificationEmail: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifie: true,
        tokenVerificationEmail: null,
        statut: StatutUtilisateur.ACTIF,
      },
    });

    return { message: 'Email verified successfully' };
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.emailVerifie) {
      throw new BadRequestException('Email is already verified');
    }

    // Generate new verification token
    const verificationToken = this.generateToken();

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        tokenVerificationEmail: verificationToken,
      },
    });

    await this.mailService.sendVerificationEmail({
      to: [{ email: user.email, name: `${user.prenom} ${user.nom}` }],
      templateId: 1, // VERIFY_EMAIL template
      params: {
        verificationLink: `${this.config.get('FRONTEND_URL')}/verify-email?token=${verificationToken}`,
        userName: user.prenom,
      },
    });

    return { message: 'Verification email sent successfully' };
  }

  async testEmailConfiguration(): Promise<{ success: boolean; message: string; details?: any }> {
    return this.mailService.testEmailConfiguration();
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const resetToken = this.generateToken();
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 24); // Token expires in 24 hours

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        tokenResetMotDePasse: resetToken,
        expirationResetMotDePasse: expirationDate,
      },
    });

    await this.mailService.sendPasswordResetEmail({
      to: [{ email: user.email, name: `${user.prenom} ${user.nom}` }],
      templateId: 2, // RESET_PASSWORD template
      params: {
        resetLink: `${this.config.get('FRONTEND_URL')}/reset-password?token=${resetToken}`,
        userName: user.prenom,
      },
    });

    return { message: 'Password reset instructions sent to your email' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: { 
        tokenResetMotDePasse: token,
        expirationResetMotDePasse: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await this.hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        tokenResetMotDePasse: null,
        expirationResetMotDePasse: null,
      },
    });

    return { message: 'Password reset successfully' };
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    // For now, we'll use a simple approach where we validate the refresh token
    // In a production environment, you might want to store refresh tokens in the database
    // and validate them against stored tokens
    
    try {
      // Decode the refresh token to get user information
      const decoded = this.jwtService.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET') || this.config.get('JWT_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        select: {
          id: true,
          email: true,
          role: true,
          nom: true,
          prenom: true,
          statut: true,
          telephone: true,
          avatar: true,
          emailVerifie: true,
          creeA: true,
          modifieA: true,
          derniereConnexion: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (user.statut === StatutUtilisateur.INACTIF) {
        throw new UnauthorizedException('Account is inactive');
      }

      const newAccessToken = this.generateJwtToken(user as SafeUser);
      const newRefreshToken = this.generateToken();

      return {
        user: user as SafeUser,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async createUserProfile(userId: string, role: RoleUtilisateur): Promise<void> {
    const baseData = {
      utilisateurId: userId,
    };
    
    switch (role) {
      case RoleUtilisateur.CANDIDAT:
        await this.prisma.profilCandidat.create({
          data: {
            ...baseData,
            pays: 'Maroc',
            communicationPreferee: 'EMAIL',
            // fuseauHoraire: 'Africa/Casablanca',
          },
        });
        break;
      case RoleUtilisateur.COORDINATEUR:
        await this.prisma.profilCoordinateur.create({
          data: {
            ...baseData,
            departement: '',
            specialisation: [],
          },
        });
        break;
      case RoleUtilisateur.EXAMINATEUR:
        await this.prisma.profilExaminateur.create({
          data: {
            ...baseData,
            titre: '',
            departement: '',
            specialisation: [],
            maxEntretiensParJour: 4,
            creneauxPreferes: [],
            joursDisponibles: [],
          },
        });
        break;
      case RoleUtilisateur.ADMINISTRATEUR:
        await this.prisma.profilAdministrateur.create({
          data: {
            ...baseData,
            departement: 'Administration' // You can adjust this default value as needed
          },
        });
        break;
    }
  }

  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  private async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  private generateJwtToken(user: SafeUser): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload,{expiresIn: '1d'});
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
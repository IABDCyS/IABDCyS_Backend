import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { StatutUtilisateur } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    // private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromExtractors([(request) => {
          let token = null;
          if (request && request.cookies) {
            token = request.cookies['access_token'];
          }
          return token;
        }])
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
       
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        statut: true,
        emailVerifie: true,
        profilCandidat: {
          select: {
            id: true,
            pays: true,
            communicationPreferee: true,
            // fuseauHoraire: true,
          },
        },
        profilCoordinateur: {
          select: {
            id: true,
            departement: true,
            specialisation: true,
          },
        },
        profilExaminateur: {
          select: {
            id: true,
            titre: true,
            departement: true,
            bureauLocalisation: true,
            specialisation: true,
            maxEntretiensParJour: true,
          },
        },
        profilAdministrateur: {
          select: {
            id: true,
            departement: true,
            niveauAcces: true,
            permissions: true,
          },
        },
      },
    });

    if (!user || user.statut !== StatutUtilisateur.ACTIF) {
      throw new UnauthorizedException();
    }

    return user;
  }
}

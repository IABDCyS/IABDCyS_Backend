// import { InformationsPersonnelles } from './../../node_modules/.prisma/client/index.d';
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEntretienDto } from './dto/create-entretien.dto';
import { UpdateEntretienDto } from './dto/update-entretien.dto';
import { CreateNoteEntretienDto } from './dto/create-note-entretien.dto';
import { RoleUtilisateur, StatutEntretien, Prisma } from '@prisma/client';

@Injectable()
export class EntretiensService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    userId: string,
    userRole: RoleUtilisateur,
    filters: {
      statut?: StatutEntretien;
      date?: string;
      examinateur?: string;
      periode?: string;
    },
  ) {
    const where: Prisma.EntretienWhereInput = {};

    // Apply filters
    if (filters.statut) where.statut = filters.statut;
    if (filters.date) where.dateProgrammee = new Date(filters.date);
    if (filters.examinateur) where.examinateurId = filters.examinateur;
    if (filters.periode) where.periodeId = filters.periode;

    // Role-based filtering
    switch (userRole) {
      case RoleUtilisateur.CANDIDAT:
        where.candidature = {
          candidat: {
            profilCandidat: {
              utilisateurId: userId
            }
          }
        };
        break;
      case RoleUtilisateur.EXAMINATEUR:
        where.examinateurId = userId;
        break;
      case RoleUtilisateur.COORDINATEUR:
      case RoleUtilisateur.ADMINISTRATEUR:
        // No additional filters needed - they can see all
        break;
      default:
        throw new ForbiddenException('Rôle non autorisé');
    }

    return this.prisma.entretien.findMany({
      where,
      include: {
        candidature: {
          include: {
            candidat: {
              include: {
                profilCandidat: {
                  select: {
                    utilisateur: {
                      select: {
                        prenom: true,
                        nom: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
            programme: {
              select: {
                nom: true,
              },
            },
          },
        },
        examinateur: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            email: true,
          },
        },
      },
      orderBy: {
        dateProgrammee: 'asc',
      },
    });
  }

  async findOne(id: string, userId: string, userRole: RoleUtilisateur) {
    const entretien = await this.prisma.entretien.findUnique({
      where: { id },
      include: {
        candidature: {
          include: {
            candidat: {
              select:{
                id: true,
                nom: true,
                prenom: true,
                email: true,
              }
            },
            programme: true,
            documents: true,
            dossierAcademique: true,
          },
        },
        notes: true,
        examinateur: true,
      },
    });

    if (!entretien) {
      throw new NotFoundException('Entretien non trouvé');
    }

    // Check access rights
    switch (userRole) {
      case RoleUtilisateur.CANDIDAT:
        if (entretien.candidature.candidat.id !== userId) {
          throw new ForbiddenException('Accès non autorisé');
        }
        break;
      case RoleUtilisateur.EXAMINATEUR:
        if (entretien.examinateurId !== userId) {
          throw new ForbiddenException('Accès non autorisé');
        }
        break;
      case RoleUtilisateur.COORDINATEUR:
      case RoleUtilisateur.ADMINISTRATEUR:
        // Full access
        break;
      default:
        throw new ForbiddenException('Rôle non autorisé');
    }

    return entretien;
  }

  async create(createEntretienDto: CreateEntretienDto) {
    const { candidatureId, examinateurId, periode, ...rest } = createEntretienDto;

    // Verify candidature exists
    const candidature = await this.prisma.candidature.findUnique({
      where: { id: candidatureId },
    });

    if (!candidature) {
      throw new NotFoundException('Candidature non trouvée');
    }

    // Verify examiner exists
    const examiner = await this.prisma.user.findFirst({
      where: { 
        id: examinateurId,
        role: RoleUtilisateur.EXAMINATEUR,
      },
    });

    if (!examiner) {
      throw new NotFoundException('Examinateur non trouvé');
    }

    // Verify periode exists
    const periodeExists = await this.prisma.periodeCandidature.findUnique({
      where: { id: periode },
    });

    if (!periodeExists) {
      throw new NotFoundException('Période non trouvée');
    }

    return this.prisma.entretien.create({
      data: {
        ...rest,
        periode: {
          connect: { id: periode }
        },
        candidature: {
          connect: { id: candidatureId }
        },
        examinateur: {
          connect: { id: examinateurId }
        },
        dateProgrammee: new Date(rest.dateProgrammee),
      },
      include: {
        candidature: {
          select: {
            candidat: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
              }
            },
            programme: true,
          },
        },
        examinateur: true,
      },
    });
  }

  async update(id: string, updateData: UpdateEntretienDto) {
    const {  examinateurId, ...otherData } = updateData;

    const entretien = await this.prisma.entretien.findUnique({
      where: { id },
    });

    if (!entretien) {
      throw new NotFoundException('Entretien non trouvé');
    }

    return this.prisma.entretien.update({
      where: { id },
      data: updateData,
      include: {
        candidature: {
          select: {
            candidat: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
              }
            },
          },
        },
        examinateur: true,
      },
    });
  }

  async addNote(entretienId: string, createNoteDto: CreateNoteEntretienDto, userId: string) {
    const entretien = await this.prisma.entretien.findUnique({
      where: { id: entretienId },
    });

    if (!entretien) {
      throw new NotFoundException('Entretien non trouvé');
    }

    if (entretien.examinateurId !== userId) {
      throw new ForbiddenException('Seul l\'examinateur assigné peut ajouter des notes');
    }

    return this.prisma.noteEntretien.create({
      data: {
        ...createNoteDto,
        entretienId,
        auteurId: userId,
      },
    });
  }

  async getNotes(entretienId: string, userId: string, userRole: RoleUtilisateur) {
    const entretien = await this.prisma.entretien.findUnique({
      where: { id: entretienId },
      include: {
        notes: true,
        candidature: {
          select: {
            candidat: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
              }
            },
          },
        },
      },
    });

    if (!entretien) {
      throw new NotFoundException('Entretien non trouvé');
    }

    // Check access rights
    switch (userRole) {
      case RoleUtilisateur.CANDIDAT:
        if (entretien.candidature.candidat.id !== userId) {
          throw new ForbiddenException('Accès non autorisé');
        }
        break;
      case RoleUtilisateur.EXAMINATEUR:
        if (entretien.examinateurId !== userId) {
          throw new ForbiddenException('Accès non autorisé');
        }
        break;
      case RoleUtilisateur.COORDINATEUR:
      case RoleUtilisateur.ADMINISTRATEUR:
        // Full access
        break;
      default:
        throw new ForbiddenException('Rôle non autorisé');
    }

    return entretien.notes;
  }

  async cancel(id: string, raison: string) {
    const entretien = await this.prisma.entretien.findUnique({
      where: { id },
    });

    if (!entretien) {
      throw new NotFoundException('Entretien non trouvé');
    }

    return this.prisma.entretien.update({
      where: { id },
      data: {
        statut: StatutEntretien.ANNULE,
        recommandation: raison,
      },
    });
  }
}

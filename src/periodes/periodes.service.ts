import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePeriodeDto } from './dto/create-periode.dto';
import { UpdatePeriodeDto } from './dto/update-periode.dto';
import { StatutPeriode, StatutCandidature } from '@prisma/client';

@Injectable()
export class PeriodesService {
  constructor(private prisma: PrismaService) {}

  async create(createPeriodeDto: CreatePeriodeDto) {
    return this.prisma.periodeCandidature.create({
      data: {
        ...createPeriodeDto,
        statut: StatutPeriode.A_VENIR,
      },
    });
  }

  async findAll() {
    const periodes = await this.prisma.periodeCandidature.findMany({
      include: {
        _count: {
          select: {
            candidatures: true,
          },
        },
        candidatures: {
          select: {
            statut: true,
          },
        },
      },
      orderBy: {
        dateDebut: 'desc',
      },
    });

    return {
      donnees: {
        periodes: periodes.map(periode => ({
          id: periode.id,
          nom: periode.nom,
          dateDebut: periode.dateDebut,
          dateFin: periode.dateFin,
          statut: periode.statut,
          nombreCandidatures: periode._count.candidatures,
          nombreAcceptes: periode.candidatures.filter(c => c.statut === 'ACCEPTEE').length,
          nombreRejetes: periode.candidatures.filter(c => c.statut === 'REFUSEE').length,
        })),
      },
    };
  }

  async findOne(id: string) {
    const periode = await this.prisma.periodeCandidature.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            candidatures: true,
          },
        },
        candidatures: {
          select: {
            statut: true,
          },
        },
      },
    });

    if (!periode) {
      throw new NotFoundException(`Période #${id} introuvable`);
    }

    return {
      donnees: {
        periode: {
          ...periode,
          nombreCandidatures: periode._count.candidatures,
          nombreAcceptes: periode.candidatures.filter(c => c.statut === 'ACCEPTEE').length,
          nombreRejetes: periode.candidatures.filter(c => c.statut === 'REFUSEE').length,
        },
      },
    };
  }

  async update(id: string, updatePeriodeDto: UpdatePeriodeDto) {
    await this.findOne(id);

    return this.prisma.periodeCandidature.update({
      where: { id },
      data: updatePeriodeDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.periodeCandidature.delete({
      where: { id },
    });
  }
}

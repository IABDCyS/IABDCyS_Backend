import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProgrammeDto } from './dto/create-programme.dto';
import { UpdateProgrammeDto } from './dto/update-programme.dto';
import { QueryProgrammesDto } from './dto/query-programmes.dto';

@Injectable()
export class ProgrammesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryProgrammesDto) {
    const where = {
      ...(query.actif !== undefined && { estActif: query.actif }),
      ...(query.departement && { departement: query.departement }),
      ...(query.diplome && { diplome: query.diplome }),
    };

    const programmes = await this.prisma.programme.findMany({
      where,
      select: {
        id: true,
        nom: true,
        code: true,
        departement: true,
        diplome: true,
        duree: true,
        estActif: true,
        capacite: true,
        inscriptionsActuelles: true,
        dateLimiteCandidature: true,
      },
    });

    return programmes;
  }

  async create(createProgrammeDto: CreateProgrammeDto) {
    return this.prisma.programme.create({
      data: createProgrammeDto,
    });
  }

  async findOne(id: string) {
    const programme = await this.prisma.programme.findUnique({
      where: { code: id },
      include: {
        periodesCandidature: true,
      },
    });

    if (!programme) {
      throw new NotFoundException(`Programme avec ID ${id} non trouvé`);
    }

    return programme;
  }

  async update(id: string, updateProgrammeDto: UpdateProgrammeDto) {
    await this.findOne(id); // Vérifie si le programme existe

    return this.prisma.programme.update({
      where: { code: id },
      data: updateProgrammeDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Vérifie si le programme existe

    await this.prisma.programme.delete({
      where: { code: id },
    });
  }
}

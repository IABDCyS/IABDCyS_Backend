import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { EntretiensService } from './entretiens.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateEntretienDto } from './dto/create-entretien.dto';
import { CreateNoteEntretienDto } from './dto/create-note-entretien.dto';
import { RoleUtilisateur, StatutEntretien } from '@prisma/client';

@Controller('entretiens')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EntretiensController {
  constructor(private readonly entretiensService: EntretiensService) {}

  @Get()
  async findAll(
    @Request() req,
    @Query('statut') statut?: StatutEntretien,
    @Query('date') date?: string,
    @Query('examinateur') examinateur?: string,
    @Query('periode') periode?: string,
  ) {
    const entretiens = await this.entretiensService.findAll(
      req.user.id,
      req.user.role,
      {
        statut,
        date,
        examinateur,
        periode,
      },
    );

    return {
      succes: true,
      donnees: {
        entretiens,
      },
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const entretien = await this.entretiensService.findOne(
      id,
      req.user.id,
      req.user.role,
    );

    return {
      succes: true,
      donnees: {
        entretien,
      },
    };
  }

  @Post()
  @Roles(RoleUtilisateur.COORDINATEUR, RoleUtilisateur.ADMINISTRATEUR)
  async create(@Body() createEntretienDto: CreateEntretienDto) {
    const entretien = await this.entretiensService.create(createEntretienDto);

    return {
      succes: true,
      donnees: {
        entretien,
      },
    };
  }

  @Put(':id')
  @Roles(RoleUtilisateur.COORDINATEUR, RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.EXAMINATEUR)
  async update(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateEntretienDto>,
  ) {
    const entretien = await this.entretiensService.update(id, updateData);

    return {
      succes: true,
      donnees: {
        entretien,
      },
    };
  }

  @Post(':id/notes')
  @Roles(RoleUtilisateur.EXAMINATEUR)
  async addNote(
    @Param('id') id: string,
    @Body() createNoteDto: CreateNoteEntretienDto,
    @Request() req,
  ) {
    const note = await this.entretiensService.addNote(
      id,
      createNoteDto,
      req.user.id,
    );

    return {
      succes: true,
      donnees: {
        note,
      },
    };
  }

  @Get(':id/notes')
  async getNotes(@Param('id') id: string, @Request() req) {
    const notes = await this.entretiensService.getNotes(
      id,
      req.user.id,
      req.user.role,
    );

    return {
      succes: true,
      donnees: {
        notes,
      },
    };
  }

  @Post(':id/annuler')
  @Roles(RoleUtilisateur.COORDINATEUR, RoleUtilisateur.ADMINISTRATEUR)
  async cancel(@Param('id') id: string, @Body('raison') raison: string) {
    const entretien = await this.entretiensService.cancel(id, raison);

    return {
      succes: true,
      donnees: {
        entretien,
      },
    };
  }
}

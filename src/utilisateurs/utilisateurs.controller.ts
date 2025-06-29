import {
  Controller,
  Get,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UtilisateursService } from './utilisateurs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleUtilisateur } from '@prisma/client';
import { QueryUtilisateursDto } from './dto/query-utilisateurs.dto';
import { UpdateUtilisateurDto } from './dto/update-utilisateur.dto';
import { UpdateProfilCandidatDto } from './dto/update-profil-candidat.dto';
import { UpdateProfilCoordinateurDto } from './dto/update-profil-coordinateur.dto';

@Controller('utilisateurs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UtilisateursController {
  constructor(private readonly utilisateursService: UtilisateursService) {}

  @Get()
  @Roles(RoleUtilisateur.ADMINISTRATEUR,RoleUtilisateur.COORDINATEUR)
  async findAll(@Query() query: QueryUtilisateursDto) {
    const result = await this.utilisateursService.findAll(query);
    return {
      succes: true,
      donnees: result,
    };
  }

  @Get('examinateurs')
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.COORDINATEUR)
  async findExaminateurs() {
    const examinateurs = await this.utilisateursService.findExaminateurs();
    return {
      succes: true,
      donnees: {
        utilisateurs: examinateurs,
      },
    };
  }

  @Get('candidats')
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.COORDINATEUR)
  async findCandidats() {
    const candidats = await this.utilisateursService.findCandidats();
    return {
      succes: true,
      donnees: {
        utilisateurs: candidats,
      },
    };
  }

  @Get(':id')
  @Roles(RoleUtilisateur.ADMINISTRATEUR)
  async findOne(@Param('id') id: string) {
    const utilisateur = await this.utilisateursService.findOne(id);
    return {
      succes: true,
      donnees: utilisateur,
    };
  }

  @Put(':id')
  @Roles(RoleUtilisateur.ADMINISTRATEUR)
  async update(@Param('id') id: string, @Body() updateUtilisateurDto: UpdateUtilisateurDto) {
    const utilisateur = await this.utilisateursService.update(id, updateUtilisateurDto);
    return {
      succes: true,
      donnees: utilisateur,
    };
  }

  @Delete(':id')
  @Roles(RoleUtilisateur.ADMINISTRATEUR)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.utilisateursService.remove(id);
  }

  @Put(':id/profil')
  async updateProfil(
    @Param('id') id: string,
    @Body() updateProfilDto: UpdateProfilCandidatDto | UpdateProfilCoordinateurDto,
  ) {
    const profil = await this.utilisateursService.updateProfil(id, updateProfilDto);
    return {
      succes: true,
      donnees: profil,
    };
  }
}

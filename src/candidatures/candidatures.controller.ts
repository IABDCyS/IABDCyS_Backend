import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { CandidaturesService } from "./candidatures.service";
import { CreateCandidatureDto } from "./dto/create-candidature.dto";
import { UpdateCandidatureDto } from "./dto/update-candidature.dto";
import { UpdateApplicationInfoDto } from "./dto/update-application-info.dto";
import { UpdateInformationsPersonnellesDto } from "./dto/update-informations-personnelles.dto";
import { CreateDossierAcademiqueDto } from "./dto/create-dossier-academique.dto";
import { QueryCandidaturesDto } from "./dto/query-candidatures.dto";
import { RetirerCandidatureDto } from "./dto/retirer-candidature.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { RoleUtilisateur } from "@prisma/client";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { UpdateMyCandidatureDto } from "./dto/update-my-candidature.dto";

@Controller("candidatures")
@UseGuards(JwtAuthGuard)
export class CandidaturesController {
  constructor(private readonly candidaturesService: CandidaturesService) { }

  @Get("verifier-candidature-active")
  @ApiOperation({
    summary: "Vérifier si l'utilisateur a une candidature active",
    description:
      "Vérifie si l'utilisateur courant a une candidature dans une période active",
  })
  @ApiResponse({
    status: 200,
    description: "Retourne si l'utilisateur a une candidature active",
    schema: {
      type: "object",
      properties: {
        candidatureActive: {
          type: "boolean",
          description:
            "Vrai si l'utilisateur a une candidature active, faux sinon",
        },
        candidatureId: {
          type: "string",
          description: "L'identifiant de la candidature active si elle existe",
          nullable: true,
        },
      },
    },
  })
  async verifierCandidatureActive(@Request() req) {
    const resultat = await this.candidaturesService.verifierCandidatureActive(
      req.user.id
    );
    return resultat;
  }

  @Get("periodes/active")
  @UseGuards(JwtAuthGuard)
  // @UseGuards(RolesGuard)
  // @Roles(RoleUtilisateur.CANDIDAT, RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.COORDINATEUR)
  @ApiOperation({
    summary: "Get all active application periods",
    description:
      "Retrieves all currently active application periods that candidates can apply to",
  })
  @ApiResponse({
    status: 200,
    description:
      "Returns all active application periods with their associated programs",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: {
            type: "number",
            description: "Unique identifier of the application period",
          },
          name: {
            type: "string",
            description: "Name of the application period",
          },
          description: {
            type: "string",
            description: "Detailed description of the application period",
          },
          startDate: {
            type: "string",
            format: "date-time",
            description: "Start date of the application period",
          },
          endDate: {
            type: "string",
            format: "date-time",
            description: "End date of the application period",
          },
          program: {
            type: "object",
            properties: {
              id: {
                type: "number",
                description: "Unique identifier of the program",
              },
              name: { type: "string", description: "Name of the program" },
              description: {
                type: "string",
                description: "Description of the program",
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - User is not authenticated",
  })
  async getActivePeriods() {
    return this.candidaturesService.findActivePeriods();
  }

  @Get("mes-candidatures")
  @ApiOperation({ summary: "Get current user applications" })
  @ApiResponse({
    status: 200,
    description: "Returns all applications for the current user",
  })
  async getMyApplications(
    @Request() req,
    @Query() filters: QueryCandidaturesDto
  ) {
    return this.candidaturesService.findAll(
      filters,
      req.user.id,
      req.user.role
    );
  }

  @Post(":id/dossiers-academiques")
  @UseGuards(RolesGuard)
  async createDossierAcademique(
    @Param("id") id: string,
    @Body() createDto: CreateDossierAcademiqueDto,
    @Request() req
  ) {
    return await this.candidaturesService.createDossierAcademique(
      id,
      createDto,
      req.user
    );
  }

  @Put(":id/dossiers-academiques/:dossierId")
  @UseGuards(RolesGuard)
  async updateDossierAcademique(
    @Param("id") id: string,
    @Param("dossierId") dossierId: string,
    @Body() updateDto: CreateDossierAcademiqueDto,
    @Request() req
  ) {
    return await this.candidaturesService.updateDossierAcademique(
      id,
      dossierId,
      updateDto,
      req.user
    );
  }

  @Delete(":id/dossiers-academiques/:dossierId")
  @UseGuards(RolesGuard)
  async deleteDossierAcademique(
    @Param("id") id: string,
    @Param("dossierId") dossierId: string,
    @Request() req
  ) {
    return await this.candidaturesService.deleteDossierAcademique(
      id,
      dossierId,
      req.user
    );
  }

  @Get(":id/dossiers-academiques")
  @UseGuards(RolesGuard)
  async getDossiersAcademiques(@Param("id") id: string, @Request() req) {
    return await this.candidaturesService.getDossiersAcademiques(id, req.user);
  }

  @Put(":id/informations-personnelles")
  @UseGuards(RolesGuard)
  async updateInformationsPersonnelles(
    @Param("id") id: string,
    @Body() updateDto: UpdateInformationsPersonnellesDto,
    @Request() req
  ) {
    return await this.candidaturesService.updateInformationsPersonnelles(
      id,
      updateDto,
      req.user
    );
  }

  @Get(":id/mon-candidature")
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.CANDIDAT)
  async getMonCandidature(@Param("id") id: string, @Request() req) {
    return await this.candidaturesService.getMonCandidature(id, req.user);
  }

  @Get()
  async findAll(@Query() query: QueryCandidaturesDto, @Request() req) {
    const result = await this.candidaturesService.findAll(query, req.user);
    return {
      ...result,
    };
  }

  @Post()
  @Roles(RoleUtilisateur.CANDIDAT, RoleUtilisateur.ADMINISTRATEUR)
  @UseGuards(RolesGuard)
  async create(
    @Body() createCandidatureDto: CreateCandidatureDto,
    @Request() req
  ) {
    const candidature = await this.candidaturesService.create(
      createCandidatureDto,
      req.user.id
    );
    return candidature;
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @Request() req) {
    const candidature = await this.candidaturesService.findOne(id, req.user);
    return candidature;
  }

  @Put(":id")
  @Roles(RoleUtilisateur.COORDINATEUR, RoleUtilisateur.ADMINISTRATEUR)
  @UseGuards(RolesGuard)
  async update(
    @Param("id") id: string,
    @Body() updateCandidatureDto: UpdateCandidatureDto,
    @Request() req
  ) {
    const candidature = await this.candidaturesService.update(
      id,
      updateCandidatureDto,
      req.user
    );
    return {
      succes: true,
      donnees: {
        candidature,
      },
    };
  }

  @Put(":id/mon-candidature")
  @Roles(RoleUtilisateur.CANDIDAT)
  @UseGuards(RolesGuard)
  async updateMyCandidature(
    @Param("id") id: string,
    @Body() updateDto: UpdateMyCandidatureDto,
    @Request() req
  ) {
    const candidature = await this.candidaturesService.update(
      id,
      updateDto,
      req.user
    );
    return {
      succes: true,
      donnees: {
        candidature,
      },
    };
  }

  @Put(":id/application-info")
  @UseGuards(RolesGuard)
  async updateApplicationInfo(
    @Param("id") id: string,
    @Body() updateDto: any,
    @Request() req
  ) {
    const candidature = await this.candidaturesService.updateApplicationInfo(
      id,
      updateDto,
      req.user
    );
    return {
      succes: true,
      donnees: {
        candidature,
      },
    };
  }

  @Post(":id/soumettre")
  @Roles(RoleUtilisateur.CANDIDAT)
  @UseGuards(RolesGuard)
  async soumettre(@Param("id") id: string, @Request() req) {
    const candidature = await this.candidaturesService.soumettre(id, req.user);
    return {
      succes: true,
      donnees: {
        candidature,
      },
    };
  }

  @Post(":id/retirer")
  async retirer(
    @Param("id") id: string,
    @Body() retirerCandidatureDto: RetirerCandidatureDto,
    @Request() req
  ) {
    const candidature = await this.candidaturesService.retirer(
      id,
      retirerCandidatureDto,
      req.user
    );
    return {
      succes: true,
      donnees: {
        candidature,
      },
    };
  }
  @Get(":id/notes")
  @Roles(
    RoleUtilisateur.ADMINISTRATEUR,
    RoleUtilisateur.COORDINATEUR,
    RoleUtilisateur.CANDIDAT
  )
  @UseGuards(RolesGuard)
  async getNotes(@Param("id") id: string, @Request() req) {
    const notes = await this.candidaturesService.getNotes(id, req.user);
    return {
      succes: true,
      donnees: {
        notes,
      },
    };
  }
  @Post(":id/notes")
  @Roles(RoleUtilisateur.ADMINISTRATEUR)
  @UseGuards(RolesGuard)
  async addNote(@Param("id") id: string, @Body() noteDto: any, @Request() req) {
    const note = await this.candidaturesService.addNote(id, noteDto, req.user);
    return {
      succes: true,
      donnees: {
        note,
      },
    };
  }
  @Delete(":id/notes/:noteId")
  @Roles(RoleUtilisateur.ADMINISTRATEUR)
  @UseGuards(RolesGuard)
  async deleteNote(@Param("noteId") noteId: string) {
    const note = await this.candidaturesService.deleteNote(noteId);
    return {
      succes: true,
      // donnees: {
      //   note,
      // },
    };
  }
}

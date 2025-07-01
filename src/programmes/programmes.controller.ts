import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ProgrammesService } from "./programmes.service";
import { CreateProgrammeDto } from "./dto/create-programme.dto";
import { UpdateProgrammeDto } from "./dto/update-programme.dto";
import { QueryProgrammesDto } from "./dto/query-programmes.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { RoleUtilisateur } from "@prisma/client";

@Controller("programmes")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgrammesController {
  constructor(private readonly programmesService: ProgrammesService) { }

  @Get()
  async findAll(@Query() query: QueryProgrammesDto) {
    const programmes = await this.programmesService.findAll(query);
    return programmes;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR)
  async create(@Body() createProgrammeDto: CreateProgrammeDto) {
    const programme = await this.programmesService.create(createProgrammeDto);
    return programme;
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    const programme = await this.programmesService.findOne(id);
    return programme;
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR)
  async update(
    @Param("id") id: string,
    @Body() updateProgrammeDto: UpdateProgrammeDto
  ) {
    const programme = await this.programmesService.update(
      id,
      updateProgrammeDto
    );
    return programme;
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id") id: string) {
    await this.programmesService.remove(id);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { PeriodesService } from "./periodes.service";
import { CreatePeriodeDto } from "./dto/create-periode.dto";
import { UpdatePeriodeDto } from "./dto/update-periode.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { RoleUtilisateur } from "@prisma/client";

@Controller("periodes")
@UseGuards(JwtAuthGuard)
export class PeriodesController {
  constructor(private readonly periodesService: PeriodesService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR)
  create(@Body() createPeriodeDto: CreatePeriodeDto) {
    return this.periodesService.create(createPeriodeDto);
  }

  @Get()
  findAll() {
    return this.periodesService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.periodesService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR)
  update(@Param("id") id: string, @Body() updatePeriodeDto: UpdatePeriodeDto) {
    return this.periodesService.update(id, updatePeriodeDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR)
  remove(@Param("id") id: string) {
    return this.periodesService.remove(id);
  }
}

import { PartialType } from '@nestjs/mapped-types';
import { CreatePeriodeDto } from './create-periode.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { StatutPeriode } from '@prisma/client';

export class UpdatePeriodeDto extends PartialType(CreatePeriodeDto) {
  @IsOptional()
  @IsEnum(StatutPeriode)
  statut?: StatutPeriode;
}

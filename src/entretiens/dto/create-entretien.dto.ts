import { IsString, IsNotEmpty, IsEnum, IsOptional, IsInt, IsISO8601, Matches } from 'class-validator';
import { TypeEntretien, FormatEntretien } from '@prisma/client';

export class CreateEntretienDto {
  @IsString()
  @IsNotEmpty()
  candidatureId: string;

  @IsString()
  @IsNotEmpty()
  examinateurId: string;

  @IsEnum(TypeEntretien)
  @IsNotEmpty()
  type: TypeEntretien;

  @IsEnum(FormatEntretien)
  @IsNotEmpty()
  format: FormatEntretien;

  @IsISO8601()
  @IsNotEmpty()
  dateProgrammee: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'heureProgrammee must be in format HH:mm',
  })
  heureProgrammee: string;

  @IsInt()
  @IsNotEmpty()
  duree: number;

  @IsString()
  @IsOptional()
  lieu?: string;

  @IsString()
  @IsOptional()
  lienReunion?: string;

  @IsString()
  @IsOptional()
  titre?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  periode: string;

  @IsString()
  @IsOptional()
  idReunion?: string;

  @IsString()
  @IsOptional()
  motDePasseReunion?: string;
}

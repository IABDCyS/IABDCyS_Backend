import { IsString, IsNotEmpty, IsDateString, IsEnum, IsInt } from 'class-validator';
import { Semestre } from '@prisma/client';

export class CreatePeriodeDto {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsInt()
  @IsNotEmpty()
  annee: number;

  @IsEnum(Semestre)
  @IsNotEmpty()
  semestre: Semestre;

  @IsDateString()
  @IsNotEmpty()
  dateDebut: string;

  @IsDateString()
  @IsNotEmpty()
  dateFin: string;

  @IsDateString()
  @IsNotEmpty()
  dateLimiteCandidature: string;
}

import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { TypeDiplome } from '@prisma/client';

export class CreateProgrammeDto {
  @IsString()
  nom: string;

  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  departement: string;

  @IsEnum(TypeDiplome)
  diplome: TypeDiplome;

  @IsNumber()
  @Min(1)
  duree: number;

  @IsNumber()
  @Min(0)
  moyenneMinimale: number;

  @IsArray()
  @IsString({ each: true })
  documentsRequis: string[];

  @IsNumber()
  @Min(0)
  fraisCandidature: number;

  @IsNumber()
  @Min(1)
  capacite: number;
}

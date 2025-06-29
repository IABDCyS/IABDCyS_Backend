import { IsString, IsNumber, IsBoolean, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { TypeEtablissement, TypeDiplome } from '@prisma/client';

export class CreateDossierAcademiqueDto {
  @IsString()
  nomEtablissement: string;

  @IsEnum(TypeEtablissement)
  typeEtablissement: TypeEtablissement;

  @IsString()
  ville: string;

  @IsString()
  pays: string;

  @IsEnum(TypeDiplome)
  typeDiplome: TypeDiplome;

  @IsString()
  domaineEtude: string;

  @IsString()
  specialite: string;

  @IsString()
  @IsOptional()
  mention?: string;

  @IsDateString()
  dateDebut: string;

  @IsDateString()
  dateFin: string;

  @IsDateString()
  dateObtentionDiplome: string;

  @IsNumber()
  moyenne: number;

  @IsNumber()
  echelleMoyenne: number;

  @IsBoolean()
  estTermine: boolean;
}

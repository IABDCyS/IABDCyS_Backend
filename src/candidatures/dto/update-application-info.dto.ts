import { IsString, IsOptional, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { TypeEtablissement, TypeDiplome } from '@prisma/client';

export class CandidatDto {
  @IsString()
  @IsOptional()
  prenom?: string;

  @IsString()
  @IsOptional()
  nom?: string;

  @IsString()
  @IsOptional()
  telephone?: string;

  @IsString()
  @IsOptional()
  adresse?: string;

  @IsString()
  @IsOptional()
  ville?: string;

  @IsString()
  @IsOptional()
  pays?: string;
}

export class UpdateApplicationInfoDto {
  @IsString()
  @IsOptional()
  statement?: string;

  @ValidateNested()
  @Type(() => CandidatDto)
  @IsOptional()
  candidat?: CandidatDto;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DossierAcademiqueDto)
  dossierAcademique?: DossierAcademiqueDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ReferenceDto)
  references?: ReferenceDto[];
}

export class DossierAcademiqueDto {
  @IsString()
  nomEtablissement: string;

  @IsEnum(TypeEtablissement)
  typeEtablissement: TypeEtablissement;

  @IsString()
  ville: string;

  @IsEnum(TypeDiplome)
  typeDiplome: TypeDiplome;

  @IsString()
  specialite: string;

  @IsString()
  dateDebut: string;

  @IsString()
  dateFin: string;

  @IsString()
  @IsOptional()
  mention?: string;

  @IsString()
  domaineEtude: string;
}

export class ReferenceDto {
  @IsString()
  nom: string;

  @IsString()
  organisation: string;

  @IsString()
  relation: string;

  @IsString()
  email: string;

  @IsString()
  telephone: string;
}

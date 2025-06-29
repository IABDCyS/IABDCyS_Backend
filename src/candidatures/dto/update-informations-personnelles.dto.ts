import { IsString, IsOptional, IsEmail, IsDateString, IsEnum } from 'class-validator';
import { Genre } from '@prisma/client';

export class UpdateInformationsPersonnellesDto {
  @IsString()
  @IsOptional()
  prenom?: string;

  @IsString()
  @IsOptional()
  nom?: string;

  @IsString()
  @IsOptional()
  nomJeuneFille?: string;

  @IsDateString()
  @IsOptional()
  dateNaissance?: string;

  @IsEnum(Genre)
  @IsOptional()
  genre?: Genre;

  @IsString()
  @IsOptional()
  nationalite?: string;

  @IsString()
  @IsOptional()
  lieuNaissance?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

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
  province?: string;

  @IsString()
  @IsOptional()
  codePostal?: string;

  @IsString()
  @IsOptional()
  pays?: string;

  @IsString()
  @IsOptional()
  nomContactUrgence?: string;

  @IsString()
  @IsOptional()
  telephoneContactUrgence?: string;

  @IsString()
  @IsOptional()
  relationContactUrgence?: string;

  @IsString()
  @IsOptional()
  numeroCIN?: string;

  @IsDateString()
  @IsOptional()
  dateDelivranceCIN?: string;

  @IsString()
  @IsOptional()
  lieuDelivranceCIN?: string;
}

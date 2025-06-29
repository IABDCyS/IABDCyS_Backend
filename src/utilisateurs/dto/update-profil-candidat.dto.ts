import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { Genre } from '@prisma/client';

export class UpdateProfilCandidatDto {
  @IsOptional()
  @IsDateString()
  dateNaissance?: string;

  @IsOptional()
  @IsEnum(Genre)
  genre?: Genre;

  @IsOptional()
  @IsString()
  nationalite?: string;

  @IsOptional()
  @IsString()
  adresse?: string;

  @IsOptional()
  @IsString()
  ville?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  codePostal?: string;

  @IsOptional()
  @IsString()
  pays?: string;
}

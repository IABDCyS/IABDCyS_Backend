import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { StatutCandidature } from '@prisma/client';

export class QueryCandidaturesDto {
  @IsOptional()
  @IsEnum(StatutCandidature)
  statut?: StatutCandidature;

  @IsOptional()
  @IsString()
  programme?: string;

  @IsOptional()
  @IsString()
  periode?: string;

  @IsOptional()
  @IsString()
  recherche?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(-1)
  limite?: number = 10;
}

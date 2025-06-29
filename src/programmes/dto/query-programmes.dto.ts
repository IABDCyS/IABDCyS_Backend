import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { TypeDiplome } from '@prisma/client';

export class QueryProgrammesDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  actif?: boolean;

  @IsOptional()
  @IsString()
  departement?: string;

  @IsOptional()
  @IsEnum(TypeDiplome)
  diplome?: TypeDiplome;
}

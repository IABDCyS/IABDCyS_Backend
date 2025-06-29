import { IsString, IsEnum, IsOptional, IsISO8601 } from 'class-validator';
import { TypeEntretien, FormatEntretien } from '@prisma/client';

export class UpdateEntretienDto {
  @IsString()
  @IsOptional()
  examinateurId?: string;

  @IsEnum(TypeEntretien)
  @IsOptional()
  type?: TypeEntretien;

  @IsEnum(FormatEntretien)
  @IsOptional()
  format?: FormatEntretien;

  @IsISO8601()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  lien?: string;

  @IsString()
  @IsOptional()
  lieu?: string;
}

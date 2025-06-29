import { IsEnum, IsOptional, IsPhoneNumber, IsString } from 'class-validator';
import { StatutUtilisateur } from '@prisma/client';

export class UpdateUtilisateurDto {
  @IsOptional()
  @IsString()
  prenom?: string;

  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsPhoneNumber('MA')
  telephone?: string;

  @IsOptional()
  @IsEnum(StatutUtilisateur)
  statut?: StatutUtilisateur;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  password?: string;
}

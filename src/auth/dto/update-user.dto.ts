import { IsEnum, IsOptional, IsPhoneNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatutUtilisateur } from '@prisma/client';

export class UpdateUserDto {
  @ApiProperty({ example: 'John', required: false })
  @IsOptional()
  @IsString()
  prenom?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiProperty({ example: '+212612345678', required: false })
  @IsOptional()
  @IsPhoneNumber('MA')
  telephone?: string;

  @ApiProperty({ enum: StatutUtilisateur, example: 'ACTIF', required: false })
  @IsOptional()
  @IsEnum(StatutUtilisateur)
  statut?: StatutUtilisateur;
}

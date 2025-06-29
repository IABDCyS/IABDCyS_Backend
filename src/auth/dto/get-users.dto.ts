import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { RoleUtilisateur, StatutUtilisateur } from '@prisma/client';

export class GetUsersDto {
  @ApiProperty({ required: false, example: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, example: 10, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({ required: false, example: 'john@example.com' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ enum: RoleUtilisateur, required: false })
  @IsOptional()
  @IsEnum(RoleUtilisateur)
  role?: RoleUtilisateur;

  @ApiProperty({ enum: StatutUtilisateur, required: false })
  @IsOptional()
  @IsEnum(StatutUtilisateur)
  statut?: StatutUtilisateur;
}

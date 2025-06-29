import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RoleUtilisateur } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  prenom: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  nom: string;

  @ApiProperty({ example: '+212612345678', required: false })
  @IsString()
  @IsOptional()
  telephone?: string;

  @ApiProperty({ enum: RoleUtilisateur, example: 'CANDIDAT', required: false })
  @IsEnum(RoleUtilisateur)
  @IsOptional()
  role?: RoleUtilisateur;
}

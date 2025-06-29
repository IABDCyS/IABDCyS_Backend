import { IsArray, IsDateString, IsEnum, IsOptional, IsPhoneNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Genre } from '@prisma/client';

export class UpdateCandidatProfileDto {
  @ApiProperty({ example: '1990-01-01', required: false })
  @IsOptional()
  @IsDateString()
  dateNaissance?: string;

  @ApiProperty({ enum: Genre, required: false })
  @IsOptional()
  @IsEnum(Genre)
  genre?: Genre;

  @ApiProperty({ example: 'Marocaine', required: false })
  @IsOptional()
  @IsString()
  nationalite?: string;

  @ApiProperty({ example: '123 Rue Example', required: false })
  @IsOptional()
  @IsString()
  adresse?: string;

  @ApiProperty({ example: 'Casablanca', required: false })
  @IsOptional()
  @IsString()
  ville?: string;

  @ApiProperty({ example: 'Grand Casablanca', required: false })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiProperty({ example: '20000', required: false })
  @IsOptional()
  @IsString()
  codePostal?: string;

  @ApiProperty({ example: 'Maroc', required: false })
  @IsOptional()
  @IsString()
  pays?: string;
}

export class UpdateCoordinateurProfileDto {
  @ApiProperty({ example: 'Informatique', required: false })
  @IsOptional()
  @IsString()
  departement?: string;

  @ApiProperty({ example: 'Bureau 123, Bâtiment A', required: false })
  @IsOptional()
  @IsString()
  bureauLocalisation?: string;

  @ApiProperty({ example: '+212522123456', required: false })
  @IsOptional()
  @IsPhoneNumber('MA')
  telephoneBureau?: string;

  @ApiProperty({ example: ['Java', 'Python', 'Web'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialisation?: string[];
}

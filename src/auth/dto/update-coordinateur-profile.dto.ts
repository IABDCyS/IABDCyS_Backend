import { IsOptional, IsString, IsArray } from 'class-validator';

export class UpdateCoordinateurProfileDto {
  @IsOptional()
  @IsString()
  departement?: string;

  @IsOptional()
  @IsString()
  bureauLocalisation?: string;

  @IsOptional()
  @IsString()
  telephoneBureau?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialisation?: string[];
}

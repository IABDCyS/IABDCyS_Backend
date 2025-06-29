import { IsArray, IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export class UpdateProfilCoordinateurDto {
  @IsString()
  departement: string;

  @IsOptional()
  @IsString()
  bureauLocalisation?: string;

  @IsOptional()
  @IsPhoneNumber('MA')
  telephoneBureau?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialisation?: string[];
}

import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray, IsISO8601 } from 'class-validator';
import { TypeNotification, AudienceNotification } from '@prisma/client';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  titre: string;

  @IsString()
  @IsNotEmpty()
  contenu: string;

  @IsEnum(TypeNotification)
  @IsNotEmpty()
  type: TypeNotification;

  @IsEnum(AudienceNotification)
  @IsNotEmpty()
  audience: AudienceNotification;

  @IsArray()
  @IsOptional()
  idsProgrammes?: string[];

  @IsISO8601()
  @IsOptional()
  programmePour?: string;
}

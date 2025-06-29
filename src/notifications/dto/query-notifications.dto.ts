import { IsOptional, IsBoolean, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { TypeNotification } from '@prisma/client';

export class QueryNotificationsDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  lue?: boolean;

  @IsOptional()
  @IsEnum(TypeNotification)
  type?: TypeNotification;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number = 20;
}

import { IsDateString, IsEnum, IsString } from 'class-validator';
import { TypeEtude } from '@prisma/client';

export class CreateCandidatureDto {
  @IsString()
  programmeId: string;

  @IsString()
  periodeId: string;

//   @IsEnum(TypeEtude)
//   typeEtude: TypeEtude;

//   @IsDateString()
//   dateDebutPrevue: string;
// }
}

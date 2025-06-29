import { IsString } from 'class-validator';

export class RetirerCandidatureDto {
  @IsString()
  raison: string;
}

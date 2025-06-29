import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DecisionCandidature, Priorite, StatutCandidature } from '@prisma/client';

export class UpdateCandidatureDto {
  @IsOptional()
  @IsEnum(StatutCandidature)
  statut?: StatutCandidature;

  @IsOptional()
  @IsEnum(Priorite)
  priorite?: Priorite;

  @IsOptional()
  @IsEnum(DecisionCandidature)
  decision?: DecisionCandidature;

  @IsOptional()
  @IsString()
  raisonDecision?: string;

  
}

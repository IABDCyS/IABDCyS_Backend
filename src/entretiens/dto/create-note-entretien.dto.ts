import { IsString, IsNotEmpty, IsOptional, IsInt, IsBoolean, Min, Max } from 'class-validator';

export class CreateNoteEntretienDto {
  @IsString()
  @IsOptional()
  evaluationTechnique?: string;

  @IsString()
  @IsOptional()
  competencesCommunication?: string;

  @IsString()
  @IsOptional()
  motivationAdequation?: string;

  @IsString()
  @IsOptional()
  recommandationGlobale?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  noteTechnique?: number;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  noteCommunication?: number;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  noteMotivation?: number;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  noteGlobale?: number;

  @IsString()
  @IsOptional()
  pointsForts?: string;

  @IsString()
  @IsOptional()
  pointsFaibles?: string;

  @IsString()
  @IsOptional()
  commentairesSupplementaires?: string;

  @IsBoolean()
  @IsNotEmpty()
  estComplete: boolean;

  @IsBoolean()
  @IsNotEmpty()
  estBrouillon: boolean;
}

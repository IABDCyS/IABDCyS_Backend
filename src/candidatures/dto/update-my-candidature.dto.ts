import { IsString, IsOptional, IsArray, ValidateNested, IsEmail, IsPhoneNumber, IsDateString, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { StatutCandidature } from '@prisma/client';

export class EducationDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  nomEtablissement: string;

  @IsString()
  typeEtablissement: string;

  @IsString()
  typeDiplome: string;

  @IsString()
  domaineEtude: string;

  @IsString()
  moyenne: string;

  @IsString()
  dateDebut: string;

  @IsString()
  dateFin: string;

  @IsString()
  echelleMoyenne: string;

  // @IsArray()
  // @ValidateNested({ each: true })
  // @Type(() => Record<string, string>)
  @IsOptional()
  semesters:any;
}

export class ReferenceDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  name: string;

  @IsString()
  relationship: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;
}

export class ProfilCandidatDto {
  
  @IsDateString()
  dateNaissance: string;


  @IsString()
  @IsOptional()
  nationalite?: string;

  @IsString()
  adresse: string;

  @IsString()
  ville: string;

  @IsString()
  province: string;

  @IsString()
  pays: string;

}
export class CandidatDto {

  @IsString()
  prenom: string;

  @IsString()
  nom: string;

  @IsEmail()
  email: string;

  @IsString()
  telephone: string;
  

  @ValidateNested()
  @Type(() => ProfilCandidatDto)
  profilCandidat: ProfilCandidatDto;
 
}




export class UpdateMyCandidatureDto {
  @ValidateNested()
  @Type(() => CandidatDto)
  candidat: CandidatDto;

  @IsOptional()
  @IsEnum(StatutCandidature)
  statut?: StatutCandidature;

  @IsOptional()
  @IsNumber()
  progression?: number;

  

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  dossierAcademique: EducationDto[];

  @IsString()
  statement: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReferenceDto)
  references: ReferenceDto[];
}

import { TypeNote } from "@prisma/client";

export class CreateNoteCandidatureDto {
    contenu: string;
    type?: TypeNote;
    
    
}
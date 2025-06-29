import { Injectable, NotFoundException, ForbiddenException, BadRequestException, HttpException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { User, TypeDocument, StatutDocument } from '@prisma/client';
import { CloudinaryResponse } from '@/cloudinary/types/cloudinary-response';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  async uploadDocument(
    candidatureId: string,
    file: Express.Multer.File,
    data: {
      type: TypeDocument;
      titre: string;
      description?: string;
      estObligatoire: boolean;
    },
    user: User,
  ) {
    try {
      // Validate input parameters
      if (!file) {
        throw new BadRequestException('Aucun fichier n\'a été fourni');
      }

      if (!Object.values(TypeDocument).includes(data.type)) {
        throw new BadRequestException('Type de document invalide');
      }

      // Validate file type
      const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException('Type de fichier non autorisé. Seuls les fichiers PDF, JPEG et PNG sont acceptés.');
      }

      // Validate file size (5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        throw new BadRequestException('Taille du fichier trop importante. Maximum 5MB.');
      }

      // Check if candidature exists and user has access
      const candidature = await this.prisma.candidature.findUnique({
        where: { id: candidatureId },
        select: { candidatId: true, statut: true },
      });

      if (!candidature) {
        throw new NotFoundException('Candidature non trouvée');
      }

      if (candidature.candidatId !== user.id && user.role !== 'ADMINISTRATEUR') {
        throw new ForbiddenException('Accès non autorisé à cette candidature');
      }

      // Check if candidature is not already submitted
      if (candidature.statut === 'SOUMISE') {
        throw new ForbiddenException('Impossible de modifier les documents d\'une candidature déjà soumise');
      }

      // Check if a document of this type already exists
      const existingDocument = await this.prisma.document.findFirst({
        where: {
          candidatureId,
          type: data.type,
        },
      });

      let cloudinaryResponse: CloudinaryResponse;
      const uploadPath = `IABDCys/${new Date().getFullYear()}/applicants/${user.id}/documents`;

      if (existingDocument) {
        // Only update the file in Cloudinary if a new file is provided
        if (file) {
          try {
            // Upload new file first to ensure it succeeds
            cloudinaryResponse = await this.cloudinary.uploadFile(file, uploadPath);
            // Then delete old file
            await this.cloudinary.deleteFile(existingDocument.nomFichier);
          } catch (error) {
            throw new BadRequestException('Erreur lors de l\'upload du fichier: ' + error.message);
          }
        }

        // Update existing document record
        const document = await this.prisma.document.update({
          where: { id: existingDocument.id },
          data: {
            titre: data.titre,
            description: data.description,
            estObligatoire: data.estObligatoire,
            ...(cloudinaryResponse && {
              nomFichier: cloudinaryResponse.public_id,
              nomOriginal: file.originalname,
              tailleFichier: file.size,
              typeMime: file.mimetype,
              url: cloudinaryResponse.url,
              size: cloudinaryResponse.bytes,
            }),
          },
          include: {
            verifications: {
              include: {
                verificateur: {
                  select: {
                    nom: true,
                    role: true,
                  },
                },
              },
            },
          },
        });

        return document;
      } else {
        // Create new document
        try {
          cloudinaryResponse = await this.cloudinary.uploadFile(file, uploadPath);
        } catch (error) {
          throw new BadRequestException('Erreur lors de l\'upload du fichier: ' + error.message);
        }

        const document = await this.prisma.document.create({
          data: {
            type: data.type,
            titre: data.titre,
            description: data.description,
            estObligatoire: data.estObligatoire,
            nomFichier: cloudinaryResponse.public_id,
            nomOriginal: file.originalname,
            tailleFichier: file.size,
            typeMime: file.mimetype,
            url: cloudinaryResponse.url,
            size: cloudinaryResponse.bytes,
            candidature: {
              connect: { id: candidatureId },
            },
          },
          include: {
            verifications: {
              include: {
                verificateur: {
                  select: {
                    nom: true,
                    role: true,
                  },
                },
              },
            },
          },
        });

        return document;
      }
    } catch (error) {
      // Handle Prisma errors
      if (error.code === 'P2002') {
        throw new BadRequestException('Un document de ce type existe déjà pour cette candidature');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('La candidature spécifiée n\'existe pas');
      }
      
      // Re-throw if it's already a NestJS exception
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Log unexpected errors
      console.error('Unexpected error in uploadDocument:', error);
      throw new InternalServerErrorException('Une erreur est survenue lors de l\'upload du document');
    }
  }
  async getAllDocuments() {
    const documents = await this.prisma.document.findMany({
      include: {
        verifications: {
          include: {
            verificateur: {
              select: {
                nom: true,
                role: true,
              },
            },
          },
        },
      },
    });
    return documents;
  }
  async getAllDocumentsForPeriod(annee: number = new Date().getFullYear()) {
    const documents = await this.prisma.document.findMany({
      where: {
        candidature: {
          periodeCandidature: {
            annee: annee,
          },
        },
      },
      include: {
        candidature:{
          select:{
            programme:{
              select:{
                nom:true
              }
            },
            candidat:{
              select:{
                nom:true,
                prenom:true,
                email:true
              }
            }
          }
        },
        verifications: {
          include: {
            verificateur: {
              select: {
                nom: true,
                role: true,
              },
            },
          },
        },
      },
    });
    return documents;
  }
  async getCandidatureDocuments(candidatureId: string, user: User) {
    const candidature = await this.prisma.candidature.findUnique({
      where: { id: candidatureId },
      select: { candidatId: true },
    });

    if (!candidature) {
      throw new NotFoundException('Candidature non trouvée');
    }

    if (candidature.candidatId !== user.id && !['ADMINISTRATEUR', 'COORDINATEUR'].includes(user.role)) {
      throw new ForbiddenException('Accès non autorisé à cette candidature');
    }

    const documents = await this.prisma.document.findMany({
      where: {
        candidatureId: candidatureId,
      },
      include: {
        verifications: {
          include: {
            verificateur: {
              select: {
                nom: true,
                role: true,
              },
            },
          },
        },
      },
    });

    return documents;
  }

  async verifyDocument(
    documentId: string,
    data: { statut: StatutDocument; notes: string },
    user: User,
  ) {
    if (!['ADMINISTRATEUR', 'COORDINATEUR'].includes(user.role)) {
      throw new ForbiddenException('Seuls les coordinateurs et administrateurs peuvent vérifier les documents');
    }

    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document non trouvé');
    }

    const verification = await this.prisma.verificationDocument.create({
      data: {
        documentId,
        verificateurId: user.id,
        statut: data.statut,
        notes: data.notes,
      },
      include: {
        verificateur: {
          select: {
            nom: true,
            role: true,
          },
        },
      },
    });

    // Update document status
    await this.prisma.document.update({
      where: { id: documentId },
      data: { statut: data.statut },
    });

    return verification;
  }

  async deleteDocument(documentId: string, user: User) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        candidature: {
          select: {
            candidatId: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document non trouvé');
    }

    if (
      document.candidature.candidatId !== user.id &&
      !['ADMINISTRATEUR'].includes(user.role)
    ) {
      throw new ForbiddenException('Non autorisé à supprimer ce document');
    }

    // Delete from Cloudinary
    await this.cloudinary.deleteFile(document.nomFichier);

    // Delete from database
    await this.prisma.document.delete({
      where: { id: documentId },
    });

    return { message: 'Document supprimé avec succès' };
  }
}

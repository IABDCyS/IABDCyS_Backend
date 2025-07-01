import { UpdateCandidatProfileDto } from './../auth/dto/update-profile.dto';
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCandidatureDto } from './dto/create-candidature.dto';
import { UpdateCandidatureDto } from './dto/update-candidature.dto';
import { UpdateApplicationInfoDto } from './dto/update-application-info.dto';
import { QueryCandidaturesDto } from './dto/query-candidatures.dto';
import { RetirerCandidatureDto } from './dto/retirer-candidature.dto';
import { RoleUtilisateur, StatutCandidature, StatutChronologie, User, TypeEtablissement, Prisma, TypeNote, TypeDiplome } from '@prisma/client';
import { UpdateInformationsPersonnellesDto } from './dto/update-informations-personnelles.dto';
import { CreateDossierAcademiqueDto } from './dto/create-dossier-academique.dto';
import { CreateNoteCandidatureDto } from './dto/create-note-candidature-dto';
import {UpdateMyCandidatureDto} from './dto/update-my-candidature.dto'
@Injectable()
export class CandidaturesService {
  constructor(private prisma: PrismaService) {}

  async findActivePeriods() {
    const now = new Date();
    return this.prisma.periodeCandidature.findMany({
      where: {
        dateDebut: {
          lte: now
        },
        dateLimiteCandidature: {
          gte: now
        },
        statut: 'ACTIVE'
      },
      include: {
        programmes: true
      }
    });
  }

  async findUserApplications(userId: string) {
    return this.prisma.candidature.findMany({
      where: {
        candidatId: userId
      },
      include: {
        programme: true,
        candidat: true
      },
      orderBy: {
        creeA: 'desc'
      }
    });
  }

  async findAll(query?: QueryCandidaturesDto, userId?:string,userRole?:RoleUtilisateur) {

    const { page = 1, limite = 10, statut, programme, periode, recherche } = query;
    const skip = (page - 1) * (limite === -1 ? 0 : limite);

    // Base query
    const where: Prisma.CandidatureWhereInput = {
      ...(statut && { statut }),
      ...(programme && { programmeId: programme }),
      ...(periode && { periodeCandidatureId: periode }),
      ...(recherche && {
        OR: [
          { numeroCandidature: { contains: recherche, mode: 'insensitive' as const } },
          { candidat: {
            OR: [
              { prenom: { contains: recherche, mode: 'insensitive' as const } },
              { nom: { contains: recherche, mode: 'insensitive' as const } },
              { email: { contains: recherche, mode: 'insensitive' as const } },
            ],
          }},
        ],
      }),
    };

    // Role-based filtering
    if (userRole === RoleUtilisateur.CANDIDAT) {
      where['candidatId'] = userId;
    } else if (userRole === RoleUtilisateur.COORDINATEUR) {
      where['programme'] = {
        coordinateurs: {
          some: {
            utilisateurId: userId,
          },
        },
      };
    }

    const [candidatures, total] = await Promise.all([
      this.prisma.candidature.findMany({
        where,
        skip,
        take: limite === -1 ? undefined : limite,
        select: {
          id: true,
          numeroCandidature: true,
          statut: true,
          progression: true,
          // priorite: true,
          soumiseA: true,
          dateLimite: true,
          candidat: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              email: true,
            },
          },
          programme: {
            select: {
              id: true,
              nom: true,
              code: true,
            },
          },
          periodeCandidature: {
            select: {
              id: true,
              nom: true,
              annee: true,
              semestre: true,
            },
          },
        },
        orderBy: {
          soumiseA: 'desc',
        },
      }),
      this.prisma.candidature.count({ where }),
    ]);

    return {
      candidatures,
      pagination: {
        page,
        limite: limite === -1 ? total : limite,
        total,
        totalPages: limite === -1 ? 1 : Math.ceil(total / limite),
      },
    };
  }

  async create(createCandidatureDto: CreateCandidatureDto, userId: string) {
    // Vérifier si le programme et la période existent
    const [programme, periode] = await Promise.all([
      this.prisma.programme.findUnique({
        where: { id: createCandidatureDto.programmeId },
      }),
      this.prisma.periodeCandidature.findUnique({
        where: { id: createCandidatureDto.periodeId },
      }),
    ]);

    if (!programme || !periode) {
      throw new NotFoundException('Programme ou période non trouvé');
    }

    // Générer le numéro de candidature
    const numeroCandidature = await this.generateNumeroCandidature(periode.annee);

    return this.prisma.candidature.create({
      data: {
        numeroCandidature,
        candidatId: userId,
        dateLimite: periode.dateLimiteCandidature,
        programmeId: createCandidatureDto.programmeId,
        periodeCandidatureId: createCandidatureDto.periodeId,
        // typeEtude: createCandidatureDto.typeEtude,
        // dateDebutPrevue: createCandidatureDto.dateDebutPrevue,
        statut: 'BROUILLON',
      },
      include: {
        candidat: {
          select: {
            prenom: true,
            nom: true,
            email: true,
          },
        },
        programme: {
          select: {
            nom: true,
            code: true,
          },
        },
        periodeCandidature: {
          select: {
            nom: true,
            annee: true,
            semestre: true,
          },
        },
      },
    });
  }

  async findOne(id: string, user: User) {
    const candidature = await this.prisma.candidature.findUnique({
      where: { id },
      select: {
       
        numeroCandidature:true,
        programmeId:true,
        statement:true,
        soumiseA:true,
        statut:true,
        progression:true,
        candidat: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            email: true,
            profilCandidat: {
              select: {
                dateNaissance: true,
                genre: true,
                nationalite: true,
                adresse: true,
                ville: true,
                province: true,
                pays: true,
                nomContactUrgence: true,
                telephoneContactUrgence: true,
                emailContactUrgence: true,
                communicationPreferee: true,
              },
            },
          },
        },
        programme: {
          select: {
            id: true,
            nom: true,
            code: true,
            
          },
        },
        periodeCandidature: {
          select: {
            id: true,
            nom: true,
            annee: true,
            semestre: true,
            dateFin:true
          },
        },
        dossierAcademique: true,
        documents: {
          include: {
            verifications: true,
          },
        },
        references: true,
        entretiens: {
          include: {
            examinateur: {
              select: {
                prenom: true,
                nom: true,
              },
            },
          },
        },
        chronologie: {
          orderBy: {
            creeA: 'desc',
          },
        },
        notes: {
          orderBy: {
            creeA: 'desc',
          },
        },
      },
    });

    if (!candidature) {
      throw new NotFoundException(`Candidature avec ID ${id} non trouvée`);
    }

    // Vérifier les permissions non autorisées
    if (
      user.role === RoleUtilisateur.CANDIDAT &&
      candidature.candidat.id !== user.id
    ) {
      throw new ForbiddenException('Accès non autorisé à cette candidature');
    }

    if (
      user.role === RoleUtilisateur.COORDINATEUR &&
      !(await this.hasAccessToProgram(user.id, candidature.programmeId))
    ) {
      throw new ForbiddenException('Accès non autorisé à cette candidature');
    }

    return candidature;
  }

  async update(id: string, updateCandidatureDto: any, user: User) {
    await this.checkCandidatureAccess(id, user);
  
    const updateData: any = {};
  
    // Handle candidat updates
    if (updateCandidatureDto.candidat) {
      const candidatUpdate: any = {};
  
      // Basic candidat fields
      if (updateCandidatureDto.candidat.prenom) {
        candidatUpdate.prenom = updateCandidatureDto.candidat.prenom;
      }
      if(updateCandidatureDto.progression){
        updateData.progression = updateCandidatureDto.progression;
      }
      if (updateCandidatureDto.candidat.nom) {
        candidatUpdate.nom = updateCandidatureDto.candidat.nom;
      }
      if (updateCandidatureDto.candidat.email) {
        candidatUpdate.email = updateCandidatureDto.candidat.email;
      }
      if (updateCandidatureDto.candidat.telephone) {
        candidatUpdate.telephone = updateCandidatureDto.candidat.telephone;
      }

  
      // Handle profilCandidat updates
      if (updateCandidatureDto.candidat.profilCandidat) {
        const profil = updateCandidatureDto.candidat.profilCandidat;
        const profilUpdate: any = {};
  
        if (profil.dateNaissance) {
          try {
            // Handle date strings like "2020-12-30" by ensuring they're parsed as UTC
            let date: Date;
            if (typeof profil.dateNaissance === 'string') {
              // If it's just a date string (YYYY-MM-DD), append time to make it a full datetime
              if (profil.dateNaissance.match(/^\d{4}-\d{2}-\d{2}$/)) {
                date = new Date(profil.dateNaissance + 'T00:00:00.000Z');
              } else {
                date = new Date(profil.dateNaissance);
              }
            } else {
              date = new Date(profil.dateNaissance);
            }
            
            if (isNaN(date.getTime())) {
              throw new Error('Invalid date format');
            }
            profilUpdate.dateNaissance = date;
          } catch (error) {
            console.error('Invalid dateNaissance format:', profil.dateNaissance);
            throw new Error(`Invalid date format for dateNaissance: ${profil.dateNaissance}. Expected format: YYYY-MM-DD`);
          }
        }
        if (profil.adresse) profilUpdate.adresse = profil.adresse;
        if (profil.ville) profilUpdate.ville = profil.ville;
        if (profil.province) profilUpdate.province = profil.province;
        if (profil.pays) profilUpdate.pays = profil.pays;
  
        candidatUpdate.profilCandidat = {
          update: profilUpdate
        };
      }
  
      updateData.candidat = { update: candidatUpdate };
    }
  
    // Handle statement update
    if (updateCandidatureDto.statement) {
      updateData.statement = updateCandidatureDto.statement;
    }
  
    // Perform the main update first
    const updatedCandidature = await this.prisma.candidature.update({
      where: { id },
      data: updateData,
      include: {
        candidat: {
          include: {
            profilCandidat: true
          }
        },
        dossierAcademique: true
      }
    });
  
    // Handle dossierAcademique updates separately
    if (updateCandidatureDto.dossierAcademique && updateCandidatureDto.dossierAcademique.length > 0) {
      for (const dossier of updateCandidatureDto.dossierAcademique) {
        if(dossier.id){
          await this.prisma.dossierAcademique.update({
            where: { id: dossier.id },
            data:  {
              nomEtablissement: dossier.nomEtablissement,
              typeEtablissement: dossier.typeEtablissement,
              typeDiplome: dossier.typeDiplome as TypeDiplome,
              domaineEtude: dossier.domaineEtude,
              moyenne: Number(dossier.moyenne),
              dateDebut: new Date(dossier.dateDebut),
              dateFin: new Date(dossier.dateFin),
              echelleMoyenne: Number(dossier.echelleMoyenne),
              semesters: dossier.semesters,
            },
          });
        }else{
          await this.prisma.dossierAcademique.create({
            data:  {
              // id: dossier.id, // Include the ID for creation
              nomEtablissement: dossier.nomEtablissement,
              typeEtablissement: dossier.typeEtablissement,
              typeDiplome: dossier.typeDiplome as TypeDiplome,
              domaineEtude: dossier.domaineEtude,
              moyenne: Number(dossier.moyenne),
              dateDebut: new Date(dossier.dateDebut),
              dateFin: new Date(dossier.dateFin),
              echelleMoyenne: Number(dossier.echelleMoyenne),
              candidatureId: id
              }
          });
        }
      }
    }
   
    
    return updatedCandidature;
  }

  async createDossierAcademique(id: string, createDto: CreateDossierAcademiqueDto, user: User) {
    const candidature = await this.checkCandidatureAccess(id, user);

    const dossier = await this.prisma.dossierAcademique.create({
      data: {
        ...createDto,
        candidature: {
          connect: { id }
        }
      }
    });

    await this.prisma.chronologieCandidature.create({
      data: {
        candidatureId: id,
        evenement: 'AJOUT_DOSSIER_ACADEMIQUE',
        description: `Ajout du dossier académique: ${createDto.typeDiplome} - ${createDto.nomEtablissement}`,
        acteurId: user.id,
        statut: StatutChronologie.EN_COURS,
      }
    });

    return {
      succes: true,
      donnees: {
        dossierAcademique: dossier
      }
    };
  }

  async updateDossierAcademique(id: string, dossierId: string, updateDto: CreateDossierAcademiqueDto, user: User) {
    const candidature = await this.checkCandidatureAccess(id, user);

    // Verify that the dossier belongs to this candidature
    const dossier = await this.prisma.dossierAcademique.findFirst({
      where: {
        id: dossierId,
        candidatureId: id
      }
    });

    if (!dossier) {
      throw new NotFoundException('Dossier académique non trouvé');
    }

    const updatedDossier = await this.prisma.dossierAcademique.update({
      where: { id: dossierId },
      data: updateDto
    });

    await this.prisma.chronologieCandidature.create({
      data: {
        candidatureId: id,
        evenement: 'MISE_A_JOUR_DOSSIER_ACADEMIQUE',
        description: `Mise à jour du dossier académique: ${updateDto.typeDiplome} - ${updateDto.nomEtablissement}`,
        acteurId: user.id,
        statut: StatutChronologie.EN_COURS,
      }
    });

    return {
      succes: true,
      donnees: {
        dossierAcademique: updatedDossier
      }
    };
  }

  async deleteDossierAcademique(id: string, dossierId: string, user: User) {
    const candidature = await this.checkCandidatureAccess(id, user);

    // Verify that the dossier belongs to this candidature
    const dossier = await this.prisma.dossierAcademique.findFirst({
      where: {
        id: dossierId,
        candidatureId: id
      }
    });

    if (!dossier) {
      throw new NotFoundException('Dossier académique non trouvé');
    }

    await this.prisma.dossierAcademique.delete({
      where: { id: dossierId }
    });

    await this.prisma.chronologieCandidature.create({
      data: {
        candidatureId: id,
        evenement: 'SUPPRESSION_DOSSIER_ACADEMIQUE',
        description: `Suppression du dossier académique: ${dossier.typeDiplome} - ${dossier.nomEtablissement}`,
        acteurId: user.id,
        statut: StatutChronologie.EN_COURS,
      }
    });

    return {
      succes: true,
      message: 'Dossier académique supprimé avec succès'
    };
  }

  async getDossiersAcademiques(id: string, user: User) {
    const candidature = await this.checkCandidatureAccess(id, user);

    const dossiers = await this.prisma.dossierAcademique.findMany({
      where: { candidatureId: id },
      orderBy: { dateDebut: 'desc' }
    });

    return {
      succes: true,
      donnees: {
        dossiersAcademiques: dossiers
      }
    };
  }

  async updateInformationsPersonnelles(id: string, updateDto: UpdateCandidatProfileDto, user: User) {
    const candidature = await this.checkCandidatureAccess(id, user);

    // Prepare the update data with proper date conversion
    const updateData: any = { ...updateDto };
    
    // Convert dateNaissance to Date object if present
    if (updateData.dateNaissance) {
      try {
        let date: Date;
        if (typeof updateData.dateNaissance === 'string') {
          // If it's just a date string (YYYY-MM-DD), append time to make it a full datetime
          if (updateData.dateNaissance.match(/^\d{4}-\d{2}-\d{2}$/)) {
            date = new Date(updateData.dateNaissance + 'T00:00:00.000Z');
          } else {
            date = new Date(updateData.dateNaissance);
          }
        } else {
          date = new Date(updateData.dateNaissance);
        }
        
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date format');
        }
        updateData.dateNaissance = date;
      } catch (error) {
        console.error('Invalid dateNaissance format:', updateData.dateNaissance);
        throw new Error(`Invalid date format for dateNaissance: ${updateData.dateNaissance}. Expected format: YYYY-MM-DD`);
      }
    }

    const updatedCandidature = await this.prisma.candidature.update({
      where: { id },
      data: {
        candidat: {
        update:{
          profilCandidat: {
            update: updateData
           }
        }
        },
        chronologie: {
          create: {
            evenement: 'MISE_A_JOUR_INFORMATIONS_PERSONNELLES',
            description: 'Informations personnelles mises à jour',
            acteurId: user.id,
            statut: StatutChronologie.EN_COURS,
          }
        }
      },
      include: {
        candidat: {
          select: {
            nom: true,
            prenom: true,
            telephone: true,
            email: true,
            profilCandidat: {
              select:{
                dateNaissance:true,
                adresse:true,
                ville:true,
          
                pays:true,
                genre:true,
                
              }
            }
          }
        }
      }
    });

    return {
      succes: true,
      donnees: {
        informationsPersonnelles: updatedCandidature
      }
    };
  }

  async getMonCandidature(id: string, user: User) {
    const candidature = await this.checkCandidatureAccess(id, user);

    const result = await this.prisma.candidature.findUnique({
      where: { id },
      select: {
        candidat: {
          select: {
            nom: true,
            prenom: true,
            telephone: true,
            email: true,
            profilCandidat:{
              select:{
                dateNaissance:true,
                adresse:true,
                ville:true,
                province:true,
                pays:true,
                
                
              }
            }
          }
        },
        periodeCandidature: true,
        dossierAcademique: {
          select: {
            id:true,
            nomEtablissement:true,
            typeEtablissement:true,
            typeDiplome:true,
            domaineEtude:true,
            // mention:true,
            moyenne:true,
            echelleMoyenne:true,
            dateDebut:true,
            dateFin:true,
            semesters:true,
            
          }
        },
        documents: true,
        statement: true,
        soumiseA: true,
        statut: true,
        progression: true,

        
      },
    });

    return {
      succes: true,
      donnees: {
        candidature: result
      }
    };
  }

  async soumettre(id: string, user: User) {
    const candidature = await this.checkCandidatureAccess(id, user);

    if (candidature.statut !== StatutCandidature.BROUILLON) {
      throw new ForbiddenException('Seules les candidatures en brouillon peuvent être soumises');
    }

    // Get candidature with documents to validate required documents
    const candidatureWithDocuments = await this.prisma.candidature.findUnique({
      where: { id },
      include: {
        documents: true,
        candidat: true,
        dossierAcademique: true,
      },
    });

    if (!candidatureWithDocuments) {
      throw new NotFoundException(`Candidature avec ID ${id} non trouvée`);
    }

    // Validate required documents
    const requiredDocumentTypes = [
      'DEMANDE_CV',
      'PHOTOS_IDENTITE', 
      'DIPLOMES',
      'RELEVES_NOTES',
      'CIN',
      'CONTRAT_FORMATION'
    ];

    const uploadedDocumentTypes = candidatureWithDocuments.documents.map(doc => doc.type);
    const missingDocuments = requiredDocumentTypes.filter(type => !uploadedDocumentTypes.includes(type));

    if (missingDocuments.length > 0) {
      const documentNames = {
        'DEMANDE_CV': 'CV',
        'PHOTOS_IDENTITE': 'Photos d\'identité',
        'DIPLOMES': 'Diplômes',
        'RELEVES_NOTES': 'Relevés de notes',
        'CIN': 'Carte d\'identité nationale',
        'CONTRAT_FORMATION': 'Contrat de formation'
      };
      
      const missingNames = missingDocuments.map(type => documentNames[type as keyof typeof documentNames]);
      throw new BadRequestException(`Documents requis manquants: ${missingNames.join(', ')}`);
    }

    // Validate other required fields
    if (!candidatureWithDocuments.candidat?.prenom || !candidatureWithDocuments.candidat?.nom || 
        !candidatureWithDocuments.candidat?.email || !candidatureWithDocuments.candidat?.telephone) {
      throw new BadRequestException('Informations personnelles incomplètes');
    }

    if (!candidatureWithDocuments.dossierAcademique || candidatureWithDocuments.dossierAcademique.length === 0) {
      throw new BadRequestException('Dossier académique requis');
    }

    if (!candidatureWithDocuments.statement || candidatureWithDocuments.statement.trim().length < 10) {
      throw new BadRequestException('Lettre de motivation requise (minimum 10 caractères)');
    }

    return this.prisma.candidature.update({
      where: { id },
      data: {
        statut: StatutCandidature.SOUMISE,
        soumiseA: new Date(),
        chronologie: {
          create: {
            evenement: 'SOUMISSION',
            description: 'Candidature soumise',
            acteurId: user.id,
            statut: StatutChronologie.EN_COURS,
          },
        },
      },
    });
  }

  async retirer(id: string, retirerCandidatureDto: RetirerCandidatureDto, user: User) {
    const candidature = await this.checkCandidatureAccess(id, user);

    if (candidature.statut === StatutCandidature.RETIREE) {
      throw new ForbiddenException('Cette candidature a déjà été retirée');
    }

    return this.prisma.candidature.update({
      where: { id },
      data: {
        statut: StatutCandidature.RETIREE,
        chronologie: {
          create: {
            evenement: 'RETRAIT',
            description: retirerCandidatureDto.raison,
            acteurId: user.id,
            statut: StatutChronologie.ANNULE,
          },
        },
      },
    });
  }

  private async checkCandidatureAccess(id: string, user: User) {
    const candidature = await this.prisma.candidature.findUnique({
      where: { id },
      select: {
        id: true,
        candidatId: true,
        programmeId: true,
        statut: true,
      },
    });

    if (!candidature) {
      throw new NotFoundException(`Candidature avec ID ${id} non trouvée`);
    }

    if (
      user.role === RoleUtilisateur.CANDIDAT &&
      candidature.candidatId !== user.id
    ) {
      throw new ForbiddenException('Accès non autorisé à cette candidature');
    }

    if (
      user.role === RoleUtilisateur.COORDINATEUR &&
      !(await this.hasAccessToProgram(user.id, candidature.programmeId))
    ) {
      throw new ForbiddenException('Accès non autorisé à cette candidature');
    }

    return candidature;
  }

  private async hasAccessToProgram(userId: string, programmeId: string): Promise<boolean> {
    const count = await this.prisma.profilCoordinateur.count({
      where: {
        utilisateurId: userId,
        programmesAssignes: {
          some: {
            id: programmeId,
          },
        },
      },
    });
    return count > 0;
  }

  async verifierCandidatureActive(userId: string): Promise<{ candidatureActive: boolean; candidatureId?: string }> {
    const activePeriod = await this.findActivePeriods();
    
    if (!activePeriod || activePeriod.length === 0) {
      return { candidatureActive: false };
    }

    const activePeriodsIds = activePeriod.map(period => period.id);

    const existingApplication = await this.prisma.candidature.findFirst({
      where: {
        candidatId: userId,
        periodeCandidatureId: { in: activePeriodsIds },
        statut: {
          in: ['BROUILLON', 'SOUMISE', 'EN_COURS_EXAMEN']
        }
      }
    });

    return {
      candidatureActive: !!existingApplication,
      candidatureId: existingApplication?.id
    };
  }

  private async generateNumeroCandidature(annee: number): Promise<string> {
    const count = await this.prisma.candidature.count({
      where: {
        periodeCandidature: {
          annee,
        },
      },
    });
    return `CAND-${annee}-${(count + 1).toString().padStart(3, '0')}`;
  }

  async updateApplicationInfo(id: string, updateDto: UpdateApplicationInfoDto, user: User) {
    const candidature = await this.checkCandidatureAccess(id, user);

    if (candidature.statut !== StatutCandidature.BROUILLON) {
      throw new ForbiddenException('Seules les candidatures en brouillon peuvent être modifiées');
    }

    // Get existing candidature with candidate info
    const existingCandidature = await this.prisma.candidature.findUnique({
      where: { id },
      include: {
        candidat: true
      }
    });

    if (!existingCandidature) {
      throw new NotFoundException(`Candidature avec ID ${id} non trouvée`);
    }

    const dossierAcademiqueCreate = updateDto.dossierAcademique?.map(dossier => ({
      nomEtablissement: dossier.nomEtablissement,
      typeEtablissement: dossier.typeEtablissement,
      ville: dossier.ville,
      typeDiplome: dossier.typeDiplome,
      specialite: dossier.specialite,
      dateDebut: dossier.dateDebut,
      dateFin: dossier.dateFin,
      mention: dossier.mention,
      domaineEtude: dossier.domaineEtude,
    })) || [];

    const referencesCreate = updateDto.references?.map(ref => ({
      nom: ref.nom,
      organisation: ref.organisation,
      relation: ref.relation,
      email: ref.email,
      telephone: ref.telephone,
    })) || [];

    return this.prisma.candidature.update({
      where: { id },
      data: {
        statement: updateDto.statement,
        dossierAcademique: {
          deleteMany: {
            candidatureId: id,
          },
          create: dossierAcademiqueCreate,
        },
        references: {
          deleteMany: {
            candidatureId: id,
          },
          create: referencesCreate,
        },
        candidat: updateDto.candidat ? {
          update: {
            where: {
              id: existingCandidature.candidatId
            },
            data: {
              prenom: updateDto.candidat.prenom,
              nom: updateDto.candidat.nom,
              telephone: updateDto.candidat.telephone,
              profilCandidat: {
                update: {
                  adresse: updateDto.candidat.adresse,
                  ville: updateDto.candidat.ville,
                  pays: updateDto.candidat.pays,
                }
              }
              // email is intentionally not included as it cannot be modified
            }
          }
        } : undefined,
        chronologie: {
          create: {
            evenement: 'MISE_A_JOUR',
            description: 'Mise à jour des informations de la candidature',
            acteurId: user.id,
            statut: StatutChronologie.EN_COURS,
          },
        },
      },
      include: {
        candidat: true,
        dossierAcademique: true,
        references: true
      }
    });
  }
  async addNote(id: string, noteDto: any, user: User) {
      const note = await this.prisma.noteCandidature.create({
          data: {
              contenu: noteDto.contenu,
              type: noteDto.type||TypeNote.GENERALE,
              candidatureId: id,
             auteurId: user.id,
             nomAuteur: user.nom,
             roleAuteur: user.role, 
          },
      });
      return note;
  }

  async getNotes(id: string, user: User) {
    const notes = await this.prisma.noteCandidature.findMany({
      where: {
        candidatureId: id,
      },
   
    });
    return notes;
  }

  async deleteNote(id: string) {
    const note = await this.prisma.noteCandidature.delete({
      where: {
        id,
      },
    });
    return note;
  }
}

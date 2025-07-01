import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { QueryUtilisateursDto } from "./dto/query-utilisateurs.dto";
import { UpdateUtilisateurDto } from "./dto/update-utilisateur.dto";
import { UpdateProfilCandidatDto } from "./dto/update-profil-candidat.dto";
import { UpdateProfilCoordinateurDto } from "./dto/update-profil-coordinateur.dto";
import { RoleUtilisateur } from "@prisma/client";

@Injectable()
export class UtilisateursService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryUtilisateursDto) {
    const { page = 1, limite = 10, role, statut, recherche } = query;
    const skip = (page - 1) * (limite === -1 ? 0 : limite);

    const where = {
      ...(role && { role }),
      ...(statut && { statut }),
      ...(recherche && {
        OR: [
          {
            prenom: { contains: recherche, mode: Prisma.QueryMode.insensitive },
          },
          { nom: { contains: recherche, mode: Prisma.QueryMode.insensitive } },
          {
            email: { contains: recherche, mode: Prisma.QueryMode.insensitive },
          },
        ],
      }),
    };

    const [utilisateurs, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limite === -1 ? undefined : limite,
        select: {
          id: true,
          email: true,
          prenom: true,
          nom: true,
          role: true,
          statut: true,
          telephone: true,
          emailVerifie: true,
          derniereConnexion: true,
          creeA: true,
          modifieA: true,
          profilCandidat: {
            select: {
              id: true,
              dateNaissance: true,
              genre: true,
              nationalite: true,
              ville: true,
              pays: true,
            },
          },
          profilCoordinateur: {
            select: {
              id: true,
              departement: true,
              bureauLocalisation: true,
              specialisation: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      utilisateurs,
      pagination: {
        page,
        limite: limite === -1 ? total : limite,
        total,
        totalPages: limite === -1 ? 1 : Math.ceil(total / limite),
      },
    };
  }

  async findOne(id: string) {
    const utilisateur = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        prenom: true,
        nom: true,
        role: true,
        statut: true,
        telephone: true,
        emailVerifie: true,
        derniereConnexion: true,
        creeA: true,
        modifieA: true,
        profilCandidat: true,
        profilCoordinateur: true,
        profilExaminateur: true,
        profilAdministrateur: true,
      },
    });

    if (!utilisateur) {
      throw new NotFoundException(`Utilisateur avec ID ${id} non trouvé`);
    }

    return utilisateur;
  }

  async update(id: string, updateUtilisateurDto: UpdateUtilisateurDto) {
    await this.findOne(id);
    // CHNAGE WHAT'S NOT EMPTY
    const data: any = {};
    if (updateUtilisateurDto.role) data.role = updateUtilisateurDto.role;
    if (updateUtilisateurDto.statut) data.statut = updateUtilisateurDto.statut;
    if (updateUtilisateurDto.email) data.email = updateUtilisateurDto.email;
    if (updateUtilisateurDto.password)
      data.password = updateUtilisateurDto.password;
    if (updateUtilisateurDto.telephone)
      data.telephone = updateUtilisateurDto.telephone;
    if (updateUtilisateurDto.prenom) data.prenom = updateUtilisateurDto.prenom;
    if (updateUtilisateurDto.nom) data.nom = updateUtilisateurDto.nom;

    return this.prisma.user.update({
      where: { id },
      data: {
        ...updateUtilisateurDto,
        role: updateUtilisateurDto.role as RoleUtilisateur,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.user.delete({
      where: { id },
    });
  }

  async updateProfil(
    id: string,
    updateProfilDto: UpdateProfilCandidatDto | UpdateProfilCoordinateurDto
  ) {
    const user = await this.findOne(id);

    if (user.role === RoleUtilisateur.CANDIDAT) {
      return this.prisma.profilCandidat.upsert({
        where: { utilisateurId: id },
        create: {
          ...(updateProfilDto as UpdateProfilCandidatDto),
          utilisateur: { connect: { id } },
        },
        update: updateProfilDto as UpdateProfilCandidatDto,
      });
    } else if (user.role === RoleUtilisateur.COORDINATEUR) {
      return this.prisma.profilCoordinateur.upsert({
        where: { utilisateurId: id },
        create: {
          ...(updateProfilDto as UpdateProfilCoordinateurDto),
          utilisateur: { connect: { id } },
        },
        update: updateProfilDto as UpdateProfilCoordinateurDto,
      });
    }

    throw new NotFoundException(
      `Type de profil non pris en charge pour le rôle ${user.role}`
    );
  }

  async findExaminateurs() {
    return this.prisma.user.findMany({
      where: {
        role: RoleUtilisateur.EXAMINATEUR,
        statut: "ACTIF",
      },
      select: {
        id: true,
        email: true,
        prenom: true,
        nom: true,
        role: true,
        statut: true,
        telephone: true,
        emailVerifie: true,
        derniereConnexion: true,
        creeA: true,
        modifieA: true,
      },
      orderBy: {
        nom: "asc",
      },
    });
  }

  async findCandidats() {
    return this.prisma.user.findMany({
      where: {
        role: RoleUtilisateur.CANDIDAT,
        statut: "ACTIF",
      },
      select: {
        id: true,
        email: true,
        prenom: true,
        nom: true,
        role: true,
        statut: true,
        telephone: true,
        emailVerifie: true,
        derniereConnexion: true,
        creeA: true,
        modifieA: true,
      },
      orderBy: {
        nom: "asc",
      },
    });
  }
}

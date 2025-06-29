import { PrismaClient, RoleUtilisateur, StatutUtilisateur, TypeDiplome, Semestre, StatutPeriode } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Check if admin user already exists
  let admin = await prisma.user.findUnique({
    where: { email: 'admin@example.com' }
  });

  if (!admin) {
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        prenom: 'Admin',
        nom: 'User One',
        role: RoleUtilisateur.ADMINISTRATEUR,
        statut: StatutUtilisateur.ACTIF,
        emailVerifie: true,
        profilAdministrateur: {
          create: {
            departement: 'Administration',
            niveauAcces: 'SUPER_ADMIN',
            permissions: ['ALL']
          }
        }
      }
    });
    console.log('✅ Admin user created');
  } else {
    console.log('ℹ️ Admin user already exists');
  }

  // Check if program already exists
  let program = await prisma.programme.findFirst({
    where: { code: 'IABDCyS' }
  });

  if (!program) {
    console.log('📚 Creating program...');
    program = await prisma.programme.create({
      data: {
        nom: 'IABDCyS',
        description: 'Intelligence Artificielle, Big Data et Cyber Sécurité',
        code: 'IABDCyS',
        departement: 'Informatique',
        diplome: TypeDiplome.LICENCE_US,
        duree: 12
      }
    });
    console.log('✅ Program created');
  } else {
    console.log('ℹ️ Program already exists');
  }

  // Check if period already exists
  let period = await prisma.periodeCandidature.findFirst({
    where: { nom: 'Automne 2025' }
  });

  if (!period) {
    console.log('📅 Creating candidature period...');
    period = await prisma.periodeCandidature.create({
      data: {
        nom: 'Automne 2025',
        annee: 2025,
        semestre: Semestre.AUTOMNE,
        dateDebut: new Date('2025-09-01'),
        dateFin: new Date('2025-12-31'),
        dateLimiteCandidature: new Date('2025-08-15'),
        dateDecision: new Date('2025-08-30'),
        statut: StatutPeriode.A_VENIR
      }
    });
    console.log('✅ Candidature period created');
  } else {
    console.log('ℹ️ Candidature period already exists');
  }

  // Check if coordinator already exists
  let coordinator = await prisma.user.findUnique({
    where: { email: 'coordinator@example.com' }
  });

  if (!coordinator) {
    console.log('👥 Creating coordinator...');
    const coordinatorPassword = await bcrypt.hash('Coord123!', 10);
    coordinator = await prisma.user.create({
      data: {
        email: 'coordinator@example.com',
        password: coordinatorPassword,
        prenom: 'John',
        nom: 'Coordinator',
        role: RoleUtilisateur.COORDINATEUR,
        statut: StatutUtilisateur.ACTIF,
        emailVerifie: true,
        profilCoordinateur: {
          create: {
            departement: 'Informatique',
            specialisation: ['Intelligence Artificielle', 'Big Data'],
            programmesAssignes: {
              connect: {
                id: program.id
              }
            }
          }
        }
      }
    });
    console.log('✅ Coordinator created');
  } else {
    console.log('ℹ️ Coordinator already exists');
  }

  // Check if examiner already exists
  let examiner = await prisma.user.findUnique({
    where: { email: 'examiner@example.com' }
  });

  if (!examiner) {
    console.log('👨‍🏫 Creating examiner...');
    const examinerPassword = await bcrypt.hash('Exam123!', 10);
    examiner = await prisma.user.create({
      data: {
        email: 'examiner@example.com',
        password: examinerPassword,
        prenom: 'Jane',
        nom: 'Examiner',
        role: RoleUtilisateur.EXAMINATEUR,
        statut: StatutUtilisateur.ACTIF,
        emailVerifie: true,
        profilExaminateur: {
          create: {
            titre: 'Dr.',
            departement: 'Informatique',
            specialisation: ['Intelligence Artificielle'],
            maxEntretiensParJour: 4,
            creneauxPreferes: ['MATIN', 'APRES_MIDI'],
            joursDisponibles: ['LUNDI', 'MERCREDI', 'VENDREDI']
          }
        }
      }
    });
    console.log('✅ Examiner created');
  } else {
    console.log('ℹ️ Examiner already exists');
  }

  // Check if applicant already exists
  let applicant = await prisma.user.findUnique({
    where: { email: 'applicant@example.com' }
  });

  if (!applicant) {
    console.log('👤 Creating applicant...');
    const applicantPassword = await bcrypt.hash('Appl123!', 10);
    applicant = await prisma.user.create({
      data: {
        email: 'applicant@example.com',
        password: applicantPassword,
        prenom: 'Alice',
        nom: 'Applicant',
        role: RoleUtilisateur.CANDIDAT,
        statut: StatutUtilisateur.ACTIF,
        emailVerifie: true,
        profilCandidat: {
          create: {
            dateNaissance: new Date('1998-01-01'),
            genre: 'FEMININ',
            nationalite: 'Marocaine',
            adresse: '123 Rue Example',
            ville: 'Casablanca',
            pays: 'Maroc',
            communicationPreferee: 'EMAIL'
          }
        }
      }
    });
    console.log('✅ Applicant created');
  } else {
    console.log('ℹ️ Applicant already exists');
  }

  console.log('🎉 Database seeding completed successfully!');
  console.log({
    admin: { id: admin.id, email: admin.email },
    program: { id: program.id, nom: program.nom },
    period: { id: period.id, nom: period.nom },
    coordinator: { id: coordinator.id, email: coordinator.email },
    examiner: { id: examiner.id, email: examiner.email },
    applicant: { id: applicant.id, email: applicant.email }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

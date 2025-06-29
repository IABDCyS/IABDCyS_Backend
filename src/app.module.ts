import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './mail/mail.module';
import {UtilisateursModule} from './utilisateurs/utilisateurs.module';
import {CandidaturesModule} from './candidatures/candidatures.module';
import {ProgrammesModule} from './programmes/programmes.module';
import {DocumentsModule} from './documents/documents.module';
import {NotificationsModule} from './notifications/notifications.module';
import {EntretiensModule} from './entretiens/entretiens.module';
import {CloudinaryModule} from './cloudinary/cloudinary.module';
import {StatsModule} from './stats/stats.module';
import {PeriodesModule} from './periodes/periodes.module';
import { AppController } from './app.controller';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UtilisateursModule,
    CandidaturesModule,
    ProgrammesModule,
    DocumentsModule,
    NotificationsModule,
    EntretiensModule,
    CloudinaryModule,
    MailModule,
    StatsModule,
    PeriodesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

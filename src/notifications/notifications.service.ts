import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { RoleUtilisateur, AudienceNotification } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, userRole: RoleUtilisateur, query: QueryNotificationsDto) {
    const { lue, type, limite = 20 } = query;

    const notifications = await this.prisma.destinataireNotification.findMany({
      where: {
        utilisateurId: userId,
        ...(lue !== undefined && { lue }),
        notification: {
          ...(type && { type })
        }
      },
      take: limite,
      include: {
        notification: true
      },
      orderBy: {
        notification: {
          creeA: 'desc'
        }
      }
    });

   

    return notifications.map(n => ({
          id: n.notification.id,
          titre: n.notification.titre,
          contenu: n.notification.contenu,
          type: n.notification.type,
          creeA: n.notification.creeA,
          lue: n.lue,
          lueA: n.lueA
        }))
        
     
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.destinataireNotification.findFirst({
      where: {
        notificationId: id,
        utilisateurId: userId
      }
    });

    if (!notification) {
      throw new NotFoundException('Notification non trouvée');
    }

    await this.prisma.destinataireNotification.update({
      where: {
        id: notification.id
      },
      data: {
        lue: true,
        lueA: new Date()
      }
    });

    return { succes: true };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.destinataireNotification.updateMany({
      where: {
        utilisateurId: userId,
        lue: false
      },
      data: {
        lue: true,
        lueA: new Date()
      }
    });

    return { succes: true };
  }

  async create(createDto: CreateNotificationDto, userId: string) {
    const { idsProgrammes, ...notificationData } = createDto;

    // Créer la notification
    const notification = await this.prisma.notification.create({
      data: {
        ...notificationData,
        expediteur: {
          connect:{
            id:userId
          }
        },
       
        // ...(idsProgrammes && {
        //   // pro: {
        //   //   connect: {
        //   //     code:"IABDCyS"
        //   //   }
        //   // }
        // })
      }, include:{
          destinataires:{
            select:{
              lue:true,
              id:true
            }
          }
        }
    });

    // Déterminer les destinataires basés sur l'audience
    let destinataires = [];
    switch (createDto.audience) {
      case AudienceNotification.TOUS:
        destinataires = await this.prisma.user.findMany({
          select: { id: true }
        });
        break;
      case AudienceNotification.CANDIDATS:
        destinataires = await this.prisma.user.findMany({
          where: { role: RoleUtilisateur.CANDIDAT },
          select: { id: true }
        });
        break;
      case AudienceNotification.PROGRAMMES_SPECIFIQUES:
        if (!idsProgrammes?.length) {
          throw new ForbiddenException('IDs des programmes requis pour l\'audience PROGRAMMES_SPECIFIQUES');
        }
        // Logique pour obtenir les utilisateurs des programmes spécifiques
        // À implémenter selon votre logique métier
        break;
    }

    // Créer les entrées DestinataireNotification
    await this.prisma.destinataireNotification.createMany({
      data: destinataires.map(dest => ({
        notificationId: notification.id,
        utilisateurId: dest.id,
        methode: ['email'] // Par défaut
      }))
    });

    return { succes: true, notification:{
      lue: notification.destinataires.filter(d => d.lue).length,
        nonLue: notification.destinataires.filter(d => !d.lue).length,
        envoyeA: notification.destinataires.length,
        ...notification
    }};
  }

  async findAllAdmin(userId: string) {
    const notifications = await this.prisma.notification.findMany({
      orderBy: { creeA: 'desc' },
      include: {
        expediteur: {
          select: {
            nom: true,
            prenom: true
          }
        },
        destinataires: {
          select:{
            lue:true,
            id:true // this
          }
        
          
        
      }
    }
    })
  
    

    return {
      succes: true,
      notifications: notifications.map(n => ({
        ...n,
        lue: n.destinataires.filter(d => d.lue).length,
        nonLue: n.destinataires.filter(d => !d.lue).length,
        envoyeA: n.destinataires.length,
      })),
      stats: {
        averageReadRate: notifications.reduce((acc, n) => acc + n.destinataires.filter(d => d.lue).length / n.destinataires.length, 0) / notifications.length,
        lastSent: notifications[0].creeA,
        totalSent: notifications.length,
        byAudience: {
          CANDIDATS: notifications.filter(n => n.audience === 'CANDIDATS').length,
          ADMINISTRATEURS: notifications.filter(n => n.audience === 'ADMINISTRATEURS').length,
          EXAMINATEURS: notifications.filter(n => n.audience === 'EXAMINATEURS').length,
          COORDINATEURS: notifications.filter(n => n.audience === 'COORDINATEURS').length,
          TOUS: notifications.filter(n => n.audience === 'TOUS').length,
        },
        unreadCount: notifications.reduce((acc, n) => acc + n.destinataires.filter(d => !d.lue).length, 0),
        byType: {
          SYSTEME: notifications.filter(n => n.type === 'SYSTEME').length,
          REGULIERE: notifications.filter(n => n.type === 'REGULIERE').length,
        },
        weeklyCount: notifications.filter(n => 
          new Date(n.creeA) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        lastWeekCount: notifications.filter(n => 
          new Date(n.creeA) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        mostEffectiveType: notifications.length > 0 
          ? (notifications.reduce((acc, n) => {
              const readRate = n.destinataires.filter(d => d.lue).length / n.destinataires.length;
              return acc.readRate > readRate ? acc : { type: n.type, readRate };
            }, { type: '', readRate: 0 })).type
          : null
      
  
      }
    };
  }

  async remove(id: string) {
    await this.prisma.notification.delete({
      where: { id }
    });

    return { succes: true };
  }
}

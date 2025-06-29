import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StatutPeriode, RoleUtilisateur, StatutCandidature, StatutEntretien, StatutDocument } from '@prisma/client';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRecentActivities() {
    // Get recent chronology events
    const recentChronology = await this.prisma.chronologieCandidature.findMany({
      take: 5,
      orderBy: {
        creeA: 'desc'
      },
      include: {
        candidature: {
          include: {
            candidat: true,
            periodeCandidature: true
          }
        }
      }
    });

    // Transform chronology events into the expected format
    const activities = recentChronology.map(event => ({
      id: event.id,
      type: event.evenement,
      description: event.description,
      statut: event.candidature.statut,
      candidat: event.candidature.candidat,
      periodeCandidature: event.candidature.periodeCandidature,
      modifieA: event.creeA.toISOString(),
      metadonnees: event.metadonnees
    }));

    return activities;
  }

  async getDashboardStats() {
    const [
      totalCandidatures,
      activeCandidatures,
      totalInterviewers,
      totalPeriods
    ] = await Promise.all([
      // Total des candidatures
      this.prisma.candidature.count(),
      
      // Candidatures actives (dans une période active)
      this.prisma.candidature.count({
        where: {
          programme: {
            periodesCandidature: {
              some: {
                statut: StatutPeriode.ACTIVE
              }
            }
          }
        }
      }),
      
      // Total des examinateurs
      this.prisma.user.count({
        where: {
          role: RoleUtilisateur.EXAMINATEUR
        }
      }),
      
      // Total des périodes cette année
      this.prisma.periodeCandidature.count({
        where: {
          annee: new Date().getFullYear()
        }
      })
    ]);

    // Get current period stats
    const activePeriod = await this.prisma.periodeCandidature.findFirst({
      where: {
        statut: StatutPeriode.ACTIVE
      }
    });

    let currentPeriodStats = {
      totalSoumises: 0,
      totalEnExamen: 0,
      totalAcceptees: 0,
      totalRefusees: 0,
      totalListeAttente: 0,
      totalBrouillon: 0,
      totalEntretienTermine: 0
      
    };

    if (activePeriod) {
      const [totalSoumises, totalEnExamen, totalAcceptees, totalRefusees, totalListeAttente, totalBrouillon, totalEntretienTermine] = await Promise.all([
        // Candidatures soumises
        this.prisma.candidature.count({
          where: {
            periodeCandidatureId: activePeriod.id,
            statut: StatutCandidature.SOUMISE
          }
        }),
        // Candidatures en cours d'examen
        this.prisma.candidature.count({
          where: {
            periodeCandidatureId: activePeriod.id,
            statut: StatutCandidature.EN_COURS_EXAMEN 
          }
        }),
        // Candidatures acceptées
        this.prisma.candidature.count({
          where: {
            periodeCandidatureId: activePeriod.id,
            statut: StatutCandidature.ACCEPTEE
          }
        }),
        // Candidatures refusées
        this.prisma.candidature.count({
          where: {
            periodeCandidatureId: activePeriod.id,
            statut: StatutCandidature.REFUSEE
          }
        }),
        // Candidatures en liste d'attente
        this.prisma.candidature.count({
          where: {
            periodeCandidatureId: activePeriod.id,
            statut: StatutCandidature.LISTE_ATTENTE
          }
        }),
        // Candidatures en brouillon
        this.prisma.candidature.count({
          where: {
            periodeCandidatureId: activePeriod.id,
            statut: StatutCandidature.BROUILLON
          }
        }),
        // Candidatures entretien termine
        this.prisma.candidature.count({
          where: {
            periodeCandidatureId: activePeriod.id,
            statut: StatutCandidature.ENTRETIEN_TERMINE
          }
        }),
        // Candidatures retirées
        this.prisma.candidature.count({
          where: {
            periodeCandidatureId: activePeriod.id,
            statut: StatutCandidature.RETIREE
          }
        }),
        // waiting for interview assigned
        
      ]);

      currentPeriodStats = {
        totalSoumises,
        totalEnExamen,
        totalAcceptees,
        totalRefusees,
        totalListeAttente,
        totalBrouillon,
        totalEntretienTermine
      };
    }

    return {
      totalCandidatures,
      activeCandidatures,
      totalInterviewers,
      totalPeriods,
      currentPeriodStats
    };
  }

  async getCoordinatorStats() {
    const currentPeriod = await this.prisma.periodeCandidature.findFirst({
      where: { statut: StatutPeriode.ACTIVE }
    });

    if (!currentPeriod) {
      return {
        totalApplications: 0,
        pendingReview: 0,
        documentsToVerify: 0,
        interviewsToSchedule: 0,
        pendingInterviews: 0,
        completedReviews: 0,
        averageProcessingTime: "0 days",
        documentVerificationRate: 0,
      };
    }

    const [
      totalApplications,
      pendingReview,
      documentsToVerify,
      interviewsToSchedule,
      pendingInterviews,
      completedReviews
    ] = await Promise.all([
      // Total applications in current period
      this.prisma.candidature.count({
        where: { periodeCandidatureId: currentPeriod.id }
      }),
      // Applications pending review
      this.prisma.candidature.count({
        where: {
          periodeCandidatureId: currentPeriod.id,
          statut: StatutCandidature.SOUMISE
        }
      }),
      // Documents needing verification
      this.prisma.document.count({
        where: {
          candidature: {
            periodeCandidatureId: currentPeriod.id,
            statut: {
              in: [StatutCandidature.SOUMISE, StatutCandidature.EN_COURS_EXAMEN]
            }
          },
        }
      }),
      // Interviews needing scheduling
      this.prisma.candidature.count({
        where: {
          periodeCandidatureId: currentPeriod.id,
          statut: StatutCandidature.EN_COURS_EXAMEN,
          entretiens: { none: {} }
        }
      }),
      // Pending interviews
      this.prisma.entretien.count({
        where: {
          candidature: {
            periodeCandidatureId: currentPeriod.id
          },
          statut: StatutEntretien.PROGRAMME
        }
      }),
      // Completed reviews
      this.prisma.candidature.count({
        where: {
          periodeCandidatureId: currentPeriod.id,
          statut: {
            in: [StatutCandidature.ACCEPTEE, StatutCandidature.REFUSEE, StatutCandidature.LISTE_ATTENTE]
          }
        }
      })
    ]);

    // Calculate average processing time
    const completedApplications = await this.prisma.candidature.findMany({
      where: {
        periodeCandidatureId: currentPeriod.id,
        statut: {
          in: [StatutCandidature.ACCEPTEE, StatutCandidature.REFUSEE]
        }
      },
      select: {
        soumiseA: true,
        modifieA: true
      }
    });

    let averageProcessingDays = 0;
    if (completedApplications.length > 0) {
      const totalDays = completedApplications.reduce((acc, app) => {
        const submittedDate = new Date(app.soumiseA);
        const completedDate = new Date(app.modifieA);
        const days = Math.ceil((completedDate.getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24));
        return acc + days;
      }, 0);
      averageProcessingDays = Math.round(totalDays / completedApplications.length * 10) / 10;
    }

    // Calculate document verification rate
    const [verifiedDocs, totalDocs] = await Promise.all([
      this.prisma.document.count({
        where: {
          candidature: {
            periodeCandidatureId: currentPeriod.id
          },
          verifications:{
            some:{
                statut:StatutDocument.VERIFIE
            }
          }
        }
      }),
      this.prisma.document.count({
        where: {
          candidature: {
            periodeCandidatureId: currentPeriod.id
          }
        }
      })
    ]);

    const documentVerificationRate = totalDocs > 0 ? Math.round((verifiedDocs / totalDocs) * 100) : 0;

    return {
      totalApplications,
      pendingReview,
      documentsToVerify,
      interviewsToSchedule,
      pendingInterviews,
      completedReviews,
      averageProcessingTime: `${averageProcessingDays} days`,
      documentVerificationRate
    };
  }

  async getRecentApplications() {
    const applications = await this.prisma.candidature.findMany({
      take: 5,
      orderBy: { modifieA: 'desc' },
      where: {
        periodeCandidature: {
          statut: StatutPeriode.ACTIVE
        }
      },
      include: {
        candidat: true,
        programme: true,
        documents: true,
        entretiens: true
      }
    });

    return applications.map(app => ({
      id: app.id,
      applicantName: `${app.candidat.prenom} ${app.candidat.nom}`,
      program: app.programme.nom,
      submittedDate: app.soumiseA ? new Date(app.soumiseA).toISOString().split('T')[0] : null,
      status: app.statut.toLowerCase(),
      priority: this.calculatePriority(app),
      documentsComplete: app.documents.length >= app.programme.documentsRequis.length,
      // gpa: app.?.toString() || 'N/A'
    }));
  }

  async getUpcomingInterviews() {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const interviews = await this.prisma.entretien.findMany({
      take: 5,
      where: {
        dateProgrammee: {
          gte: today,
          lte: nextWeek
        },
        statut: StatutEntretien.PROGRAMME,
      },
      orderBy: { dateProgrammee: 'asc' },
      include: {
        candidature: {
          include: {
            candidat: true,
            programme: true
          }
        },
        examinateur: true
      }
    });

    return interviews.map(interview => ({
      id: interview.id,
      applicantName: `${interview.candidature.candidat.prenom} ${interview.candidature.candidat.nom}`,
      program: interview.candidature.programme.nom,
      date: interview.dateProgrammee.toISOString().split('T')[0],
      time: interview.dateProgrammee.toTimeString().split(' ')[0].substring(0, 5),
      interviewer: `${interview.examinateur.prenom} ${interview.examinateur.nom}`,
      type: interview.type
    }));
  }

  async getTodaySummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const [
        applicationsReviewed,
        documentsVerified,
        interviewsScheduled
      ] = await Promise.all([
        // Count applications that were reviewed today
        this.prisma.candidature.count({
          where: {
            modifieA: {
              gte: today
            },
            statut: {
              in: [StatutCandidature.ACCEPTEE, StatutCandidature.REFUSEE, StatutCandidature.LISTE_ATTENTE]
            }
          }
        }),
        // Count documents that were verified today
        this.prisma.document.count({
          where: {
            verifications: {
              some: {
                verifieA: {
                  gte: today
                }
              }
            }
          }
        }),
        // Count interviews scheduled today
        this.prisma.entretien.count({
          where: {
            creeA: {
              gte: today
            }
          }
        })
      ]);

      // Try to get notifications count if the table exists
      let notificationsSent = 0;
      try {
        notificationsSent = await this.prisma.notification.count({
          where: {
            envoyeeA: {
              gte: today
            }
          }
        });
      } catch (error) {
        // If table doesn't exist or other error, keep count as 0
        console.log('Notifications table may not exist yet:', error);
      }

      return {
        applicationsReviewed,
        documentsVerified,
        interviewsScheduled,
        notificationsSent
      };
    } catch (error) {
      console.error('Error fetching today summary:', error);
      throw new Error('Failed to fetch today\'s summary statistics');
    }
  }

  async getInterviewerStats(examinateurId: string) {
    const currentPeriod = await this.prisma.periodeCandidature.findFirst({
      where: { statut: StatutPeriode.ACTIVE }
    });

    if (!currentPeriod) {
      return {
        assigned: 0,
        completed: 0,
        pending: 0,
        notesSubmitted: 0,
        currentPeriod: null
      };
    }

    const [
      assigned,
      completed,
      pending,
      notesSubmitted
    ] = await Promise.all([
      // Total assigned interviews for this examiner in current period
      this.prisma.entretien.count({
        where: {
          examinateurId: examinateurId,
          candidature: {
            periodeCandidatureId: currentPeriod.id
          }
        }
      }),
      // Completed interviews
      this.prisma.entretien.count({
        where: {
          examinateurId: examinateurId,
          candidature: {
            periodeCandidatureId: currentPeriod.id
          },
          statut: StatutEntretien.TERMINE
        }
      }),
      // Pending interviews
      this.prisma.entretien.count({
        where: {
          examinateurId: examinateurId,
          candidature: {
            periodeCandidatureId: currentPeriod.id
          },
          statut: StatutEntretien.PROGRAMME
        }
      }),
      // Interviews with notes submitted
      this.prisma.entretien.count({
        where: {
          examinateurId: examinateurId,
          candidature: {
            periodeCandidatureId: currentPeriod.id
          },
          notes: {
            some: {}
          }
        }
      })
    ]);

    return {
      assigned,
      completed,
      pending,
      notesSubmitted,
      currentPeriod: {
        id: currentPeriod.id,
        nom: currentPeriod.nom,
        annee: currentPeriod.annee,
        semestre: currentPeriod.semestre
      }
    };
  }

  async getTodayInterviews(examinateurId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const interviews = await this.prisma.entretien.findMany({
      where: {
        examinateurId: examinateurId,
        dateProgrammee: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        candidature: {
          include: {
            candidat: {
              select: {
                prenom: true,
                nom: true,
                email: true
              }
            },
            programme: {
              select: {
                nom: true
              }
            }
          }
        }
      },
      orderBy: {
        dateProgrammee: 'asc'
      }
    });

    return interviews.map(interview => ({
      id: interview.id,
      applicantName: `${interview.candidature.candidat.prenom} ${interview.candidature.candidat.nom}`,
      applicantEmail: interview.candidature.candidat.email,
      time: interview.dateProgrammee.toTimeString().split(' ')[0].substring(0, 5),
      duration: interview.duree || 45,
      location: interview.lieu || 'Virtual - Zoom',
      status: interview.statut.toLowerCase(),
      applicationId: interview.candidature.numeroCandidature || `APP-${interview.candidature.id}`,
      program: interview.candidature.programme.nom,
      type: interview.type
    }));
  }

  async getInterviewerRecentActivities(examinateurId: string) {
    const activities = [];

    // Get recent interviews with notes
    const recentInterviews = await this.prisma.entretien.findMany({
      where: {
        examinateurId: examinateurId
      },
      include: {
        candidature: {
          include: {
            candidat: {
              select: {
                prenom: true,
                nom: true
              }
            }
          }
        },
        notes: {
          orderBy: {
            creeA: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        modifieA: 'desc'
      },
      take: 10
    });

    for (const interview of recentInterviews) {
      const applicantName = `${interview.candidature.candidat.prenom} ${interview.candidature.candidat.nom}`;
      const timeAgo = this.getTimeAgo(interview.modifieA);

      if (interview.statut === StatutEntretien.TERMINE && interview.notes.length > 0) {
        activities.push({
          type: 'interview_completed',
          applicantName,
          time: timeAgo,
          action: 'Interview completed and notes submitted',
          interviewId: interview.id
        });
      } else if (interview.notes.length > 0) {
        activities.push({
          type: 'notes_submitted',
          applicantName,
          time: timeAgo,
          action: 'Interview notes updated',
          interviewId: interview.id
        });
      } else if (interview.statut === StatutEntretien.PROGRAMME) {
        activities.push({
          type: 'interview_scheduled',
          applicantName,
          time: timeAgo,
          action: 'New interview assigned',
          interviewId: interview.id
        });
      }
    }

    return activities.slice(0, 5); // Return only the 5 most recent activities
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }

  async getInterviewerHistory(examinateurId: string) {
    // Get all completed interviews for this examiner
    const interviews = await this.prisma.entretien.findMany({
      where: {
        examinateurId: examinateurId,
        statut: StatutEntretien.TERMINE
      },
      include: {
        candidature: {
          include: {
            candidat: {
              select: {
                prenom: true,
                nom: true,
                email: true
              }
            },
            programme: {
              select: {
                nom: true
              }
            },
            periodeCandidature: {
              select: {
                nom: true,
                annee: true,
                semestre: true
              }
            }
          }
        },
        notes: {
          orderBy: {
            creeA: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        dateProgrammee: 'desc'
      }
    });

    return interviews.map(interview => {
      const applicantName = `${interview.candidature.candidat.prenom} ${interview.candidature.candidat.nom}`;
      const periodName = `${interview.candidature.periodeCandidature.semestre} ${interview.candidature.periodeCandidature.annee}`;
      const latestNote = interview.notes[0];
      
      // Determine outcome based on note data
      let outcome = 'pending';
      let finalDecision = 'pending';
      
      if (latestNote) {
        if (latestNote.noteGlobale) {
          if (latestNote.noteGlobale >= 4) {
            outcome = 'recommended';
          } else if (latestNote.noteGlobale >= 3) {
            outcome = 'conditional';
          } else {
            outcome = 'not-recommended';
          }
        }
        
        // For now, we'll set final decision based on outcome
        // In a real system, this would come from the application status
        if (outcome === 'recommended') {
          finalDecision = 'accepted';
        } else if (outcome === 'not-recommended') {
          finalDecision = 'rejected';
        } else if (outcome === 'conditional') {
          finalDecision = 'waitlisted';
        }
      }

      return {
        id: interview.id,
        applicantName,
        applicationId: interview.candidature.numeroCandidature || `APP-${interview.candidature.id}`,
        period: periodName,
        date: interview.dateProgrammee.toISOString().split('T')[0],
        time: interview.heureProgrammee,
        status: interview.statut.toLowerCase(),
        outcome,
        finalDecision,
        notes: latestNote?.commentairesSupplementaires || latestNote?.recommandationGlobale || '',
        program: interview.candidature.programme.nom,
        applicantEmail: interview.candidature.candidat.email
      };
    });
  }

  async getInterviewerPeriodsOverview(examinateurId: string) {
    // Get all periods where this examiner has conducted interviews
    const periods = await this.prisma.periodeCandidature.findMany({
      where: {
        entretiens: {
          some: {
            examinateurId: examinateurId
          }
        }
      },
      include: {
        entretiens: {
          where: {
            examinateurId: examinateurId
          }
        }
      },
      orderBy: [
        {
          annee: 'desc'
        },
        {
          semestre: 'desc'
        }
      ]
    });

    return periods.map(period => {
      const totalInterviews = period.entretiens.length;
      const completedInterviews = period.entretiens.filter(e => e.statut === StatutEntretien.TERMINE).length;
      const pendingInterviews = totalInterviews - completedInterviews;
      
      const isCurrentPeriod = period.statut === StatutPeriode.ACTIVE;
      
      return {
        name: `${period.semestre} ${period.annee}`,
        status: isCurrentPeriod ? 'current' : 'completed',
        interviews: totalInterviews,
        completed: completedInterviews,
        pending: pendingInterviews,
        periodId: period.id
      };
    });
  }

  private calculatePriority(application: any): 'high' | 'medium' | 'low' {
    // Priority calculation logic:
    // High: Submitted more than 2 weeks ago OR high GPA (>3.8)
    // Medium: Submitted between 1-2 weeks ago OR medium GPA (3.5-3.8)
    // Low: Recently submitted AND lower GPA

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const submittedDate = new Date(application.soumiseA);
    const gpa = application.moyenneGenerale || 0;

    if (submittedDate < twoWeeksAgo || gpa >= 3.8) {
      return 'high';
    } else if (submittedDate < oneWeekAgo || gpa >= 3.5) {
      return 'medium';
    } else {
      return 'low';
    }
  }
}

import { Controller, Get, Request } from "@nestjs/common";
import { StatsService } from "./stats.service";
import { ApiTags } from "@nestjs/swagger";
import { Roles } from "../auth/decorators/roles.decorator";
import { RoleUtilisateur } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { UseGuards } from "@nestjs/common";

@ApiTags("Statistiques")
@Controller("stats")
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) { }

  @Get("recent-activities")
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.COORDINATEUR)
  async getRecentActivities() {
    return this.statsService.getRecentActivities();
  }

  @Get("dashboard")
  async getDashboardStats() {
    return this.statsService.getDashboardStats();
  }

  @Get("coordinator")
  @Roles(RoleUtilisateur.COORDINATEUR)
  async getCoordinatorStats() {
    return this.statsService.getCoordinatorStats();
  }

  @Get("interviewer")
  @Roles(RoleUtilisateur.EXAMINATEUR)
  async getInterviewerStats(@Request() req) {
    const stats = await this.statsService.getInterviewerStats(req.user.id);
    return {
      succes: true,
      donnees: stats,
    };
  }

  @Get("interviewer/today-interviews")
  @Roles(RoleUtilisateur.EXAMINATEUR)
  async getTodayInterviews(@Request() req) {
    const interviews = await this.statsService.getTodayInterviews(req.user.id);
    return {
      succes: true,
      donnees: interviews,
    };
  }

  @Get("interviewer/recent-activities")
  @Roles(RoleUtilisateur.EXAMINATEUR)
  async getInterviewerRecentActivities(@Request() req) {
    const activities = await this.statsService.getInterviewerRecentActivities(
      req.user.id
    );
    return {
      succes: true,
      donnees: activities,
    };
  }

  @Get("interviewer/history")
  @Roles(RoleUtilisateur.EXAMINATEUR)
  async getInterviewerHistory(@Request() req) {
    const history = await this.statsService.getInterviewerHistory(req.user.id);
    return {
      succes: true,
      donnees: history,
    };
  }

  @Get("interviewer/periods-overview")
  @Roles(RoleUtilisateur.EXAMINATEUR)
  async getInterviewerPeriodsOverview(@Request() req) {
    const periods = await this.statsService.getInterviewerPeriodsOverview(
      req.user.id
    );
    return {
      succes: true,
      donnees: periods,
    };
  }

  @Get("candidatures/recentes")
  @Roles(RoleUtilisateur.COORDINATEUR)
  async getRecentApplications() {
    return this.statsService.getRecentApplications();
  }

  @Get("entretiens/prevus")
  @Roles(RoleUtilisateur.COORDINATEUR)
  async getUpcomingInterviews() {
    return this.statsService.getUpcomingInterviews();
  }

  @Get("today-summary")
  @Roles(RoleUtilisateur.COORDINATEUR)
  async getTodaySummary() {
    return this.statsService.getTodaySummary();
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CampaignStatus,
  PaymentStatus,
  Role,
  UserStatus,
} from '../../../generated/prisma';

@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [
      totalUsers,
      totalClients,
      totalProfessionals,
      pendingUsers,
      totalProjectRequests,
      openProjectRequests,
      unverifiedProfessionals,
      pendingCertificates,
      pendingReports,
      openDisputes,
      pendingCampaigns,
      pendingPayments,
      revenue,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: Role.CLIENT } }),
      this.prisma.user.count({ where: { role: Role.PROFESSIONAL } }),
      this.prisma.user.count({ where: { status: UserStatus.PENDING } }),
      this.prisma.projectRequest.count(),
      this.prisma.projectRequest.count({ where: { status: 'OPEN' } }),
      this.prisma.professionalProfile.count({ where: { verified: false } }),
      this.prisma.certificate.count({ where: { verified: false } }),
      this.prisma.report.count({ where: { status: 'PENDING' } }),
      this.prisma.dispute.count({ where: { status: 'OPEN' } }),
      this.prisma.campaign.count({
        where: { status: CampaignStatus.PENDING_REVIEW },
      }),
      this.prisma.payment.count({ where: { status: PaymentStatus.PENDING } }),
      this.prisma.payment.aggregate({
        where: { status: PaymentStatus.SUCCEEDED },
        _sum: { amount: true },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        clients: totalClients,
        professionals: totalProfessionals,
        pending: pendingUsers,
      },
      projectRequests: {
        total: totalProjectRequests,
        open: openProjectRequests,
      },
      moderation: {
        unverifiedProfessionals,
        pendingCertificates,
        pendingReports,
        openDisputes,
        pendingCampaigns,
        pendingPayments,
      },
      revenue: {
        total: Number(revenue._sum.amount ?? 0),
      },
    };
  }
}

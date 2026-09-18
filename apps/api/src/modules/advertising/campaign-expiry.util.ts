import { CampaignStatus, type PrismaClient } from '../../../generated/prisma';

export async function expireOverdueCampaigns(
  prisma: PrismaClient,
): Promise<void> {
  await prisma.campaign.updateMany({
    where: {
      status: { in: [CampaignStatus.ACTIVE, CampaignStatus.PAUSED] },
      endDate: { lt: new Date() },
    },
    data: { status: CampaignStatus.COMPLETED },
  });
}

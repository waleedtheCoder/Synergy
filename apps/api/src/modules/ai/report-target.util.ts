import type { PrismaService } from '../../prisma/prisma.service';
import { ReportTargetType } from '../../../generated/prisma';

const MAX_LENGTH = 1500;

function clip(text: string): string {
  return text.length > MAX_LENGTH ? `${text.slice(0, MAX_LENGTH)}…` : text;
}

/**
 * Plain-text description of whatever a report points at, for the moderation
 * assistant. Returns null when the target no longer exists.
 */
export async function describeReportTarget(
  prisma: PrismaService,
  targetType: ReportTargetType,
  targetId: string,
): Promise<string | null> {
  switch (targetType) {
    case ReportTargetType.USER: {
      const user = await prisma.user.findUnique({
        where: { id: targetId },
        select: {
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          createdAt: true,
          professionalProfile: {
            select: { businessName: true, tagline: true, about: true },
          },
        },
      });
      if (!user) return null;
      const profile = user.professionalProfile;
      return clip(
        [
          `${user.role.toLowerCase()} account "${user.firstName} ${user.lastName}" (status ${user.status}, joined ${user.createdAt.toISOString().slice(0, 10)})`,
          profile?.businessName && `Business name: ${profile.businessName}`,
          profile?.tagline && `Tagline: ${profile.tagline}`,
          profile?.about && `About: ${profile.about}`,
        ]
          .filter(Boolean)
          .join('\n'),
      );
    }
    case ReportTargetType.REVIEW: {
      const review = await prisma.review.findUnique({
        where: { id: targetId },
        select: { rating: true, comment: true, response: true },
      });
      if (!review) return null;
      return clip(
        [
          `${review.rating}/5 review: ${review.comment ?? '(no comment)'}`,
          review.response && `Professional's response: ${review.response}`,
        ]
          .filter(Boolean)
          .join('\n'),
      );
    }
    case ReportTargetType.MESSAGE: {
      const message = await prisma.message.findUnique({
        where: { id: targetId },
        select: { type: true, content: true },
      });
      if (!message) return null;
      return clip(`${message.type} message: ${message.content ?? '(no text)'}`);
    }
    case ReportTargetType.PORTFOLIO_PROJECT: {
      const project = await prisma.portfolioProject.findUnique({
        where: { id: targetId },
        select: { title: true, description: true },
      });
      if (!project) return null;
      return clip(
        `Portfolio project "${project.title}": ${project.description ?? '(no description)'}`,
      );
    }
    case ReportTargetType.PROJECT_REQUEST: {
      const request = await prisma.projectRequest.findUnique({
        where: { id: targetId },
        select: { title: true, description: true },
      });
      if (!request) return null;
      return clip(`Project request "${request.title}": ${request.description}`);
    }
    default:
      return null;
  }
}


import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProfileChangeRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.profileChangeRequest.findMany({
      include: {
        user: {
          select: {
            name: true,
            surname: true,
          },
        },
      },
    });
  }

  async approve(id: string, reviewedById: string) {
    const request = await this.prisma.profileChangeRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new Error('Request not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: request.userId },
      data: request.requestedData as any,
    });

    return this.prisma.profileChangeRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedById,
        reviewedAt: new Date(),
      },
    });
  }

  reject(id: string, reviewedById: string) {
    return this.prisma.profileChangeRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedById,
        reviewedAt: new Date(),
      },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/persistence/prisma.service';
import type { WardStatus } from '../domain/ward';

@Injectable()
export class WardFacilityStatusSyncService {
  constructor(private readonly prisma: PrismaService) {}

  async apply(wardId: string, status: WardStatus): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.ward.update({
        where: { id: wardId },
        data: { status },
      }),
      this.prisma.healthFacility.updateMany({
        where: { wardId },
        data: { status },
      }),
    ]);
  }
}

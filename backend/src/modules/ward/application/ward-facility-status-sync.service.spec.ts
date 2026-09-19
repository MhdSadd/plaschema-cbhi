import { WardFacilityStatusSyncService } from './ward-facility-status-sync.service';

describe('WardFacilityStatusSyncService', () => {
  it('updates the ward and all linked facilities in one transaction', async () => {
    const wardUpdate = jest.fn().mockReturnValue({ where: {}, data: {} });
    const facilityUpdateMany = jest.fn().mockReturnValue({ where: {}, data: {} });
    const transaction = jest.fn(async (operations: Promise<unknown>[]) => {
      await Promise.all(operations);
    });

    const prisma = {
      $transaction: transaction,
      ward: { update: wardUpdate },
      healthFacility: { updateMany: facilityUpdateMany },
    };

    const service = new WardFacilityStatusSyncService(prisma as never);
    await service.apply('ward-1', 'inactive');

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(wardUpdate).toHaveBeenCalledWith({
      where: { id: 'ward-1' },
      data: { status: 'inactive' },
    });
    expect(facilityUpdateMany).toHaveBeenCalledWith({
      where: { wardId: 'ward-1' },
      data: { status: 'inactive' },
    });
  });
});

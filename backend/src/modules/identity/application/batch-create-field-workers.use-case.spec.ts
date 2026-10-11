import type { WardRepository } from '../../ward/application/ward.repository';
import type { UserRepository } from './user.repository';
import { BatchCreateFieldWorkersUseCase } from './batch-create-field-workers.use-case';

describe('BatchCreateFieldWorkersUseCase', () => {
  const users = {
    findExistingEmails: jest.fn(),
    wardIdsExist: jest.fn(),
    create: jest.fn(),
  } as unknown as jest.Mocked<UserRepository>;

  const wards = {
    findByLgaAndNames: jest.fn(),
  } as unknown as jest.Mocked<WardRepository>;

  let useCase: BatchCreateFieldWorkersUseCase;

  beforeEach(() => {
    jest.resetAllMocks();
    useCase = new BatchCreateFieldWorkersUseCase(users, wards);
    users.findExistingEmails.mockResolvedValue(new Set());
    users.wardIdsExist.mockResolvedValue(true);
    users.create.mockResolvedValue({} as never);
  });

  it('creates officers with a shared password', async () => {
    const csv = Buffer.from(
      'name,email,phone,status,lga,wards\nAda Lovelace,ada@cbhi.local,08012345678,active,,\n',
      'utf8',
    );

    const result = await useCase.execute(csv, 'ChangeMe123!', 'officers.csv');

    expect(result.created).toBe(1);
    expect(result.skipped).toBe(0);
    expect(users.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ada@cbhi.local',
        phone: '08012345678',
        role: 'field_worker',
        isPasswordChangeRequired: true,
      }),
    );
  });

  it('skips existing emails', async () => {
    users.findExistingEmails.mockResolvedValue(new Set(['ada@cbhi.local']));
    const csv = Buffer.from(
      'name,email,phone\nAda Lovelace,ada@cbhi.local,08012345678\n',
      'utf8',
    );

    const result = await useCase.execute(csv, 'ChangeMe123!', 'officers.csv');

    expect(result.created).toBe(0);
    expect(result.skipped).toBe(1);
    expect(users.create).not.toHaveBeenCalled();
  });
});

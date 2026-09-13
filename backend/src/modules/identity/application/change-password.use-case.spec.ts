import { hash } from 'bcryptjs';
import { AppError } from '../../../platform/http/app-error';
import type { UserRepository } from './user.repository';
import { ChangePasswordUseCase } from './change-password.use-case';

describe('ChangePasswordUseCase', () => {
  const userId = '01900000-0000-7000-8000-000000000010';

  let users: jest.Mocked<UserRepository>;
  let useCase: ChangePasswordUseCase;

  beforeEach(() => {
    users = {
      findById: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    useCase = new ChangePasswordUseCase(users);
  });

  it('rejects non-field-worker accounts', async () => {
    users.findById.mockResolvedValue({
      id: userId,
      name: 'Admin',
      email: 'admin@cbhi.local',
      passwordHash: await hash('ChangeMe123!', 12),
      role: 'admin',
      status: 'active',
      phone: null,
      lastSyncedAt: null,
      isPasswordChangeRequired: false,
      assignedWards: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      useCase.execute(userId, {
        currentPassword: 'ChangeMe123!',
        newPassword: 'NewPassword123!',
      }),
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
    } satisfies Partial<AppError>);
  });

  it('rejects an incorrect current password', async () => {
    users.findById.mockResolvedValue({
      id: userId,
      name: 'Worker',
      email: 'worker@cbhi.local',
      passwordHash: await hash('ChangeMe123!', 12),
      role: 'field_worker',
      status: 'active',
      phone: '+2348012345678',
      lastSyncedAt: null,
      isPasswordChangeRequired: true,
      assignedWards: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      useCase.execute(userId, {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewPassword123!',
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    } satisfies Partial<AppError>);
  });

  it('clears isPasswordChangeRequired after a successful change', async () => {
    users.findById.mockResolvedValue({
      id: userId,
      name: 'Worker',
      email: 'worker@cbhi.local',
      passwordHash: await hash('ChangeMe123!', 12),
      role: 'field_worker',
      status: 'active',
      phone: '+2348012345678',
      lastSyncedAt: null,
      isPasswordChangeRequired: true,
      assignedWards: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    users.update.mockResolvedValue({
      id: userId,
      name: 'Worker',
      email: 'worker@cbhi.local',
      role: 'field_worker',
      status: 'active',
      phone: '+2348012345678',
      lastSyncedAt: null,
      isPasswordChangeRequired: false,
      assignedWards: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await useCase.execute(userId, {
      currentPassword: 'ChangeMe123!',
      newPassword: 'NewPassword123!',
    });

    expect(users.update).toHaveBeenCalledWith(
      userId,
      expect.objectContaining({
        isPasswordChangeRequired: false,
        passwordHash: expect.any(String),
      }),
    );
    expect(result.isPasswordChangeRequired).toBe(false);
  });
});

import { Inject, Injectable } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { AppError } from '../../../platform/http/app-error';
import { USER_REPOSITORY, type UserRepository } from './user.repository';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(
    userId: string,
    input: { currentPassword: string; newPassword: string },
  ) {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    if (user.role !== 'field_worker') {
      throw new AppError(
        'FORBIDDEN',
        'Only field workers can change their password through this endpoint',
        403,
      );
    }

    const valid = await compare(input.currentPassword, user.passwordHash);
    if (!valid) {
      throw new AppError(
        'INVALID_CREDENTIALS',
        'Current password is incorrect',
        401,
      );
    }

    if (input.currentPassword === input.newPassword) {
      throw new AppError(
        'VALIDATION_ERROR',
        'New password must be different from the current password',
        400,
      );
    }

    return this.users.update(userId, {
      passwordHash: await hash(input.newPassword, 12),
      isPasswordChangeRequired: false,
    });
  }
}

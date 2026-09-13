import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppError } from '../http/app-error';
import type { AuthenticatedUser } from './current-user.decorator';
import { IS_PUBLIC_KEY } from './public.decorator';
import { SKIP_PASSWORD_CHANGE_REQUIRED_KEY } from './skip-password-change-required.decorator';

@Injectable()
export class PasswordChangeRequiredGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const skipPasswordChangeRequired = this.reflector.getAllAndOverride<boolean>(
      SKIP_PASSWORD_CHANGE_REQUIRED_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipPasswordChangeRequired) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
    }>();
    const user = request.user;

    if (!user) {
      return true;
    }

    if (user.role !== 'field_worker' || !user.isPasswordChangeRequired) {
      return true;
    }

    throw new AppError(
      'PASSWORD_CHANGE_REQUIRED',
      'You must change your password before using this feature',
      403,
    );
  }
}

import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppError } from '../http/app-error';
import { PasswordChangeRequiredGuard } from './password-change-required.guard';

describe('PasswordChangeRequiredGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const guard = new PasswordChangeRequiredGuard(reflector);

  function createContext(user?: {
    role: 'admin' | 'field_worker';
    isPasswordChangeRequired: boolean;
  }) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    reflector.getAllAndOverride = jest
      .fn()
      .mockImplementation((key: string) => {
        if (key === 'isPublic') {
          return false;
        }
        if (key === 'skipPasswordChangeRequired') {
          return false;
        }
        return false;
      });
  });

  it('allows public routes', () => {
    reflector.getAllAndOverride = jest
      .fn()
      .mockImplementation((key: string) => key === 'isPublic');

    expect(
      guard.canActivate(
        createContext({
          role: 'field_worker',
          isPasswordChangeRequired: true,
        }),
      ),
    ).toBe(true);
  });

  it('allows routes marked to skip the password-change requirement', () => {
    reflector.getAllAndOverride = jest
      .fn()
      .mockImplementation((key: string) => key === 'skipPasswordChangeRequired');

    expect(
      guard.canActivate(
        createContext({
          role: 'field_worker',
          isPasswordChangeRequired: true,
        }),
      ),
    ).toBe(true);
  });

  it('blocks field workers with a pending password change', () => {
    expect(() =>
      guard.canActivate(
        createContext({
          role: 'field_worker',
          isPasswordChangeRequired: true,
        }),
      ),
    ).toThrow(
      expect.objectContaining({
        code: 'PASSWORD_CHANGE_REQUIRED',
      } satisfies Partial<AppError>),
    );
  });

  it('allows field workers after the password has been changed', () => {
    expect(
      guard.canActivate(
        createContext({
          role: 'field_worker',
          isPasswordChangeRequired: false,
        }),
      ),
    ).toBe(true);
  });
});

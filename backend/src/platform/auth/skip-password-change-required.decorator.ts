import { SetMetadata } from '@nestjs/common';

export const SKIP_PASSWORD_CHANGE_REQUIRED_KEY =
  'skipPasswordChangeRequired';

/** Allows field workers with a pending password change to call this route. */
export const SkipPasswordChangeRequired = () =>
  SetMetadata(SKIP_PASSWORD_CHANGE_REQUIRED_KEY, true);

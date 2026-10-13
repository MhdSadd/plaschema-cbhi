import { applyDecorators } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { EmptyStringToUndefined } from './query-transforms';

/** Query `cursor` from a prior response `meta.nextCursor` (base64url JSON keyset, not a bare UUID). */
export function ApiOpaqueListCursor() {
  return applyDecorators(
    ApiPropertyOptional({
      type: String,
      description: 'Opaque cursor from meta.nextCursor on the previous page',
    }),
    EmptyStringToUndefined(),
    IsOptional(),
    IsString(),
    MaxLength(1024),
  );
}

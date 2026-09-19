import { BadRequestException } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  EmptyStringToUndefined,
  toQueryInt,
} from '../../../platform/http/query-transforms';
import { CursorPaginationMetaDto } from '../../../platform/http/cursor-pagination.dto';
import {
  CapitationTierValidationError,
  type CapitationTier,
  validateCapitationTiers,
} from '../domain/capitation';

export class CapitationTierDto {
  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  minEnrollees!: number;

  @ApiPropertyOptional({
    example: 5000,
    nullable: true,
    description: 'Inclusive upper bound; null means open-ended (last tier only)',
  })
  @Transform(({ value }) => (value === '' || value === undefined ? null : value))
  @IsOptional()
  @IsInt()
  @Min(1)
  maxEnrollees!: number | null;

  @ApiProperty({ example: 650000, minimum: 1 })
  @IsInt()
  @Min(1)
  amount!: number;
}

function parseTiersQuery(value: unknown): CapitationTier[] | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  let parsed: unknown = value;
  if (typeof value === 'string') {
    parsed = JSON.parse(value) as unknown;
  }

  if (!Array.isArray(parsed)) {
    return undefined;
  }

  try {
    return validateCapitationTiers(parsed as CapitationTier[]);
  } catch (error) {
    const message =
      error instanceof CapitationTierValidationError
        ? error.message
        : 'Invalid capitation tiers';
    throw new BadRequestException(message);
  }
}

export class CapitationPeriodQueryDto {
  @ApiProperty({ example: 8, minimum: 1, maximum: 12 })
  @Transform(({ value }) => toQueryInt(value, 0, { min: 1, max: 12 }))
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @ApiProperty({ example: 2026, minimum: 2000, maximum: 2100 })
  @Transform(({ value }) => toQueryInt(value, 0, { min: 2000, max: 2100 }))
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @ApiPropertyOptional({
    type: String,
    description: 'JSON array of capitation tiers; defaults to server configuration',
    example:
      '[{"minEnrollees":1,"maxEnrollees":5000,"amount":650000},{"minEnrollees":5001,"maxEnrollees":10000,"amount":830000},{"minEnrollees":10001,"maxEnrollees":null,"amount":1000000}]',
  })
  @Transform(({ value }) => parseTiersQuery(value))
  @IsOptional()
  @IsArray()
  tiers?: CapitationTier[];
}

export class GenerateCapitationDto {
  @ApiProperty({ example: 8, minimum: 1, maximum: 12 })
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @ApiProperty({ example: 2026, minimum: 2000, maximum: 2100 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @ApiPropertyOptional({
    type: [CapitationTierDto],
    description: 'Capitation tiers; defaults to server configuration when omitted',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CapitationTierDto)
  tiers?: CapitationTierDto[];
}

export class ListCapitationsQueryDto {
  @ApiPropertyOptional({
    example: 8,
    minimum: 1,
    maximum: 12,
    description: 'Defaults to current month in Africa/Lagos',
  })
  @Transform(({ value }) =>
    value === undefined || value === '' ? undefined : toQueryInt(value, 0, { min: 1, max: 12 }),
  )
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional({
    example: 2026,
    minimum: 2000,
    maximum: 2100,
    description: 'Defaults to current year in Africa/Lagos',
  })
  @Transform(({ value }) =>
    value === undefined || value === ''
      ? undefined
      : toQueryInt(value, 0, { min: 2000, max: 2100 }),
  )
  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    description: 'Cursor from the previous page nextCursor',
  })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsUUID('7')
  cursor?: string;

  @ApiPropertyOptional({
    type: Number,
    example: 50,
    default: 50,
    minimum: 1,
    maximum: 100,
  })
  @Transform(({ value }) => toQueryInt(value, 50, { min: 1, max: 100 }))
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 50;

  @ApiPropertyOptional({ example: 'Jos North' })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  lga?: string;

  @ApiPropertyOptional({ type: String, format: 'uuid' })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsUUID('7')
  healthFacilityId?: string;

  @ApiPropertyOptional({ description: 'Search facility name or LGA' })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}

export class CapitationTierResponseDto {
  @ApiProperty()
  minEnrollees!: number;

  @ApiProperty({ nullable: true })
  maxEnrollees!: number | null;

  @ApiProperty()
  amount!: number;
}

export class CapitationRecordDraftDto {
  @ApiProperty({ format: 'uuid' })
  healthFacilityId!: string;

  @ApiProperty()
  facilityName!: string;

  @ApiProperty()
  lga!: string;

  @ApiProperty()
  beneficiaryCount!: number;

  @ApiProperty()
  amount!: number;

  @ApiProperty({ nullable: true })
  tierMin!: number | null;

  @ApiProperty({ nullable: true })
  tierMax!: number | null;

  @ApiProperty({ nullable: true })
  tierAmount!: number | null;

  @ApiProperty({ nullable: true })
  tierLabel!: string | null;

  @ApiProperty({ nullable: true, description: 'Legacy flat rate per beneficiary' })
  rate!: number | null;
}

export class CapitationPreviewResponseDto {
  @ApiProperty()
  month!: number;

  @ApiProperty()
  year!: number;

  @ApiProperty({ type: [CapitationTierResponseDto] })
  tiers!: CapitationTierResponseDto[];

  @ApiProperty()
  totalFacilities!: number;

  @ApiProperty()
  totalBeneficiaries!: number;

  @ApiProperty()
  totalCapitation!: number;

  @ApiProperty({ type: [CapitationRecordDraftDto] })
  records!: CapitationRecordDraftDto[];
}

export class CapitationGenerateResponseDto {
  @ApiProperty({ format: 'uuid' })
  runId!: string;

  @ApiProperty()
  month!: number;

  @ApiProperty()
  year!: number;

  @ApiProperty({ type: [CapitationTierResponseDto], nullable: true })
  tiers!: CapitationTierResponseDto[] | null;

  @ApiProperty({ nullable: true, description: 'Legacy flat rate per beneficiary' })
  rate!: number | null;

  @ApiProperty()
  generatedAt!: Date;

  @ApiProperty()
  totalFacilities!: number;

  @ApiProperty()
  totalBeneficiaries!: number;

  @ApiProperty()
  totalCapitation!: number;

  @ApiProperty()
  recordCount!: number;
}

export class CapitationRecordListItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  healthFacilityId!: string;

  @ApiProperty()
  facilityName!: string;

  @ApiProperty()
  lga!: string;

  @ApiProperty()
  month!: number;

  @ApiProperty()
  year!: number;

  @ApiProperty({ example: 'August 2026' })
  period!: string;

  @ApiProperty()
  beneficiaryCount!: number;

  @ApiProperty()
  amount!: number;

  @ApiProperty({ nullable: true })
  tierMin!: number | null;

  @ApiProperty({ nullable: true })
  tierMax!: number | null;

  @ApiProperty({ nullable: true })
  tierAmount!: number | null;

  @ApiProperty({ nullable: true })
  tierLabel!: string | null;

  @ApiProperty({ nullable: true, description: 'Legacy flat rate per beneficiary' })
  rate!: number | null;
}

export class CapitationListSummaryDto {
  @ApiProperty({ format: 'uuid' })
  runId!: string;

  @ApiProperty()
  month!: number;

  @ApiProperty()
  year!: number;

  @ApiProperty({ type: [CapitationTierResponseDto], nullable: true })
  tiers!: CapitationTierResponseDto[] | null;

  @ApiProperty({ nullable: true, description: 'Legacy flat rate per beneficiary' })
  rate!: number | null;

  @ApiProperty()
  generatedAt!: Date;

  @ApiProperty()
  totalFacilities!: number;

  @ApiProperty()
  totalBeneficiaries!: number;

  @ApiProperty()
  totalCapitation!: number;
}

export class ListCapitationsResponseDto {
  @ApiProperty({ type: [CapitationRecordListItemDto] })
  data!: CapitationRecordListItemDto[];

  @ApiProperty({ type: CursorPaginationMetaDto })
  meta!: CursorPaginationMetaDto;

  @ApiProperty({ type: CapitationListSummaryDto, nullable: true })
  summary!: CapitationListSummaryDto | null;
}

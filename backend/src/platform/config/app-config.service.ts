import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DEFAULT_CAPITATION_TIERS,
  type CapitationTier,
  validateCapitationTiers,
} from '../../modules/capitation/domain/capitation';
import { Env } from './env.schema';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService<Env, true>) {}

  get nodeEnv(): Env['NODE_ENV'] {
    return this.configService.get('NODE_ENV', { infer: true });
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get port(): number {
    return this.configService.get('PORT', { infer: true });
  }

  get databaseUrl(): string {
    return this.configService.get('DATABASE_URL', { infer: true });
  }

  get redisUrl(): string {
    return this.configService.get('REDIS_URL', { infer: true });
  }

  get logLevel(): Env['LOG_LEVEL'] {
    return this.configService.get('LOG_LEVEL', { infer: true });
  }

  get corsOrigin(): string {
    return this.configService.get('CORS_ORIGIN', { infer: true });
  }

  get swaggerEnabled(): boolean {
    return this.configService.get('SWAGGER_ENABLED', { infer: true });
  }

  get jwtSecret(): string {
    return this.configService.get('JWT_SECRET', { infer: true });
  }

  get jwtExpiresIn(): string {
    return this.configService.get('JWT_EXPIRES_IN', { infer: true });
  }

  get objectStorageProvider(): Env['OBJECT_STORAGE_PROVIDER'] {
    return this.configService.get('OBJECT_STORAGE_PROVIDER', { infer: true });
  }

  get objectStorageBucketName(): string {
    return this.configService.get('OBJECT_STORAGE_BUCKET_NAME', {
      infer: true,
    });
  }

  get objectStorageEndpoint(): string {
    return this.configService.get('OBJECT_STORAGE_ENDPOINT', { infer: true });
  }

  get objectStorageAccessKeyId(): string {
    return this.configService.get('OBJECT_STORAGE_ACCESS_KEY_ID', {
      infer: true,
    });
  }

  get objectStorageSecretAccessKey(): string {
    return this.configService.get('OBJECT_STORAGE_SECRET_ACCESS_KEY', {
      infer: true,
    });
  }

  get objectStorageRegion(): string {
    return this.configService.get('OBJECT_STORAGE_REGION', { infer: true });
  }

  get objectStoragePresignTtlSeconds(): number {
    return this.configService.get('OBJECT_STORAGE_PRESIGN_TTL_SECONDS', {
      infer: true,
    });
  }

  get capitationRate(): number {
    return this.configService.get('CAPITATION_RATE', { infer: true });
  }

  get defaultCapitationTiers(): CapitationTier[] {
    const raw = this.configService.get('CAPITATION_TIERS', { infer: true });
    if (!raw) {
      return DEFAULT_CAPITATION_TIERS;
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        throw new Error('CAPITATION_TIERS must be a JSON array');
      }
      return validateCapitationTiers(parsed as CapitationTier[]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Invalid CAPITATION_TIERS JSON';
      throw new Error(`Invalid CAPITATION_TIERS configuration: ${message}`);
    }
  }
}

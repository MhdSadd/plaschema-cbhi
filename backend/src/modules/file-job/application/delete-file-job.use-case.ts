import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../platform/auth/current-user.decorator';
import { AppError } from '../../../platform/http/app-error';
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../../../platform/storage/object-storage';
import type { FileJobStatus } from '../domain/file-job';
import {
  FILE_JOB_REPOSITORY,
  type FileJobRepository,
} from './file-job.repository';

const DELETABLE_STATUSES = new Set<FileJobStatus>(['completed', 'failed']);

function assertDeletableObjectKey(objectKey: string): void {
  const normalized = objectKey.replace(/^\/+/, '');
  if (
    !normalized.startsWith('id-cards/') &&
    !normalized.startsWith('enrollment-reports/')
  ) {
    throw new AppError(
      'VALIDATION_ERROR',
      'File job object key is not deletable',
      400,
    );
  }
}

@Injectable()
export class DeleteFileJobUseCase {
  constructor(
    @Inject(FILE_JOB_REPOSITORY)
    private readonly fileJobs: FileJobRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
  ) {}

  async execute(actor: AuthenticatedUser, id: string) {
    const job = await this.fileJobs.findByIdForUser(id, actor.id);
    if (!job) {
      throw new AppError('FILE_JOB_NOT_FOUND', 'File job not found', 404);
    }

    if (!DELETABLE_STATUSES.has(job.status)) {
      throw new AppError(
        'FILE_JOB_NOT_DELETABLE',
        'Only completed or failed file jobs can be deleted',
        409,
      );
    }

    if (job.objectKey) {
      assertDeletableObjectKey(job.objectKey);
      await this.storage.deleteObject(job.objectKey);
    }

    const deleted = await this.fileJobs.deleteForUser(id, actor.id);
    if (!deleted) {
      throw new AppError('FILE_JOB_NOT_FOUND', 'File job not found', 404);
    }

    return { id, deleted: true as const };
  }
}

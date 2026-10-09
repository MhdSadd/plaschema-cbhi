import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../platform/auth/current-user.decorator';
import { AppError } from '../../../platform/http/app-error';
import { CreateFileJobUseCase } from '../../file-job/application/create-file-job.use-case';
import type { ResolvedFieldWorkerListFilters } from '../domain/field-worker-list-filters';
import {
  FIELD_WORKER_EXPORT_QUEUE_PORT,
  type FieldWorkerExportJobPayload,
  type FieldWorkerExportQueuePort,
  type FieldWorkerReportFormat,
} from './field-worker-export-queue.port';
import { ResolveFieldWorkerListFiltersUseCase } from './resolve-field-worker-list-filters';

const SUPPORTED_FORMATS: FieldWorkerReportFormat[] = ['xlsx'];

@Injectable()
export class ExportFieldWorkerReportUseCase {
  constructor(
    private readonly resolveFilters: ResolveFieldWorkerListFiltersUseCase,
    @Inject(FIELD_WORKER_EXPORT_QUEUE_PORT)
    private readonly queue: FieldWorkerExportQueuePort,
    private readonly createFileJob: CreateFileJobUseCase,
  ) {}

  async execute(
    actor: AuthenticatedUser,
    input: {
      format: FieldWorkerReportFormat;
      search?: string;
      status?: ResolvedFieldWorkerListFilters['status'];
      beneficiariesEnrolledMin?: number;
      beneficiariesEnrolledMax?: number;
      lastEnrollmentFrom?: string;
      lastEnrollmentTo?: string;
      lastSyncedFrom?: string;
      lastSyncedTo?: string;
    },
  ): Promise<{ jobId: string; status: 'queued' }> {
    if (!SUPPORTED_FORMATS.includes(input.format)) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Only xlsx export is supported',
        400,
      );
    }

    const filters = this.resolveFilters.execute(input);

    const fileJob = await this.createFileJob.execute({
      requestedByUserId: actor.id,
      kind: 'field_worker_report',
      format: input.format,
    });

    const payload: FieldWorkerExportJobPayload = {
      format: input.format,
      filters,
      requestedByUserId: actor.id,
    };

    await this.queue.enqueue(payload, fileJob.id);
    return { jobId: fileJob.id, status: 'queued' };
  }
}

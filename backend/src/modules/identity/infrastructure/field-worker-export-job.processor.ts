import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../../../platform/storage/object-storage';
import {
  CompleteFileJobUseCase,
  FailFileJobUseCase,
  MarkFileJobProcessingUseCase,
} from '../../file-job/application/update-file-job-status.use-case';
import {
  FIELD_WORKER_EXPORT_QUEUE_NAME,
  type FieldWorkerExportJobPayload,
  type FieldWorkerExportJobResult,
  type FieldWorkerExportQueuePort,
} from '../application/field-worker-export-queue.port';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../application/user.repository';
import { FieldWorkerReportExportRenderer } from './field-worker-report-export';

@Injectable()
export class BullFieldWorkerExportQueueAdapter
  implements FieldWorkerExportQueuePort
{
  constructor(
    @InjectQueue(FIELD_WORKER_EXPORT_QUEUE_NAME)
    private readonly queue: Queue<
      FieldWorkerExportJobPayload,
      FieldWorkerExportJobResult
    >,
  ) {}

  async enqueue(
    payload: FieldWorkerExportJobPayload,
    jobId: string,
  ): Promise<string> {
    const job = await this.queue.add('export', payload, {
      jobId,
      removeOnComplete: { age: 60 * 60 * 24, count: 200 },
      removeOnFail: { age: 60 * 60 * 24 * 7 },
      attempts: 2,
      backoff: { type: 'exponential', delay: 3000 },
    });
    return String(job.id);
  }
}

@Processor(FIELD_WORKER_EXPORT_QUEUE_NAME, { concurrency: 1 })
export class FieldWorkerExportProcessor
  extends WorkerHost
  implements OnModuleInit
{
  private readonly logger = new Logger(FieldWorkerExportProcessor.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    private readonly renderer: FieldWorkerReportExportRenderer,
    private readonly markFileJobProcessing: MarkFileJobProcessingUseCase,
    private readonly completeFileJob: CompleteFileJobUseCase,
    private readonly failFileJob: FailFileJobUseCase,
  ) {
    super();
  }

  onModuleInit() {
    this.logger.log('Field worker report export worker ready (concurrency=1)');
  }

  async process(
    job: Job<FieldWorkerExportJobPayload, FieldWorkerExportJobResult>,
  ): Promise<FieldWorkerExportJobResult> {
    const { format, filters } = job.data;
    const jobId = String(job.id);
    this.logger.log(`Generating ${format} field worker report (job ${jobId})`);

    await this.markFileJobProcessing.execute(jobId);

    try {
      const iterable = this.users.iterateFieldWorkersForExport(filters);
      if (format !== 'xlsx') {
        throw new Error(`Unsupported export format: ${format}`);
      }

      const rendered = await this.renderer.renderXlsx(iterable);

      const objectKey = `field-worker-reports/${jobId}.xlsx`;
      const contentType =
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      await this.storage.putObject({
        objectKey,
        body: rendered.buffer,
        contentType,
      });

      await this.completeFileJob.execute(jobId, {
        objectKey,
        metadata: { rowCount: rendered.rowCount },
      });

      this.logger.log(
        `Field worker report export completed (job ${jobId}, rows=${rendered.rowCount})`,
      );

      return { objectKey, format, rowCount: rendered.rowCount };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Field worker export failed';
      await this.failFileJob.execute(jobId, message);
      throw error;
    }
  }
}

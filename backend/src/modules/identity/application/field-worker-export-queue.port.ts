import type { ResolvedFieldWorkerListFilters } from '../domain/field-worker-list-filters';

export const FIELD_WORKER_EXPORT_QUEUE_NAME = 'field-worker-export';

export type FieldWorkerReportFormat = 'xlsx';

export type FieldWorkerExportJobPayload = {
  format: FieldWorkerReportFormat;
  filters: ResolvedFieldWorkerListFilters;
  requestedByUserId: string;
};

export type FieldWorkerExportJobResult = {
  objectKey: string;
  format: FieldWorkerReportFormat;
  rowCount: number;
};

export const FIELD_WORKER_EXPORT_QUEUE_PORT = Symbol(
  'FIELD_WORKER_EXPORT_QUEUE_PORT',
);

export interface FieldWorkerExportQueuePort {
  enqueue(
    payload: FieldWorkerExportJobPayload,
    jobId: string,
  ): Promise<string>;
}

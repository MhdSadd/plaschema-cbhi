import {
  _get,
  _patch,
  _post,
  type ApiResponse,
  type CursorPaginationMeta,
} from '@/api'

import type {
  CreateFieldWorkerPayload,
  FieldWorker,
  FieldWorkerDetail,
  FieldWorkerListParams,
  FieldWorkerListResult,
  FieldWorkerListSummary,
  FieldWorkerUserRecord,
  ResetFieldWorkerPasswordResult,
  ResetFieldWorkerPasswordVariables,
  UpdateFieldWorkerVariables,
  ExportFieldWorkerPayload,
} from '../types'
import type { CreateFileJobResult } from '@/features/enrollments/types/enrollment.types'

type FieldWorkerListResponse = ApiResponse<
  FieldWorker[],
  CursorPaginationMeta
> & {
  summary?: FieldWorkerListSummary
}

/** GET /users?role=field_worker */
export async function fetchFieldWorkers(
  params: FieldWorkerListParams,
): Promise<FieldWorkerListResult> {
  const response = await _get<FieldWorkerListResponse>('/users', {
    cursor: params.cursor,
    limit: params.limit,
    role: 'field_worker',
    search: params.search,
    status: params.status,
    beneficiariesEnrolledMin: params.beneficiariesEnrolledMin,
    beneficiariesEnrolledMax: params.beneficiariesEnrolledMax,
    lastEnrollmentFrom: params.lastEnrollmentFrom,
    lastEnrollmentTo: params.lastEnrollmentTo,
    lastSyncedFrom: params.lastSyncedFrom,
    lastSyncedTo: params.lastSyncedTo,
  })

  return {
    items: response.data.data,
    meta: response.data.meta,
    summary: response.data.summary,
  }
}

/** GET /users?role=field_worker (ward assignment picker) */
export async function fetchAssignableFieldWorkers(
  params: FieldWorkerListParams,
): Promise<FieldWorkerListResult> {
  return fetchFieldWorkers(params)
}

/** GET /users/:id/detail */
export async function fetchFieldWorkerDetail(
  id: string,
): Promise<FieldWorkerDetail> {
  const response = await _get<ApiResponse<FieldWorkerDetail>>(
    `/users/${id}/detail`,
  )
  return response.data.data
}

/** POST /users */
export async function createFieldWorker(
  payload: CreateFieldWorkerPayload,
): Promise<FieldWorkerUserRecord> {
  const response = await _post<
    ApiResponse<FieldWorkerUserRecord>,
    CreateFieldWorkerPayload
  >('/users', payload)
  return response.data.data
}

/** PATCH /users/:id */
export async function updateFieldWorker({
  id,
  payload,
}: UpdateFieldWorkerVariables): Promise<FieldWorkerUserRecord> {
  const response = await _patch<
    ApiResponse<FieldWorkerUserRecord>,
    typeof payload
  >(`/users/${id}`, payload)
  return response.data.data
}

/** POST /users/reports/export */
export async function exportFieldWorkers(
  payload: ExportFieldWorkerPayload,
): Promise<CreateFileJobResult> {
  const response = await _post<
    ApiResponse<CreateFileJobResult>,
    ExportFieldWorkerPayload
  >('/users/reports/export', payload)
  return response.data.data
}

/** POST /users/:id/reset-password */
export async function resetFieldWorkerPassword({
  id,
  password,
}: ResetFieldWorkerPasswordVariables): Promise<ResetFieldWorkerPasswordResult> {
  const response = await _post<
    ApiResponse<ResetFieldWorkerPasswordResult>,
    { newPassword: string }
  >(`/users/${id}/reset-password`, { newPassword: password })
  return response.data.data
}

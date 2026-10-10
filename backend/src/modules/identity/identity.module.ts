import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { FileJobModule } from '../file-job/file-job.module';
import { ChangePasswordUseCase } from './application/change-password.use-case';
import { CreateUserUseCase } from './application/create-user.use-case';
import { ExportFieldWorkerReportUseCase } from './application/export-field-worker-report.use-case';
import {
  FIELD_WORKER_EXPORT_QUEUE_NAME,
  FIELD_WORKER_EXPORT_QUEUE_PORT,
} from './application/field-worker-export-queue.port';
import { GetFieldWorkerDetailUseCase } from './application/get-field-worker-detail.use-case';
import { GetUserUseCase } from './application/get-user.use-case';
import { ListUsersUseCase } from './application/list-users.use-case';
import { LoginUseCase } from './application/login.use-case';
import { ReportLastSyncUseCase } from './application/report-last-sync.use-case';
import { ResolveFieldWorkerListFiltersUseCase } from './application/resolve-field-worker-list-filters';
import { ResetPasswordUseCase } from './application/reset-password.use-case';
import { UpdateUserUseCase } from './application/update-user.use-case';
import { USER_REPOSITORY } from './application/user.repository';
import {
  BullFieldWorkerExportQueueAdapter,
  FieldWorkerExportProcessor,
} from './infrastructure/field-worker-export-job.processor';
import { FieldWorkerReportExportRenderer } from './infrastructure/field-worker-report-export';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { AuthController } from './presentation/auth.controller';
import { UsersController } from './presentation/users.controller';

@Module({
  imports: [
    ActivityLogModule,
    FileJobModule,
    BullModule.registerQueue({ name: FIELD_WORKER_EXPORT_QUEUE_NAME }),
  ],
  controllers: [AuthController, UsersController],
  providers: [
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    {
      provide: FIELD_WORKER_EXPORT_QUEUE_PORT,
      useClass: BullFieldWorkerExportQueueAdapter,
    },
    LoginUseCase,
    ChangePasswordUseCase,
    CreateUserUseCase,
    ListUsersUseCase,
    ResolveFieldWorkerListFiltersUseCase,
    ExportFieldWorkerReportUseCase,
    GetUserUseCase,
    GetFieldWorkerDetailUseCase,
    ReportLastSyncUseCase,
    UpdateUserUseCase,
    ResetPasswordUseCase,
    FieldWorkerReportExportRenderer,
    FieldWorkerExportProcessor,
  ],
  exports: [USER_REPOSITORY],
})
export class IdentityModule {}

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiAcceptedResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { BatchUploadResultDto } from '../../../platform/http/batch-upload.dto';
import { assertSupportedBatchUpload } from '../../../platform/http/csv';
import { BatchCreateFieldWorkersUseCase } from '../application/batch-create-field-workers.use-case';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../../platform/auth/current-user.decorator';
import { Roles } from '../../../platform/auth/roles.decorator';
import { CursorPaginationMetaDto } from '../../../platform/http/cursor-pagination.dto';
import { UuidV7Pipe } from '../../../platform/http/uuid-v7.pipe';
import { CreateUserUseCase } from '../application/create-user.use-case';
import { ExportFieldWorkerReportUseCase } from '../application/export-field-worker-report.use-case';
import { GetFieldWorkerDetailUseCase } from '../application/get-field-worker-detail.use-case';
import { GetUserUseCase } from '../application/get-user.use-case';
import { ListUsersUseCase } from '../application/list-users.use-case';
import { ResetPasswordUseCase } from '../application/reset-password.use-case';
import { UpdateUserUseCase } from '../application/update-user.use-case';
import {
  CreateUserDto,
  ExportFieldWorkerReportRequestDto,
  ExportFieldWorkerReportResponseDto,
  FieldWorkerDetailResponseDto,
  FieldWorkerListItemDto,
  ListUsersQueryDto,
  ResetPasswordDto,
  UpdateUserDto,
  UserResponseDto,
} from './identity.dto';

@ApiTags('users')
@ApiBearerAuth('bearer')
@ApiExtraModels(UserResponseDto, FieldWorkerListItemDto)
@Roles('admin')
@Controller('users')
export class UsersController {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly listUsers: ListUsersUseCase,
    private readonly getUser: GetUserUseCase,
    private readonly getFieldWorkerDetail: GetFieldWorkerDetailUseCase,
    private readonly updateUser: UpdateUserUseCase,
    private readonly resetPassword: ResetPasswordUseCase,
    private readonly exportFieldWorkerReport: ExportFieldWorkerReportUseCase,
    private readonly batchCreateFieldWorkers: BatchCreateFieldWorkersUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create an admin or field worker' })
  @ApiCreatedResponse({ type: UserResponseDto })
  create(@Body() body: CreateUserDto) {
    return this.createUser.execute(body);
  }

  @Get()
  @ApiOperation({
    summary:
      'List users (cursor pagination). With role=field_worker returns field-worker table rows (wards, enrollment stats).',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    type: String,
    description: 'Opaque cursor from meta.nextCursor',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 50,
    description: 'Page size (1-100)',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: ['admin', 'field_worker'],
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'inactive'],
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name, email, or phone',
  })
  @ApiOkResponse({
    description:
      'UserResponseDto[] by default; FieldWorkerListItemDto[] when role=field_worker',
    schema: {
      oneOf: [
        {
          type: 'array',
          items: { $ref: getSchemaPath(UserResponseDto) },
        },
        {
          type: 'array',
          items: { $ref: getSchemaPath(FieldWorkerListItemDto) },
        },
      ],
    },
  })
  async list(@Query() query: ListUsersQueryDto) {
    const result = await this.listUsers.execute(query);
    return {
      data: result.items,
      meta: {
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
        limit: result.limit,
        total: result.total,
      } satisfies CursorPaginationMetaDto,
      ...(result.summary ? { summary: result.summary } : {}),
    };
  }

  @Post('reports/export')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary:
      'Enqueue enrollment officer report export (xlsx) using list filters',
  })
  @ApiAcceptedResponse({ type: ExportFieldWorkerReportResponseDto })
  exportReport(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ExportFieldWorkerReportRequestDto,
  ) {
    return this.exportFieldWorkerReport.execute(user, body);
  }

  @Post('batch')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'password'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description:
            'CSV or Excel with columns: name, email, phone, optional status, lga, wards (pipe-separated ward names; empty wards = all wards).',
        },
        password: {
          type: 'string',
          description:
            'Initial password applied to every created officer (they must change it on first login).',
        },
      },
    },
  })
  @ApiOperation({
    summary:
      'Batch create enrollment officers from CSV or Excel with a shared initial password',
  })
  @ApiOkResponse({ type: BatchUploadResultDto })
  batchCreate(
    @UploadedFile() file?: Express.Multer.File,
    @Body('password') password?: string,
  ) {
    const upload = assertSupportedBatchUpload(file);
    return this.batchCreateFieldWorkers.execute(
      upload.buffer,
      password ?? '',
      upload.originalname,
    );
  }

  @Get(':id/detail')
  @Roles('admin', 'field_worker')
  @ApiOperation({
    summary:
      'Get field worker detail (admin overview, or own profile for field workers). Includes overview with lastSyncedAt, stats, assigned wards, and activity log.',
  })
  @ApiOkResponse({ type: FieldWorkerDetailResponseDto })
  detail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', UuidV7Pipe) id: string,
  ) {
    return this.getFieldWorkerDetail.execute(user, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiOkResponse({ type: UserResponseDto })
  get(@Param('id', UuidV7Pipe) id: string) {
    return this.getUser.execute(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiOkResponse({ type: UserResponseDto })
  update(@Param('id', UuidV7Pipe) id: string, @Body() body: UpdateUserDto) {
    return this.updateUser.execute(id, body);
  }

  @Post(':id/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset a user password (admin only; no email flow)',
  })
  @ApiOkResponse({ description: 'Password reset successfully' })
  resetUserPassword(
    @Param('id', UuidV7Pipe) id: string,
    @Body() body: ResetPasswordDto,
  ) {
    return this.resetPassword.execute(id, body.newPassword);
  }
}

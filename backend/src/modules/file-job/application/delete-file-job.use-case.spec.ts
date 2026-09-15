import { DeleteFileJobUseCase } from './delete-file-job.use-case';
import type { FileJobRepository } from './file-job.repository';
import type { ObjectStorage } from '../../../platform/storage/object-storage';

describe('DeleteFileJobUseCase', () => {
  const actor = {
    id: 'user-1',
    role: 'admin' as const,
    email: 'a@b.c',
    name: 'Admin User',
    status: 'active' as const,
    isPasswordChangeRequired: false,
  };
  let fileJobs: jest.Mocked<
    Pick<FileJobRepository, 'findByIdForUser' | 'deleteForUser'>
  >;
  let storage: jest.Mocked<Pick<ObjectStorage, 'deleteObject'>>;
  let useCase: DeleteFileJobUseCase;

  beforeEach(() => {
    fileJobs = {
      findByIdForUser: jest.fn(),
      deleteForUser: jest.fn(),
    };
    storage = {
      deleteObject: jest.fn(),
    };
    useCase = new DeleteFileJobUseCase(
      fileJobs as unknown as FileJobRepository,
      storage as unknown as ObjectStorage,
    );
  });

  it('deletes the stored object and database row for completed jobs', async () => {
    fileJobs.findByIdForUser.mockResolvedValue({
      id: 'job-1',
      requestedByUserId: actor.id,
      kind: 'id_card',
      format: 'pdf',
      status: 'completed',
      statusRank: 3,
      title: 'ID cards',
      objectKey: 'id-cards/job-1.pdf',
      error: null,
      metadata: null,
      createdAt: new Date(),
      startedAt: new Date(),
      completedAt: new Date(),
    });
    fileJobs.deleteForUser.mockResolvedValue(true);

    await expect(useCase.execute(actor, 'job-1')).resolves.toEqual({
      id: 'job-1',
      deleted: true,
    });

    expect(storage.deleteObject).toHaveBeenCalledWith('id-cards/job-1.pdf');
    expect(fileJobs.deleteForUser).toHaveBeenCalledWith('job-1', actor.id);
  });

  it('rejects queued jobs', async () => {
    fileJobs.findByIdForUser.mockResolvedValue({
      id: 'job-1',
      requestedByUserId: actor.id,
      kind: 'enrollment_report',
      format: 'xlsx',
      status: 'queued',
      statusRank: 0,
      title: 'Report',
      objectKey: null,
      error: null,
      metadata: null,
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
    });

    await expect(useCase.execute(actor, 'job-1')).rejects.toMatchObject({
      code: 'FILE_JOB_NOT_DELETABLE',
    });
    expect(storage.deleteObject).not.toHaveBeenCalled();
    expect(fileJobs.deleteForUser).not.toHaveBeenCalled();
  });
});

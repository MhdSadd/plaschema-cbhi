import {
  assertAssignedWardsSingleLga,
  assertFieldWorkerPhone,
  assertUserRoleConstraints,
  toPublicUser,
  type User,
} from './user';

describe('identity domain user', () => {
  const baseUser: User = {
    id: '01900000-0000-7000-8000-000000000001',
    name: 'Worker',
    email: 'worker@cbhi.local',
    passwordHash: 'hash',
    role: 'field_worker',
    status: 'active',
    phone: '08012345678',
    lastSyncedAt: null,
    isPasswordChangeRequired: true,
    assignedWards: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('strips passwordHash from public user', () => {
    const publicUser = toPublicUser(baseUser);
    expect(publicUser).not.toHaveProperty('passwordHash');
    expect(publicUser.email).toBe(baseUser.email);
  });

  it('requires phone for field workers', () => {
    expect(() =>
      assertUserRoleConstraints({
        role: 'field_worker',
        phone: null,
      }),
    ).toThrow('PHONE_REQUIRED_FOR_FIELD_WORKER');
  });

  it('requires an 11-digit phone for field workers', () => {
    expect(() => assertFieldWorkerPhone('123')).toThrow(
      'INVALID_FIELD_WORKER_PHONE',
    );
    expect(() => assertFieldWorkerPhone('8012345678')).toThrow(
      'INVALID_FIELD_WORKER_PHONE',
    );
    expect(() => assertFieldWorkerPhone('08012345678')).not.toThrow();
  });

  it('requires assigned wards to share one LGA', () => {
    expect(() =>
      assertAssignedWardsSingleLga(['Jos South', 'Jos North']),
    ).toThrow('ASSIGNED_WARDS_MULTIPLE_LGAS');
    expect(() => assertAssignedWardsSingleLga(['Jos South', 'jos south'])).not.toThrow();
  });

  it('allows admin without phone', () => {
    expect(() =>
      assertUserRoleConstraints({
        role: 'admin',
        phone: null,
      }),
    ).not.toThrow();
  });
});

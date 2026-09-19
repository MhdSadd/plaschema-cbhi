# Architecture and build mode

## Decision order

1. Write the offline promise and choose the capability level.
2. Map sources of truth: component memory, shared UI state, server-state cache, IndexedDB, Cache Storage, and server.
3. Define the service-worker scope, resource-by-resource cache policy, update choice, and worker/page/API compatibility window.
4. Define local tables, owner keys, indexes, atomic transitions, retention, quota behavior, and migrations.
5. For reads, define freshness, access signature, validation, atomic replacement, missing-data UX, and stale-data policy.
6. For writes, define persisted states, idempotency, ordered stages, leases, retry classification, conflicts, final acknowledgment, and cleanup.
7. For files, define capacity, blob ownership, presign/PUT stages, token isolation, reuse, and orphan cleanup.
8. Define offline session expiry, revalidation, permission changes, logout, shared-device, and wipe behavior.
9. Define privacy-safe observability, real-device tests, release gate, rollback, and incident recovery.

## Default layering

Use one-way dependencies:

`components → hooks/adapters → feature services/coordinator → repositories/transport → browser/API`

Components render state and express intent. Repositories own database transactions. Transport owns wire details. The coordinator owns ordering and recovery.

## Build slices

Build and verify shell, local reads, local writes, file stages, security/session behavior, and operations separately. Do not claim offline readiness from a generated service worker alone. Test interruption after each irreversible boundary.

Plans must include diagrams for the complete architecture, data ownership, update lifecycle, outbox state machine, synchronization sequence, and version compatibility when those concerns apply.

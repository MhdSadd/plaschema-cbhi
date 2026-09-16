# Audit mode

Remain read-only unless the user separately requests fixes.

Trace evidence in this order:

1. User-facing offline and update promises.
2. Manifest, registration, scope, precache, navigation fallback, cache routes, and update UI.
3. IndexedDB schema, indexes, ownership, transactions, migrations, storage estimates, and cleanup.
4. Offline reads, freshness, access invalidation, and replacement atomicity.
5. Outbox states, idempotency, leases, retries, conflicts, file stages, final acknowledgments, and deletion order.
6. Offline auth, expiry, logout/wipe, shared-device behavior, server authorization, and telemetry.
7. Tests, deployed headers, CORS, real-device evidence, rollback, and runbooks.

For each finding provide evidence, affected promise, plausible failure, severity, and smallest safe remediation. Rank critical for likely data loss, exposure, or harmful duplication; high for broken core offline promises; medium for weak recovery or operations; low for clarity and maintainability.

Separate proven defects, intentional tradeoffs, unverified risks, and optional hardening. Do not present lack of evidence as proof of failure.

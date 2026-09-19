---
name: pwa-engineering
description: Teach, plan, build, or audit production PWAs, especially offline data, service-worker updates, durable synchronization, files, authentication, security, testing, and recovery. Use only when explicitly invoked.
---

# PWA engineering

Work in the mode the user requests: **learn**, **plan**, **build**, or **audit**. If the mode is not named, infer it from the requested outcome. Use plain language and define necessary jargon.

## Ground first

Read repository instructions and inspect the actual manifest, service worker, registration, local database, data services, auth, deployment, and tests before asking discoverable questions or making claims.

For current browser or library behavior, verify primary sources. Do not rely on remembered compatibility tables.

## Establish the contract

Before architecture or implementation, establish:

- the testable offline user promise;
- app-shell-only, offline-read, or transactional offline-write level;
- installed and browser-tab targets;
- offline duration, record count, and file volume;
- data sensitivity and shared-device policy;
- source of truth before and after synchronization;
- idempotency and conflict behavior enforced by the server;
- service-worker update and database migration compatibility;
- acceptance, real-device, rollback, and recovery tests.

Ask only for product decisions that inspection cannot answer. Use the recommended safe default for low-impact omissions and record it.

## Non-negotiable invariants

- Installation, service-worker control, shell caching, and durable data are separate capabilities.
- Cache Storage holds selected HTTP responses. IndexedDB holds structured business data, blobs, metadata, and the outbox.
- Commit important work locally before showing success.
- Give each user intention one stable idempotency key and require backend enforcement.
- Persist synchronization stages; claim work with an expiring lease; retry transient failures with bounded delay.
- Treat network status only as a hint. The request result is authoritative.
- Avoid authenticated API caching by default. Any exception needs owner isolation, expiry, wipe, authorization, and threat analysis.
- Keep server-accepted records until all required final acknowledgments complete.
- Migrate persisted schemas forward from every supported released version.
- Prefer prompted updates for forms and offline-write apps. Do not activate incompatible worker/page combinations.
- Preserve unsent work during authentication failure, updates, and recovery.

## Mode routing

- For **learn**, read [learning.md](references/learning.md).
- For **plan** or **build**, read [architecture-and-build.md](references/architecture-and-build.md).
- For **audit**, read [audit.md](references/audit.md).
- For any sensitive data, offline writes, files, or auth, also read [risk-and-quality.md](references/risk-and-quality.md).

Never expand authority: audit is read-only, and build changes only the scope the user requested. Do not add backend work unless it is explicitly in scope; describe missing backend contracts as blockers or required interfaces.

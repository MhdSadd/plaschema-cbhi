# PWA engineering agent guide

Use this guide when an agent must teach, plan, build, or audit a progressive web application.

## Start with evidence

1. Read the repository instructions and inspect the current manifest, service-worker registration, caching rules, durable storage, data services, authentication, deployment headers, and tests.
2. Do not assume installation is required for offline use. Separate manifest/install behavior, service-worker control, shell caching, and durable business data.
3. Classify the required product as app-shell-only, offline-read, or transactional offline-write.
4. State the user promise in testable words: preparation, user, offline actions, duration, retained data, reconnect behavior, and unavailable actions.
5. Verify changing browser and library facts from primary sources. The playbook source index is a starting point, not permanent proof.

## Four modes

- **Learn:** choose the smallest relevant HTML lesson, explain the mental model in plain language, and use its knowledge check.
- **Plan:** produce a decision-complete design covering data ownership, cache policy, local schema, synchronization, security, updates, testing, operations, and backend invariants.
- **Build:** implement only the approved scope. Preserve repository architecture and unrelated changes. Verify interruption and recovery, not only the happy path.
- **Audit:** remain read-only unless a fix is requested. Cite code or observed behavior for each finding, rank impact, and distinguish proven defects from hardening opportunities.

## Invariants

- Cache Storage owns selected HTTP responses; IndexedDB owns structured offline business data.
- Save important offline work locally before presenting success.
- Generate one stable idempotency key per user intention; the server must enforce it.
- Persist every irreversible synchronization stage and use expiring leases for claimed work.
- Do not treat `navigator.onLine` as proof that the API is reachable.
- Do not cache authenticated API responses in the service worker without an explicit user boundary, expiry, wipe, and threat model.
- Do not delete accepted local work until every required server acknowledgment succeeds.
- Database changes require forward migrations and fixtures from supported released versions.
- Prompted service-worker updates are the default for forms and offline-write apps.
- Never recommend clearing site data until the effect on unsent work is known and explained.

## Expected outputs

A plan or audit should include the offline promise, capability level, architecture diagram, source-of-truth table, state machine, interface or schema changes, failure policy, security boundary, update policy, tests, rollout, recovery, and explicit assumptions. Use common words, define necessary jargon, and draw diagrams for ownership, sequence, state, and compatibility.

The canonical learning material starts at `index.html`. Operational checks are in `reference/decision-checklists.html`, and exact transitions are in `reference/state-machines.html`.

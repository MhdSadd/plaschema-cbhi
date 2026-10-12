# Native mobile — household code sync update (next release)

Last updated: 12 October 2026

Audience: engineers maintaining the **native** field-worker enrollment app (iOS/Android). The reference PWA implementation lives in `pwa/`.

Related docs:

- General mobile enrollment integration: [`mobile-app-enrollment-handoff.md`](./mobile-app-enrollment-handoff.md)
- Admin / project context: [`HANDOFF.md`](./HANDOFF.md)

---

## 1. Why this update exists

Household IDs (`householdCode`, e.g. `JOS-VOM-001`) were allocated **on each device** while officers enroll offline in the same ward. Multiple devices could pick the same suffix. The server used to reject duplicate `(wardId, householdCode)` pairs with errors such as **`HOUSEHOLD_CODE_TAKEN`** or **`ENROLLMENT_ID_TAKEN`**, leaving records stuck in **failed** sync state.

The **backend now resolves head collisions server-side**:

- It still accepts the client’s proposed `householdCode` when it is free in that ward.
- If the code (or derived head `enrollmentId`) is already taken, the server assigns the **next available suffix** for that ward using a **Redis-backed sequence** (bootstrapped from Postgres).
- The create succeeds; the response includes the **canonical** `householdCode` and head `enrollmentId` (`PL-CBHI-{householdCode}`).

**Deploying the backend does not require an immediate app update** for sync to succeed on **retry**. This document describes what the **next native app release** should implement so local data, UI, and operator messaging match the server.

---

## 2. API contract changes

### Endpoint (unchanged)

`POST /api/household-enrollments` — same request body as today (`household.householdLocalId`, `household.householdCode`, `household.role`, optional `householdId` for members, plus enrollment fields).

### Success response (additive)

New optional field:

| Field | Type | Meaning |
| --- | --- | --- |
| `householdCodeRemapped` | `boolean` | `true` when the server replaced the client’s `householdCode` with the next free suffix for the ward. Omitted or `false` when the client’s code was kept. |

Existing fields remain authoritative on success:

| Field | Use on client |
| --- | --- |
| `enrollmentId` | Public CBHI ID (head: `PL-CBHI-{householdCode}`; member: `{headEnrollmentId}-{NN}`) |
| `householdCode` | Canonical ward-scoped household ID string (e.g. `JOS-VOM-002`) |
| `householdId` | Server UUID; propagate to pending **members** after head sync |
| `householdRole` | `head` \| `member` |
| `memberSequence` | Server-assigned for members |
| `idempotentReplay` | Treat as success; do not re-upload files or change local ids |

Example when the client sent `JOS-VOM-001` but the server assigned `JOS-VOM-002`:

```json
{
  "id": "uuid",
  "enrollmentId": "PL-CBHI-JOS-VOM-002",
  "idempotencyId": "uuid-v7",
  "status": "pending",
  "capturedAt": "2026-09-10T08:15:00.000Z",
  "createdAt": "2026-09-10T09:00:00.000Z",
  "idempotentReplay": false,
  "householdId": "uuid",
  "householdRole": "head",
  "memberSequence": null,
  "householdCode": "JOS-VOM-002",
  "householdCodeRemapped": true
}
```

### Head create errors (removed / reduced)

For **household head** creates, do **not** expect these solely because another device used the same code:

- ~~`HOUSEHOLD_CODE_TAKEN`~~
- ~~`ENROLLMENT_ID_TAKEN`~~ (for head ID derived from `householdCode`)

Still handle:

| Code | Action |
| --- | --- |
| `HOUSEHOLD_HEAD_NOT_SYNCED` | Keep **pending**; retry after head syncs (members) |
| `HOUSEHOLD_HEAD_EXISTS` | Failed or success via idempotency — head already created for this `householdLocalId` |
| `DUPLICATE_ENROLLMENT` | Failed + review (identity duplicate) |
| `VALIDATION_ERROR`, `UPLOAD_NOT_FOUND`, `FORBIDDEN_WARD` | Failed + review |
| `HOUSEHOLD_CODE_EXHAUSTED` | Rare (503); retry with backoff |
| Network / 5xx / timeout | Pending + retry |

Update in-app error copy and any hard-coded handling that treated code clash as non-retryable.

---

## 3. Required client changes (next native release)

### 3.1 Persist server values on every successful create

After `POST /household-enrollments` succeeds (including `idempotentReplay: true`):

1. Store **`enrollmentId`** from the response (not the provisional offline-derived id).
2. Store **`householdCode`** from the response (overwrites the offline-allocated value when different).
3. Store **`householdId`** when present (required after head sync).
4. For members, store **`memberSequence`** when present.

Treat the response as **source of truth** for these fields once sync succeeds.

### 3.2 Propagate canonical `householdCode` across the household session

When a **head** sync succeeds **or** `householdCodeRemapped === true`:

- Update **`householdCode`** on **every local queue/draft record** that shares the same `householdLocalId` (head + pending members + household summary row if you keep one).
- Update any **household list / review UI** cache keyed by `householdLocalId`.

Members still sync with `householdId` / `householdLocalId`; their request may still include the old `householdCode` in the payload — the server links by household id/local id. Keeping local `householdCode` aligned avoids confusing labels before member sync.

**Reference (PWA):** `pwa/src/features/enrollment/services/sync.service.ts` — `persistSuccessfulSync`, `applyHouseholdCodeToLocalRecords`.

### 3.3 Propagate `householdId` to pending members (unchanged rule)

After head success, set **`householdId`** on all **pending** member records with the same `householdLocalId` before or while syncing members. This rule is unchanged; verify it still runs after remapped heads.

### 3.4 UX when `householdCodeRemapped === true`

Recommended (pick at least one):

- One-time notice after sync: e.g. “Household ID was adjusted to **{householdCode}** to avoid a duplicate in this ward.”
- On beneficiary / household review screens, show the **stored post-sync** `householdCode` and `enrollmentId`, not only the value shown at capture time.

Offline capture may still **display** a provisional code; label it as provisional until sync if you continue client-side allocation before server contact.

### 3.5 Retry failed records after backend upgrade

Records that failed with code-clash errors **before** the backend change remain **`failed`** on device until the user retries.

- Provide **Retry** on failed sync rows (same `idempotencyId` and payload is fine).
- Do **not** require users to re-enroll from scratch for duplicate-code failures.

No app update is strictly required for retry to **succeed on the server**, but the app should persist §3.1–3.2 on retry to fix local labels.

### 3.6 Optional improvements (same release or later)

- After login / going online, refresh **`GET /households/code-counters`** and merge into local per-ward counters (reduces provisional collisions offline; server still fixes on sync). See [`mobile-app-enrollment-handoff.md`](./mobile-app-enrollment-handoff.md).
- Treat former code-clash error codes as **retryable pending** if they appear against an older API version during rollout.

---

## 4. What you can defer

| Item | Notes |
| --- | --- |
| Reading `householdCodeRemapped` | Sync works without it; UX is better with it |
| Local counter algorithm changes | Server remaps on head sync; counters remain a best-effort offline hint |
| New API endpoints | None required for this feature |

---

## 5. Testing checklist (native QA)

1. **Two devices, same ward, offline:** Both allocate `…-001` locally. Sync device A, then device B. B should ** succeed** with `householdCodeRemapped: true` and a higher suffix; local DB on B shows canonical code and `PL-CBHI-…` head id.
2. **Head + members queued:** Head remapped; pending members still sync after `householdId` propagation; member `enrollmentId` suffix matches head’s **canonical** base id.
3. **Idempotent replay:** Retry same head with same `idempotencyId` after success → `idempotentReplay: true`, same `householdCode` / `enrollmentId`, no duplicate rows on server.
4. **Previously failed record:** Mark failed with old clash message → user taps Retry → success without re-capture.
5. **UI:** Review screen shows server `householdCode` after sync, not stale offline code when remapped.

---

## 6. Rollout coordination

1. **Backend + Redis** deployed first (household code allocation active).
2. **Native app:** ship this update when ready; older builds remain usable if they persist response fields and support retry.
3. **Operators:** retry failed household syncs after backend deploy; communicate that displayed household IDs may change to the server-assigned value.

---

## 7. Implementation reference in this repo

| Area | Location |
| --- | --- |
| Server allocation + head create | `backend/src/modules/household/application/household-code-allocation.service.ts`, `create-household-enrollment.use-case.ts` |
| API response field | `backend/src/modules/household/presentation/household-enrollment.controller.ts` |
| PWA sync persistence | `pwa/src/features/enrollment/services/sync.service.ts` |
| PWA response types | `pwa/src/features/enrollment/types/enrollment.types.ts` (`CreateHouseholdEnrollmentResponse`) |

For questions about the wider enrollment flow, start with [`mobile-app-enrollment-handoff.md`](./mobile-app-enrollment-handoff.md).

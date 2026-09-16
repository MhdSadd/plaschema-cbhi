# Codex conversation

## User

We did quite a nice job on the PWA of this project. Like how we made it work offline even when the PWA was not installed. Like how we always have like an update when a new build is available for the PWA works like a real mobile app. Like how we handled offline data storage and all. I would love to have this knowledge for like what do you suggest ?

## Assistant

I’ll first map the PWA’s actual offline, update, and local-data architecture, then suggest the best way to preserve that knowledge—likely a reusable engineering guide rather than a project-only note.

## Activity

    $ /bin/zsh -lc "pwd && rg --files docs pwa | sed -n '1,240p'"
    status: Completed · exit 0
      docs/HANDOFF.md
      docs/pwa-enrollment-handoff.md
      docs/feature-folder-structure.md
      docs/routing-entry-pattern.md
      docs/frontend-list-kpi-handoff.md
      docs/capitation-backend-feedback.md
      docs/enrollment-backend-feedback.md
      pwa/public/icon-512.png
      pwa/public/logo.png
      pwa/public/icon-192.png
      pwa/public/apple-touch-icon.png
      pwa/tsconfig.app.json
      pwa/netlify.toml
      pwa/index.html
      pwa/tsconfig.node.json
      pwa/src/test/setup.ts
      pwa/src/app/providers.tsx
      pwa/src/app/router.tsx
      pwa/src/main.tsx
      pwa/vite.config.ts
      pwa/.env.example
      pwa/tsconfig.json
      pwa/package.json
      pwa/src/routes/beneficiaries.tsx
      pwa/src/routes/profile.tsx
      pwa/src/routes/sync.tsx
      pwa/src/routes/enroll.tsx
      pwa/src/routes/home.tsx
      pwa/src/routes/login.tsx
      pwa/src/routes/beneficiary-detail.tsx
      pwa/src/hooks/use-network-status.ts
      pwa/src/vite-env.d.ts
      pwa/src/api/index.ts
      pwa/src/api/stream.test.ts
      pwa/src/api/client.ts
      pwa/src/api/request.ts
      pwa/src/api/stream.ts
      pwa/src/api/errors.ts
      pwa/src/api/api.types.ts
      pwa/src/components/app-layout.tsx
      pwa/src/lib/offline-db.ts
      pwa/src/lib/query-client.ts
      pwa/src/components/layout-regression.test.ts
      pwa/src/components/protected-layout.tsx
      pwa/src/components/status-badge.tsx
      pwa/src/components/update-prompt.tsx
      pwa/src/styles.css
      pwa/src/features/sync/components/sync-view.tsx
      pwa/src/features/profile/components/ward-access-card.test.tsx
      pwa/src/features/profile/components/ward-access-card.tsx
      pwa/src/features/profile/components/profile-view.tsx
      pwa/src/features/beneficiaries/components/beneficiaries-view.tsx
      pwa/src/features/beneficiaries/components/beneficiary-detail-view.tsx
      pwa/src/features/enrollment/services/index.ts
      pwa/src/features/enrollment/services/sync.service.test.ts
      pwa/src/features/enrollment/services/sync.service.ts
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts
      pwa/src/features/enrollment/services/offline-enrollment.service.ts
      pwa/src/features/enrollment/services/enrollment.service.ts
      pwa/src/features/enrollment/hooks/index.ts
      pwa/src/features/enrollment/hooks/useEnrollmentOffline.ts
      pwa/src/features/enrollment/components/enrollment-view.tsx
      pwa/src/features/enrollment/components/offline-enrollment-coordinator.tsx
      pwa/src/features/enrollment/utils/index.ts
      pwa/src/features/enrollment/utils/form.ts
      pwa/src/features/enrollment/types/index.ts
      pwa/src/features/enrollment/types/enrollment.types.ts
      pwa/src/features/auth/services/index.ts
      pwa/src/features/auth/services/auth.service.ts
      pwa/src/features/auth/hooks/useFieldWorkerLogin.ts
      pwa/src/features/auth/hooks/index.ts
      pwa/src/features/auth/hooks/useFieldWorkerLogout.ts
      pwa/src/features/auth/hooks/useAuthSession.ts
      pwa/src/features/auth/components/index.ts
      pwa/src/features/auth/components/login-view.tsx
      pwa/src/features/auth/components/login-view.test.tsx
      pwa/src/features/auth/components/auth-session-gate.tsx
      pwa/src/features/auth/utils/session.test.ts
      pwa/src/features/auth/utils/index.ts
      pwa/src/features/auth/utils/session.ts
      pwa/src/features/auth/stores/auth.store.test.ts
      pwa/src/features/auth/stores/auth.store.ts
      pwa/src/features/auth/types/index.ts
      pwa/src/features/auth/types/auth.types.ts
      pwa/src/features/home/components/home-view.tsx

## Activity

    $ /bin/zsh -lc "sed -n '1,260p' docs/HANDOFF.md; sed -n '1,240p' docs/feature-folder-structure.md; sed -n '1,240p' docs/routing-entry-pattern.md; sed -n '1,280p' docs/pwa-enrollment-handoff.md"
    status: Completed · exit 0
      # Frontend Architecture Spec — Routing & Data Layer
      
      **What this pattern is called.** Routing is the *Bulletproof React / Feature-Sliced*
      split: an **app layer** (composition root) holding a **centralized route manifest**, and
      a **thin route-entry layer** (FSD calls it the *pages layer*) whose files are pure
      adapters. The data layer is a **three-layer feature architecture** with a
      **unidirectional dependency rule**: a **transport facade** over one HTTP client, a
      **service layer** acting as an **anti-corruption layer** (wire DTOs → domain types), and
      a **server-state adapter** layer of React Query hooks.
      
      ---
      
      # Part A — Routing
      
      ## A0. Layout
      
      ```
      src/
        app/router.tsx        # the ONLY place URL paths are declared
        routes/               # flat, one file per route, no subfolders, no index.ts
        features/<name>/
          components/         # index.ts barrel; contains <name>-view.tsx (the real page)
          hooks/  services/  types/  utils/
        components/layout/protected-layout.tsx
        main.tsx              # providers + <RouterProvider router={router} />
      ```
      
      ## A1. One centralized route manifest
      
      All paths live in a single `createBrowserRouter` array in `src/app/router.tsx`.
      Public/auth routes are top-level siblings. Everything authenticated is a child of one
      layout route at `path: '/'`. A `*` catch-all redirects to `/`.
      
      ```tsx
      export const router = createBrowserRouter([
        { path: '/login', element: <LoginPage /> },
        { path: '/verify-otp', element: <VerifyOtpPage /> },  // sibling on purpose: must sit
                                                              // outside the layout, and an
                                                              // unregistered path would be
                                                              // swallowed by the catch-all
        {
          path: '/',
          element: <ProtectedLayout />,
          children: [
            { index: true, element: <DashboardPage />, handle: { title: 'Dashboard' } },
            { path: 'users', element: <UsersPage />, handle: { title: 'Users' } },
            { path: 'users/:userId', element: <UserDetailPage /> },
            { path: 'roles', element: <RolesPage />, handle: { title: 'Roles' } },
            { path: 'roles/create', element: <CreateRolePage /> },   // static BEFORE :param
            { path: 'roles/:roleId/edit', element: <EditRolePage /> },
            { path: 'roles/:roleId', element: <RoleDetailPage /> },
          ],
        },
        { path: '*', element: <Navigate to="/" replace /> },
      ])
      ```
      
      Ordering: static sub-routes (`create`, `:id/edit`) are always declared **before** the
      bare `:id` route.
      
      ## A2. Route files are adapters, never implementations
      
      A file in `src/routes/` may do exactly two things: read URL params, and render one
      feature view. No markup, no data fetching, no business logic, no more than ~10 lines.
      
      ```tsx
      // src/routes/users.tsx — canonical shape
      import { UsersView } from '@/features/users/components'
      
      export function UsersPage() {
        return <UsersView />
      }
      ```
      
      ```tsx
      // src/routes/user-detail.tsx — param variant.
      // The route narrows the optional param so the feature view takes a plain string.
      import { useParams } from 'react-router-dom'
      import { UserDetailView } from '@/features/users/components'
      
      export function UserDetailPage() {
        const { userId } = useParams<{ userId: string }>()
        if (!userId) return null
        return <UserDetailView userId={userId} />
      }
      ```
      
      - Import **only** from the feature's `components/` barrel (`@/features/users/components`).
        Never a deep file path, never from `hooks/` or `services/`.
      - Naming: file `kebab-case.tsx`, export `<Name>Page`, feature component `<Name>View`.
      - **Named exports only — no default exports anywhere in `src/routes/`.**
      
      ## A3. One layout route owns the auth guard
      
      Gate auth inside the layout component, not with loaders or a `<RequireAuth>` wrapper.
      Public routes opt out by being siblings of the layout route.
      
      ```tsx
      const status = useAuthStore(selectAuthStatus)
      if (status === 'restoring') return <FullPageSpinner />
      if (status === 'unauthenticated')
        return <Navigate to="/login" replace state={{ from: location.pathname }} />
      return (/* sidebar + header + <PageHeader /> + <Outlet /> */)
      ```
      
      Kick off the auth bootstrap in `main.tsx` **before** `createRoot`, as an idempotent
      memoised promise so StrictMode's double-effect is safe.
      
      ## A4. `handle: { title }` drives the page header
      
      Only top-level nav destinations declare `handle.title`; detail and sub-routes omit it
      and render no title band. Read it in the layout with a typed guard:
      
      ```tsx
      interface RouteHandle { title?: string }
      function hasTitle(h: unknown): h is Required<RouteHandle> { /* ... */ }
      
      function usePageTitle(): string | undefined {
        const match = useMatches().findLast((m) => hasTitle(m.handle))
        return match && hasTitle(match.handle) ? match.handle.title : undefined
      }
      ```
      
      `handle.title` strings must match the sidebar nav labels one-for-one.
      
      ## A5. No React Router data APIs
      
      No `loader`, `action`, or `errorElement`. All server state is TanStack Query inside
      feature hooks. The manifest stays purely declarative.
      
      ## A6. Barrels inside features only
      
      Every feature subfolder with 2+ files gets an `index.ts`. `src/routes/` and `src/app/`
      have none — `router.tsx` imports each route file by path.
      
      ## A7. Lazy-load every non-auth route
      
      Use React Router's `lazy` so the app does not ship as a single bundle. The thin-route
      convention makes this one line per route.
      
      ---
      
      # Part B — API / data layer
      
      Three strictly-layered modules: **transport → services → hooks → components**.
      Each layer may import only the layer directly below it.
      
      ## B0. Layout
      
      ```
      src/
        api/
          api.types.ts    # envelope, pagination, error body types
          client.ts       # the single axios instance + interceptors
          errors.ts       # error normalization helpers
          request.ts      # _get / _post / _put / _patch / _delete
          index.ts        # barrel — `@/api` is the ONLY import surface
        lib/query-client.ts
        features/<name>/
          services/<name>.service.ts + index.ts
          hooks/useXxx.ts + index.ts
          types/<name>.types.ts + index.ts
          utils/           # pure wire→domain mappers
          components/
      ```
      
      ## B1. Transport (`src/api/`)
      
      ### `request.ts` — the only functions services may call
      
      ```ts
      import { api } from './client'
      import type { QueryParams, RequestConfig } from './api.types'
      
      export const _get = <T = unknown>(url: string, params?: QueryParams, config?: RequestConfig) =>
        api.get<T>(url, { ...config, params })
      
      export const _post = <T = unknown, D = unknown>(url: string, data?: D, config?: RequestConfig) =>
        api.post<T>(url, data, config)
      
      export const _put   = <T = unknown, D = unknown>(url: string, data?: D, config?: RequestConfig) => api.put<T>(url, data, config)
      export const _patch = <T = unknown, D = unknown>(url: string, data?: D, config?: RequestConfig) => api.patch<T>(url, data, config)
      export const _delete = <T = unknown>(url: string, config?: RequestConfig) => api.delete<T>(url, config)
      ```
      
      Non-negotiable details:
      
      - Generics default to `unknown`, **never `any`** — an untyped call must fail to compile.
      - Write verbs take two generics: `<TResponse, TBody>`.
      - Wrappers return the **full `AxiosResponse<T>`**, not `.data`. Unwrapping is the
        service's job (`response.data.data`).
      - `_get` takes query params as a **params object in the second argument** — never
        hand-built `URLSearchParams` in the URL string. Let axios serialize.
      
      ### `api.types.ts` — the shared contracts
      
      ```ts
      export type QueryParamValue = string | number | boolean | null | undefined
      export type QueryParams = Record<string, QueryParamValue | QueryParamValue[]>
      export type RequestConfig = Omit<AxiosRequestConfig, 'url' | 'method' | 'data'>
      
      export interface ApiResponse<T> { data: T; message?: string; success?: boolean }
      export interface PaginationMeta { page: number; pageSize: number; total: number; totalPages: number }
      export interface PaginatedApiResponse<T> extends ApiResponse<T[]> { meta: PaginationMeta }
      export interface ApiErrorBody { message?: string; error?: string; errors?: Record<string, string[]> }
      export interface AuthTokens { accessToken: string; refreshToken: string }
      ```
      
      ### `client.ts` — one axios instance, two interceptors
      
      - `baseURL` from a single typed env var (declare it in `vite-env.d.ts`).
      - **Request interceptor** attaches `Authorization: Bearer <accessToken>` from the auth store.
      - **Response interceptor** handles 401 with refresh-and-replay:
        - A separate bare `refreshClient` instance performs the refresh so it **cannot
          re-enter the interceptors and recurse**.
        - An `UNAUTHENTICATED_PATHS` allowlist (`/auth/login`, `/auth/verify-login`,
          `/auth/forgot-password`, the refresh endpoint) is exempt — a 401 on OTP verify
          means "wrong code", not "expired session", and must not trigger a redirect.
        - An `isRefreshing` flag plus a `failedQueue` so concurrent 401s park on the single
          in-flight refresh instead of each firing their own.
        - A `_retry` flag on the request config prevents infinite replay.
        - On refresh failure: clear auth state and redirect to `/login`.
      - Export `requestNewTokens(refreshToken)` so cold-start session restore reuses the exact
        same call without triggering the redirect path.
      
      ### `errors.ts` — never read `error.response.data.message` at a call site
      
      ```ts
      export const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.'
      export const isApiError = (e: unknown): e is AxiosError<ApiErrorBody> => axios.isAxiosError(e)
      export const getApiErrorMessage = (e: unknown, fallback = DEFAULT_ERROR_MESSAGE): string => {
        /* body.message ?? body.error ?? first field error ?? fallback */
      }
      export const getApiErrorStatus = (e: unknown): number | undefined => /* ... */
      export const getApiFieldErrors = (e: unknown): Record<string, string[]> | undefined => /* for react-hook-form setError */
      ```
      
      `index.ts` re-exports everything. **Nothing outside `src/api/` imports `axios` or the
      `api` instance directly.**
      
      # PWA beneficiary enrollment — handoff
      
      Last updated: 2 September 2026
      
      This document explains how beneficiary enrollment is meant to work on the **PLASCHEMA Field Worker PWA**, with emphasis on **offline behaviour**, **sync**, and **which API endpoints to call for what**.
      
      It is written for engineers maintaining the live PWA enrollment integration.
      
      ---
      
      ## 1. Big picture
      
      The PWA lets field workers enroll beneficiaries in the field, often with poor connectivity.
      
      The model is **offline-first**:
      
      1. Capture everything on the device (form + photos).
      2. Save locally with a sync status.
      3. Upload to the server when online, one record at a time.
      4. Keep pending and failed records on the device; do **not** rely on listing synced server records in the PWA.
      
      ```text
      ┌─────────────────┐     online      ┌──────────────────┐
      │  PWA (device)   │ ──────────────► │  Backend API     │
      │  local drafts   │   presign +     │  PostgreSQL +    │
      │  pending/failed │   create        │  object storage  │
      └─────────────────┘                 └──────────────────┘
              │
              │ offline: read/write local storage only
              ▼
         IndexedDB / local storage
      ```
      
      ---
      
      ## 2. Current implementation
      
      | Area | Status |
      | --- | --- |
      | Login, session restore, offline session | **Live** — `POST /auth/login`, `GET /auth/me`, local storage |
      | Profile name, phone, assigned wards | **Live** — from authenticated user |
      | Six-step enrollment UI | **Built** — design-complete |
      | Saving enrollments | **Live** — durable IndexedDB draft and outbox |
      | File upload to server | **Live** — presigned PUT upload |
      | Real sync to backend | **Live** — foreground one-by-one sync |
      | Backend create/sync APIs | **Ready** — see endpoint table below |
      | Ward/facility pickers offline cache | **Live** — NDJSON streams cached in IndexedDB |
      
      ---
      
      ## 3. Enrollment screens (PWA routes)
      
      | Route | Purpose |
      | --- | --- |
      | `/login` | Field-worker login (online required first time) |
      | `/` (Home) | Greeting, Today/Total/Pending cards, recent local records |
      | `/enroll` | Six-step enrollment wizard |
      | `/beneficiaries` | Search/filter device-local pending and failed records |
      | `/beneficiaries/:id` | Review one local draft |
      | `/sync` | Pending/failed queue, Sync now, Retry, Review |
      | `/profile` | Worker identity, assigned wards, sign out |
      
      ### Six enrollment steps
      
      1. **Personal** — passport photo, title, names, gender, DOB, marital status
      2. **Residence** — state, LGA, ward, address
      3. **Contact** — phone, optional email
      4. **Background** — ID type, ID document, next of kin
      5. **Facility** — health facility for the selected ward
      6. **Review** — confirm and save locally
      
      Passport and ID files: images or PDF (ID only), max 5 MB each. State is fixed to `PLATEAU`; both phone fields require exactly 11 digits; optional NIN requires exactly 10 digits.
      
      ---
      
      ## 4. Sync statuses (device-local)
      
      Every saved enrollment on the device has one of these statuses:
      
      | Status | Meaning | Shown on |
      | --- | --- | --- |
      | **Pending** | Saved locally, not yet uploaded (or waiting for retry) | Home, People, Sync |
      | **Syncing** | Upload in progress (UI-only transient state) | Sync |
      | **Failed** | Upload attempted; error stored for review/retry | Home, People, Sync |
      | **Synced** | Successfully accepted but final sync reporting is still finishing | Hidden, then removed after `/auth/sync` succeeds |
      
      **Failed sync handling (client-side, no special API):**
      
      - Keep the full draft on the device.
      - Store `syncError` (message from API `error.message`, optionally `error.code`).
      - **Retry** — run the same upload + create flow again with the **same** `idempotencyId`.
      - **Review** — open the beneficiary detail screen so the worker can fix data/files, then retry.
      
      Typical error mapping:
      
      | API code | Suggested client action |
      | --- | --- |
      | Network / timeout | Failed, retryable |
      | `DUPLICATE_ENROLLMENT` | Treat as success if same person, or Failed + review |
      | `VALIDATION_ERROR`, `UPLOAD_NOT_FOUND`, `FORBIDDEN_WARD` | Failed, needs review |
      | `401` / expired JWT | Stop sync, prompt re-login |
      
      ---
      
      ## 5. Online enrolment flow
      
      When the device is **online** at save time, you can sync immediately or still save locally first — product prefers **always save locally**, then sync.
      
      ### Step A — Save on device
      
      On “Save enrollment”:
      
      - Generate **UUID v7** → `idempotencyId` (keep forever for this draft).
      - Set `capturedAt` = now (ISO datetime).
      - Store form fields + file blobs locally.
      - Set status = `Pending` (even if online — sync step confirms server acceptance).
      
      ### Step B — Upload files (when syncing)
      
      For each pending record:
      
      1. `POST /api/enrollments/files/presign-upload`
         - Body: `{ purpose: "passport" | "id_document", filename, contentType }`
         - Returns presigned PUT URL + `objectKey`
      
      2. **PUT** file bytes to the presigned URL (Railway object storage).
      
      3. Repeat for passport and ID document.
      
      > Dev-only shortcut: `POST /api/enrollments/files/dev-upload` (multipart). Not for production.
      
      ### Step C — Create enrollment
      
      `POST /api/enrollments` with the form payload + `passportObjectKey` + `idDocumentObjectKey`.
      
      **Slim success response** (all the client needs):
      
      ```json
      {
        "id": "uuid",
        "enrollmentId": "PL/CBHI/2026/001",
        "idempotencyId": "uuid-v7",
        "status": "pending",
        "capturedAt": "2026-09-02T08:15:00.000Z",
        "createdAt": "2026-09-02T09:00:00.000Z",
        "idempotentReplay": false
      }
      ```
      
      - On **retry with same `idempotencyId`**: same shape, `idempotentReplay: true` → treat as success.
      - Store `enrollmentId` temporarily and mark **Synced** while the final sync report is owed.
      
      ### Step D — Report sync complete
      
      After the **one-by-one** pending loop finishes (all success or user stops):
      
      `POST /api/auth/sync` → updates the user’s `lastSyncedAt` on the server.
      
      After this succeeds, delete all successfully synced local records and their file blobs. If it fails, keep the records and retry only `/auth/sync`; do not upload or create those enrollments again.
      
      ---
      
      ## 6. Offline enrolment flow
      
      When the device is **offline** at save time:
      
      1. Worker completes the same six steps.
      2. App saves the draft **only on device** in IndexedDB.
      3. Status = **Pending**.
      4. Passport/ID files stay as **local blobs** (not uploaded).
      5. Home **Pending** count increases; **Today** can count local captures by `capturedAt` calendar day.
      
      When connectivity returns:
      
      1. User opens **Sync** (or app auto-triggers when online).
      2. For each **Pending** or **Failed** record: run Step B + C above.
      3. On full run completion: `POST /api/auth/sync`.
      
      **Important:** offline save does **not** call the API. The server only sees the record after a successful create.
      
      ---
      
      ## 7. What data lives where
      
      ### On the device (source of truth for the PWA UI)
      
      - Pending and failed enrollment drafts (full form + files).
      - Local counters for **Pending**.
      - Local unsent count used alongside server totals so new device records appear immediately without double-counting accepted records.
      - Session token + cached user profile (for offline app access).
      
      ### On the server (source of truth after sync)
      
      - Accepted enrollments in PostgreSQL.
      - Passport and ID files in object storage.
      - Worker stats: `totalEnrolled`, `enrollmentsToday`, `enrollmentsThisMonth`.
      
      ### Do **not** fetch synced beneficiary lists for the PWA
      
      The PWA does **not** mirror the admin beneficiary table. After the final sync report, synced rows are deleted locally. Server-backed history belongs in admin, not the field app.
      
      ---
      
      ## 8. Home analytics (Today / Total / Pending)
      
      | Card | Source |
      | --- | --- |
      | **Pending** | Count device records where status is Pending or Failed |
      | **Today** | **Synced today (server)** + **captured today (device, not yet synced)** |
      | **Total** | **All-time synced (server)** + **unsent records on this device** |
      
      Server side for synced portions:
      
      `GET /api/users/:id/detail` (own id only) → `stats`:
      
      - `totalEnrolled` — all-time synced count for this worker
      - `enrollmentsToday` — synced today (Africa/Lagos calendar day)
      - `enrollmentsThisMonth` — optional, not on home design
      
      Combine with local pending/today captures in the client.
      
      ---
      
      ## 9. API endpoints — what to use for what
      
      Base URL: configure `VITE_API_URL` (e.g. production API). All paths below are prefixed with `/api`.
      
      Auth header: `Authorization: Bearer <accessToken>`
      
      ### Authentication and profile
      
      | Endpoint | Role | Use for |
      | --- | --- | --- |
      | `POST /auth/login` | Public | First login; returns token + user |
      | `GET /auth/me` | Field worker | Refresh profile when online; validate session |
      | `POST /auth/sync` | Field worker | After sync loop; sets `lastSyncedAt` |
      | `GET /users/:id/detail` | Field worker (own id only) | Home **Today/Total** stats, wards list, `lastSyncedAt` |
      
      No logout endpoint — clear token locally. No refresh token — re-login when JWT expires (~8h).
      
      ### Reference data (for enrollment form pickers)
      
      | Endpoint | Use for |
      | --- | --- |
      | `GET /wards` | Paginated ward list (online) |
      | `GET /wards/stream` | NDJSON bulk download for **offline ward cache** |
      | `GET /health-facilities` | Paginated facilities (online) |
      | `GET /health-facilities/stream` | NDJSON bulk download for **offline facility cache** |
      
      Field workers only see wards they are assigned to (empty assignment = all wards).
      
      ### Enrollment sync
      
      | Endpoint | Use for |
      | --- | --- |
      | `POST /enrollments/files/presign-upload` | Get upload URL before create |
      | `POST /enrollments` | Submit enrollment (idempotent) |
      | `GET /enrollments` | **Not for PWA lists** — admin / display-only tabs |
      | `GET /enrollments/:id` | **Not needed for sync** — full detail + file URLs |
      
      ### Error shape (all endpoints)
      
      ```json
      {
        "success": false,
        "error": {
          "code": "DUPLICATE_ENROLLMENT",
          "message": "Human-readable message",
          "details": {}
        }
      }
      ```
      
      ---
      
      ## 10. Create enrollment — required fields (summary)
      
      Key fields for `POST /api/enrollments`:
      
      | Field | Notes |

## Activity

    $ /bin/zsh -lc "sed -n '1,260p' pwa/vite.config.ts; sed -n '1,220p' pwa/src/main.tsx; sed -n '1,220p' pwa/src/app/providers.tsx; sed -n '1,220p' pwa/src/components/update-prompt.tsx; sed -n '1,320p' pwa/src/lib/offline-db.ts; sed -n '1,320p' pwa/src/features/enrollment/services/offline-enrollment.service.ts; sed -n '1,380p' pwa/src/features/enrollment/services/sync.service.ts; sed -n '1,260p' pwa/src/features/enrollment/components/offline-enrollment-coordinator.tsx; sed -n '1,180p' pwa/src/hooks/use-network-status.ts; sed -n '1,180p' pwa/netlify.toml; sed -n '1,180p' pwa/package.json"
    status: Completed · exit 0
      [build]
        command = "pnpm --filter pwa build"
        publish = "/pwa/dist"
        ignore = "git diff --quiet $CACHED_COMMIT_REF $COMMIT_REF pwa package.json pnpm-lock.yaml pnpm-workspace.yaml"
      
      [build.environment]
        NODE_VERSION = "22"
      
      [[redirects]]
        from = "/*"
        to = "/index.html"
        status = 200
      
      [[headers]]
        for = "/sw.js"
      
        [headers.values]
          Cache-Control = "public, max-age=0, must-revalidate"
      
      {
        "name": "pwa",
        "private": true,
        "version": "0.0.0",
        "type": "module",
        "scripts": {
          "dev": "vite --port 5174 --strictPort",
          "build": "tsc -b && vite build",
          "lint": "oxlint",
          "test": "vitest run",
          "preview": "vite preview --port 4174"
        },
        "dependencies": {
          "@fontsource-variable/inter-tight": "^5.3.0",
          "@tanstack/react-query": "^5.102.3",
          "axios": "^1.19.0",
          "dexie": "^4.4.5",
          "dexie-react-hooks": "^4.4.0",
          "lucide-react": "^1.34.0",
          "react": "^19.2.8",
          "react-dom": "^19.2.8",
          "react-router-dom": "^7.18.2",
          "uuid": "^14.0.2",
          "workbox-window": "^7.4.0",
          "zustand": "^5.0.15"
        },
        "devDependencies": {
          "@tailwindcss/vite": "^4.3.3",
          "@testing-library/jest-dom": "^6.9.1",
          "@testing-library/react": "^16.3.2",
          "@testing-library/user-event": "^14.6.1",
          "@types/node": "^24.13.3",
          "@types/react": "^19.2.18",
          "@types/react-dom": "^19.2.4",
          "@vitejs/plugin-react": "^6.1.0",
          "fake-indexeddb": "^6.2.5",
          "jsdom": "^28.1.0",
          "oxlint": "^1.79.0",
          "tailwindcss": "^4.3.3",
          "typescript": "~6.0.2",
          "vite": "^8.2.2",
          "vite-plugin-pwa": "^1.2.0",
          "vitest": "^4.1.0"
        }
      }

## Activity

    $ /bin/zsh -lc "rg -n \"UpdatePrompt|requestPersistentStorage|hasStorageCapacity|navigator\\.onLine|continue offline|Continue Offline|persist|service worker|syncStatus|useLiveQuery\" pwa/src pwa/index.html docs -g '"'!docs/HANDOFF.md'"' -g '"'!docs/pwa-enrollment-handoff.md'"'; sed -n '1,300p' pwa/src/features/auth/components/auth-session-gate.tsx; sed -n '1,300p' pwa/src/features/auth/stores/auth.store.ts; sed -n '1,260p' pwa/src/features/enrollment/hooks/useEnrollmentOffline.ts; sed -n '1,240p' pwa/src/components/app-layout.tsx"
    status: Completed · exit 0
      pwa/src/features/beneficiaries/components/beneficiary-detail-view.tsx:56:    <div className="card p-5 text-center"><span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success text-xl font-bold text-success-foreground">{form.firstName[0]}{form.lastName[0]}</span><h1 className="mt-3 text-xl font-bold">{form.firstName} {form.lastName}</h1><p className="mt-1 font-mono text-xs text-neutral-400">{record.enrollmentId ?? `Local · ${record.localId.slice(0, 8)}`}</p><div className="mt-3"><StatusBadge status={record.syncStatus} /></div></div>
      pwa/src/features/beneficiaries/components/beneficiary-detail-view.tsx:57:    {record.errorMessage && <section role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4"><h2 className="text-sm font-bold text-red-800">Synchronization needs attention</h2><p className="mt-1 text-sm text-red-700">{record.errorMessage}</p>{duplicate && <p className="mt-2 text-xs font-semibold text-red-700">Existing enrollment: {duplicate}</p>}{actionError && <p className="mt-2 text-xs font-semibold text-red-700">{actionError}</p>}<div className="mt-3 grid grid-cols-3 gap-2"><button className="secondary-button !min-h-9 !py-2 text-xs" onClick={() => void edit()}><FilePenLine size={14} /> Edit</button><button className="secondary-button !min-h-9 !py-2 text-xs" disabled={!navigator.onLine || sync.isPending} onClick={() => void retry()}><RefreshCw size={14} /> Retry</button><button className="secondary-button !min-h-9 !border-red-200 !py-2 text-xs !text-red-700" onClick={() => void discard()}><Trash2 size={14} /> Discard</button></div></section>}
      pwa/src/features/home/components/home-view.tsx:16:  const unsentEnrollments = enrollments.filter((record) => record.syncStatus !== 'synced')
      pwa/src/features/home/components/home-view.tsx:24:    <section><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold">Recent device enrollments</h2><Link className="flex items-center text-xs font-semibold text-neutral-500" to="/beneficiaries">View all <ArrowRight size={14} /></Link></div>{unsentEnrollments.length === 0 ? <div className="card p-5 text-center text-sm text-neutral-500">No pending enrollments on this device.</div> : <div className="space-y-2">{unsentEnrollments.slice(0, 4).map((record) => <Link to={`/beneficiaries/${record.localId}`} className="card flex items-center gap-3 p-3" key={record.localId}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold">{record.form.firstName[0]}{record.form.lastName[0]}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{record.form.firstName} {record.form.lastName}</span><span className="text-xs text-neutral-400">{record.wardName}</span></span><StatusBadge status={record.syncStatus} /></Link>)}</div>}</section>
      pwa/src/features/enrollment/hooks/useEnrollmentOffline.ts:2:import { useLiveQuery } from 'dexie-react-hooks'
      pwa/src/features/enrollment/hooks/useEnrollmentOffline.ts:12:  return useLiveQuery(async () => (await offlineDb.drafts.get(ownerUserId)) ?? null, [ownerUserId])
      pwa/src/features/enrollment/hooks/useEnrollmentOffline.ts:16:  return useLiveQuery(
      pwa/src/features/enrollment/hooks/useEnrollmentOffline.ts:24:  return useLiveQuery(() => offlineDb.enrollments.get(localId), [localId])
      pwa/src/features/enrollment/hooks/useEnrollmentOffline.ts:28:  return useLiveQuery(() => offlineDb.syncState.get(ownerUserId), [ownerUserId])
      pwa/src/features/enrollment/hooks/useEnrollmentOffline.ts:32:  const wards = useLiveQuery(() => offlineDb.wards.where('ownerUserId').equals(ownerUserId).toArray(), [ownerUserId], [])
      pwa/src/features/enrollment/hooks/useEnrollmentOffline.ts:33:  const facilities = useLiveQuery(() => offlineDb.facilities.where('ownerUserId').equals(ownerUserId).toArray(), [ownerUserId], [])
      pwa/src/features/enrollment/hooks/useEnrollmentOffline.ts:34:  const metadata = useLiveQuery(() => offlineDb.referenceMetadata.get(ownerUserId), [ownerUserId])
      pwa/src/features/enrollment/hooks/useEnrollmentOffline.ts:57:    enabled: Boolean(user && navigator.onLine),
      pwa/src/features/enrollment/hooks/useEnrollmentOffline.ts:60:  const cachedStats = useLiveQuery(async () => user ? (await offlineDb.workerStats.get(user.id))?.stats : undefined, [user?.id])
      pwa/src/features/enrollment/utils/form.ts:111:  const unsent = records.filter((record) => record.syncStatus !== 'synced')
      pwa/src/features/auth/stores/auth.store.test.ts:25:  it('persists a valid field-worker session', () => {
      pwa/src/features/auth/stores/auth.store.test.ts:31:  it('allows an unexpired saved session to continue offline', () => {
      pwa/src/features/enrollment/components/enrollment-view.tsx:6:import { hasStorageCapacity, requestPersistentStorage } from '@/lib/offline-db'
      pwa/src/features/enrollment/components/enrollment-view.tsx:40:  useEffect(() => { void requestPersistentStorage() }, [])
      pwa/src/features/enrollment/components/enrollment-view.tsx:104:    if (!await hasStorageCapacity(file.size)) {
      pwa/src/features/enrollment/components/enrollment-view.tsx:178:  if (activeWards.length === 0 || facilities.length === 0) return <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 px-6 text-center"><RefreshCw size={32} className={referenceSync.isPending ? 'animate-spin' : ''} /><h1 className="text-xl font-bold">Enrollment data required</h1><p className="text-sm text-neutral-500">Download your wards and health facilities before starting. Once downloaded, they remain available offline.</p>{metadata && <p className="text-xs text-neutral-400">Last complete download: {new Date(metadata.syncedAt).toLocaleString()}</p>}<button className="primary-button w-full" disabled={!navigator.onLine || referenceSync.isPending} onClick={() => referenceSync.mutate()}>{navigator.onLine ? referenceSync.isPending ? 'Downloading…' : 'Download enrollment data' : 'Connect to the internet to download'}</button>{referenceSync.isError && <p role="alert" className="text-sm font-semibold text-red-700">Reference data could not be downloaded. Check your connection and try again.</p>}</div>
      pwa/src/features/enrollment/components/offline-enrollment-coordinator.tsx:14:    if (status !== 'authenticated' || !user || !navigator.onLine) return
      pwa/src/features/enrollment/components/offline-enrollment-coordinator.tsx:29:    const interval = window.setInterval(() => { if (navigator.onLine) void run(false) }, 30_000)
      pwa/src/features/auth/components/auth-session-gate.tsx:37:    return <main className="app-frame flex min-h-dvh items-center justify-center bg-neutral-50 p-6"><section className="card w-full p-6 text-center" role="alert"><h1 className="text-lg font-bold">Unable to verify your session</h1><p className="mt-2 text-sm text-neutral-500">The saved session is still valid. Retry when the service is available or continue offline using your saved profile.</p><div className="mt-5 flex flex-col gap-3"><button className="primary-button" onClick={() => void sessionQuery.refetch()} type="button">Retry</button><button className="secondary-button" onClick={continueOffline} type="button">Continue offline</button></div></section></main>
      pwa/src/features/enrollment/types/enrollment.types.ts:71:  syncStatus: LocalSyncStatus
      import type { PropsWithChildren } from 'react'
      import { useEffect } from 'react'
      
      import { useAuthSession } from '../hooks'
      import { PWA_SESSION_STORAGE_KEY, useAuthStore } from '../stores/auth.store'
      
      export function AuthSessionGate({ children }: PropsWithChildren) {
        const status = useAuthStore((state) => state.status)
        const expiresAt = useAuthStore((state) => state.expiresAt)
        const continueOffline = useAuthStore((state) => state.continueOffline)
        const clearSession = useAuthStore((state) => state.clearSession)
        const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage)
        const sessionQuery = useAuthSession()
      
        useEffect(() => {
          if (!expiresAt) return
          const remaining = expiresAt - Date.now()
          if (remaining <= 0) {
            clearSession('expired')
            return
          }
          const timer = window.setTimeout(() => clearSession('expired'), remaining)
          return () => window.clearTimeout(timer)
        }, [clearSession, expiresAt])
      
        useEffect(() => {
          function storageChanged(event: StorageEvent) {
            if (event.key === PWA_SESSION_STORAGE_KEY) hydrateFromStorage()
          }
          window.addEventListener('storage', storageChanged)
          return () => window.removeEventListener('storage', storageChanged)
        }, [hydrateFromStorage])
      
        if (status !== 'restoring') return children
      
        if (sessionQuery.isError) {
          return <main className="app-frame flex min-h-dvh items-center justify-center bg-neutral-50 p-6"><section className="card w-full p-6 text-center" role="alert"><h1 className="text-lg font-bold">Unable to verify your session</h1><p className="mt-2 text-sm text-neutral-500">The saved session is still valid. Retry when the service is available or continue offline using your saved profile.</p><div className="mt-5 flex flex-col gap-3"><button className="primary-button" onClick={() => void sessionQuery.refetch()} type="button">Retry</button><button className="secondary-button" onClick={continueOffline} type="button">Continue offline</button></div></section></main>
        }
      
        return <main aria-busy="true" aria-live="polite" className="app-frame flex min-h-dvh items-center justify-center bg-neutral-50"><div className="flex items-center gap-3 text-sm font-semibold text-neutral-500"><span className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-800" />Restoring your session…</div></main>
      }
      import { create } from 'zustand'
      
      import type { AuthStatus, FieldWorkerLoginResult, FieldWorkerUser, SessionNotice, SessionValidation } from '../types'
      import { isFieldWorkerUser } from '../utils'
      
      export const PWA_SESSION_STORAGE_KEY = 'plaschema-field-worker-session'
      
      interface StoredSession {
        accessToken: string
        expiresAt: number
        user: FieldWorkerUser
      }
      
      interface AuthState {
        accessToken: string | null
        expiresAt: number | null
        user: FieldWorkerUser | null
        status: AuthStatus
        validation: SessionValidation
        notice: SessionNotice
        setSession: (result: FieldWorkerLoginResult) => void
        completeRestore: (user: FieldWorkerUser, validation?: Exclude<SessionValidation, null>) => void
        continueOffline: () => void
        hydrateFromStorage: () => void
        clearSession: (reason?: 'logout' | 'expired') => void
        consumeNotice: () => void
        logout: () => void
      }
      
      function parseSession(value: string | null): StoredSession | null {
        if (!value) return null
        try {
          const parsed = JSON.parse(value) as Partial<StoredSession>
          if (
            typeof parsed.accessToken === 'string' &&
            typeof parsed.expiresAt === 'number' &&
            parsed.expiresAt > Date.now() &&
            isFieldWorkerUser(parsed.user)
          ) {
            return parsed as StoredSession
          }
        } catch {
          return null
        }
        return null
      }
      
      function readInitialSession() {
        const raw = localStorage.getItem(PWA_SESSION_STORAGE_KEY)
        const session = parseSession(raw)
        if (!session) localStorage.removeItem(PWA_SESSION_STORAGE_KEY)
        return { session, expired: Boolean(raw) && !session }
      }
      
      function writeSession(session: StoredSession) {
        localStorage.setItem(PWA_SESSION_STORAGE_KEY, JSON.stringify(session))
      }
      
      const initial = readInitialSession()
      
      export const useAuthStore = create<AuthState>((set, get) => ({
        accessToken: initial.session?.accessToken ?? null,
        expiresAt: initial.session?.expiresAt ?? null,
        user: initial.session?.user ?? null,
        status: initial.session ? 'restoring' : 'unauthenticated',
        validation: null,
        notice: initial.expired ? 'expired' : null,
        setSession: (result) => {
          writeSession(result)
          set({ ...result, status: 'authenticated', validation: 'verified', notice: null })
        },
        completeRestore: (user, validation = 'verified') => {
          const { accessToken, expiresAt } = get()
          if (!accessToken || !expiresAt || expiresAt <= Date.now()) return
          writeSession({ accessToken, expiresAt, user })
          set({ user, status: 'authenticated', validation, notice: null })
        },
        continueOffline: () => {
          const { accessToken, expiresAt, user } = get()
          if (!accessToken || !expiresAt || expiresAt <= Date.now() || !user) {
            get().clearSession('expired')
            return
          }
          set({ status: 'authenticated', validation: 'offline' })
        },
        hydrateFromStorage: () => {
          const session = parseSession(localStorage.getItem(PWA_SESSION_STORAGE_KEY))
          if (!session) {
            get().clearSession('logout')
            return
          }
          set({ ...session, status: 'restoring', validation: null, notice: null })
        },
        clearSession: (reason = 'logout') => {
          localStorage.removeItem(PWA_SESSION_STORAGE_KEY)
          set({
            accessToken: null,
            expiresAt: null,
            user: null,
            status: 'unauthenticated',
            validation: null,
            notice: reason === 'expired' ? 'expired' : null,
          })
        },
        consumeNotice: () => set({ notice: null }),
        logout: () => get().clearSession('logout'),
      }))
      import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
      import { useLiveQuery } from 'dexie-react-hooks'
      import { useEffect } from 'react'
      
      import { useAuthStore } from '@/features/auth/stores/auth.store'
      import { offlineDb } from '@/lib/offline-db'
      
      import { fetchOwnFieldWorkerDetail } from '../services'
      import { syncPendingEnrollments, syncReferenceData } from '../services/sync.service'
      
      export function useEnrollmentDraft(ownerUserId: string) {
        return useLiveQuery(async () => (await offlineDb.drafts.get(ownerUserId)) ?? null, [ownerUserId])
      }
      
      export function useLocalEnrollments(ownerUserId: string) {
        return useLiveQuery(
          () => offlineDb.enrollments.where('ownerUserId').equals(ownerUserId).reverse().sortBy('capturedAt'),
          [ownerUserId],
          [],
        )
      }
      
      export function useLocalEnrollment(localId: string) {
        return useLiveQuery(() => offlineDb.enrollments.get(localId), [localId])
      }
      
      export function useDeviceSyncState(ownerUserId: string) {
        return useLiveQuery(() => offlineDb.syncState.get(ownerUserId), [ownerUserId])
      }
      
      export function useEnrollmentReferences(ownerUserId: string) {
        const wards = useLiveQuery(() => offlineDb.wards.where('ownerUserId').equals(ownerUserId).toArray(), [ownerUserId], [])
        const facilities = useLiveQuery(() => offlineDb.facilities.where('ownerUserId').equals(ownerUserId).toArray(), [ownerUserId], [])
        const metadata = useLiveQuery(() => offlineDb.referenceMetadata.get(ownerUserId), [ownerUserId])
        return { wards, facilities, metadata }
      }
      
      export function useReferenceSync() {
        const user = useAuthStore((state) => state.user)!
        return useMutation({ mutationFn: () => syncReferenceData(user.id, user.assignedWards.map((ward) => ward.id)) })
      }
      
      export function useEnrollmentSync() {
        const user = useAuthStore((state) => state.user)!
        const queryClient = useQueryClient()
        return useMutation({
          mutationFn: () => syncPendingEnrollments(user.id),
          onSuccess: () => queryClient.invalidateQueries({ queryKey: ['field-worker', 'own-detail', user.id] }),
        })
      }
      
      export function useOwnFieldWorkerDetail() {
        const user = useAuthStore((state) => state.user)
        const query = useQuery({
          queryKey: ['field-worker', 'own-detail', user?.id],
          queryFn: ({ signal }) => fetchOwnFieldWorkerDetail(user!.id, signal),
          enabled: Boolean(user && navigator.onLine),
          staleTime: 30_000,
        })
        const cachedStats = useLiveQuery(async () => user ? (await offlineDb.workerStats.get(user.id))?.stats : undefined, [user?.id])
        useEffect(() => {
          if (!user || !query.data) return
          void offlineDb.workerStats.put({ ownerUserId: user.id, stats: query.data.stats, cachedAt: new Date().toISOString() })
        }, [query.data, user])
        return { ...query, effectiveStats: query.data?.stats ?? cachedStats }
      }
      import { Home, RefreshCw, UserRound, UsersRound, Wifi, WifiOff, Plus } from 'lucide-react'
      import { NavLink, Outlet, useLocation } from 'react-router-dom'
      
      import { UpdatePrompt } from '@/components/update-prompt'
      import { useNetworkStatus } from '@/hooks/use-network-status'
      
      const navItems = [
        { to: '/', label: 'Home', icon: Home },
        { to: '/beneficiaries', label: 'People', icon: UsersRound },
        { to: '/enroll', label: 'Enroll', icon: Plus, primary: true },
        { to: '/sync', label: 'Sync', icon: RefreshCw },
        { to: '/profile', label: 'Profile', icon: UserRound },
      ]
      
      export function AppLayout() {
        const isOnline = useNetworkStatus()
        const isEnrollmentRoute = useLocation().pathname === '/enroll'
        return (
          <div className="app-frame flex flex-col">
            <header className="flex shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="" className="h-8 w-10 object-contain" />
                <span className="font-bold">PLASCHEMA</span>
              </div>
              <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${isOnline ? 'bg-success text-success-foreground' : 'bg-amber-50 text-amber-700'}`}>
                {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}{isOnline ? 'Online' : 'Offline'}
              </div>
            </header>
            <UpdatePrompt />
            <main className={`min-h-0 flex-1 ${isEnrollmentRoute ? 'overflow-hidden' : 'overflow-y-auto'}`}><Outlet /></main>
            <nav aria-label="Main navigation" className="relative z-30 mx-auto flex w-full max-w-[430px] shrink-0 items-end border-t border-neutral-200 bg-white px-1 pt-5 pb-[max(.35rem,env(safe-area-inset-bottom))]">
              {navItems.map(({ to, label, icon: Icon, primary }) => (
                <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-bold ${isActive ? 'text-neutral-950' : 'text-neutral-400'}`}>
                  <span className={primary ? '-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-lg' : 'flex h-6 items-center'}><Icon size={primary ? 24 : 20} /></span>
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
        )
      }

## Assistant

The implementation is worth preserving as a reusable pattern, because it combines four distinct ideas: an app-shell service worker that works in a normal browser tab, explicit build-update prompting, owner-scoped IndexedDB storage, and a durable foreground outbox with idempotency, leases, retries, and final server acknowledgment. The current handoff documents the product behavior, but not enough of the reasoning and reusable design rules.

## Assistant

I’m using the skill-creator guidance because the deliverable now includes a reusable Codex skill. I’ll use it to define a full PWA framework—not just copy PLASCHEMA’s implementation—and keep the human guide and executable guidance aligned.

## Activity

    $ /bin/zsh -lc "sed -n '1,320p' /Users/admin/.codex/skills/.system/skill-creator/SKILL.md"
    status: Completed · exit 0
      ---
      name: skill-creator
      description: Create or update a Codex skill with appropriately scoped instructions and any needed supporting resources.
      metadata:
        short-description: Create or update a skill
      ---
      
      # Skill Creator
      
      Create skills that give Codex useful, non-obvious guidance without constraining unrelated work.
      
      ## Core Principles
      
      **Assume Codex is already capable.** Include only information that changes its decisions or improves its work. Remove generic advice, repeated instructions, speculative edge cases, and examples that do not materially clarify the task.
      
      **Preserve user intent and scope.** A skill should support the requested task, not replace the user's chosen product, expand the assignment, modify unrelated configuration, or imply permission for additional external actions. Do not turn a particular example, past failure, or personal preference into a universal requirement.
      
      Approval to complete a task does not expand its scope or execution permissions. For retrying or externally mutating workflows, define a stopping condition proportional to the risk.
      
      **Match specificity to the risk.** Give the model room to choose an appropriate approach when multiple approaches are reasonable. Use detailed steps, deterministic scripts, or absolute language only when correctness, safety, permissions, or a genuinely fragile workflow requires them.
      
      For open-ended work, describe the outcome and relevant decision criteria. For workflows with a preferred shape, offer useful examples or configurable scripts. Reserve fixed sequences and narrow parameters for operations where deviation would cause a concrete problem. Preserve non-obvious operational invariants, distinguish actual requirements from optional recommendations or local conventions, and avoid restating policies already enforced elsewhere.
      
      **Keep discovery cheap and precise.** Skill names and descriptions are available before a skill is loaded. Describe the actual capability and when it applies, adding exclusions only when they prevent likely misrouting. Avoid exhaustive capability lists and catchalls that attract unrelated requests.
      
      Keep skills self-contained; refer to another skill or tool only when the requested workflow genuinely requires it and it is available in the target environment. Specialized review, hardening, or audit workflows should apply when requested or genuinely needed, not merely because ordinary work touches the same subject.
      
      **Disclose detail progressively.** Keep shared purpose, essential constraints, and useful routing in `SKILL.md`. Put substantial mode-specific guidance, schemas, examples, or procedures in supporting references and read only the references relevant to the current task. A simple self-contained skill does not need a router or extra files.
      
      ## Anatomy of a Skill
      
      Every skill is a folder containing a required `SKILL.md` file and any optional resources its actual workflow needs:
      
      ```text
      skill-name/
      |-- SKILL.md                 Required skill instructions
      |   |-- YAML frontmatter     Required name and description
      |   `-- Markdown body        Instructions loaded when the skill is used
      |-- agents/                  Optional UI metadata and invocation policy
      |   `-- openai.yaml
      |-- scripts/                 Optional executable helpers
      |-- references/              Optional documentation loaded as needed
      `-- assets/                  Optional files used in generated output
      ```
      
      Choose the structure that fits the actual task. Some skills are short and self-contained; others route among operating modes or delegate complex mechanics to scripts. Avoid creating directories, placeholders, examples, or ancillary documentation without a clear use.
      
      ### SKILL.md
      
      The YAML frontmatter identifies the skill and determines when it should be considered. Include the required `name` and `description`, and preserve supported optional fields such as existing `metadata` when appropriate.
      
      The Markdown body is loaded only when the skill is used. Put the purpose, essential workflow, real constraints, and useful links there. Keep detailed procedures and examples in supporting references when they are relevant only to particular modes.
      
      Skill information is disclosed in three stages:
      
      1. **Name and description:** Available during skill selection, so keep them concise and discriminating.
      2. **SKILL.md body:** Loaded when the skill applies, so keep its instructions relevant to that task.
      3. **Supporting resources:** Read or execute only when the current task actually needs them.
      
      The entrypoint should be as short as the task permits while retaining important constraints. A large upper bound is not a target: move conditional detail into references when doing so improves clarity or context use, rather than waiting for the file to become unwieldy.
      
      ### Scripts
      
      Use `scripts/` for executable code when the same logic would otherwise be rewritten repeatedly or deterministic execution materially improves reliability.
      
      - **Example:** `scripts/rotate_pdf.py` for a PDF operation that would otherwise require recreating the same code.
      - **Useful for:** Repeated transformations, reliable API operations, data processing, and other concrete automation.
      - **Validation:** Run new or changed scripts to verify their behavior. Scripts can usually be executed without loading their full implementation into context, although an agent may need to inspect them when patching or adapting them.
      
      ### References
      
      Use `references/` for documentation that is needed only in particular contexts.
      
      - **Examples:** `references/schema.md` for database tables, `references/policies.md` for domain rules, `references/api_docs.md` for an API, or separate writing guides for different deliverables.
      - **Useful for:** Schemas, API documentation, company policies, format-specific procedures, detailed workflows, and substantial examples.
      - **Routing:** Link each reference from `SKILL.md` or another relevant resource and explain when it should be read. Keep information in one place instead of duplicating it across the entrypoint and references.
      
      Keep references focused on maintained, task-specific information that changes the agent's decisions. Avoid copied manuals, exhaustive catalogs, and generic tutorials already available from authoritative sources. Before removing existing resources, inspect their callers and purpose.
      
      For large references, include useful search terms or a short contents section when that makes the needed material easier to find.
      
      ### Assets
      
      Use `assets/` for files that belong in generated output rather than in the model's instructions.
      
      - **Examples:** `assets/logo.png`, `assets/slides.pptx`, `assets/font.ttf`, or `assets/frontend-template/`.
      - **Useful for:** Templates, images, fonts, icons, boilerplate projects, and other files copied or adapted into the result.
      - **Context:** Do not load assets as instructions unless the task requires inspecting them.
      
      ### UI Metadata and Invocation Policy
      
      `agents/openai.yaml` can provide UI-facing metadata such as `display_name`, `short_description`, and `default_prompt`, along with invocation policy. When creating or updating those settings, read [references/openai_yaml.md](references/openai_yaml.md) and keep the values consistent with the skill.
      
      Automatic skill selection is allowed by default. Change that default only when the user explicitly requests an explicit-only skill:
      
      ```yaml
      policy:
        allow_implicit_invocation: false
      ```
      
      This keeps the skill available when explicitly invoked as `$skill-name` without adding it to the model context automatically. Preserve unrelated existing UI, policy, and dependency fields when updating `agents/openai.yaml`.
      
      The initializer creates this file automatically. For new or interface-only metadata, generate it with:
      
      ```bash
      scripts/generate_openai_yaml.py <path/to/skill-folder> --interface key=value
      ```
      
      The generator replaces the entire file. If an existing file contains `policy` or `dependencies`, update only the intended fields in place instead of regenerating it.
      
      Include optional interface fields only when the user provides or requests them.
      
      ### What Not to Include
      
      Include files that directly support the skill's work. Avoid adding a `README.md`, installation guide, changelog, duplicated quick reference, or other auxiliary documentation unless a specific task or packaging requirement calls for it.
      
      ## Progressive Disclosure in Practice
      
      For a skill with multiple substantial modes, keep the shared guidance and mode-selection criteria in `SKILL.md`. Link each supporting reference where its use becomes relevant. Do not load every reference by default, duplicate reference content in the entrypoint, or add a routing layer when there is nothing meaningful to route.
      
      For example, a deployment skill can keep provider selection in `SKILL.md` and separate provider details:
      
      ```text
      cloud-deploy/
      |-- SKILL.md
      `-- references/
          |-- aws.md
          |-- gcp.md
          `-- azure.md
      ```
      
      When the user chooses AWS, read `references/aws.md`; do not also load the GCP and Azure guides. The same pattern can separate business domains, deliverable types, or other genuinely distinct operating modes.
      
      A short skill can instead route to details only when an advanced operation needs them:
      
      ```markdown
      ## Documents
      
      Handle ordinary edits directly.
      
      - For tracked changes, read [references/redlining.md](references/redlining.md).
      - For document internals, read [references/ooxml.md](references/ooxml.md).
      ```
      
      These examples illustrate options, not a required structure. Choose the organization that makes the skill easier to use without loading irrelevant material.
      
      ## Create or Update a Skill
      
      Adapt the work to the request. Creating a complex new skill may involve understanding realistic use cases, choosing supporting resources, initializing files, writing instructions, and validating the result. A narrow update to an existing skill may require only a focused edit and validation.
      
      Ask clarifying questions only when the missing information matters and cannot be reasonably inferred. Respect a user-specified location; otherwise create discoverable skills in `$CODEX_HOME/skills`, or `~/.codex/skills` when `CODEX_HOME` is unset.
      
      Keep automatic skill selection enabled unless the user explicitly requests an explicit-only skill. When the intended invocation mode is genuinely unclear and matters to the requested workflow, ask whether the user wants normal automatic discovery or explicit-only invocation; otherwise preserve the default. Do not infer explicit-only invocation from sensitive operations or required approvals: keep the skill discoverable and require authorization immediately before the actual mutation. Preserve an existing skill's invocation policy unless the user asks to change it.
      
      For a new or substantially revised skill, consider the actual requests it should handle and which reusable resources would improve those tasks:
      
      - A repeated PDF transformation may justify a `scripts/rotate_pdf.py` helper.
      - An application-building workflow may benefit from an `assets/frontend-template/` starter.
      - A data-analysis skill may need a `references/schema.md` guide to avoid rediscovering table relationships.
      
      Create those resources only when their concrete benefit justifies them. If the user has already explained the task clearly, proceed without requesting additional examples.
      
      ### Naming
      
      - Use lowercase letters, digits, and hyphens.
      - Keep names under 64 characters and prefer short action-oriented names.
      - Namespace by tool or domain when doing so improves discovery.
      - Name the skill folder after the skill.
      
      ### Initialize a New Skill
      
      For a new skill, use the bundled initializer when it helps create the required files consistently:
      
      ```bash
      scripts/init_skill.py <skill-name> --path <output-directory> [--resources scripts,references,assets] [--examples]
      ```
      
      For example:
      
      ```bash
      scripts/init_skill.py my-skill --path "${CODEX_HOME:-$HOME/.codex}/skills"
      scripts/init_skill.py my-skill --path "${CODEX_HOME:-$HOME/.codex}/skills" --resources references
      ```
      
      Request only the resource directories the skill needs. Use `--examples` only when concrete placeholders would help, and replace or remove them before finishing. Do not initialize an existing skill again.
      
      The initializer creates the skill directory, a concise `SKILL.md` starter, and `agents/openai.yaml`. It creates resource directories and example files only when requested. Pass generated UI values as `--interface key=value` when needed.
      
      ### Write the Instructions
      
      The frontmatter `description` should briefly explain what the skill does and when it applies. Include a meaningful boundary when similar requests should not activate the skill.
      
      For example:
      
      ```yaml
      description: Create or edit Word documents when formatting, tracked changes, or comments require document-specific handling.
      ```
      
      Put detailed workflows, tool choices, examples, and operating modes in the body or relevant references rather than listing them all in the description. Preserve supported optional frontmatter, such as existing `metadata`, when appropriate.
      
      Write only the instructions needed for another Codex instance to perform the task well. State the desired outcome, non-obvious context, real constraints, and relevant references or tools. Preserve the user's explicit choices and existing authorization boundaries. Avoid prescribing a fixed structure, process, or number of steps when the task does not require one.
      
      ### Validate and Iterate
      
      Validate the completed skill with:
      
      ```bash
      scripts/quick_validate.py <path/to/skill-folder>
      ```
      
      The validator checks frontmatter, naming, and unfinished scaffold placeholders; it does not prove that the skill makes good decisions. Also check that descriptions remain discriminating, instructions preserve user intent, references are discoverable, and any added scripts actually work.
      
      When testing is warranted, verify observable behavior or meaningful invariants. Avoid tests that merely match generated wording, headings, or regex patterns.
      
      Improve the skill based on real usage or demonstrated failures. Prefer a narrow correction to accumulating universal rules for every observed example.
      
      ## Independent Forward-Testing
      
      Use an independent subagent pass when a skill is sufficiently complex or risky that realistic behavioral validation would add meaningful confidence, and when delegation is available and authorized. Ordinary creation or small edits do not automatically require subagents.
      
      Give the evaluating agent a realistic user request, the skill, and the minimum raw artifacts needed to perform the task. Do not provide the intended answer, suspected bug, proposed fix, or prior conclusions unless the evaluation genuinely requires them.
      
      For example:
      
      ```text
      Use $skill-name at /path/to/skill-name to complete this realistic request.
      ```
      
      Keep the evaluation scoped to permitted resources and side effects. Use an isolated temporary workspace for generated artifacts so they do not enter the working tree or contaminate later evaluations. Ask for approval when the proposed evaluation would require additional authorization, affect a live production system, or impose substantial time or cost. Review the actual outcome and artifacts, then make only changes supported by the observed behavior.

## Assistant

The strongest framework would separate universal PWA principles from a concrete reference stack. That avoids turning one project’s choices into dogma, while still giving engineers copyable React/Vite/Dexie/Workbox patterns. I need to lock three high-impact boundaries before shaping it.

## Activity

    $ /bin/zsh -lc "git status --short; find .agents .codex -maxdepth 4 -type f -print 2>/dev/null | sort | sed -n '1,240p'; rg -n \"offline|service worker|IndexedDB|PWA|sync\" README.md docs pwa -g '*.md' -g '*.test.ts' -g '*.test.tsx' | sed -n '1,260p'"
    status: Completed · exit 0
      pwa/src/api/stream.test.ts:13:  it('parses NDJSON split across response chunks and sends API authorization', async () => {
      pwa/src/api/stream.test.ts:28:  it('uploads a presigned file without leaking the API bearer token', async () => {
      docs/enrollment-backend-feedback.md:37:The API accepts an exact category string but does not provide a list of allowed or existing categories. The admin now uses the same three fixed programme categories as the PWA and dashboard: IDPs, Elderly 65+, and Indigents / Very Poor / Others.
      docs/HANDOFF.md:15:| `pwa/` | Field-worker mobile PWA | Production auth/profile and offline-first enrollment sync integrated |
      docs/HANDOFF.md:78:- Admin enrollment and ID-card category filters use the same fixed programme categories as the PWA: IDPs, Elderly 65+, and Indigents / Very Poor / Others.
      docs/HANDOFF.md:80:- Enrollment creation remains in the field-worker PWA. Admin enrollment details remain read-only apart from activation/deactivation because production exposes no general update or delete endpoint. See `docs/enrollment-backend-feedback.md`.
      docs/HANDOFF.md:82:### Field-worker PWA
      docs/HANDOFF.md:86:- Routes: login, home, enrollment, beneficiaries, beneficiary detail, sync and profile.
      docs/HANDOFF.md:89:- Saved sessions persist locally, are checked with `GET /auth/me` when online and may continue offline only until the JWT expires.
      docs/HANDOFF.md:92:- Enrollment drafts, selected files, local queues, reference data and cached worker statistics use IndexedDB through Dexie. Authentication remains separate in local storage.
      docs/HANDOFF.md:94:- PWA form fields, including the native Date of Birth control, are constrained to the mobile frame so they cannot widen the enrollment screen or create document-level horizontal scrolling.
      docs/HANDOFF.md:98:- A successful create keeps a durable pending sync-report marker until `POST /auth/sync` succeeds, including when only part of a batch succeeded.
      docs/HANDOFF.md:99:- Server-accepted records remain locally only while the final `POST /auth/sync` report is owed. After that report succeeds, their records and file blobs are removed from the device.
      docs/HANDOFF.md:100:- Home Pending is device-local. Today and Total combine own `/users/:id/detail` statistics with unsent device records without double-counting retained synced rows; dates use the Africa/Lagos calendar day.
      docs/HANDOFF.md:101:- People and Sync display only records created on the current device. The PWA does not use `GET /enrollments` as a server-backed beneficiary list.
      docs/HANDOFF.md:103:- The Residence step orders geography as State, LGA and Ward. Its offline LGA selector is derived from the worker's accessible active wards, and selecting an LGA filters the ward selector. A sole matching ward is selected automatically.
      docs/HANDOFF.md:105:- Next-of-kin name and relationship remain visible but optional. Emergency phone is no longer collected or submitted by the PWA, including from legacy device records.
      docs/HANDOFF.md:109:### Backend contracts for PWA sync (ready)
      docs/HANDOFF.md:111:- `POST /api/enrollments` returns a slim sync acknowledgement (`id`, `enrollmentId`, `idempotencyId`, `status`, `capturedAt`, `createdAt`, `idempotentReplay`).
      docs/HANDOFF.md:112:- `POST /api/auth/sync` sets the authenticated user’s `lastSyncedAt` to now (call after the client’s one-by-one pending loop).
      docs/HANDOFF.md:115:- No batch enrollment create; PWA syncs pending records one-by-one.
      docs/HANDOFF.md:117:## PWA configuration
      docs/HANDOFF.md:119:- `vite-plugin-pwa` generates the manifest and service worker.
      docs/HANDOFF.md:125:- The PWA reuses the admin PLASCHEMA logo, with padded 192 px, 512 px and Apple-touch PNG variants for installation.
      docs/HANDOFF.md:126:- No push notifications, service-worker background sync or authenticated API caching. Private enrollment data is stored in IndexedDB and scoped by the authenticated worker id.
      docs/HANDOFF.md:127:- PWA API responses are not cached by the service worker. Set `VITE_API_URL` in local and Netlify environments; never commit its deployed value.
      docs/HANDOFF.md:129:- Production enrollment uploads require Railway object-storage CORS to allow the deployed PWA origin, `PUT` and the requested `Content-Type`. Uploaded objects that are never attached to a completed enrollment require backend lifecycle cleanup.
      docs/HANDOFF.md:137:pnpm dev              # backend, admin and PWA
      docs/HANDOFF.md:139:pnpm dev:pwa          # PWA only, fixed at http://localhost:5174
      docs/HANDOFF.md:154:- The admin app and field-worker PWA deploy as two separate Netlify sites from this repository.
      docs/HANDOFF.md:156:- Field-worker PWA production URL: `https://plaschema-pwa.netlify.app`.
      docs/HANDOFF.md:161:- The PWA service worker is served with revalidation enabled so clients can discover new deployments.
      docs/HANDOFF.md:175:- Keep admin and PWA as separate apps in the same Git repository.
      docs/HANDOFF.md:190:- Keep `GET /wards/stream` for a separate PWA offline-sync phase; it is not used by the admin app.
      docs/HANDOFF.md:192:- Keep `GET /health-facilities/stream` for a separate PWA offline-sync phase, and use the admin detail endpoint rather than the simpler by-ID endpoint without a consumer.
      docs/HANDOFF.md:196:- Persist the PWA field-worker session in local storage without a Remember me control. Revalidate through `/auth/me` when online and permit offline access only before the JWT expires.
      docs/HANDOFF.md:197:- Keep PWA authentication separate from local enrollment state, reject admin accounts in the PWA, and never cache authenticated API responses in the service worker.
      docs/HANDOFF.md:198:- PWA enrollment sync is one-by-one via `POST /enrollments` (idempotent); after the loop call `POST /auth/sync` to persist `lastSyncedAt`.
      docs/HANDOFF.md:199:- PWA profile does not use a worker code field; use `/auth/me` or own `/users/:id/detail`.
      docs/HANDOFF.md:200:- Home/People/Sync analytics and pending/failed queues are device-local; do not list server-synced enrollments on the PWA. Today/Total can use detail `stats.enrollmentsToday` / `stats.totalEnrolled`.
      docs/HANDOFF.md:201:- Keep PWA enrollment API traffic in typed services. Components consume hooks; direct `fetch` is limited to the NDJSON and presigned-upload transport helpers.
      docs/HANDOFF.md:202:- Remove accepted local enrollment records and their file blobs after the final `/auth/sync` report succeeds; server history remains in the admin app.
      docs/HANDOFF.md:203:- Refresh offline reference streams when absent, more than 24 hours old or ward access changes; do not download both streams on every queue polling interval.
      docs/HANDOFF.md:206:- Keep admin enrollment creation in the PWA workflow; the admin app reviews, filters, prints and exports server records.
      docs/HANDOFF.md:223:- PWA lint passes.
      docs/HANDOFF.md:224:- PWA TypeScript and production build pass.
      docs/HANDOFF.md:225:- Three PWA tests pass.
      docs/HANDOFF.md:239:On 7 September 2026 after the PWA/admin overflow corrections:
      docs/HANDOFF.md:241:- Shared PWA fields and the native Date of Birth input are width-constrained, while the PWA document, app frame and enrollment fields area prevent accidental horizontal overflow.
      docs/HANDOFF.md:243:- All 36 PWA tests pass, including the new native-date width regression. PWA lint, TypeScript and production build pass.
      docs/HANDOFF.md:279:- Admin lint, TypeScript and production build pass. Local production-preview checks return HTTP 200 for the enrollment list and nested detail routes. No backend or PWA files were changed; authenticated API smoke testing was unavailable without admin credentials.
      docs/HANDOFF.md:281:On 5 September 2026 after the confirmed PWA enrollment feedback:
      docs/HANDOFF.md:283:- NIN is mandatory in both step validation and final offline payload validation. It accepts digits only and must contain exactly 10 digits; beneficiary phone remains mandatory at exactly 11 digits.
      docs/HANDOFF.md:285:- The enrollment route disables the app shell's outer scrolling and keeps one overscroll-contained fields area between the fixed-in-flow enrollment header and action bar. Other PWA routes retain normal page scrolling.
      docs/HANDOFF.md:288:- PWA lint and production build pass. All 35 PWA tests pass, including required NIN, geography selection, optional next-of-kin, facility-selection and layout regression coverage.
      docs/HANDOFF.md:310:On 2 September 2026 after the PWA offline enrollment integration:
      docs/HANDOFF.md:312:- PWA lint and TypeScript pass.
      docs/HANDOFF.md:313:- All 22 PWA tests pass, including durable draft/outbox storage, UUID v7, file blobs, NDJSON parsing, bearer isolation for presigned PUTs, partial sync batches, delayed `/auth/sync` reporting, reference freshness and Africa/Lagos Home counts.
      docs/HANDOFF.md:314:- The PWA production build passes and generates its service worker. Vite reports a non-blocking warning because the main JavaScript chunk is larger than 500 kB.
      docs/HANDOFF.md:315:- A local production-preview smoke test returned HTTP 200 for the root, a nested beneficiary route, the web manifest and the generated service worker.
      docs/HANDOFF.md:317:- Live authenticated uploads were not run in this coding session. Production still needs a real-device offline/reconnect test and confirmation of Railway object-storage CORS and abandoned-upload cleanup.
      docs/HANDOFF.md:321:- Synced records are removed after the final sync report succeeds; a failed report retains enough local state to retry without recreating the enrollment.
      docs/HANDOFF.md:322:- The Synced filter and recent-synced device UI were removed. All now means all pending and failed records on the current device.
      docs/HANDOFF.md:324:- Profile ward access handles unrestricted, single-ward and multi-ward workers, and the PWA now shares the admin logo and install artwork.
      docs/HANDOFF.md:325:- The PWA shell reserves separate space for its header, scrolling page content and bottom navigation instead of overlaying page content. Enrollment fields scroll independently between the step header and an always-visible action bar, so fields cannot pass beneath Back or Save.
      docs/HANDOFF.md:327:- PWA TypeScript, lint and production build pass; all 32 tests pass, including layout regression checks. Production-preview checks returned HTTP 200 for the root, Profile route, manifest, install icons and service worker.
      docs/HANDOFF.md:328:- The admin and PWA visible logo files are byte-for-byte identical, and generated install artwork has the required 192×192, 512×512 and 180×180 dimensions.
      docs/HANDOFF.md:333:- PWA TypeScript and production build passed.
      docs/HANDOFF.md:336:- The deployed PWA service worker returned HTTP 200 with cache revalidation enabled.
      docs/HANDOFF.md:383:On 2 September 2026 after the PWA authentication integration:
      docs/HANDOFF.md:385:- PWA login and `/me` use production contracts through a typed Axios service and React Query hooks.
      docs/HANDOFF.md:386:- Persistent field-worker-only sessions, online restoration, unexpired offline continuation, background revalidation, local expiry, cross-tab logout and real Profile/Home identity are implemented.
      docs/HANDOFF.md:388:- PWA TypeScript, lint, production build and eight Vitest tests pass.
      docs/HANDOFF.md:407:3. Complete real-device PWA browser testing.
      docs/routing-entry-pattern.md:243:File: `features/<name>/services/<name>.service.ts` + a barrel. `export async function`
      docs/routing-entry-pattern.md:260:export async function fetchRoles(state: RolesTableState): Promise<RolesListResult> {
      docs/routing-entry-pattern.md:267:export async function createRole(payload: CreateRolePayload): Promise<Role> {
      docs/pwa-enrollment-handoff.md:1:# PWA beneficiary enrollment — handoff
      docs/pwa-enrollment-handoff.md:5:This document explains how beneficiary enrollment is meant to work on the **PLASCHEMA Field Worker PWA**, with emphasis on **offline behaviour**, **sync**, and **which API endpoints to call for what**.
      docs/pwa-enrollment-handoff.md:7:It is written for engineers maintaining the live PWA enrollment integration.
      docs/pwa-enrollment-handoff.md:13:The PWA lets field workers enroll beneficiaries in the field, often with poor connectivity.
      docs/pwa-enrollment-handoff.md:15:The model is **offline-first**:
      docs/pwa-enrollment-handoff.md:18:2. Save locally with a sync status.
      docs/pwa-enrollment-handoff.md:20:4. Keep pending and failed records on the device; do **not** rely on listing synced server records in the PWA.
      docs/pwa-enrollment-handoff.md:24:│  PWA (device)   │ ──────────────► │  Backend API     │
      docs/pwa-enrollment-handoff.md:29:        │ offline: read/write local storage only
      docs/pwa-enrollment-handoff.md:31:   IndexedDB / local storage
      docs/pwa-enrollment-handoff.md:40:| Login, session restore, offline session | **Live** — `POST /auth/login`, `GET /auth/me`, local storage |
      docs/pwa-enrollment-handoff.md:43:| Saving enrollments | **Live** — durable IndexedDB draft and outbox |
      docs/pwa-enrollment-handoff.md:45:| Real sync to backend | **Live** — foreground one-by-one sync |
      docs/pwa-enrollment-handoff.md:46:| Backend create/sync APIs | **Ready** — see endpoint table below |
      docs/pwa-enrollment-handoff.md:47:| Ward/facility pickers offline cache | **Live** — NDJSON streams cached in IndexedDB |
      docs/pwa-enrollment-handoff.md:51:## 3. Enrollment screens (PWA routes)
      docs/pwa-enrollment-handoff.md:60:| `/sync` | Pending/failed queue, Sync now, Retry, Review |
      docs/pwa-enrollment-handoff.md:85:| **Synced** | Successfully accepted but final sync reporting is still finishing | Hidden, then removed after `/auth/sync` succeeds |
      docs/pwa-enrollment-handoff.md:87:**Failed sync handling (client-side, no special API):**
      docs/pwa-enrollment-handoff.md:90:- Store `syncError` (message from API `error.message`, optionally `error.code`).
      docs/pwa-enrollment-handoff.md:101:| `401` / expired JWT | Stop sync, prompt re-login |
      docs/pwa-enrollment-handoff.md:107:When the device is **online** at save time, you can sync immediately or still save locally first — product prefers **always save locally**, then sync.
      docs/pwa-enrollment-handoff.md:116:- Set status = `Pending` (even if online — sync step confirms server acceptance).
      docs/pwa-enrollment-handoff.md:118:### Step B — Upload files (when syncing)
      docs/pwa-enrollment-handoff.md:151:- Store `enrollmentId` temporarily and mark **Synced** while the final sync report is owed.
      docs/pwa-enrollment-handoff.md:153:### Step D — Report sync complete
      docs/pwa-enrollment-handoff.md:157:`POST /api/auth/sync` → updates the user’s `lastSyncedAt` on the server.
      docs/pwa-enrollment-handoff.md:159:After this succeeds, delete all successfully synced local records and their file blobs. If it fails, keep the records and retry only `/auth/sync`; do not upload or create those enrollments again.
      docs/pwa-enrollment-handoff.md:165:When the device is **offline** at save time:
      docs/pwa-enrollment-handoff.md:168:2. App saves the draft **only on device** in IndexedDB.
      docs/pwa-enrollment-handoff.md:177:3. On full run completion: `POST /api/auth/sync`.
      docs/pwa-enrollment-handoff.md:179:**Important:** offline save does **not** call the API. The server only sees the record after a successful create.
      docs/pwa-enrollment-handoff.md:185:### On the device (source of truth for the PWA UI)
      docs/pwa-enrollment-handoff.md:190:- Session token + cached user profile (for offline app access).
      docs/pwa-enrollment-handoff.md:192:### On the server (source of truth after sync)
      docs/pwa-enrollment-handoff.md:198:### Do **not** fetch synced beneficiary lists for the PWA
      docs/pwa-enrollment-handoff.md:200:The PWA does **not** mirror the admin beneficiary table. After the final sync report, synced rows are deleted locally. Server-backed history belongs in admin, not the field app.
      docs/pwa-enrollment-handoff.md:209:| **Today** | **Synced today (server)** + **captured today (device, not yet synced)** |
      docs/pwa-enrollment-handoff.md:210:| **Total** | **All-time synced (server)** + **unsent records on this device** |
      docs/pwa-enrollment-handoff.md:212:Server side for synced portions:
      docs/pwa-enrollment-handoff.md:216:- `totalEnrolled` — all-time synced count for this worker
      docs/pwa-enrollment-handoff.md:217:- `enrollmentsToday` — synced today (Africa/Lagos calendar day)
      docs/pwa-enrollment-handoff.md:236:| `POST /auth/sync` | Field worker | After sync loop; sets `lastSyncedAt` |
      docs/pwa-enrollment-handoff.md:246:| `GET /wards/stream` | NDJSON bulk download for **offline ward cache** |
      docs/pwa-enrollment-handoff.md:248:| `GET /health-facilities/stream` | NDJSON bulk download for **offline facility cache** |
      docs/pwa-enrollment-handoff.md:252:### Enrollment sync
      docs/pwa-enrollment-handoff.md:258:| `GET /enrollments` | **Not for PWA lists** — admin / display-only tabs |
      docs/pwa-enrollment-handoff.md:259:| `GET /enrollments/:id` | **Not needed for sync** — full detail + file URLs |
      docs/pwa-enrollment-handoff.md:294:## 11. Accessing the PWA offline (after online login)
      docs/pwa-enrollment-handoff.md:296:The PWA is installable and works offline **only after at least one successful online login**.
      docs/pwa-enrollment-handoff.md:298:### What “offline access” means here
      docs/pwa-enrollment-handoff.md:300:| Works offline | Does not work offline |
      docs/pwa-enrollment-handoff.md:320:   - If `/auth/me` fails transiently: user can choose **Continue offline** with saved profile.
      docs/pwa-enrollment-handoff.md:332:Online:  Install PWA → Login → (optional) cache wards/facilities streams
      docs/pwa-enrollment-handoff.md:334:Online:  Open Sync → upload each pending record → POST /auth/sync
      docs/pwa-enrollment-handoff.md:348:  syncStatus: 'Pending' | 'Failed' | 'Syncing'
      docs/pwa-enrollment-handoff.md:349:  syncError?: string
      docs/pwa-enrollment-handoff.md:359:Use **IndexedDB** for blobs + drafts; keep auth session in **localStorage** (already done).
      docs/pwa-enrollment-handoff.md:365:1. Durable IndexedDB drafts, files and outbox — **complete**.
      docs/pwa-enrollment-handoff.md:366:2. Always save locally before sync — **complete**.
      docs/pwa-enrollment-handoff.md:371:7. Durable final `/auth/sync` reporting — **complete**.
      docs/pwa-enrollment-handoff.md:372:8. Remove synced device rows after final reporting — **complete**.
      docs/pwa-enrollment-handoff.md:382:| PWA auth store | `pwa/src/features/auth/stores/auth.store.ts` |
      docs/pwa-enrollment-handoff.md:384:| Offline sync | `pwa/src/features/enrollment/services/sync.service.ts` |
      docs/pwa-enrollment-handoff.md:385:| PWA service worker config | `pwa/vite.config.ts` |
      docs/pwa-enrollment-handoff.md:389:## 15. Quick reference — sync loop pseudocode
      docs/pwa-enrollment-handoff.md:401:    set status = Failed, syncError = error.message
      docs/pwa-enrollment-handoff.md:403:if any record synced successfully:
      docs/pwa-enrollment-handoff.md:404:  POST /auth/sync
      docs/pwa-enrollment-handoff.md:405:  delete successfully synced device records and blobs
      docs/pwa-enrollment-handoff.md:409:This is the intended production behaviour. The UI designs already match this model; backend contracts are ready on branch `feat/pwa-enrollment-sync-api`.
      docs/feature-folder-structure.md:31:export async function fetchVerifications(state: VerificationTableState) {
      pwa/src/features/enrollment/services/sync.service.test.ts:3:import { offlineDb } from '@/lib/offline-db'
      pwa/src/features/enrollment/services/sync.service.test.ts:6:import { createEnrollmentDraft, queueEnrollment, saveEnrollmentFile } from './offline-enrollment.service'
      pwa/src/features/enrollment/services/sync.service.test.ts:19:import { syncPendingEnrollments, syncReferenceDataIfNeeded } from './sync.service'
      pwa/src/features/enrollment/services/sync.service.test.ts:23:async function queueCompleteEnrollment(firstName: string) {
      pwa/src/features/enrollment/services/sync.service.test.ts:41:describe('enrollment synchronization', () => {
      pwa/src/features/enrollment/services/sync.service.test.ts:42:  beforeEach(async () => {
      pwa/src/features/enrollment/services/sync.service.test.ts:44:    await offlineDb.delete()
      pwa/src/features/enrollment/services/sync.service.test.ts:45:    await offlineDb.open()
      pwa/src/features/enrollment/services/sync.service.test.ts:46:    mocks.presignEnrollmentUpload.mockImplementation(async ({ purpose }: { purpose: string }) => ({ objectKey: `${purpose}-key`, uploadUrl: `https://storage/${purpose}`, contentType: purpose === 'passport' ? 'image/jpeg' : 'application/pdf', purpose, filename: 'file', expiresInSeconds: 300, method: 'PUT' }))
      pwa/src/features/enrollment/services/sync.service.test.ts:50:  afterAll(() => offlineDb.close())
      pwa/src/features/enrollment/services/sync.service.test.ts:52:  it('reports a completed sync even when a later record in the batch fails', async () => {
      pwa/src/features/enrollment/services/sync.service.test.ts:57:    await syncPendingEnrollments(owner)
      pwa/src/features/enrollment/services/sync.service.test.ts:60:    expect(await offlineDb.enrollments.where('ownerUserId').equals(owner).count()).toBe(1)
      pwa/src/features/enrollment/services/sync.service.test.ts:61:    expect((await offlineDb.enrollments.where('ownerUserId').equals(owner).first())?.form.firstName).toBe('Second')
      pwa/src/features/enrollment/services/sync.service.test.ts:64:  it('retries an owed sync report without creating the enrollment again', async () => {
      pwa/src/features/enrollment/services/sync.service.test.ts:69:    await expect(syncPendingEnrollments(owner)).rejects.toThrow('Temporary report failure')
      pwa/src/features/enrollment/services/sync.service.test.ts:70:    expect((await offlineDb.syncState.get(owner))?.needsReport).toBe(true)
      pwa/src/features/enrollment/services/sync.service.test.ts:71:    expect(await offlineDb.enrollments.where('ownerUserId').equals(owner).count()).toBe(1)
      pwa/src/features/enrollment/services/sync.service.test.ts:72:    expect(await offlineDb.files.where('ownerUserId').equals(owner).count()).toBe(2)
      pwa/src/features/enrollment/services/sync.service.test.ts:73:    await syncPendingEnrollments(owner)
      pwa/src/features/enrollment/services/sync.service.test.ts:77:    expect((await offlineDb.syncState.get(owner))?.needsReport).toBe(false)
      pwa/src/features/enrollment/services/sync.service.test.ts:78:    expect(await offlineDb.enrollments.where('ownerUserId').equals(owner).count()).toBe(0)
      pwa/src/features/enrollment/services/sync.service.test.ts:79:    expect(await offlineDb.files.where('ownerUserId').equals(owner).count()).toBe(0)
      pwa/src/features/enrollment/services/sync.service.test.ts:82:  it('removes a legacy synced record when no final report is owed', async () => {
      pwa/src/features/enrollment/services/sync.service.test.ts:84:    await offlineDb.enrollments.update(record.localId, { syncStatus: 'synced' })
      pwa/src/features/enrollment/services/sync.service.test.ts:85:    await syncPendingEnrollments(owner)
      pwa/src/features/enrollment/services/sync.service.test.ts:86:    expect(await offlineDb.enrollments.get(record.localId)).toBeUndefined()
      pwa/src/features/enrollment/services/sync.service.test.ts:90:  it('refreshes references only when missing, stale, or ward access changes', async () => {
      pwa/src/features/enrollment/services/sync.service.test.ts:94:    await expect(syncReferenceDataIfNeeded(owner, ['ward'], now)).resolves.toBe(true)
      pwa/src/features/enrollment/services/sync.service.test.ts:95:    await expect(syncReferenceDataIfNeeded(owner, ['ward'], now + 60_000)).resolves.toBe(false)
      pwa/src/features/enrollment/services/sync.service.test.ts:96:    await expect(syncReferenceDataIfNeeded(owner, ['other-ward'], now + 120_000)).resolves.toBe(true)
      pwa/src/features/enrollment/services/sync.service.test.ts:97:    await expect(syncReferenceDataIfNeeded(owner, ['other-ward'], now + 25 * 60 * 60_000)).resolves.toBe(true)
      pwa/src/features/auth/components/login-view.test.tsx:21:  it('requires both fields', async () => {
      pwa/src/features/auth/stores/auth.store.test.ts:3:import { PWA_SESSION_STORAGE_KEY, useAuthStore } from './auth.store'
      pwa/src/features/auth/stores/auth.store.test.ts:19:describe('PWA auth store', () => {
      pwa/src/features/auth/stores/auth.store.test.ts:28:    expect(localStorage.getItem(PWA_SESSION_STORAGE_KEY)).toContain('amina@example.com')
      pwa/src/features/auth/stores/auth.store.test.ts:31:  it('allows an unexpired saved session to continue offline', () => {
      pwa/src/features/auth/stores/auth.store.test.ts:34:    expect(useAuthStore.getState().validation).toBe('offline')
      pwa/src/features/auth/stores/auth.store.test.ts:38:  it('clears an expired session instead of continuing offline', () => {
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:4:import { offlineDb } from '@/lib/offline-db'
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:16:} from './offline-enrollment.service'
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:32:describe('offline enrollment storage', () => {
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:33:  beforeEach(async () => {
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:34:    await offlineDb.delete()
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:35:    await offlineDb.open()
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:37:  afterAll(() => offlineDb.close())
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:39:  it('creates one durable draft with a UUID v7 idempotency key', async () => {
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:42:    expect((await offlineDb.drafts.get(owner))?.form.stateOfResidence).toBe('PLATEAU')
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:45:  it('stores a selected file as a Blob scoped to the worker and draft', async () => {
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:50:    expect((await offlineDb.files.get(stored.id))?.ownerUserId).toBe(owner)
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:53:  it('atomically moves a completed draft into the outbox', async () => {
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:58:    expect(queued.syncStatus).toBe('pending')
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:59:    expect(await offlineDb.drafts.get(owner)).toBeUndefined()
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:60:    expect((await offlineDb.enrollments.get(queued.localId))?.wardName).toBe('Tudun Wada')
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:63:  it('filters downloaded reference data to assigned wards', async () => {
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:72:    expect((await offlineDb.wards.where('ownerUserId').equals(owner).toArray()).map((ward) => ward.name)).toEqual(['Allowed'])
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:73:    expect(await offlineDb.facilities.where('ownerUserId').equals(owner).count()).toBe(1)
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:76:  it('removes synchronized records from the device', async () => {
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:80:    await offlineDb.enrollments.update(queued.localId, { syncStatus: 'synced' })
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:82:    expect(await offlineDb.enrollments.get(queued.localId)).toBeUndefined()
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:85:  it('restores a failed outbox record as the active editable draft', async () => {
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:90:    await offlineDb.enrollments.update(queued.localId, { syncStatus: 'failed', errorMessage: 'Invalid phone' })
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:94:    const restored = await offlineDb.drafts.get(owner)
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:97:    expect(await offlineDb.enrollments.get(queued.localId)).toBeUndefined()
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:100:  it('does not overwrite an unfinished draft when editing a failed record', async () => {
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:104:    await offlineDb.enrollments.update(queued.localId, { syncStatus: 'failed' })
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:110:    expect((await offlineDb.drafts.get(owner))?.form.firstName).toBe('New draft')
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:111:    expect(await offlineDb.enrollments.get(queued.localId)).toBeDefined()
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:118:      syncStatus: 'pending', uploadStage: 'queued', passportObjectKey: 'passport-key', idDocumentObjectKey: 'id-key', attemptCount: 0,
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:135:      syncStatus: 'pending', uploadStage: 'queued', passportObjectKey: 'passport-key', idDocumentObjectKey: 'id-key', attemptCount: 0,
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:147:      syncStatus: 'pending' as const, uploadStage: 'queued' as const,
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:201:  it('combines server statistics with unsent device records without counting synced rows twice', async () => {
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:205:    const syncedDraft = await createEnrollmentDraft(owner)
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:206:    syncedDraft.form = { ...completeForm(), firstName: 'Already' }
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:207:    const synced = await queueEnrollment(syncedDraft, 'Ward', 'Facility')
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:208:    await offlineDb.enrollments.update(synced.localId, { syncStatus: 'synced' })
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:209:    const records = (await offlineDb.enrollments.bulkGet([pending.localId, synced.localId])).filter((record) => record !== undefined)
      pwa/src/features/enrollment/services/offline-enrollment.service.test.ts:220:      form: completeForm(), wardName: 'Ward', facilityName: 'Facility', syncStatus: 'pending' as const,

## Assistant

That packaging request is clear: one committed source of truth should serve humans, this repository’s agents, and your global Codex setup. Because “any agent” does not share a universal skill format, the robust approach is a Codex-compatible skill plus an agent-neutral adaptation page that explains the workflow, inputs, invariants, and expected outputs without depending on Codex metadata. Installing the global copy will require your approval when implementation begins because it writes outside this repository.

## Activity

    $ /bin/zsh -lc "ls -la; ls -la .agents .codex 2>/dev/null || true; sed -n '1,220p' README.md 2>/dev/null || true; sed -n '280,430p' docs/pwa-enrollment-handoff.md"
    status: Completed · exit 0
      total 1280
      drwxr-xr-x  15 admin  staff     480 Sep  7 13:50 .
      drwxr-xr-x  48 admin  staff    1536 Aug 25 21:01 ..
      drwxr-xr-x  17 admin  staff     544 Sep 10 13:03 .git
      -rw-r--r--   1 admin  staff     141 Aug 31 12:54 .gitignore
      -rw-r--r--   1 admin  staff     544 Aug 28 21:46 AGENTS.md
      -rw-r--r--   1 admin  staff    1346 Aug 28 15:08 README.md
      drwxr-xr-x  24 admin  staff     768 Sep  7 16:38 backend
      drwxr-xr-x   9 admin  staff     288 Sep  7 17:15 docs
      drwxr-xr-x  20 admin  staff     640 Sep  7 13:50 frontend
      -rw-r--r--   1 admin  staff     739 Sep  1 19:32 nixpacks.toml
      drwxr-xr-x   5 admin  staff     160 Aug 25 21:30 node_modules
      -rw-r--r--   1 admin  staff    1589 Aug 28 20:52 package.json
      -rw-r--r--   1 admin  staff  629741 Sep  7 13:50 pnpm-lock.yaml
      -rw-r--r--   1 admin  staff     229 Sep  1 19:32 pnpm-workspace.yaml
      drwxr-xr-x  16 admin  staff     512 Sep  3 21:43 pwa
      # Plaschema
      
      pnpm monorepo containing the frontend and backend applications.
      
      ## Requirements
      
      - Node.js 20.19+, 22.12+, or 24+
      - pnpm 10
      - Docker (optional, for local Postgres/Redis used by the backend)
      
      ## Getting started
      
      ```bash
      pnpm install
      cp frontend/.env.example frontend/.env
      cp backend/.env.example backend/.env
      ```
      
      ### Full local stack (recommended)
      
      Starts Postgres + Redis, then runs frontend and backend in watch mode:
      
      ```bash
      pnpm dev
      # alias:
      pnpm dev:all
      ```
      
      - Frontend: `http://localhost:5173`
      - API: `http://localhost:3000/api`
      - Login: `POST http://localhost:3000/api/auth/login`
      - Liveness: `http://localhost:3000/health/live`
      - Readiness: `http://localhost:3000/health/ready`
      - Swagger: `http://localhost:3000/api/docs`
      
      Seeded admin (see `backend/.env.example`): `admin@cbhi.local` / `ChangeMe123!`
      
      ### Individual apps
      x
      ```bash
      pnpm dev:frontend          # Vite only
      pnpm dev:backend           # Docker infra + Nest watch
      pnpm infra:up              # Postgres + Redis only
      pnpm infra:down            # stop infra
      ```
      
      ### Common scripts
      
      ```bash
      pnpm build
      pnpm lint
      pnpm test:backend
      pnpm typecheck:backend
      ```
      
      See [`docs/feature-folder-structure.md`](docs/feature-folder-structure.md) before adding frontend product features.
      See [`backend/README.md`](backend/README.md) for Clean Architecture backend conventions.
      | Field | Notes |
      | --- | --- |
      | `idempotencyId` | UUID v7, generated once per draft |
      | `capturedAt` | Optional ISO datetime from device |
      | `category` | Beneficiary category label |
      | `passportObjectKey`, `idDocumentObjectKey` | From presign upload |
      | `title`, `gender`, `firstName`, `lastName`, `dateOfBirth`, … | Personal details |
      | `wardId`, `healthFacilityId` | UUIDs from cached reference data |
      | `phone`, `maritalStatus`, `idType`, next-of-kin fields, address | As per form |
      
      Duplicate detection: same first name + last name + date of birth → `409 DUPLICATE_ENROLLMENT`.
      
      ---
      
      ## 11. Accessing the PWA offline (after online login)
      
      The PWA is installable and works offline **only after at least one successful online login**.
      
      ### What “offline access” means here
      
      | Works offline | Does not work offline |
      | --- | --- |
      | Open installed app / cached shell | Login (first time or after expiry) |
      | Navigate between app screens | Upload files or create enrollments on server |
      | View saved session profile | `GET /auth/me` validation |
      | Enroll using local drafts (once storage is built) | Download ward/facility streams |
      | Continue with unexpired JWT | Sync until back online |
      
      ### How it works technically
      
      1. **Service worker** (`vite-plugin-pwa`) precaches static assets (HTML, JS, CSS, icons).
         - SPA routes fall back to `index.html`.
         - API responses are **not** cached.
      
      2. **Session in local storage** (`plaschema-field-worker-session`):
         - Stores `accessToken`, `expiresAt` (from JWT), and `user` snapshot.
         - On app open: restore session if token not expired.
      
      3. **Online restore** (`GET /auth/me`):
         - When online, verify session and refresh user.
         - If `/auth/me` fails transiently: user can choose **Continue offline** with saved profile.
      
      4. **Expiry**:
         - When JWT expires, session is cleared — user must log in online again.
      
      5. **Install on phone**:
         - Browser menu → “Add to Home Screen” / “Install app”.
         - Opens in standalone mode like a native app.
      
      ### Recommended first-time worker flow
      
      ```text
      Online:  Install PWA → Login → (optional) cache wards/facilities streams
      Offline: Open app → Enroll beneficiaries → save locally as Pending
      Online:  Open Sync → upload each pending record → POST /auth/sync
      ```
      
      ---
      
      ## 12. Local storage shape
      
      Each pending enrollment record on device:
      
      ```typescript
      {
        id: string                    // local id
        idempotencyId: string         // UUID v7, sent to API
        capturedAt: string            // ISO
        syncStatus: 'Pending' | 'Failed' | 'Syncing'
        syncError?: string
        enrollmentId?: string         // set after successful create
        passportBlob: Blob
        idDocumentBlob: Blob
        // ... all form fields
        wardId: string
        healthFacilityId: string
      }
      ```
      
      Use **IndexedDB** for blobs + drafts; keep auth session in **localStorage** (already done).
      
      ---
      
      ## 13. Implementation checklist
      
      1. Durable IndexedDB drafts, files and outbox — **complete**.
      2. Always save locally before sync — **complete**.
      3. Offline ward/facility stream cache — **complete**.
      4. Presign → PUT → one-by-one create — **complete**.
      5. Durable errors, Review, Edit and Retry with the same idempotency key — **complete**.
      6. Server and local Home statistics — **complete**.
      7. Durable final `/auth/sync` reporting — **complete**.
      8. Remove synced device rows after final reporting — **complete**.
      
      ---
      
      ## 14. Related docs and code
      
      | Resource | Location |
      | --- | --- |
      | Project handoff (high level) | `docs/HANDOFF.md` |
      | Backend endpoint list | `backend/README.md` |
      | PWA auth store | `pwa/src/features/auth/stores/auth.store.ts` |
      | Enrollment wizard | `pwa/src/features/enrollment/components/enrollment-view.tsx` |
      | Offline sync | `pwa/src/features/enrollment/services/sync.service.ts` |
      | PWA service worker config | `pwa/vite.config.ts` |
      
      ---
      
      ## 15. Quick reference — sync loop pseudocode
      
      ```text
      for each local record where status in (Pending, Failed):
        set status = Syncing
        try:
          passportKey = presign + PUT passport blob
          idKey = presign + PUT id blob
          response = POST /enrollments { ...draft, passportObjectKey, idDocumentObjectKey, idempotencyId, capturedAt }
          save response.enrollmentId on draft
          set status = Synced while final reporting is owed
        catch error:
          set status = Failed, syncError = error.message
      
      if any record synced successfully:
        POST /auth/sync
        delete successfully synced device records and blobs
        refresh GET /users/:id/detail for home stats
      ```
      
      This is the intended production behaviour. The UI designs already match this model; backend contracts are ready on branch `feat/pwa-enrollment-sync-api`.

## Assistant

I’ll combine the two guide styles as a layered handbook: each chapter opens with an operational “what to decide / what to build / how to verify” section, followed by the deeper explanation and tradeoffs. The skill will stay concise and action-oriented, with focused reference checklists rather than duplicating the entire textbook.

## Activity

    $ /bin/zsh -lc "find /Users/admin/.codex/skills/.system/skill-creator -maxdepth 3 -type f -print | sort; sed -n '1,260p' /Users/admin/.codex/skills/.system/skill-creator/references/openai_yaml.md"
    status: Completed · exit 0
      /Users/admin/.codex/skills/.system/skill-creator/SKILL.md
      /Users/admin/.codex/skills/.system/skill-creator/agents/openai.yaml
      /Users/admin/.codex/skills/.system/skill-creator/assets/skill-creator-small.svg
      /Users/admin/.codex/skills/.system/skill-creator/assets/skill-creator.png
      /Users/admin/.codex/skills/.system/skill-creator/license.txt
      /Users/admin/.codex/skills/.system/skill-creator/references/openai_yaml.md
      /Users/admin/.codex/skills/.system/skill-creator/scripts/generate_openai_yaml.py
      /Users/admin/.codex/skills/.system/skill-creator/scripts/init_skill.py
      /Users/admin/.codex/skills/.system/skill-creator/scripts/quick_validate.py
      # openai.yaml fields (full example + descriptions)
      
      `agents/openai.yaml` is an extended, product-specific config intended for the machine/harness to read, not the agent. Other product-specific config can also live in the `agents/` folder.
      
      ## Full example
      
      ```yaml
      interface:
        display_name: "Optional user-facing name"
        short_description: "Optional user-facing description"
        icon_small: "./assets/small-400px.png"
        icon_large: "./assets/large-logo.svg"
        brand_color: "#3B82F6"
        default_prompt: "Optional surrounding prompt to use the skill with"
      
      dependencies:
        tools:
          - type: "mcp"
            value: "github"
            description: "GitHub MCP server"
            transport: "streamable_http"
            url: "https://api.githubcopilot.com/mcp/"
      
      policy:
        allow_implicit_invocation: true
      ```
      
      ## Field descriptions and constraints
      
      Top-level constraints:
      
      - Quote all string values.
      - Keep keys unquoted.
      - For `interface.default_prompt`: generate a helpful, short (typically 1 sentence) example starting prompt based on the skill. It must explicitly mention the skill as `$skill-name` (e.g., "Use $skill-name-here to draft a concise weekly status update.").
      
      - `interface.display_name`: Human-facing title shown in UI skill lists and chips.
      - `interface.short_description`: Human-facing short UI blurb (25–64 chars) for quick scanning.
      - `interface.icon_small`: Path to a small icon asset (relative to skill dir). Default to `./assets/` and place icons in the skill's `assets/` folder.
      - `interface.icon_large`: Path to a larger logo asset (relative to skill dir). Default to `./assets/` and place icons in the skill's `assets/` folder.
      - `interface.brand_color`: Hex color used for UI accents (e.g., badges).
      - `interface.default_prompt`: Default prompt snippet inserted when invoking the skill.
      - `dependencies.tools[].type`: Dependency category. Only `mcp` is supported for now.
      - `dependencies.tools[].value`: Identifier of the tool or dependency.
      - `dependencies.tools[].description`: Human-readable explanation of the dependency.
      - `dependencies.tools[].transport`: Connection type when `type` is `mcp`.
      - `dependencies.tools[].url`: MCP server URL when `type` is `mcp`.
      - `policy.allow_implicit_invocation`: When false, the skill is not injected into
        the model context by default, but can still be invoked explicitly via `$skill`.
        Defaults to true.

## Assistant

I like that direction. A self-contained knowledge package with HTML can be much more teachable than a Markdown-only manual: richer diagrams, progressive navigation, callouts, and interactive state-machine examples. I’ll inspect Matt Pocock’s actual “teach” skill before recommending the exact structure, so we borrow the useful packaging pattern rather than just its appearance.

## Activity

    web search: Matt Pocock teach skill HTML GitHub AI agent skill

## Activity

    web search: https://github.com/mattpocock/skills/tree/main/skills/productivity/teach

## Assistant

Yes—with one important distinction. Matt Pocock’s `teach` skill keeps the agent instructions in `SKILL.md`, while the learning material is a stateful workspace of short HTML lessons, printable HTML references, shared assets, and learning records. That separation is the part worth adopting: Markdown for agent behavior; HTML for rich teaching. [Matt Pocock’s teach skill](https://github.com/mattpocock/skills/blob/main/skills/productivity/teach/SKILL.md)

For this project, I’d make a standalone PWA engineering knowledge package, not bury it among ordinary handoff notes. It can be visually rich, navigable, printable, and usable without a build step, while the skill remains installable by Codex and adaptable to other agents.

## Activity

    $ /bin/zsh -lc "sed -n '1,220p' AGENTS.md; git log -5 --oneline -- docs pwa | sed -n '1,120p'"
    status: Completed · exit 0
      b699cc3 Merge branch 'main' into fix/app-overflow-layout
      1865705 fix(apps): correct page overflow behavior
      84a49ac feat(frontend): use filtered list totals
      13f1856 Merge pull request #28 from Shoetan/feat/admin-ui-polish
      af18177 feat(frontend): polish admin interface

## Plan

# Production PWA Engineering Playbook and Agent Skill

## Summary

Create a self-contained `pwa-engineering-playbook/` package that turns PLASCHEMA’s PWA experience into a reusable production framework for engineering teams and AI agents.

The package will combine:

- A rich, responsive HTML handbook with short lessons, deeper explanations, diagrams, recipes, and checklists.
- A lightweight installable PWA that demonstrates offline app-shell caching and an explicit update flow.
- An explicit-only `$pwa-engineering` Codex skill supporting learning, planning, implementation, and auditing.
- An agent-neutral guide for adapting the framework to other coding agents.
- A candid PLASCHEMA case study distinguishing proven patterns, intentional limitations, stale documentation, and possible hardening work.

The pedagogical structure will adapt the useful parts of [Matt Pocock’s teach skill](https://github.com/mattpocock/skills/tree/main/skills/productivity/teach): self-contained HTML lessons, shared visual assets, trusted sources, and compact reference material.

## Package and Experience

- Build a no-framework static site under `pwa-engineering-playbook/` with `index.html`, grouped `lessons/`, `reference/`, `assets/`, and `skill/` content.
- Use semantic HTML, shared CSS, small progressive-enhancement JavaScript, accessible inline SVG diagrams, syntax-highlighted recipes, responsive layouts, print styles, keyboard navigation, reduced-motion support, and graceful reading without JavaScript.
- Make the index a learning and reference hub with four paths: understand PWAs, design one, build one, and audit one.
- Keep dependencies local and avoid CDNs or a build step so the package remains portable and readable from any simple static server.
- Reuse approved PLASCHEMA install artwork where appropriate; do not introduce new branding dependencies.
- Include per-page source links and a visible “last verified” date. Time-sensitive platform claims must cite current primary sources such as browser vendors, standards, library documentation, and OWASP.

## Curriculum and Reference Framework

- Start with the correct mental model: installation, service-worker control, offline capability, and standalone display are separate concerns. Explain why a previously visited site can work offline without being installed and why first-time offline access cannot.
- Define three PWA capability levels:
  1. App-shell-only.
  2. Offline-readable cached data.
  3. Transactional offline-write with durable synchronization.
- Document a reference architecture covering UI state, server state, durable local state, transport, feature services, sync orchestration, and component boundaries.
- Cover service-worker scope, precaching, navigation fallback, cache selection, authenticated-response exclusions, activation, update prompting, recovery, rollback, and cache cleanup.
- Cover IndexedDB schema design, owner scoping, transactions, migrations, blobs, quotas, persistent-storage requests, eviction, retention, cleanup, and data-version compatibility.
- Define offline-read strategies for reference data, freshness metadata, access-scope changes, streaming large datasets, stale-data UX, and cache replacement.
- Define offline-write strategies through a durable outbox state machine: draft → pending → uploading → submitting → accepted/report-owed → removed, plus failed and abandoned-lease recovery paths.
- Explain stable idempotency keys, ordered processing, bounded retry with backoff, leases, partial success, conflict handling, server acknowledgments, and why connectivity indicators are hints rather than proof of reachability.
- Cover file capture and upload using local blobs, size/capacity checks, presigned uploads, bearer-token isolation, resumability choices, orphan cleanup, and retry safety.
- Include offline authentication and security threat modelling: shared devices, token expiry, XSS exposure, authorization changes, logout/wipe policy, sensitive IndexedDB data, encryption limitations and key management, privacy, retention, and server-side enforcement.
- Cover install UX, network and sync status, manual retry/review/edit/discard flows, accessibility, iOS/Android differences, normal-tab behavior, desktop behavior, and failure messaging.
- Cover backend contracts and invariants without implementing backend code: idempotent mutations, versioned payloads, conflict semantics, sync acknowledgments, stream endpoints, presigned uploads, CORS, lifecycle cleanup, and compatibility windows.
- Add production sections for observability, deployment headers, service-worker delivery, release/version discipline, schema migrations, rollback, and incident recovery.
- Provide focused TypeScript/React/Vite/Workbox/Dexie/TanStack Query recipes without creating a separate runnable application scaffold.
- Add compact references for architecture decisions, cache-policy selection, sync-state transitions, security review, launch readiness, troubleshooting, and real-device testing.

## Lightweight Playbook PWA

- Add a manifest, scoped service worker, offline fallback, install metadata, and local assets so the handbook itself remains readable offline after its first successful load.
- Precache only the handbook shell and authored content; do not add runtime API caching or background synchronization.
- Implement an accessible “new playbook version available” prompt using the waiting-service-worker lifecycle, explicit activation, `controllerchange`, and safe reload behavior.
- Version caches deliberately, delete obsolete caches on activation, and document the release step that changes the service-worker version.
- Keep the content usable as plain static HTML even when service workers are unsupported or the files are opened without installation.

## Agent Skill and Portability

- Create the canonical explicit-only skill as `pwa-engineering-playbook/skill/pwa-engineering/` with `SKILL.md`, `agents/openai.yaml`, and focused references.
- Expose `$pwa-engineering` with four modes:
  - **Learn:** select and explain relevant lessons and exercises.
  - **Plan:** inspect the target repository, classify the capability level, and produce a decision-complete architecture.
  - **Build:** implement only the authorized scope using the chosen storage, service-worker, and synchronization policies.
  - **Audit:** produce an evidence-backed gap assessment with severity, risk, and prioritized remediation.
- Require the skill to establish data ownership, offline duration and volume, sensitivity, conflict policy, platform baseline, backend contracts, update policy, and acceptance tests before recommending architecture.
- Keep automatic invocation disabled in the global metadata, as requested.
- Add an agent-neutral adaptation guide describing inputs, invariants, workflows, expected outputs, and how to translate the package into agents that do not support Codex skill metadata.
- Update root `AGENTS.md` so PWA planning, implementation, and review work is routed to the playbook’s agent guide.
- After repository validation, install a standalone copy into the user’s global Codex skills directory with explicit filesystem approval, and document how to refresh that copy from the committed canonical version.

## PLASCHEMA Reconciliation

- Add a case study based on the actual `pwa/` implementation: generated app shell, update prompt, normal-tab offline operation, owner-scoped Dexie database, local-first drafts, UUID v7 idempotency, leases, retries, reference streams, presigned uploads, final sync reporting, cached statistics, and offline session continuation.
- Clearly label current intentional choices such as foreground-only synchronization, no authenticated API caching, no push notifications, and device-local unsent-record views.
- Record evidence-based hardening opportunities separately so the playbook does not imply they are already implemented.
- Correct `docs/pwa-enrollment-handoff.md` where it implies installation is required for offline use; state that prior service-worker control and cached resources are required, while installation is optional.
- Cross-link the existing PWA handoff to the new playbook and update `docs/HANDOFF.md` with the new knowledge package, skill command, architecture documentation, and verification results.
- Do not modify `backend/` or the production `pwa/` runtime as part of this documentation-and-skill work.

## Verification and Acceptance Tests

- Validate every internal link, navigation path, source citation, code-reference path, and referenced project fact.
- Test the HTML at phone, tablet, and desktop widths; verify keyboard use, visible focus, contrast, reduced motion, screen-reader labels for diagrams, printing, and readable no-JavaScript behavior.
- Serve the package locally and verify first load, service-worker registration, offline reload from the index and nested lessons, cache cleanup, update detection, activation, and reload.
- Verify ordinary browser-tab offline behavior independently from installed standalone behavior.
- Run production checks in current Chromium and WebKit-compatible environments where available; document Android and iOS real-device checks that remain manual.
- Validate the skill with the skill-creator validator and exercise representative Learn, Plan, Build, and Audit prompts.
- Confirm the skill does not mutate during audits, does not assume backend authorization, re-verifies unstable browser facts, and preserves repository-specific instructions.
- Confirm the global installed copy matches the committed canonical skill.
- Run the existing PWA test, lint, and production-build commands to prove the documentation package did not regress the application.

## Assumptions and Defaults

- The audience is engineering teams, with enough explanation for less experienced developers and enough operational detail for implementation.
- Modern Android Chrome, iOS Safari, evergreen desktop browsers, installed mode, and ordinary browser-tab mode are first-class.
- The handbook is both operational and educational: concise decision/checklist sections precede deeper explanations.
- The default architecture is platform-neutral at the principle level and React/Vite/Workbox/Dexie/TanStack Query at the reference-implementation level.
- Private API responses are not service-worker cached by default; deviations require an explicit data-classification and invalidation decision.
- Transactional offline-write receives the deepest coverage, while simpler PWAs can stop at the appropriate capability level.
- Primary-source research will be refreshed during implementation and recorded with a verification date.

## User

Remember to use common words for the playbook to make it easy for engineers to read. Remember to add rich diagrams, architectures everything very detailed

## Plan

# Detailed, Plain-Language PWA Engineering Playbook

## Summary

Create a self-contained `pwa-engineering-playbook/` that teaches engineers how to plan, build, test, ship, and review production PWAs.

The playbook will:

- Use common words, short sentences, and concrete examples.
- Define technical terms before using them.
- Explain both what to build and why it works.
- Use detailed diagrams wherever relationships, data movement, or state changes are easier to understand visually.
- Cover simple app-shell PWAs, offline-readable PWAs, and full offline-write applications.
- Use PLASCHEMA as a real case study while keeping the framework reusable.
- Include an explicit-only `$pwa-engineering` Codex skill and an agent-neutral adaptation guide.

## Playbook Structure and Design

- Build a no-framework static HTML site under `pwa-engineering-playbook/` with an index, lessons, references, shared assets, and the packaged skill.
- Make the index support four clear paths: Learn, Plan, Build, and Audit.
- Organize each lesson in this order:
  1. What problem are we solving?
  2. The simple mental model.
  3. Architecture or flow diagram.
  4. Detailed explanation.
  5. Focused TypeScript example.
  6. Common mistakes.
  7. Production checklist.
  8. Short knowledge check.
  9. Links to trusted sources.
- Use plain language throughout. Where terms such as “idempotency,” “lease,” “cache invalidation,” or “eventual consistency” are necessary, define them immediately using a practical example.
- Include a searchable glossary that links technical terms back to the lessons where they are used.
- Use semantic HTML, accessible inline SVG, shared CSS, small progressive-enhancement JavaScript, responsive layouts, keyboard navigation, reduced-motion support, and print styles.
- Keep all required assets local. Do not depend on a CDN or build tool.
- Display a last-verified date and cite current primary sources for browser, security, and library behavior.

## Detailed Curriculum

- Explain the differences between a website, installable PWA, service worker, cached app shell, standalone display, and offline data.
- Show why a site can work offline in a normal browser tab after the service worker and required files have been cached. Make clear that installation is optional and first-time offline access is impossible.
- Define three capability levels:
  1. Cached application shell.
  2. Offline reading.
  3. Offline writing and synchronization.
- Explain how to choose a level based on user needs, network conditions, data sensitivity, storage size, conflict risk, and backend support.
- Define the application layers in plain language: components, hooks, client state, server state, local database, services, transport, sync coordinator, service worker, and backend.
- Cover service-worker scope, registration, installation, waiting, activation, control, precaching, navigation fallback, runtime caching, cache cleanup, recovery, and update prompting.
- Explain what should never be cached by default, especially private authenticated API responses.
- Cover IndexedDB tables, indexes, ownership boundaries, transactions, schema versions, migrations, blobs, storage limits, persistent-storage requests, eviction, retention, and cleanup.
- Explain offline reference data, freshness dates, access changes, large streaming downloads, atomic replacement, stale-data warnings, and manual refresh.
- Define the durable write queue from draft creation through final cleanup:
  `draft → pending → uploading → submitting → accepted/report owed → removed`.
- Cover failure states, abandoned work, leases, retries, backoff, stable idempotency keys, partial success, duplicate requests, validation failures, conflicts, and authentication expiry.
- Explain file handling: local blobs, capacity checks, presigned upload URLs, direct uploads, token isolation, retry behavior, resumable-upload choices, and abandoned server-file cleanup.
- Cover offline authentication, token expiry, cached identity, role changes, shared devices, logout and wipe rules, XSS risk, encryption limits, privacy, authorization, and server-side enforcement.
- Cover user experience for online/offline status, pending work, active sync, failed records, review, edit, retry, discard, stale data, storage warnings, and updates.
- Cover backend contracts and invariants without changing backend code: idempotent mutations, payload versions, conflict responses, sync acknowledgments, streaming endpoints, CORS, compatibility windows, and lifecycle cleanup.
- Cover deployment headers, service-worker delivery, navigation rewrites, releases, database migrations, rollback, monitoring, troubleshooting, and incident recovery.
- Include detailed testing guidance for storage, migrations, sync state machines, updates, offline navigation, bad networks, partial failures, multiple tabs, expired sessions, browser differences, and real devices.

## Rich Architecture and Flow Diagrams

Create detailed, accessible diagrams for:

- The complete browser, service worker, local database, API, database, and object-storage architecture.
- Installed mode versus ordinary browser-tab mode.
- First visit, returning visit, and offline reopening.
- The service-worker install, waiting, update, activation, and reload lifecycle.
- Application data layers and allowed dependency directions.
- Data ownership: UI memory, React Query, IndexedDB, Cache Storage, local storage, and server storage.
- The three PWA capability levels and their required parts.
- Offline reference-data download and replacement.
- Draft-to-outbox database transactions.
- The full enrollment synchronization sequence.
- Presigned file-upload flow and security boundary.
- The durable outbox state machine, including retry and failure paths.
- Lease acquisition and abandoned-work recovery.
- Idempotent retry behavior when the client does not receive the server response.
- Partial batch success and final sync reporting.
- Offline authentication and session-expiry decisions.
- Storage schema evolution across application versions.
- Application-build compatibility with local-database versions.
- Cache-policy decision trees.
- Update, rollback, and broken-release recovery.
- Sensitive-data threat boundaries.
- Testing layers from unit tests through real-device checks.

Each diagram will include a text explanation and accessible alternative so the lesson remains understandable without seeing the image.

## Recipes and Reference Material

- Provide focused React/Vite/Workbox/Dexie/TanStack Query examples without creating a separate full application.
- Include typed examples for database records, storage migrations, cache policies, outbox states, idempotency, leases, retry schedules, sync coordination, file uploads, and update prompts.
- Clearly label example code, required production behavior, optional improvements, and project-specific choices.
- Add quick references for:
  - Architecture decisions.
  - Data ownership.
  - Cache-policy selection.
  - Storage schema design.
  - Sync-state transitions.
  - Security and privacy review.
  - Update and release safety.
  - Offline UX.
  - Launch readiness.
  - Real-device testing.
  - Troubleshooting.
- Include common failure stories that explain what the engineer sees, what probably happened, how to diagnose it, and how to recover safely.

## Lightweight Playbook PWA

- Make the playbook itself installable and available offline after its first successful load.
- Add a manifest, scoped service worker, local install assets, offline fallback, deliberate cache versioning, and old-cache cleanup.
- Precache only the authored handbook and its static assets.
- Add an accessible prompt when a newer playbook version is waiting.
- Activate updates only after the reader chooses to update, then reload safely after `controllerchange`.
- Keep the handbook readable as ordinary static HTML when installation or service workers are unavailable.
- Document its implementation inside the playbook as a small example of the concepts it teaches.

## Agent Skill and Portability

- Place the canonical skill under `pwa-engineering-playbook/skill/pwa-engineering/`.
- Expose the explicit-only `$pwa-engineering` skill with four modes:
  - **Learn:** teach the relevant lesson using the reader’s current knowledge.
  - **Plan:** inspect a repository and produce a decision-complete PWA architecture.
  - **Build:** implement the approved design and verify it.
  - **Audit:** inspect an existing PWA and report evidence, risks, and improvements.
- Require the skill to establish capability level, data ownership, offline duration, expected data volume, data sensitivity, conflict policy, supported browsers, backend contracts, update policy, and acceptance tests.
- Require the skill to use plain language in plans and reports while retaining precise technical meaning.
- Require diagrams for complex architecture, state, sequence, ownership, and compatibility relationships.
- Add an agent-neutral guide explaining the workflow, required inputs, invariants, outputs, and how to adapt it to agents without Codex skill metadata.
- Update root `AGENTS.md` so PWA planning, building, and review work is routed to the playbook.
- Validate the committed skill and, with explicit filesystem approval, install an identical standalone global copy.
- Document how to update the global copy from the repository version.

## PLASCHEMA Case Study and Documentation

- Explain the existing PWA architecture from the real source code: generated app shell, normal-tab offline operation, update prompt, owner-scoped Dexie storage, local-first drafts, UUID v7 idempotency, leases, retries, reference streams, file uploads, final reporting, cached statistics, and offline session continuation.
- Include diagrams based on the actual PLASCHEMA data flow and sync state machine.
- Separate:
  - Proven strengths.
  - Deliberate product choices.
  - Features intentionally omitted.
  - Documentation that became stale.
  - Possible future hardening work.
- Correct the existing statement that implies installation is required for offline use. Explain that the browser must first install and control the service worker and cache the required files, but the user does not need to install the PWA.
- Cross-link the enrollment handoff and new playbook.
- Update `docs/HANDOFF.md` with the new package, skill command, architecture resource, and verification results.
- Do not modify `backend/` or the production `pwa/` runtime as part of this work.

## Verification and Acceptance Tests

- Validate all navigation, internal links, glossary links, citations, code references, and project facts.
- Review every lesson for unexplained jargon, overly long sentences, vague wording, and unnecessary complexity.
- Verify every complex relationship has either an appropriate diagram or a clear reason why prose is better.
- Test phone, tablet, and desktop layouts, keyboard navigation, visible focus, contrast, reduced motion, screen-reader labels, printing, and no-JavaScript reading.
- Test first load, service-worker registration, offline reopening, nested lesson access, cache cleanup, waiting updates, activation, safe reload, and ordinary browser-tab behavior.
- Test current Chromium and WebKit-compatible environments where available and document manual Android and iOS checks.
- Validate the skill and exercise representative Learn, Plan, Build, and Audit requests.
- Confirm audits remain non-mutating, build mode respects authorization, browser facts are reverified, and repository instructions take precedence.
- Confirm the global skill matches the committed canonical copy.
- Run the existing PWA tests, lint, and production build to ensure the new package does not regress the application.

## Assumptions and Defaults

- The writing should feel like an experienced engineer explaining the system to a teammate, not an academic paper.
- Common words take priority over jargon; technical precision must still be preserved.
- The handbook combines quick operational guidance with detailed teaching.
- Modern Android Chrome, iOS Safari, evergreen desktop browsers, installed mode, and ordinary browser-tab mode are first-class.
- Principles remain technology-neutral, while implementation recipes use the PLASCHEMA-aligned React/Vite/Workbox/Dexie/TanStack Query stack.
- Private API responses are not service-worker cached by default.
- Transactional offline-write applications receive the deepest coverage.
- Rich diagrams are a core deliverable, not decoration.
- Primary technical sources will be rechecked during implementation and recorded with a verification date.

## User

Implement the plan.

## Assistant

I’m implementing the approved playbook as a standalone static learning site plus the reusable skill. I’m using the Sites guidance for the HTML experience and the skill-creator guidance for the Codex package, then I’ll reconcile the project docs and run browser, skill, and PWA regression checks.

## Activity

    $ /bin/zsh -lc "sed -n '1,320p' /Users/admin/.codex/plugins/cache/openai-bundled/sites/0.1.27/skills/sites-building/SKILL.md; sed -n '1,320p' /Users/admin/.codex/skills/.system/skill-creator/SKILL.md; sed -n '1,260p' docs/HANDOFF.md; sed -n '1,220p' docs/feature-folder-structure.md; sed -n '1,220p' docs/routing-entry-pattern.md"
    status: Completed · exit 0
      ---
      name: sites-building
      description: Use Sites to build websites, including landing pages, portfolios, dashboards, portals, trackers, hubs, and internal tools. Always use Sites when the project contains `.openai/hosting.json`.
      ---
      
      # Sites building
      
      Build the complete requested site, validate it, then use `sites-hosting`
      unless the user explicitly asks to keep it local.
      
      ## Communicate clearly
      
      Assume the user is a nontechnical knowledge worker. Talk about their site,
      choices, progress, and results. Keep tools, commands, files, runtimes, browser
      software, permissions, dependencies, source control, credentials, IDs, builds,
      and deployment internals out of user-facing messages unless the user asks or
      must take action.
      
      Use no more than one short update for each user-visible phase: preparing design
      options, building the selected option, and publishing. If a phase takes longer
      than 60 seconds, give one plain-language update. Keep recoverable technical
      problems private; say only that you hit a problem and are trying another method.
      
      ## Choose the execution path
      
      Use the **one-shot fast path** only when all of these are true:
      
      - this is a new site in an empty or projectless workspace;
      - one route can satisfy the request;
      - the request does not require D1, R2, uploads, app-owned authentication,
        external connectors, or browser UI QA; and
      - the normal deliverable is a private deployed URL.
      
      Use the **capability path** otherwise. This includes existing-site changes,
      multi-route sites, persistent data, uploads, authentication, external data, and
      requested browser testing.
      
      ## Use imagery purposefully
      
      Avoid model-authored SVGs in finished sites, including inline SVG
      illustrations. Prefer strong typography, color, layout, CSS shapes, and existing
      icon components when imagery is unnecessary. When a site needs real imagery,
      prefer suitable images found through web image search. Use `imagegen` if and
      only if original imagery is important and a suitable existing image is
      unavailable; generation adds latency, so keep it purposeful and limited.
      
      ## Start new projects immediately
      
      For a new site in an empty or projectless workspace, make setup the first task
      action. Run this plugin's root-level `scripts/init-site.sh` with `$PWD` as its
      target and retain the session until installation completes. Do not run a second
      initializer.
      
      In a visible foreground thread, wait for setup to finish, then immediately start
      `npm run dev` in a retained session. Use the exact Local URL printed by the
      development server and call `open_in_codex` once. Complete these startup steps
      before asking discovery questions, calling `request_user_input`, or showing a
      design picker. The user should see the starter loading skeleton before
      implementation begins; continue building the requested site through HMR and
      keep the development server alive through build and hosting.
      
      In a delegated, background, or invisible thread, initialize normally but do
      not start a browser-only preview unless the task otherwise needs the server.
      
      ## One-shot design choices
      
      This flow is unrelated to the Codex Apps `$one-shot` UI-regression skill. Use
      one to four sequential design pickers before editing the site. Choose only
      decisions that materially improve the result, stop when the design is clear,
      and never exceed four pickers. Wait for each selection before preparing the
      next picker so later options can build on earlier choices. Skip the flow if the
      user wants to proceed without choosing an option.
      
      Before generating previews, normally call `request_user_input` 1-3 times to
      learn what matters most for this site. Ask short, tailored questions about
      things such as the audience, purpose, content, tone, or desired feeling. Skip
      questions the user has already answered, and skip this step only when the user
      has given unusually complete direction or asks you to decide. Then use the
      design picker for a visual choice that is easier to judge by seeing it.
      
      1. Choose the next useful design decision to compare. It may be a color palette,
         layout, typography pair, visual density, component style, illustration
         language, or full-page direction. Create a temporary directory outside the
         site source for the options. Start project setup first. In a visible
         foreground thread, the starter loading view should already be open before
         asking the user to choose. Do not edit product files before the user chooses.
      2. Spawn exactly three subagents in parallel to create three distinct options.
         Give them the same content, viewport, aspect ratio, and medium. Default to
         HTML whenever HTML and CSS can show the decision clearly. If unsure, use
         HTML.
         - Use HTML for palettes, typography, high-level layouts, spacing, navigation,
           component styles, and other interface choices. Create three simple page
           mockups or specimens with realistic shared content so the difference is
           easy to compare. For layout choices, use abstract wireframes with labeled
           regions, boxes, lines, and simple CSS shapes. Keep color, typography, and
           content neutral and consistent so the layout is the clear variable. Do not
           add decorative imagery, illustrations, or model-authored SVGs to layout
           previews. Reference `Visualize:visualize` for composition, responsive
           layout, typography, and accessibility. Each subagent creates one
           self-contained HTML file outside the site source. The parent renders all
           three files to images after they return; subagents do no browser work. Do
           not use the inline-visualization response directive.
         - For a Work image-picker decision, use `answers-image-picker` to
           generate exactly three comparable imagegen previews in the background.
           Start every preview prompt with the exact literal prefix
           `[image_picker_background_preview]`; do not alter, omit, or paraphrase it.
           Work uses that prefix to hide only these preview imagegen messages.
           Do not announce the skill, preview generation, or imagegen calls in
           user-visible commentary.
           Treat the final picker as the decision surface for this phase. Each
           direction uses realistic product content and no browser chrome, device
           frame, montage, unrelated logo, or watermark.
         Each subagent returns a unique id, short title, absolute artifact path, and
         implementation-ready brief. Include exact values when useful, such as
         colors, font families and weights, layout regions, spacing, imagery,
         interaction, and motion.
      3. Wait for all three options. Retry missing or unusable options until all three
         are ready. When `answers-image-picker` is available, use the three returned
         absolute saved paths from its background imagegen previews and skip the HTML
         renderer. For Codex-app fallback HTML options on macOS, run the bundled root-level
         `scripts/render-html-previews.sh` once for all three files, with elevated
         permissions on the first attempt. It produces three consistent 1600×1000 PNG
         files. Never install or invoke standalone Playwright, Chromium, or other
         browser software. On another platform, or after one helper failure, use the
         in-app Browser once. If neither renderer is available, offer the briefs as
         text instead of installing software or retrying repeatedly. Keep renderer
         setup and recovery out of user-facing messages.
      4. In Work, when the `answers-image-picker` answer skill is available,
         invoke `image_picker` with a question tailored to the decision and exactly
         three `{ id, title, image_path, selection_context }` options. Pass each
         background imagegen preview's returned absolute saved path as `image_path`;
         never invent, rename, shorten, or copy a path from an example. Work promotes
         those generated paths to Sediment URLs before the frontend renders them. Map each
         implementation-ready brief to `selection_context`.
         The final answer must contain the single `image_picker` genui citation;
         do not merely announce that the previews were rendered, and do not add
         prose before or after the citation. Then end the turn and wait for the
         user's choice.
         Use the selected context for that decision while preserving the user's
         other requirements. The follow-up turn includes the selected preview image;
         inspect it and treat its visual details as the source of truth when they
         differ from the prose brief. Continue with the Sites workflow instead of
         answering with standalone HTML.
      
         When the answer skill is unavailable, keep the Codex-app fallback: call
         `choose_site_design` with the same question and three
         `{ id, title, imagePath, designBrief }` options. If the user skips either
         picker, ask whether to retry, use the strongest option, or stop. If neither
         picker is available, offer the options as text. For the MCP fallback,
         continue in the same turn unless the user asks to stop. If another distinct
         visual decision would materially improve the site and fewer than four pickers
         have been shown, repeat this flow using every previous selection as a
         constraint. Never open multiple pickers at the same time.
      
      ## One-shot build
      
      After the final selection, build and deploy the complete site in one focused
      pass.
      
      1. Reuse the retained setup, development server, and browser tab started above.
         Start or open anything here only when the corresponding earlier step did not
         happen. Preserve the package manager and lockfile.
      2. Start by inspecting `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, and
         `.openai/hosting.json`. Read other files only when the implementation needs
         them. Avoid broad scans and speculative research.
      3. Make one complete product patch. Prefer one page component and one
         stylesheet. Include all requested content, interactions, responsive
         behavior, keyboard and touch behavior when relevant, and accessible labels.
         The starter loading skeleton is temporary infrastructure, not product UI.
         Once the requested first version replaces it, remove `app/_sites-preview`
         and its imports. If nothing else uses `react-loading-skeleton`, remove that
         dependency and refresh the lockfile. Remove the temporary `codex-preview`
         metadata marker, replace the starter title and description with the requested
         site's own values, and update starter icons when appropriate before the final
         build unless the user explicitly asked to work on the starter itself.
      4. As soon as implementation is complete, run `npm run build` while the
         retained `npm run dev` process stays alive. Fix actual build failures, then
         rerun it. Run lint separately only if the build omits compilation or the user
         asks.
      5. Follow the shared preview rules below.
      6. Continue to `sites-hosting`. Avoid an unnecessary polish pass after the
         build succeeds.
      
      ## Capability path
      
      ### Project setup
      
      - For a new site, use the setup flow in **Start new projects immediately** and
        preserve the bundled vinext structure.
      - For an existing site, preserve its package manager, lockfile, scripts,
        architecture, and `.openai/hosting.json`. Install only when dependencies are
        absent. Do not replace a working structure merely to use the starter.
      - Keep site code within the selected project surface.
      
      ### Shape the product
      
      - Build the first viewport around the requested product, not generic dashboard
        chrome.
      - For a new site, replace the starter loading skeleton completely and remove
        `app/_sites-preview` and its imports. Remove `react-loading-skeleton` and
        refresh the lockfile if the finished site no longer uses it. Remove the
        temporary `codex-preview` metadata marker, update `app/layout.tsx` with the
        finished site's title and description, and replace any other starter metadata
        before final validation. Preserve the skeleton only when the user explicitly
        asked to work on the starter itself.
      - Use concrete, product-specific copy and realistic data.
      - Once the site's visual direction, primary headline, and supporting copy are
        stable, freeze a compact social-preview brief and launch exactly one
        `imagegen` request in parallel with the remaining site implementation and
        validation. Ask imagegen to create the complete social card, including its
        typography, as one cohesive landscape image. The card must represent the
        actual finished site by reusing its content, brand palette, typography
        treatment, and distinctive visual motifs; optimize it for visual impact and
        legibility in X, Slack, iMessage, and other link unfurls.
      - Inspect the returned image for incorrect, missing, or invented text. Retry
        once only when the card is unusable; do not generate multiple candidates in
        parallel. If validation succeeds, save the image as `public/og.png` and update
        `app/layout.tsx` with site-specific Open Graph and X metadata using an absolute
        URL derived from the incoming request host. Run the final build after wiring
        the asset. Never ship a generic or starter fallback image; if no bespoke card
        passes validation, omit `og:image` instead.
      - Avoid speculative features and unnecessary client state.
      - Use the starter's `sites()` Vite plugin and produce Cloudflare
        Worker-compatible ESM output.
      
      ### Add only requested capabilities
      
      - For durable state, records, uploads, or other persistence, read
        [Persistence and storage](references/persistence-and-storage.md).
      - For identity-aware or sign-in-gated behavior, read
        [Authentication](references/authentication.md).
      - Use browser storage only for device-local preferences or explicitly local
        state.
      - Keep logical D1 and R2 declarations in `.openai/hosting.json`; Sites owns the
        real Cloudflare resources and deployment wiring.
      - Keep local `.env` and `.env.example` keys aligned. Manage hosted runtime
        values through Sites.
      
      ### Validate capability work
      
      - Run the deployment build once after the complete implementation. If a D1
        schema changed, generate and inspect its migration. Fix real failures before
        hosting.
      
      ## Preview
      
      - In a visible foreground thread, reuse the tab opened during startup. If no tab
        was opened, call `open_in_codex` once with the exact Local URL printed by the
        healthy development server. If it fails, report it and continue.
      - For an existing site, preserve its normal package and development flow.
      - In a delegated, background, or invisible thread, skip `open_in_codex` and say
        why.
      - Perform no screenshots, DOM inspection, clicking, resizing, or visual QA
        unless the user explicitly requests browser testing.
      - Do not scan ports or repeatedly open the browser.
      
      ## Hosting handoff
      
      Use `sites-hosting` after validation. Do not finish with only a local build
      unless the user requested local-only work. Return the deployed Sites URL as the
      primary deliverable. Do not include file paths, commands, or validation jargon
      unless the user asks. Keep the development server running until hosting
      finishes, then stop it during final teardown.
      ---
      name: skill-creator
      description: Create or update a Codex skill with appropriately scoped instructions and any needed supporting resources.
      metadata:
        short-description: Create or update a skill
      ---
      
      # Skill Creator
      
      Create skills that give Codex useful, non-obvious guidance without constraining unrelated work.
      
      ## Core Principles
      
      **Assume Codex is already capable.** Include only information that changes its decisions or improves its work. Remove generic advice, repeated instructions, speculative edge cases, and examples that do not materially clarify the task.
      
      **Preserve user intent and scope.** A skill should support the requested task, not replace the user's chosen product, expand the assignment, modify unrelated configuration, or imply permission for additional external actions. Do not turn a particular example, past failure, or personal preference into a universal requirement.
      
      Approval to complete a task does not expand its scope or execution permissions. For retrying or externally mutating workflows, define a stopping condition proportional to the risk.
      
      **Match specificity to the risk.** Give the model room to choose an appropriate approach when multiple approaches are reasonable. Use detailed steps, deterministic scripts, or absolute language only when correctness, safety, permissions, or a genuinely fragile workflow requires them.
      
      For open-ended work, describe the outcome and relevant decision criteria. For workflows with a preferred shape, offer useful examples or configurable scripts. Reserve fixed sequences and narrow parameters for operations where deviation would cause a concrete problem. Preserve non-obvious operational invariants, distinguish actual requirements from optional recommendations or local conventions, and avoid restating policies already enforced elsewhere.
      
      **Keep discovery cheap and precise.** Skill names and descriptions are available before a skill is loaded. Describe the actual capability and when it applies, adding exclusions only when they prevent likely misrouting. Avoid exhaustive capability lists and catchalls that attract unrelated requests.
      
      Keep skills self-contained; refer to another skill or tool only when the requested workflow genuinely requires it and it is available in the target environment. Specialized review, hardening, or audit workflows should apply when requested or genuinely needed, not merely because ordinary work touches the same subject.
      
      **Disclose detail progressively.** Keep shared purpose, essential constraints, and useful routing in `SKILL.md`. Put substantial mode-specific guidance, schemas, examples, or procedures in supporting references and read only the references relevant to the current task. A simple self-contained skill does not need a router or extra files.
      
      ## Anatomy of a Skill
      
      Every skill is a folder containing a required `SKILL.md` file and any optional resources its actual workflow needs:
      
      ```text
      skill-name/
      |-- SKILL.md                 Required skill instructions
      |   |-- YAML frontmatter     Required name and description
      |   `-- Markdown body        Instructions loaded when the skill is used
      |-- agents/                  Optional UI metadata and invocation policy
      |   `-- openai.yaml
      |-- scripts/                 Optional executable helpers
      |-- references/              Optional documentation loaded as needed
      `-- assets/                  Optional files used in generated output
      ```
      
      Choose the structure that fits the actual task. Some skills are short and self-contained; others route among operating modes or delegate complex mechanics to scripts. Avoid creating directories, placeholders, examples, or ancillary documentation without a clear use.
      
      ### SKILL.md
      
      The YAML frontmatter identifies the skill and determines when it should be considered. Include the required `name` and `description`, and preserve supported optional fields such as existing `metadata` when appropriate.
      
      The Markdown body is loaded only when the skill is used. Put the purpose, essential workflow, real constraints, and useful links there. Keep detailed procedures and examples in supporting references when they are relevant only to particular modes.
      
      Skill information is disclosed in three stages:
      
      1. **Name and description:** Available during skill selection, so keep them concise and discriminating.
      2. **SKILL.md body:** Loaded when the skill applies, so keep its instructions relevant to that task.
      3. **Supporting resources:** Read or execute only when the current task actually needs them.
      
      The entrypoint should be as short as the task permits while retaining important constraints. A large upper bound is not a target: move conditional detail into references when doing so improves clarity or context use, rather than waiting for the file to become unwieldy.
      
      ### Scripts
      
      Use `scripts/` for executable code when the same logic would otherwise be rewritten repeatedly or deterministic execution materially improves reliability.
      
      - **Example:** `scripts/rotate_pdf.py` for a PDF operation that would otherwise require recreating the same code.
      - **Useful for:** Repeated transformations, reliable API operations, data processing, and other concrete automation.
      - **Validation:** Run new or changed scripts to verify their behavior. Scripts can usually be executed without loading their full implementation into context, although an agent may need to inspect them when patching or adapting them.
      
      ### References
      
      Use `references/` for documentation that is needed only in particular contexts.
      
      - **Examples:** `references/schema.md` for database tables, `references/policies.md` for domain rules, `references/api_docs.md` for an API, or separate writing guides for different deliverables.
      - **Useful for:** Schemas, API documentation, company policies, format-specific procedures, detailed workflows, and substantial examples.
      - **Routing:** Link each reference from `SKILL.md` or another relevant resource and explain when it should be read. Keep information in one place instead of duplicating it across the entrypoint and references.
      
      Keep references focused on maintained, task-specific information that changes the agent's decisions. Avoid copied manuals, exhaustive catalogs, and generic tutorials already available from authoritative sources. Before removing existing resources, inspect their callers and purpose.
      
      For large references, include useful search terms or a short contents section when that makes the needed material easier to find.
      
      ### Assets
      
      Use `assets/` for files that belong in generated output rather than in the model's instructions.
      
      - **Examples:** `assets/logo.png`, `assets/slides.pptx`, `assets/font.ttf`, or `assets/frontend-template/`.
      - **Useful for:** Templates, images, fonts, icons, boilerplate projects, and other files copied or adapted into the result.
      - **Context:** Do not load assets as instructions unless the task requires inspecting them.
      
      ### UI Metadata and Invocation Policy
      
      `agents/openai.yaml` can provide UI-facing metadata such as `display_name`, `short_description`, and `default_prompt`, along with invocation policy. When creating or updating those settings, read [references/openai_yaml.md](references/openai_yaml.md) and keep the values consistent with the skill.
      
      Automatic skill selection is allowed by default. Change that default only when the user explicitly requests an explicit-only skill:
      
      ```yaml
      policy:
        allow_implicit_invocation: false
      ```
      
      This keeps the skill available when explicitly invoked as `$skill-name` without adding it to the model context automatically. Preserve unrelated existing UI, policy, and dependency fields when updating `agents/openai.yaml`.
      
      The initializer creates this file automatically. For new or interface-only metadata, generate it with:
      
      ```bash
      scripts/generate_openai_yaml.py <path/to/skill-folder> --interface key=value
      ```
      
      The generator replaces the entire file. If an existing file contains `policy` or `dependencies`, update only the intended fields in place instead of regenerating it.
      
      Include optional interface fields only when the user provides or requests them.
      
      ### What Not to Include
      
      Include files that directly support the skill's work. Avoid adding a `README.md`, installation guide, changelog, duplicated quick reference, or other auxiliary documentation unless a specific task or packaging requirement calls for it.
      
      ## Progressive Disclosure in Practice
      
      For a skill with multiple substantial modes, keep the shared guidance and mode-selection criteria in `SKILL.md`. Link each supporting reference where its use becomes relevant. Do not load every reference by default, duplicate reference content in the entrypoint, or add a routing layer when there is nothing meaningful to route.
      
      For example, a deployment skill can keep provider selection in `SKILL.md` and separate provider details:
      
      ```text
      cloud-deploy/
      |-- SKILL.md
      `-- references/
          |-- aws.md
          |-- gcp.md
          `-- azure.md
      ```
      
      When the user chooses AWS, read `references/aws.md`; do not also load the GCP and Azure guides. The same pattern can separate business domains, deliverable types, or other genuinely distinct operating modes.
      
      A short skill can instead route to details only when an advanced operation needs them:
      
      ```markdown
      ## Documents
      
      Handle ordinary edits directly.
      
      - For tracked changes, read [references/redlining.md](references/redlining.md).
      - For document internals, read [references/ooxml.md](references/ooxml.md).
      ```
      
      These examples illustrate options, not a required structure. Choose the organization that makes the skill easier to use without loading irrelevant material.
      
      ## Create or Update a Skill
      
      Adapt the work to the request. Creating a complex new skill may involve understanding realistic use cases, choosing supporting resources, initializing files, writing instructions, and validating the result. A narrow update to an existing skill may require only a focused edit and validation.
      
      Ask clarifying questions only when the missing information matters and cannot be reasonably inferred. Respect a user-specified location; otherwise create discoverable skills in `$CODEX_HOME/skills`, or `~/.codex/skills` when `CODEX_HOME` is unset.
      
      Keep automatic skill selection enabled unless the user explicitly requests an explicit-only skill. When the intended invocation mode is genuinely unclear and matters to the requested workflow, ask whether the user wants normal automatic discovery or explicit-only invocation; otherwise preserve the default. Do not infer explicit-only invocation from sensitive operations or required approvals: keep the skill discoverable and require authorization immediately before the actual mutation. Preserve an existing skill's invocation policy unless the user asks to change it.
      
      For a new or substantially revised skill, consider the actual requests it should handle and which reusable resources would improve those tasks:
      
      - A repeated PDF transformation may justify a `scripts/rotate_pdf.py` helper.
      - An application-building workflow may benefit from an `assets/frontend-template/` starter.
      - A data-analysis skill may need a `references/schema.md` guide to avoid rediscovering table relationships.
      
      Create those resources only when their concrete benefit justifies them. If the user has already explained the task clearly, proceed without requesting additional examples.
      
      ### Naming
      
      - Use lowercase letters, digits, and hyphens.
      - Keep names under 64 characters and prefer short action-oriented names.
      - Namespace by tool or domain when doing so improves discovery.
      - Name the skill folder after the skill.
      
      ### Initialize a New Skill
      
      For a new skill, use the bundled initializer when it helps create the required files consistently:
      
      ```bash
      scripts/init_skill.py <skill-name> --path <output-directory> [--resources scripts,references,assets] [--examples]
      ```
      
      For example:
      
      ```bash
      scripts/init_skill.py my-skill --path "${CODEX_HOME:-$HOME/.codex}/skills"
      scripts/init_skill.py my-skill --path "${CODEX_HOME:-$HOME/.codex}/skills" --resources references
      ```
      
      Request only the resource directories the skill needs. Use `--examples` only when concrete placeholders would help, and replace or remove them before finishing. Do not initialize an existing skill again.
      
      The initializer creates the skill directory, a concise `SKILL.md` starter, and `agents/openai.yaml`. It creates resource directories and example files only when requested. Pass generated UI values as `--interface key=value` when needed.
      
      ### Write the Instructions
      
      The frontmatter `description` should briefly explain what the skill does and when it applies. Include a meaningful boundary when similar requests should not activate the skill.
      
      For example:
      
      ```yaml
      description: Create or edit Word documents when formatting, tracked changes, or comments require document-specific handling.
      ```
      
      Put detailed workflows, tool choices, examples, and operating modes in the body or relevant references rather than listing them all in the description. Preserve supported optional frontmatter, such as existing `metadata`, when appropriate.
      
      Write only the instructions needed for another Codex instance to perform the task well. State the desired outcome, non-obvious context, real constraints, and relevant references or tools. Preserve the user's explicit choices and existing authorization boundaries. Avoid prescribing a fixed structure, process, or number of steps when the task does not require one.
      
      ### Validate and Iterate
      
      Validate the completed skill with:
      
      ```bash
      scripts/quick_validate.py <path/to/skill-folder>
      ```
      
      The validator checks frontmatter, naming, and unfinished scaffold placeholders; it does not prove that the skill makes good decisions. Also check that descriptions remain discriminating, instructions preserve user intent, references are discoverable, and any added scripts actually work.
      
      When testing is warranted, verify observable behavior or meaningful invariants. Avoid tests that merely match generated wording, headings, or regex patterns.
      
      Improve the skill based on real usage or demonstrated failures. Prefer a narrow correction to accumulating universal rules for every observed example.
      
      ## Independent Forward-Testing
      
      Use an independent subagent pass when a skill is sufficiently complex or risky that realistic behavioral validation would add meaningful confidence, and when delegation is available and authorized. Ordinary creation or small edits do not automatically require subagents.
      
      Give the evaluating agent a realistic user request, the skill, and the minimum raw artifacts needed to perform the task. Do not provide the intended answer, suspected bug, proposed fix, or prior conclusions unless the evaluation genuinely requires them.
      
      For example:
      
      ```text
      Use $skill-name at /path/to/skill-name to complete this realistic request.
      ```
      
      Keep the evaluation scoped to permitted resources and side effects. Use an isolated temporary workspace for generated artifacts so they do not enter the working tree or contaminate later evaluations. Ask for approval when the proposed evaluation would require additional authorization, affect a live production system, or impose substantial time or cost. Review the actual outcome and artifacts, then make only changes supported by the observed behavior.
      # PLASCHEMA Project Handoff
      
      Last updated: 7 September 2026
      Last verified code commit: `177f909`
      
      ## Purpose
      
      This is the living context document for engineers and future coding sessions. Update it after major changes.
      
      ## Project layout
      
      | Folder | Purpose | Current state |
      | --- | --- | --- |
      | `frontend/` | Admin web app | Designs implemented; login and session APIs integrated |
      | `pwa/` | Field-worker mobile PWA | Production auth/profile and offline-first enrollment sync integrated |
      | `backend/` | NestJS API, Prisma, PostgreSQL and Redis | Existing backend project; frontend work must not change it unless requested |
      | `docs/` | Project guides and handoff | Read before architecture or routing work |
      
      This is a pnpm workspace. The root scripts manage all three apps.
      
      ## Current frontend state
      
      ### Admin app
      
      - React, TypeScript, Vite and Tailwind.
      - Feature folders live under `frontend/src/features/`.
      - Thin route files live under `frontend/src/routes/`.
      - Admin designs and navigation are implemented.
      - The admin top bar shows the current feature name from route metadata; unsupported global search and notification controls were removed. Detail routes identify their parent feature in the same metadata.
      - Enabled buttons, links, selects and other interactive controls use a pointer cursor across the admin app, while disabled controls use the not-allowed cursor.
      - The protected admin layout owns page-level vertical scrolling. Feature views do not create competing page scroll containers; tables, tabs, dropdowns and dialogs retain their intentional bounded scrolling.
      - The admin dashboard uses `GET /api/dashboard` for its KPIs, enrollment trend, recent activity, category/status breakdowns, ward/LGA rankings, facility overview, field-worker performance and recent enrollments.
      - Dashboard filters are LGA, a searchable Ward, period (`7d`|`30d`|`3m`|`6m`|`1y`, default `30d`) and trend (`daily`|`weekly`|`monthly`, default `monthly`). Plateau is fixed rather than exposed as a State filter; selecting an LGA clears an incompatible Ward and selecting a Ward applies its LGA.
      - Every dashboard visual is rendered with Recharts: the enrollment trend is a gradient area chart with a stroked line, per-point dots, a labelled y-axis, a hover tooltip and a dashed average reference line; enrollment by category, ward and LGA share one horizontal bar chart; enrollment by status is a donut with a legend and a centre total. No hand-rolled SVG or CSS-div bars remain in the dashboard feature.
      - Ward bars on the dashboard still navigate to ward detail. Because a Recharts bar click is mouse-only, each clickable chart also renders a visually hidden list of real buttons so keyboard and screen-reader users keep the same navigation.
      - Chart colours come from the `--chart-1` … `--chart-5` theme tokens in `frontend/src/index.css`. Recharts mount animations are disabled so charts render deterministically and do not re-animate on every filter change or background refetch.
      - Admin login uses `POST /auth/login`; saved sessions are validated with `GET /auth/me`.
      - The typed API layer is split into client, request, error and contract modules and is consumed through feature services and React Query hooks.
      - Authentication is admin-only. Zustand owns the access token, authenticated user and session status.
      - “Remember me” stores the token and user in local storage; unchecked sessions use session storage. No password is stored.
      - There is no refresh-token endpoint. A protected-request 401 clears the session, while a transient `/auth/me` failure preserves it and offers retry/sign-out actions.
      - Sonner provides login and session notifications. The existing forgot/reset-password screens are still mock-only.
      - Ward creation uses `POST /wards`; the form sends only `name` and `lga`, while Plateau and Active remain fixed display values.
      - Ward batch upload uses `POST /wards/batch` with a multipart `file` field. The UI accepts CSV, XLSX and XLS files up to 2 MB and displays created, failed and row-level results.
      - Ward list data uses `GET /wards` with debounced server search, status filters and cursor-based Previous/Next navigation.
      - Ward detail data uses `GET /wards/:id/detail` for overview statistics, enrollment trends, field workers, health facilities and activity.
      - Ward editing uses `PATCH /wards/:id`, field-worker assignment uses `PUT /wards/:id/field-workers`, and deletion uses `DELETE /wards/:id`.
      - The assignment picker reads real candidates from `GET /users?role=field_worker` with cursor pagination. Assignment replaces the ward's complete field-worker selection.
      - The ward Beneficiaries tab is visible but disabled because the detail response does not contain beneficiary rows.
      - Ward API server state is owned by React Query and is not mirrored into Zustand.
      - Health-facility list data uses `GET /health-facilities` with debounced search, LGA, searchable ward selection, status filtering and cursor navigation. Facility type and level remain visible in the table but are no longer list filters.
      - Health-facility creation uses `POST /health-facilities`; the frontend submits `name`, `wardId`, `type`, `level` and `status`. LGA is displayed from the selected ward but is derived by the backend rather than duplicated in the request.
      - Health-facility batch upload uses `POST /health-facilities/batch` with CSV/XLSX and XLS files up to 2 MB and displays server row errors. Batch-created facilities default to **inactive**.
      - Health-facility detail uses `GET /health-facilities/:id/detail` for overview statistics, capitation history and activity.
      - Facility editing/status changes use `PATCH /health-facilities/:id`, and deletion uses `DELETE /health-facilities/:id` with confirmation.
      - Unsupported mock-only facility fields (code, ownership, community, address, contacts and onboarding date) are not displayed or submitted. The Beneficiaries tab reads `GET /enrollments?healthFacilityId=` with cursor pagination and remains display-only until beneficiary detail is API-backed.
      - Facility list KPI cards use filter-scoped `meta.total` and `summary` (`active`, `totalBeneficiaries`) rather than calculating the current page.
      - Field-worker list data uses `GET /users?role=field_worker` with debounced search, status filters and cursor-based Previous/Next navigation.
      - Field-worker creation uses `POST /users` with the role fixed to `field_worker`, optional multi-ward assignment and active/inactive status.
      - Empty field-worker ward assignment intentionally means access to all wards and is labelled explicitly throughout the UI.
      - Initial and reset passwords can be cryptographically generated in the browser or entered manually. Successful credentials are displayed once for the admin to copy and are not persisted in stores, query caches, URLs or browser storage.
      - Field-worker detail uses `GET /users/:id/detail`; edits and status changes use `PATCH /users/:id`, and admin password reset uses `POST /users/:id/reset-password`.
      - Field-worker Enrollment Activity and Sync Activity tabs filter the unified detail activity log. The Beneficiaries Enrolled tab reads `GET /enrollments?enrolledByUserId=` with cursor pagination and remains display-only until beneficiary detail is API-backed.
      - Field-worker server state is owned by React Query and is no longer mirrored from the mock Zustand store.
      - Field-worker list KPI cards use filter-scoped `meta.total` and `summary` (`active`, `totalBeneficiariesEnrolled`) rather than calculating the current page.
      - Capitation records use `GET /capitations` with the selected month/year, debounced server search, LGA filtering and cursor-based Previous/Next navigation.
      - Capitation month and year controls share the responsive filter row with search and LGA rather than occupying a separate period panel.
      - Capitation preview and generation use `GET /capitations/preview` and `POST /capitations/generate`. The admin selects a period, reviews the server calculation, confirms generation and sees the real result.
      - The backend-configured capitation rate is authoritative; the admin UI does not submit a rate override. Generating a newer run for an existing period requires confirmation.
      - Payment statuses, marking payments, scoped generation, printing, exports, exceptions and breakdown actions were removed because production does not expose those contracts.
      - Capitation list cards use filter-scoped `filteredSummary`; the rate and latest-generation date continue to use the run-wide `summary`.
      - Admin CBHI Enrolments now uses `GET /enrollments` with cursor pagination and production search, status, category, printed-state, LGA, ward, facility, field-worker, date and age filters.
      - Enrollment detail combines `GET /enrollments/:id` with `GET /enrollments/:id/detail` to show the complete beneficiary record, temporary document links and real activity history.
      - Enrollment activation and deactivation use `PATCH /enrollments/:id` for row/detail actions and `POST /enrollments/status` for batches of up to 100 unique IDs. Confirmations show partial-result counts for not-found, unchanged and invalid transitions; deceased records have no single-record action.
      - Ward, facility, field-worker and dashboard enrollment rows open the API-backed enrollment detail route.
      - ID Cards queues one to nine records through `POST /enrollments/id-cards/generate`. Excel exports use `POST /enrollments/reports/export`, reuse the supported filters selected on the enrollment list and summarize their scope before submission. An unfiltered export requires an explicit all-enrollments confirmation, while unsupported search and printed-state filters are explained before export.
      - Enrollment Ward, Facility and Field Worker filters use single searchable selectors instead of separate search inputs and dropdowns. Changing the Ward clears the selected Facility to prevent incompatible filters.
      - Admin enrollment and ID-card category filters use the same fixed programme categories as the PWA: IDPs, Elderly 65+, and Indigents / Very Poor / Others.
      - Files replaces Settings in the sidebar and uses `/file-jobs`, `/file-jobs/:id` and `/file-jobs/:id/download` for progress and fresh download links. The Settings route remains available but unlisted.
      - Enrollment creation remains in the field-worker PWA. Admin enrollment details remain read-only apart from activation/deactivation because production exposes no general update or delete endpoint. See `docs/enrollment-backend-feedback.md`.
      
      ### Field-worker PWA
      
      - Separate app under `pwa/` in the same workspace.
      - React, TypeScript, Vite, Tailwind, React Router, Zustand, Axios and TanStack React Query.
      - Routes: login, home, enrollment, beneficiaries, beneficiary detail, sync and profile.
      - Six-step enrollment includes passport and ID-document design inputs.
      - Login uses `POST /auth/login`, accepts only active field-worker accounts and stores no password.
      - Saved sessions persist locally, are checked with `GET /auth/me` when online and may continue offline only until the JWT expires.
      - A protected-request 401, role mismatch or local token expiry clears the session. A transient `/auth/me` failure preserves it and offers Retry or Continue Offline.
      - Worker profile identity and assigned wards come from the authenticated user response; empty ward assignment means access to all wards.
      - Enrollment drafts, selected files, local queues, reference data and cached worker statistics use IndexedDB through Dexie. Authentication remains separate in local storage.
      - The six-step enrollment wizard always saves locally first. One active draft survives refreshes and app restarts; completed drafts enter an owner-scoped pending queue with a UUID v7 idempotency key.
      - PWA form fields, including the native Date of Birth control, are constrained to the mobile frame so they cannot widen the enrollment screen or create document-level horizontal scrolling.
      - Wards and health facilities are downloaded from their NDJSON stream endpoints when missing, older than 24 hours or when the worker's ward access changes. Workers can also refresh them manually.
      - Synchronization runs in the foreground while the app is open: presign each file, upload it directly with the returned PUT URL, then create each enrollment one at a time.
      - Pending work retries with durable leases and bounded delays. Failed records retain their form, error and files for Review, Edit, Retry or Discard actions.
      - A successful create keeps a durable pending sync-report marker until `POST /auth/sync` succeeds, including when only part of a batch succeeded.
      - Server-accepted records remain locally only while the final `POST /auth/sync` report is owed. After that report succeeds, their records and file blobs are removed from the device.
      - Home Pending is device-local. Today and Total combine own `/users/:id/detail` statistics with unsent device records without double-counting retained synced rows; dates use the Africa/Lagos calendar day.
      - People and Sync display only records created on the current device. The PWA does not use `GET /enrollments` as a server-backed beneficiary list.
      - Enrollment State of Residence is fixed to `PLATEAU`. Beneficiary phone is required at exactly 11 digits; NIN is required and must contain exactly 10 digits.
      - The Residence step orders geography as State, LGA and Ward. Its offline LGA selector is derived from the worker's accessible active wards, and selecting an LGA filters the ward selector. A sole matching ward is selected automatically.
      - Selecting a ward automatically selects its health facility only when exactly one active facility is available. Multiple facilities require an explicit worker choice, while no active facility blocks the facility step with guidance.
      - Next-of-kin name and relationship remain visible but optional. Emergency phone is no longer collected or submitted by the PWA, including from legacy device records.
      - Profile ward access shows unrestricted workers as **All wards**, one assigned ward directly, and multiple assigned wards in an expandable list. An unrestricted worker still selects one specific ward for each enrollment.
      - Logout is immediate; no refresh-token or server logout endpoint exists.
      
      ### Backend contracts for PWA sync (ready)
      
      - `POST /api/enrollments` returns a slim sync acknowledgement (`id`, `enrollmentId`, `idempotencyId`, `status`, `capturedAt`, `createdAt`, `idempotentReplay`).
      - `POST /api/auth/sync` sets the authenticated user’s `lastSyncedAt` to now (call after the client’s one-by-one pending loop).
      - `GET /api/users/:id/detail` allows `field_worker` for **own** id only; overview includes `lastSyncedAt`, plus `stats` (`totalEnrolled`, `enrollmentsToday`, `enrollmentsThisMonth`, …), `wards`, and `activityLog`. Pending counts stay device-local.
      - No refresh-token endpoint; clients re-login when the JWT expires.
      - No batch enrollment create; PWA syncs pending records one-by-one.
      
      ## PWA configuration
      
      - `vite-plugin-pwa` generates the manifest and service worker.
      - App name: **PLASCHEMA Field Worker**.
      - Display mode: standalone.
      - Static app files are precached.
      - SPA navigation falls back to `index.html`.
      - An update prompt appears when a new version is ready.
      - The PWA reuses the admin PLASCHEMA logo, with padded 192 px, 512 px and Apple-touch PNG variants for installation.
      - No push notifications, service-worker background sync or authenticated API caching. Private enrollment data is stored in IndexedDB and scoped by the authenticated worker id.
      - PWA API responses are not cached by the service worker. Set `VITE_API_URL` in local and Netlify environments; never commit its deployed value.
      - Production work should add tested PNG icons and an Apple touch icon.
      - Production enrollment uploads require Railway object-storage CORS to allow the deployed PWA origin, `PUT` and the requested `Content-Type`. Uploaded objects that are never attached to a completed enrollment require backend lifecycle cleanup.
      
      ## Commands
      
      From the repository root:
      
      ```bash
      pnpm install
      pnpm dev              # backend, admin and PWA
      pnpm dev:frontend     # admin only, fixed at http://localhost:5173
      pnpm dev:pwa          # PWA only, fixed at http://localhost:5174
      pnpm dev:backend      # backend and infrastructure only
      
      pnpm build
      pnpm build:frontend
      pnpm build:pwa
      pnpm lint
      pnpm lint:pwa
      pnpm test:pwa
      ```
      
      Both frontend development servers use Vite's `--strictPort` option and exit instead of choosing another port when `5173` or `5174` is occupied.
      
      ## Netlify deployment
      
      - The admin app and field-worker PWA deploy as two separate Netlify sites from this repository.
      - Admin production URL: `https://plaschema-admin.netlify.app`.
      - Field-worker PWA production URL: `https://plaschema-pwa.netlify.app`.
      - Select `frontend` as the package directory for the admin site and `pwa` for the field-worker site.
      - Leave the Netlify base directory unset so dependency installation and builds run from the pnpm workspace root.
      - Site-specific settings are committed in `frontend/netlify.toml` and `pwa/netlify.toml`.
      - Both sites use SPA rewrites so direct navigation to React Router routes resolves to `index.html`.
      - The PWA service worker is served with revalidation enabled so clients can discover new deployments.
      - The initial sites were uploaded manually with the Netlify CLI. Connect both Netlify sites to this repository for continuous deployment, using the package directories above.
      - Set a production `VITE_API_URL` separately for both Netlify sites and rebuild after changing it. Do not commit deployed environment values.
      
      ## Railway / ID-card Chromium
      
      - Backend ID-card PDFs need Puppeteer's Chrome binary on the Railway image.
      - `puppeteer` is allowlisted in `onlyBuiltDependencies` so its install script can download Chrome.
      - `backend` `build` also runs `puppeteer browsers install chrome`.
      - `nixpacks.toml` (repo root and `backend/`) installs the Linux libraries Chrome needs.
      - Optional: `PUPPETEER_EXECUTABLE_PATH` to point at a custom Chromium binary.
      
      ## Decisions already made
      
      - Keep admin and PWA as separate apps in the same Git repository.
      - Use `frontend/` for admin and `pwa/` for the mobile field-worker app.
      - Use Zustand for shared client state.
      - Convert and review designs before integrating APIs.
      - Keep both frontend apps mock-only until backend integration is requested.
      - Do not modify the backend as part of frontend design work.
      - Support both Android and iPhone layouts.
      - Ask before adding packages that were not already approved for the task.
      - Integrate admin APIs one Swagger endpoint at a time through API client → feature service → React Query hook → component.
      - Restrict the admin frontend to users whose API role is `admin`.
      - `sonner` is the approved toast dependency for the admin frontend.
      - `recharts` is the approved charting dependency for the admin frontend. Keep it inside dashboard chart components; hooks, services, utils and types must stay free of it.
      - Chart marks may not use the brand lime `#9fe870` directly. It is too light for a data mark (only about 1.44:1 against white), so the chart tokens hold the brand hue at an accessible step and the pale lime is used only as the area wash beneath the trend line.
      - Custom Recharts tooltip, label and click handlers are typed with narrow local interfaces plus type guards rather than the library's loose payload types, so the no-`any` rule still holds.
      - Keep server-owned ward records out of Zustand; React Query owns ward API state as read endpoints are integrated.
      - Keep `GET /wards/stream` for a separate PWA offline-sync phase; it is not used by the admin app.
      - Use the admin-specific `GET /wards/:id/detail` response rather than adding the simpler ward-by-ID endpoint without a consumer.
      - Keep `GET /health-facilities/stream` for a separate PWA offline-sync phase, and use the admin detail endpoint rather than the simpler by-ID endpoint without a consumer.
      - Keep the field-worker role implicit on the Field Workers screens; the UI always submits `field_worker` and does not expose a role selector.
      - Field workers with no assigned wards have deliberate all-ward access; clearing every assignment preserves that backend behavior.
      - Generate field-worker passwords client-side with Web Crypto by default, allow manual passwords, reveal successful credentials once, and keep password recovery admin-controlled without an invitation/setup flow.
      - Persist the PWA field-worker session in local storage without a Remember me control. Revalidate through `/auth/me` when online and permit offline access only before the JWT expires.
      - Keep PWA authentication separate from local enrollment state, reject admin accounts in the PWA, and never cache authenticated API responses in the service worker.
      - PWA enrollment sync is one-by-one via `POST /enrollments` (idempotent); after the loop call `POST /auth/sync` to persist `lastSyncedAt`.
      - PWA profile does not use a worker code field; use `/auth/me` or own `/users/:id/detail`.
      - Home/People/Sync analytics and pending/failed queues are device-local; do not list server-synced enrollments on the PWA. Today/Total can use detail `stats.enrollmentsToday` / `stats.totalEnrolled`.
      - Keep PWA enrollment API traffic in typed services. Components consume hooks; direct `fetch` is limited to the NDJSON and presigned-upload transport helpers.
      - Remove accepted local enrollment records and their file blobs after the final `/auth/sync` report succeeds; server history remains in the admin app.
      - Refresh offline reference streams when absent, more than 24 hours old or ward access changes; do not download both streams on every queue polling interval.
      - Keep the capitation rate owned by backend configuration. The admin may select the period and preview the calculation but does not override the rate.
      - Allow repeated capitation generation for a period with a warning; the newest run is the one displayed by the backend.
      - Keep admin enrollment creation in the PWA workflow; the admin app reviews, filters, prints and exports server records.
      - Keep enrollment selection across result pages up to 100 records for status changes. The same selection may generate ID cards only while it contains one to nine records.
      - Always request a fresh presigned download URL for a completed file job rather than storing temporary Railway links.
      
      ## Structure rules
      
      - Follow `docs/feature-folder-structure.md`.
      - Follow `docs/routing-entry-pattern.md`.
      - Route files should stay thin and delegate to feature views.
      - Keep reusable app UI in `components/` and feature-specific UI inside its feature.
      - Do not call Axios or `fetch` directly from components when API work begins.
      - Never use real beneficiary data in mocks, tests or committed files.
      
      ## Verification status
      
      At commit `a73ed09`:
      
      - PWA lint passes.
      - PWA TypeScript and production build pass.
      - Three PWA tests pass.
      - The generated manifest and preview output were smoke-tested.
      - Backend had no working-tree changes.
      
      After later edits, rerun the relevant checks before updating this section.
      
      On 7 September 2026 after the admin interface polish:
      
      - Facilities use one searchable ward picker with in-picker pagination; separate ward-search/load-more controls and type/level filters were removed.
      - Ward, field-worker and facility list tables use labelled view icons instead of ellipses, and their column heading is `View`.
      - Capitation period controls were moved into the main filter row, and the top bar now shows route-aware feature text instead of disabled search and notification controls.
      - Admin-wide enabled and disabled cursor behavior is defined centrally.
      - Admin lint, TypeScript and production build pass. The build retains the existing non-blocking large-chunk warning.
      
      On 7 September 2026 after the PWA/admin overflow corrections:
      
      - Shared PWA fields and the native Date of Birth input are width-constrained, while the PWA document, app frame and enrollment fields area prevent accidental horizontal overflow.
      - The admin protected layout is the only page-level vertical scroll owner; redundant `overflow-auto` declarations were removed from feature-page roots while bounded component scrolling remains intact.
      - All 36 PWA tests pass, including the new native-date width regression. PWA lint, TypeScript and production build pass.
      - Admin lint, TypeScript and production build pass. Both builds retain their existing non-blocking large-chunk warnings.
      On 7 September 2026 after the admin list-total integration:
      
      - Cursor pagination metadata includes the backend-provided filter-scoped `total`.
      - Wards, facilities, field workers, capitation, enrollments, files and ID-card queues show the current row count against the complete filtered total.
      - Facility and field-worker KPI cards use their list summaries. Capitation uses `filteredSummary` for filtered totals and the run-wide `summary` for its rate and generated date.
      - The obsolete current-page/run-total labels and missing-capitation-summary warning were removed.
      - Admin lint, TypeScript and production build pass. The build retains the existing non-blocking large-chunk warning.
      
      On 7 September 2026 after the dashboard chart rebuild:
      
      - The enrollment trend, category, ward, LGA and status visuals were rebuilt with Recharts. The previous trend chart rendered its fixed 720-wide `viewBox` at native size and centred it inside a much wider card, which left large empty margins; a responsive container removes that entirely.
      - Zero-count buckets now read as a flat line on the baseline instead of drawing nothing, the y-axis carries values, and the average reference line no longer collides with point labels.
      - Enrollment by category, ward and LGA share a single bar-chart component, and the previous `BarList` component and its `relativeWidth` helper were removed as dead code.
      - The chart token ramp was validated for lightness, chroma, colour-vision separation and surface contrast before use; the brand lime failed the mark-contrast floor and was replaced for marks while remaining the trend area wash.
      - Recharts mount animations are disabled. They were observed stalling mid-reveal, which left the line, area and donut sectors partly drawn, and they would otherwise replay on every filter change and background refetch.
      - Admin lint, TypeScript and production build pass. Static checks confirm no `any`, no request wrappers or service imports in components, and no Recharts usage outside the chart components. Note that `tsc -b` via the build script is stricter than a bare `tsc --noEmit` and is what caught the library's tooltip and label typings.
      # Feature Folder Structure — Handoff Guide
      
      ## Root structure
      
      ```text
      src/
      ├── types/
      └── features/
          └── [feature]/
      ```
      
      ## Feature folder anatomy
      
      ```text
      src/features/[feature]/
      ├── components/
      ├── hooks/
      ├── services/
      ├── stores/
      ├── types/
      └── utils/
      ```
      
      ## The three layers
      
      ### Layer 1 — Service (`services/[feature].service.ts`)
      
      ```ts
      import { _get } from '@/api'
      
      export async function fetchVerifications(state: VerificationTableState) {
        const params = new URLSearchParams({
          page: String(state.pagination.page),
          pageSize: String(state.pagination.pageSize),
        })
      
        if (state.filters.referenceId) {
          params.set('referenceId', state.filters.referenceId)
        }
        if (state.filters.status) params.set('status', state.filters.status)
      
        const response = await _get<VerificationListResponse>(
          `/verifications?${params.toString()}`,
        )
        return response.data.data
      }
      ```
      
      Rules:
      
      - This is the only layer allowed to call `_get`, `_post`, `_put`, or `_delete`.
      - Never import a service directly in a component.
      - Return raw, unwrapped data.
      - Do not use React, hooks, or state.
      - Arrow functions and function declarations are both allowed.
      - Never use `any`; define an explicit type.
      
      ### Layer 2 — Hook (`hooks/use[Feature].ts`)
      
      ```ts
      import { useQuery } from '@tanstack/react-query'
      import { fetchVerifications } from '../services/verification.service'
      
      export function useVerifications(state: VerificationTableState) {
        return useQuery({
          queryKey: ['verifications', state],
          queryFn: () => fetchVerifications(state),
          placeholderData: (previousData) => previousData,
          staleTime: 30_000,
        })
      }
      ```
      
      Rules:
      
      - Never call `_get` or `_post` directly.
      - Always return the complete `useQuery` or `useMutation` result.
      - Include every state value that should trigger a refetch in the query key.
      - Keep one hook per logical data concern.
      - Arrow functions and function declarations are both allowed.
      - Never use `any`; define an explicit type.
      
      ### Layer 3 — Component (`components/`)
      
      ```tsx
      // Named exports are required. Either syntax is acceptable.
      
      export function VerificationTable({
        tableState,
        onPageChange,
      }: VerificationTableProps) {
        const { data, isLoading, isError } = useVerifications(tableState)
        // Render only.
      }
      
      export const VerificationTable = ({
        tableState,
        onPageChange,
      }: VerificationTableProps) => {
        const { data, isLoading, isError } = useVerifications(tableState)
        // Render only.
      }
      ```
      
      Rules:
      
      - Always use named exports; never default-export components.
      - Arrow functions and function declarations are both allowed.
      - Import data access from `hooks/`, never `services/`.
      - Never call `_get` or `_post` directly.
      - Own only local UI state.
      - Never use `any`; define explicit prop types.
      
      ## Barrel exports
      
      Each folder containing multiple files exposes one `index.ts`:
      
      ```ts
      // features/verifications/components/index.ts
      export { VerificationTable } from './verification-table'
      export { VerificationFilters } from './verification-filters'
      export { VerificationStatusBadge } from './verification-status-badge'
      
      // features/verifications/hooks/index.ts
      export { useVerifications } from './useVerifications'
      
      // features/verifications/services/index.ts
      export { fetchVerifications } from './verification.service'
      
      // features/verifications/types/index.ts
      export type {
        Verification,
        VerificationListResponse,
      } from './verification.types'
      export type {
        VerificationFilters,
        VerificationTableState,
      } from './verification-filter.types'
      ```
      
      Consumers import from the folder rather than an individual file:
      
      ```ts
      import { VerificationTable } from '@/features/verifications/components'
      import { useVerifications } from '@/features/verifications/hooks'
      ```
      
      Rules:
      
      - Add a barrel export when a folder has two or more files.
      - Single-file folders do not need an `index.ts`.
      - Always use `export type` for type-only exports.
      
      ## Data flow
      
      ```text
      Component
        calls → useVerifications(state)
      
      Hook
        calls → fetchVerifications(state)
        wraps in → useQuery({ queryKey, queryFn })
        returns → { data, isLoading, isError, ...queryResult }
      
      Service
        builds → URLSearchParams from state
        calls → _get('/verifications?...')
        returns → response.data.data
      ```
      
      ## Types placement
      
      - Feature-specific types: `features/[feature]/types/[feature].types.ts`
      - Types shared by two or more features: `src/types/[name].types.ts`
      
      ## Naming conventions
      
      | Concern | Filename | Export |
      | --- | --- | --- |
      | Service | `verification.service.ts` | `fetchVerifications` |
      | Hook | `useVerifications.ts` | `useVerifications` |
      | Types | `verification.types.ts` | `Verification`, `VerificationListResponse` |
      | Filters | `verification-filter.types.ts` | `VerificationFilters`, `VerificationTableState` |
      | Component | `verification-table.tsx` | `VerificationTable` (named export) |
      
      ## Full example
      
      ```text
      src/features/verifications/
      ├── components/
      │   ├── index.ts
      │   ├── verification-table.tsx
      │   ├── verification-filters.tsx
      │   ├── verification-status-badge.tsx
      │   ├── status-select.tsx
      │   ├── reference-id-input.tsx
      │   ├── service-select.tsx
      │   └── date-range-picker.tsx
      ├── hooks/
      │   ├── index.ts
      │   └── useVerifications.ts
      ├── services/
      │   ├── index.ts
      │   └── verification.service.ts
      ├── types/
      │   ├── index.ts
      │   ├── verification.types.ts
      │   └── verification-filter.types.ts
      └── utils/
          └── format.ts
      ```
      # Frontend Architecture Spec — Routing & Data Layer
      
      **What this pattern is called.** Routing is the *Bulletproof React / Feature-Sliced*
      split: an **app layer** (composition root) holding a **centralized route manifest**, and
      a **thin route-entry layer** (FSD calls it the *pages layer*) whose files are pure
      adapters. The data layer is a **three-layer feature architecture** with a
      **unidirectional dependency rule**: a **transport facade** over one HTTP client, a
      **service layer** acting as an **anti-corruption layer** (wire DTOs → domain types), and
      a **server-state adapter** layer of React Query hooks.
      
      ---
      
      # Part A — Routing
      
      ## A0. Layout
      
      ```
      src/
        app/router.tsx        # the ONLY place URL paths are declared
        routes/               # flat, one file per route, no subfolders, no index.ts
        features/<name>/
          components/         # index.ts barrel; contains <name>-view.tsx (the real page)
          hooks/  services/  types/  utils/
        components/layout/protected-layout.tsx
        main.tsx              # providers + <RouterProvider router={router} />
      ```
      
      ## A1. One centralized route manifest
      
      All paths live in a single `createBrowserRouter` array in `src/app/router.tsx`.
      Public/auth routes are top-level siblings. Everything authenticated is a child of one
      layout route at `path: '/'`. A `*` catch-all redirects to `/`.
      
      ```tsx
      export const router = createBrowserRouter([
        { path: '/login', element: <LoginPage /> },
        { path: '/verify-otp', element: <VerifyOtpPage /> },  // sibling on purpose: must sit
                                                              // outside the layout, and an
                                                              // unregistered path would be
                                                              // swallowed by the catch-all
        {
          path: '/',
          element: <ProtectedLayout />,
          children: [
            { index: true, element: <DashboardPage />, handle: { title: 'Dashboard' } },
            { path: 'users', element: <UsersPage />, handle: { title: 'Users' } },
            { path: 'users/:userId', element: <UserDetailPage /> },
            { path: 'roles', element: <RolesPage />, handle: { title: 'Roles' } },
            { path: 'roles/create', element: <CreateRolePage /> },   // static BEFORE :param
            { path: 'roles/:roleId/edit', element: <EditRolePage /> },
            { path: 'roles/:roleId', element: <RoleDetailPage /> },
          ],
        },
        { path: '*', element: <Navigate to="/" replace /> },
      ])
      ```
      
      Ordering: static sub-routes (`create`, `:id/edit`) are always declared **before** the
      bare `:id` route.
      
      ## A2. Route files are adapters, never implementations
      
      A file in `src/routes/` may do exactly two things: read URL params, and render one
      feature view. No markup, no data fetching, no business logic, no more than ~10 lines.
      
      ```tsx
      // src/routes/users.tsx — canonical shape
      import { UsersView } from '@/features/users/components'
      
      export function UsersPage() {
        return <UsersView />
      }
      ```
      
      ```tsx
      // src/routes/user-detail.tsx — param variant.
      // The route narrows the optional param so the feature view takes a plain string.
      import { useParams } from 'react-router-dom'
      import { UserDetailView } from '@/features/users/components'
      
      export function UserDetailPage() {
        const { userId } = useParams<{ userId: string }>()
        if (!userId) return null
        return <UserDetailView userId={userId} />
      }
      ```
      
      - Import **only** from the feature's `components/` barrel (`@/features/users/components`).
        Never a deep file path, never from `hooks/` or `services/`.
      - Naming: file `kebab-case.tsx`, export `<Name>Page`, feature component `<Name>View`.
      - **Named exports only — no default exports anywhere in `src/routes/`.**
      
      ## A3. One layout route owns the auth guard
      
      Gate auth inside the layout component, not with loaders or a `<RequireAuth>` wrapper.
      Public routes opt out by being siblings of the layout route.
      
      ```tsx
      const status = useAuthStore(selectAuthStatus)
      if (status === 'restoring') return <FullPageSpinner />
      if (status === 'unauthenticated')
        return <Navigate to="/login" replace state={{ from: location.pathname }} />
      return (/* sidebar + header + <PageHeader /> + <Outlet /> */)
      ```
      
      Kick off the auth bootstrap in `main.tsx` **before** `createRoot`, as an idempotent
      memoised promise so StrictMode's double-effect is safe.
      
      ## A4. `handle: { title }` drives the page header
      
      Only top-level nav destinations declare `handle.title`; detail and sub-routes omit it
      and render no title band. Read it in the layout with a typed guard:
      
      ```tsx
      interface RouteHandle { title?: string }
      function hasTitle(h: unknown): h is Required<RouteHandle> { /* ... */ }
      
      function usePageTitle(): string | undefined {
        const match = useMatches().findLast((m) => hasTitle(m.handle))
        return match && hasTitle(match.handle) ? match.handle.title : undefined
      }
      ```
      
      `handle.title` strings must match the sidebar nav labels one-for-one.
      
      ## A5. No React Router data APIs
      
      No `loader`, `action`, or `errorElement`. All server state is TanStack Query inside
      feature hooks. The manifest stays purely declarative.
      
      ## A6. Barrels inside features only
      
      Every feature subfolder with 2+ files gets an `index.ts`. `src/routes/` and `src/app/`
      have none — `router.tsx` imports each route file by path.
      
      ## A7. Lazy-load every non-auth route
      
      Use React Router's `lazy` so the app does not ship as a single bundle. The thin-route
      convention makes this one line per route.
      
      ---
      
      # Part B — API / data layer
      
      Three strictly-layered modules: **transport → services → hooks → components**.
      Each layer may import only the layer directly below it.
      
      ## B0. Layout
      
      ```
      src/
        api/
          api.types.ts    # envelope, pagination, error body types
          client.ts       # the single axios instance + interceptors
          errors.ts       # error normalization helpers
          request.ts      # _get / _post / _put / _patch / _delete
          index.ts        # barrel — `@/api` is the ONLY import surface
        lib/query-client.ts
        features/<name>/
          services/<name>.service.ts + index.ts
          hooks/useXxx.ts + index.ts
          types/<name>.types.ts + index.ts
          utils/           # pure wire→domain mappers
          components/
      ```
      
      ## B1. Transport (`src/api/`)
      
      ### `request.ts` — the only functions services may call
      
      ```ts
      import { api } from './client'
      import type { QueryParams, RequestConfig } from './api.types'
      
      export const _get = <T = unknown>(url: string, params?: QueryParams, config?: RequestConfig) =>
        api.get<T>(url, { ...config, params })
      
      export const _post = <T = unknown, D = unknown>(url: string, data?: D, config?: RequestConfig) =>
        api.post<T>(url, data, config)
      
      export const _put   = <T = unknown, D = unknown>(url: string, data?: D, config?: RequestConfig) => api.put<T>(url, data, config)
      export const _patch = <T = unknown, D = unknown>(url: string, data?: D, config?: RequestConfig) => api.patch<T>(url, data, config)
      export const _delete = <T = unknown>(url: string, config?: RequestConfig) => api.delete<T>(url, config)
      ```
      
      Non-negotiable details:
      
      - Generics default to `unknown`, **never `any`** — an untyped call must fail to compile.
      - Write verbs take two generics: `<TResponse, TBody>`.
      - Wrappers return the **full `AxiosResponse<T>`**, not `.data`. Unwrapping is the
        service's job (`response.data.data`).
      - `_get` takes query params as a **params object in the second argument** — never
        hand-built `URLSearchParams` in the URL string. Let axios serialize.
      
      ### `api.types.ts` — the shared contracts
      
      ```ts
      export type QueryParamValue = string | number | boolean | null | undefined
      export type QueryParams = Record<string, QueryParamValue | QueryParamValue[]>
      export type RequestConfig = Omit<AxiosRequestConfig, 'url' | 'method' | 'data'>
      
      export interface ApiResponse<T> { data: T; message?: string; success?: boolean }
      export interface PaginationMeta { page: number; pageSize: number; total: number; totalPages: number }
      export interface PaginatedApiResponse<T> extends ApiResponse<T[]> { meta: PaginationMeta }
      export interface ApiErrorBody { message?: string; error?: string; errors?: Record<string, string[]> }
      export interface AuthTokens { accessToken: string; refreshToken: string }
      ```
      
      ### `client.ts` — one axios instance, two interceptors
      
      - `baseURL` from a single typed env var (declare it in `vite-env.d.ts`).
      - **Request interceptor** attaches `Authorization: Bearer <accessToken>` from the auth store.
      - **Response interceptor** handles 401 with refresh-and-replay:
        - A separate bare `refreshClient` instance performs the refresh so it **cannot
          re-enter the interceptors and recurse**.
        - An `UNAUTHENTICATED_PATHS` allowlist (`/auth/login`, `/auth/verify-login`,
          `/auth/forgot-password`, the refresh endpoint) is exempt — a 401 on OTP verify
          means "wrong code", not "expired session", and must not trigger a redirect.
        - An `isRefreshing` flag plus a `failedQueue` so concurrent 401s park on the single
          in-flight refresh instead of each firing their own.

## Activity

    web search: site:developer.mozilla.org Progressive web apps installable service worker offline cache storage persist IndexedDB ...

## Activity

    web search: site:developer.mozilla.org navigator.storage.persist storage quotas eviction IndexedDB ...

## Activity

    web search: site:developer.mozilla.org web app manifest install PWA secure context criteria ...

## Activity

    web search: site:dexie.org/docs Version stores upgrade transaction Dexie official ...

## Activity

    $ /bin/zsh -lc "sed -n '1,240p' /Users/admin/.codex/skills/.system/skill-creator/references/openai_yaml.md; wc -l /Users/admin/.codex/skills/.system/skill-creator/SKILL.md /Users/admin/.codex/plugins/cache/openai-bundled/sites/0.1.27/skills/sites-building/SKILL.md; git status --short"
    status: Completed · exit 0

## Assistant

Research is complete. I’m now building the first complete edition: a visual handbook with a capability ladder, full data-layer architecture, service-worker lifecycle, storage model, durable sync state machine, security boundaries, testing matrix, and the PLASCHEMA case study. The diagrams will use accessible HTML/CSS so they remain readable, printable, and offline without external libraries.

## Activity

    $ /bin/zsh -lc 'mkdir -p pwa-engineering-playbook/assets pwa-engineering-playbook/lessons pwa-engineering-playbook/reference pwa-engineering-playbook/skill/pwa-engineering/agents pwa-engineering-playbook/skill/pwa-engineering/references'
    status: Completed · exit 0

## Activity

    file changes: Completed · 4 changes
    Add: /Users/admin/Developer/projects/plaschema/pwa-engineering-playbook/assets/site.js
    const root = new URL('../', import.meta.url)
    
    document.querySelectorAll('[data-quiz]').forEach((quiz) => {
      const button = quiz.querySelector('button')
      button?.addEventListener('click', () => {
        const open = quiz.classList.toggle('open')
        button.setAttribute('aria-expanded', String(open))
        button.textContent = open ? 'Hide answer' : 'Check answer'
      })
    })
    
    const toast = document.querySelector('[data-update-toast]')
    const updateButton = toast?.querySelector('button')
    let waitingWorker
    
    function showUpdate(worker) {
      waitingWorker = worker
      toast?.removeAttribute('hidden')
    }
    
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      let reloading = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloading) return
        reloading = true
        location.reload()
      })
    
      navigator.serviceWorker.register(new URL('sw.js', root), { updateViaCache: 'none' })
        .then((registration) => {
          if (registration.waiting && navigator.serviceWorker.controller) showUpdate(registration.waiting)
          registration.addEventListener('updatefound', () => {
            const worker = registration.installing
            worker?.addEventListener('statechange', () => {
              if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdate(worker)
            })
          })
          window.setInterval(() => registration.update(), 60 * 60 * 1000)
        })
        .catch(() => { /* The handbook still works as a normal static site. */ })
    }
    
    updateButton?.addEventListener('click', () => waitingWorker?.postMessage({ type: 'SKIP_WAITING' }))
    Add: /Users/admin/Developer/projects/plaschema/pwa-engineering-playbook/assets/styles.css
    :root {
      color-scheme: light;
      --ink: #17211b;
      --muted: #5d6a62;
      --paper: #f6f7f2;
      --surface: #ffffff;
      --line: #d9dfd9;
      --brand: #173f32;
      --brand-2: #28634e;
      --lime: #b6e875;
      --lime-soft: #e8f7d5;
      --blue: #dcecff;
      --amber: #fff0c7;
      --red: #ffe1dc;
      --shadow: 0 18px 50px rgb(23 63 50 / 9%);
      --radius: 1.25rem;
      --measure: 72rem;
    }
    
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      background: var(--paper);
      color: var(--ink);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.65;
    }
    body::before {
      position: fixed;
      inset: 0 0 auto;
      z-index: -1;
      height: 25rem;
      background:
        radial-gradient(circle at 78% 8%, rgb(182 232 117 / 38%), transparent 30%),
        linear-gradient(145deg, #eef7e7, #f6f7f2 58%);
      content: "";
    }
    a { color: var(--brand-2); text-underline-offset: .2em; }
    a:hover { color: var(--brand); }
    button, input { font: inherit; }
    button { cursor: pointer; }
    code, pre { font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; }
    code { font-size: .92em; }
    pre {
      overflow: auto;
      margin: 1.25rem 0;
      border: 1px solid #294238;
      border-radius: 1rem;
      background: #10271f;
      color: #eef8f0;
      padding: 1.1rem;
      line-height: 1.55;
    }
    pre code { font-size: .86rem; }
    .skip-link { position: fixed; top: -5rem; left: 1rem; z-index: 50; background: var(--ink); color: white; padding: .7rem 1rem; }
    .skip-link:focus { top: 1rem; }
    .site-header {
      position: sticky;
      top: 0;
      z-index: 20;
      border-bottom: 1px solid rgb(217 223 217 / 85%);
      background: rgb(246 247 242 / 92%);
      backdrop-filter: blur(12px);
    }
    .header-inner, .shell, .footer-inner { width: min(calc(100% - 2rem), var(--measure)); margin-inline: auto; }
    .header-inner { display: flex; min-height: 4.5rem; align-items: center; justify-content: space-between; gap: 1rem; }
    .brand { display: flex; align-items: center; gap: .75rem; color: var(--ink); text-decoration: none; font-weight: 850; letter-spacing: -.02em; }
    .brand-mark { display: grid; width: 2.25rem; height: 2.25rem; place-items: center; border-radius: .7rem; background: var(--brand); color: var(--lime); font-size: .78rem; }
    .site-nav { display: flex; flex-wrap: wrap; align-items: center; gap: .4rem; }
    .site-nav a { border-radius: 999px; color: var(--muted); padding: .45rem .7rem; text-decoration: none; font-size: .88rem; font-weight: 700; }
    .site-nav a:hover, .site-nav a[aria-current="page"] { background: var(--lime-soft); color: var(--brand); }
    .shell { padding-block: 3rem 5rem; }
    .hero { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(18rem, .65fr); gap: 2rem; align-items: end; padding: 2.5rem 0 3.5rem; }
    .eyebrow { margin: 0 0 .75rem; color: var(--brand-2); font-size: .78rem; font-weight: 850; letter-spacing: .12em; text-transform: uppercase; }
    h1, h2, h3 { line-height: 1.13; letter-spacing: -.035em; }
    h1 { max-width: 16ch; margin: 0; font-size: clamp(2.6rem, 7vw, 5.8rem); }
    h2 { margin: 3rem 0 1rem; font-size: clamp(1.8rem, 4vw, 3rem); }
    h3 { margin: 2rem 0 .65rem; font-size: 1.3rem; }
    .lede { max-width: 65ch; color: var(--muted); font-size: clamp(1.08rem, 2vw, 1.35rem); }
    .hero-note { border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); padding: 1.4rem; box-shadow: var(--shadow); }
    .hero-note strong { display: block; margin-bottom: .35rem; font-size: 1.2rem; }
    .button-row { display: flex; flex-wrap: wrap; gap: .75rem; margin-top: 1.5rem; }
    .button { display: inline-flex; min-height: 2.8rem; align-items: center; justify-content: center; border: 1px solid var(--brand); border-radius: 999px; background: var(--brand); color: white; padding: .65rem 1rem; text-decoration: none; font-weight: 800; }
    .button.secondary { background: transparent; color: var(--brand); }
    .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
    .grid.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .card { border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); padding: 1.4rem; box-shadow: 0 8px 24px rgb(23 63 50 / 5%); }
    .card h3 { margin-top: 0; }
    .card p:last-child { margin-bottom: 0; }
    .card-number { color: var(--brand-2); font-size: .78rem; font-weight: 900; letter-spacing: .09em; text-transform: uppercase; }
    .lesson-list { display: grid; gap: .75rem; padding: 0; list-style: none; }
    .lesson-list a { display: grid; grid-template-columns: 3rem minmax(0, 1fr) auto; gap: 1rem; align-items: center; border: 1px solid var(--line); border-radius: 1rem; background: var(--surface); color: var(--ink); padding: 1rem 1.1rem; text-decoration: none; }
    .lesson-list a:hover { border-color: var(--brand-2); transform: translateY(-1px); }
    .lesson-list .num { color: var(--brand-2); font-weight: 900; }
    .lesson-list small { color: var(--muted); }
    .lesson-list .arrow { font-size: 1.3rem; }
    .chapter { display: grid; grid-template-columns: minmax(13rem, .28fr) minmax(0, .72fr); gap: 3rem; align-items: start; }
    .toc { position: sticky; top: 6rem; border-left: 3px solid var(--lime); padding-left: 1rem; }
    .toc a { display: block; margin: .45rem 0; color: var(--muted); text-decoration: none; font-size: .9rem; }
    .toc a:hover { color: var(--brand); }
    .article { max-width: 52rem; }
    .article > :first-child { margin-top: 0; }
    .callout { margin: 1.5rem 0; border-left: 5px solid var(--brand-2); border-radius: 0 1rem 1rem 0; background: var(--blue); padding: 1rem 1.2rem; }
    .callout.warning { border-color: #b57400; background: var(--amber); }
    .callout.danger { border-color: #a3372a; background: var(--red); }
    .callout.success { border-color: var(--brand-2); background: var(--lime-soft); }
    .callout strong { display: block; margin-bottom: .25rem; }
    .diagram { margin: 1.5rem 0; border: 1px solid var(--line); border-radius: var(--radius); background: #fbfcf9; padding: 1.25rem; }
    .diagram figcaption { margin-bottom: 1rem; font-weight: 850; }
    .flow { display: flex; flex-wrap: wrap; align-items: stretch; justify-content: center; gap: .55rem; }
    .node { display: grid; min-width: 8rem; max-width: 12rem; min-height: 5rem; place-content: center; border: 1px solid #aab8af; border-radius: .9rem; background: white; padding: .75rem; text-align: center; font-size: .86rem; font-weight: 800; }
    .node small { display: block; margin-top: .25rem; color: var(--muted); font-weight: 500; }
    .node.primary { border-color: var(--brand); background: var(--brand); color: white; }
    .node.local { background: var(--lime-soft); }
    .node.server { background: var(--blue); }
    .node.warning { background: var(--amber); }
    .connector { display: grid; place-items: center; color: var(--brand-2); font-weight: 900; }
    .layers { display: grid; gap: .55rem; max-width: 38rem; margin-inline: auto; }
    .layer { border: 1px solid var(--line); border-radius: .8rem; background: white; padding: .75rem 1rem; text-align: center; font-weight: 800; }
    .layer:nth-child(odd) { background: var(--lime-soft); }
    .matrix { width: 100%; border-collapse: collapse; margin: 1.25rem 0; font-size: .92rem; }
    .matrix th, .matrix td { border: 1px solid var(--line); padding: .7rem; text-align: left; vertical-align: top; }
    .matrix th { background: #eaf0eb; }
    .state-map { display: grid; grid-template-columns: repeat(4, minmax(8rem, 1fr)); gap: .65rem; }
    .state { position: relative; border: 1px solid var(--line); border-radius: .9rem; background: white; padding: .9rem; }
    .state b { display: block; color: var(--brand); }
    .state small { color: var(--muted); }
    .state.failure { background: var(--red); }
    .state.wait { background: var(--amber); }
    .state.done { background: var(--lime-soft); }
    .checklist { padding: 0; list-style: none; }
    .checklist li { position: relative; margin: .65rem 0; padding-left: 1.8rem; }
    .checklist li::before { position: absolute; left: 0; top: .18rem; width: 1.1rem; height: 1.1rem; border: 2px solid var(--brand-2); border-radius: .25rem; content: ""; }
    .quiz { margin-top: 2rem; border: 1px solid var(--line); border-radius: var(--radius); background: white; padding: 1.25rem; }
    .quiz button { border: 1px solid var(--line); border-radius: .65rem; background: var(--paper); padding: .55rem .8rem; }
    .quiz [data-answer] { display: none; margin-top: .75rem; color: var(--brand); font-weight: 700; }
    .quiz.open [data-answer] { display: block; }
    .sources { border-top: 1px solid var(--line); margin-top: 3rem; padding-top: 1rem; font-size: .9rem; }
    .sources li { margin: .45rem 0; }
    .pager { display: flex; justify-content: space-between; gap: 1rem; border-top: 1px solid var(--line); margin-top: 3rem; padding-top: 1.5rem; }
    .pager a { font-weight: 800; text-decoration: none; }
    .update-toast { position: fixed; right: 1rem; bottom: 1rem; z-index: 40; width: min(25rem, calc(100% - 2rem)); border: 1px solid #315a49; border-radius: 1rem; background: #10271f; color: white; padding: 1rem; box-shadow: var(--shadow); }
    .update-toast[hidden] { display: none; }
    .update-toast p { margin: 0 0 .75rem; }
    .update-toast button { border: 0; border-radius: 999px; background: var(--lime); color: #10271f; padding: .55rem .85rem; font-weight: 850; }
    .site-footer { border-top: 1px solid var(--line); background: white; }
    .footer-inner { display: flex; justify-content: space-between; gap: 2rem; padding-block: 2rem; color: var(--muted); font-size: .9rem; }
    .kicker { display: inline-block; border-radius: 999px; background: var(--lime-soft); color: var(--brand); padding: .2rem .55rem; font-size: .75rem; font-weight: 850; }
    
    @media (max-width: 800px) {
      .header-inner { align-items: flex-start; flex-direction: column; padding-block: .8rem; }
      .site-header { position: static; }
      .hero, .chapter { grid-template-columns: 1fr; }
      .toc { position: static; }
      .grid, .grid.two { grid-template-columns: 1fr; }
      .state-map { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .shell { padding-top: 2rem; }
    }
    
    @media (max-width: 520px) {
      .site-nav a { padding-left: .35rem; padding-right: .35rem; }
      .lesson-list a { grid-template-columns: 2rem minmax(0, 1fr); }
      .lesson-list .arrow { display: none; }
      .state-map { grid-template-columns: 1fr; }
      .footer-inner { flex-direction: column; }
      h1 { font-size: 2.65rem; }
    }
    
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; }
    }
    
    @media print {
      .site-header, .site-footer, .pager, .button-row, .update-toast, .quiz button { display: none !important; }
      body, body::before { background: white; }
      .shell { width: 100%; padding: 0; }
      .chapter { display: block; }
      .toc { position: static; margin-bottom: 2rem; }
      .card, .diagram, pre { break-inside: avoid; box-shadow: none; }
      a { color: inherit; text-decoration: none; }
      a[href^="http"]::after { content: " (" attr(href) ")"; font-size: .75em; overflow-wrap: anywhere; }
    }
    Add: /Users/admin/Developer/projects/plaschema/pwa-engineering-playbook/manifest.webmanifest
    {
      "name": "Production PWA Engineering Playbook",
      "short_name": "PWA Playbook",
      "description": "A detailed, plain-language guide to production progressive web applications.",
      "start_url": "./index.html",
      "scope": "./",
      "display": "standalone",
      "background_color": "#f6f7f2",
      "theme_color": "#173f32",
      "icons": [
        { "src": "assets/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
        { "src": "assets/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
      ]
    }
    Add: /Users/admin/Developer/projects/plaschema/pwa-engineering-playbook/sw.js
    const CACHE_PREFIX = 'pwa-engineering-playbook-'
    const CACHE_NAME = `${CACHE_PREFIX}2026-09-10-v1`
    const OFFLINE_URL = './index.html'
    const PRECACHE = [
      './', './index.html', './manifest.webmanifest', './assets/styles.css', './assets/site.js',
      './assets/icon-192.png', './assets/icon-512.png',
      './lessons/01-mental-model.html', './lessons/02-capability-levels.html',
      './lessons/03-data-architecture.html', './lessons/04-service-worker-updates.html',
      './lessons/05-local-storage.html', './lessons/06-offline-reads.html',
      './lessons/07-durable-sync.html', './lessons/08-files-and-auth.html',
      './lessons/09-security.html', './lessons/10-testing-and-operations.html',
      './lessons/11-plaschema-case-study.html', './reference/glossary.html',
      './reference/decision-checklists.html', './reference/state-machines.html',
      './reference/sources.html', './AGENT_GUIDE.md'
    ]
    
    self.addEventListener('install', (event) => {
      event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)))
    })
    
    self.addEventListener('activate', (event) => {
      event.waitUntil(
        caches.keys()
          .then((names) => Promise.all(names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map((name) => caches.delete(name))))
          .then(() => self.clients.claim()),
      )
    })
    
    self.addEventListener('message', (event) => {
      if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
    })
    
    self.addEventListener('fetch', (event) => {
      if (event.request.method !== 'GET') return
      const url = new URL(event.request.url)
      if (url.origin !== self.location.origin) return
    
      if (event.request.mode === 'navigate') {
        event.respondWith(fetch(event.request).catchthen)
      }
    })

## Activity

    file changes: Completed · 1 changes
    Update { move_path: None }: /Users/admin/Developer/projects/plaschema/pwa-engineering-playbook/sw.js
    @@ -38,4 +38,17 @@
       if (event.request.mode === 'navigate') {
    -    event.respondWith(fetch(event.request).catchthen)
    +    event.respondWith(
    +      fetch(event.request)
    +        .then((response) => {
    +          if (response.ok) {
    +            const copy = response.clone()
    +            event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)))
    +          }
    +          return response
    +        })
    +        .catch(async () => (await caches.match(event.request)) || caches.match(OFFLINE_URL)),
    +    )
    +    return
       }
    +
    +  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)))
     })

## Activity

    $ /bin/zsh -lc 'cp pwa/public/icon-192.png pwa-engineering-playbook/assets/icon-192.pngcp pwa/public/icon-512.png pwa-engineering-playbook/assets/icon-512.png'
    status: Completed · exit 0

## Activity

    file changes: Completed · 1 changes
    Add: /Users/admin/Developer/projects/plaschema/pwa-engineering-playbook/index.html
    <!doctype html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta name="theme-color" content="#173f32">
      <meta name="description" content="A detailed, plain-language engineering playbook for production progressive web applications.">
      <title>Production PWA Engineering Playbook</title>
      <link rel="manifest" href="manifest.webmanifest">
      <link rel="icon" href="assets/icon-192.png">
      <link rel="stylesheet" href="assets/styles.css">
      <script type="module" src="assets/site.js"></script>
    </head>
    <body>
      <a class="skip-link" href="#main">Skip to content</a>
      <header class="site-header">
        <div class="header-inner">
          <a class="brand" href="index.html"><span class="brand-mark">PWA</span><span>Engineering Playbook</span></a>
          <nav class="site-nav" aria-label="Main navigation">
            <a href="#paths">Paths</a><a href="#lessons">Lessons</a><a href="reference/decision-checklists.html">Checklists</a><a href="reference/glossary.html">Glossary</a>
          </nav>
        </div>
      </header>
    
      <main class="shell" id="main">
        <section class="hero">
          <div>
            <p class="eyebrow">Production PWA engineering · verified 10 September 2026</p>
            <h1>Build web apps that keep their promises offline.</h1>
            <p class="lede">A practical and detailed guide to app shells, local databases, safe updates, durable sync, files, authentication, security, testing, and operations.</p>
            <div class="button-row"><a class="button" href="lessons/01-mental-model.html">Start the course</a><a class="button secondary" href="reference/decision-checklists.html">Plan a PWA</a></div>
          </div>
          <aside class="hero-note">
            <span class="kicker">The central idea</span>
            <strong>Installation is optional. Preparation is not.</strong>
            <p>A service worker can cache a web app during an ordinary browser visit. The app can then reopen offline within that worker's scope—even if the user never adds it to a home screen.</p>
          </aside>
        </section>
    
        <figure class="diagram" aria-labelledby="big-picture-caption">
          <figcaption id="big-picture-caption">The production PWA system: five parts with different jobs</figcaption>
          <div class="flow">
            <div class="node primary">Screen and components<small>Show state and accept intent</small></div><span class="connector" aria-hidden="true">→</span>
            <div class="node">Feature services<small>Apply product rules</small></div><span class="connector" aria-hidden="true">→</span>
            <div class="node local">Local database<small>Drafts, files, outbox, reference data</small></div><span class="connector" aria-hidden="true">⇄</span>
            <div class="node server">API and storage<small>Shared, authoritative records</small></div>
          </div>
          <div class="flow" style="margin-top:.75rem">
            <div class="node warning">Service worker<small>Caches the app shell; manages releases</small></div><span class="connector" aria-hidden="true">↕</span>
            <div class="node">Browser cache<small>HTML, CSS, JavaScript, icons</small></div>
          </div>
          <p><strong>Do not merge these responsibilities.</strong> Cache Storage keeps HTTP responses. IndexedDB keeps structured application data. The service worker controls requests. Your foreground sync coordinator owns business synchronization unless you have proven cross-browser background support.</p>
        </figure>
    
        <section id="paths">
          <p class="eyebrow">Choose your path</p>
          <h2>Use the playbook for the work in front of you</h2>
          <div class="grid">
            <article class="card"><span class="card-number">Learn</span><h3>Build the right mental model</h3><p>Work through the lessons in order. Each one ends with a small knowledge check.</p><p><a href="lessons/01-mental-model.html">Begin with installation and offline behavior →</a></p></article>
            <article class="card"><span class="card-number">Plan</span><h3>Make the important decisions first</h3><p>Classify the app, name each source of truth, design failure behavior, then choose tools.</p><p><a href="reference/decision-checklists.html#plan">Open the planning canvas →</a></p></article>
            <article class="card"><span class="card-number">Build</span><h3>Implement in safe slices</h3><p>Ship the shell, reads, writes, files, security, and operations as independently testable layers.</p><p><a href="reference/decision-checklists.html#build">Open the build sequence →</a></p></article>
            <article class="card"><span class="card-number">Audit</span><h3>Find evidence, not vibes</h3><p>Trace real code and behavior against clear invariants, then rank gaps by data-loss and release risk.</p><p><a href="reference/decision-checklists.html#audit">Open the audit rubric →</a></p></article>
            <article class="card"><span class="card-number">Reference</span><h3>Look up a state or policy</h3><p>Use the state-machine atlas, cache matrix, glossary, and production gates during delivery.</p><p><a href="reference/state-machines.html">Browse the visual reference →</a></p></article>
            <article class="card"><span class="card-number">Case study</span><h3>See the pattern in working code</h3><p>Study PLASCHEMA's field-worker PWA and the tradeoffs behind its durable foreground outbox.</p><p><a href="lessons/11-plaschema-case-study.html">Read the case study →</a></p></article>
          </div>
        </section>
    
        <section id="lessons">
          <p class="eyebrow">Eleven lessons</p>
          <h2>From browser shell to field-ready system</h2>
          <ol class="lesson-list">
            <li><a href="lessons/01-mental-model.html"><span class="num">01</span><span><strong>The PWA mental model</strong><br><small>Installation, service-worker control, and offline reopening</small></span><span class="arrow">→</span></a></li>
            <li><a href="lessons/02-capability-levels.html"><span class="num">02</span><span><strong>Choose the capability level</strong><br><small>Shell-only, offline-read, or transactional offline-write</small></span><span class="arrow">→</span></a></li>
            <li><a href="lessons/03-data-architecture.html"><span class="num">03</span><span><strong>Design the data architecture</strong><br><small>Ownership, layers, boundaries, and data flow</small></span><span class="arrow">→</span></a></li>
            <li><a href="lessons/04-service-worker-updates.html"><span class="num">04</span><span><strong>Ship the shell and safe updates</strong><br><small>Lifecycle, caching, waiting releases, and rollback</small></span><span class="arrow">→</span></a></li>
            <li><a href="lessons/05-local-storage.html"><span class="num">05</span><span><strong>Build durable local storage</strong><br><small>IndexedDB, migrations, blobs, quotas, and cleanup</small></span><span class="arrow">→</span></a></li>
            <li><a href="lessons/06-offline-reads.html"><span class="num">06</span><span><strong>Make reads honest offline</strong><br><small>Reference data, freshness, access changes, and replacement</small></span><span class="arrow">→</span></a></li>
            <li><a href="lessons/07-durable-sync.html"><span class="num">07</span><span><strong>Build a durable write queue</strong><br><small>Idempotency, leases, retries, partial success, and conflicts</small></span><span class="arrow">→</span></a></li>
            <li><a href="lessons/08-files-and-auth.html"><span class="num">08</span><span><strong>Handle files and offline sessions</strong><br><small>Local blobs, presigned uploads, identity, and expiry</small></span><span class="arrow">→</span></a></li>
            <li><a href="lessons/09-security.html"><span class="num">09</span><span><strong>Protect sensitive device data</strong><br><small>Threats, controls, retention, shared devices, and XSS</small></span><span class="arrow">→</span></a></li>
            <li><a href="lessons/10-testing-and-operations.html"><span class="num">10</span><span><strong>Test, release, observe, and recover</strong><br><small>Failure drills, real devices, migrations, and incidents</small></span><span class="arrow">→</span></a></li>
            <li><a href="lessons/11-plaschema-case-study.html"><span class="num">11</span><span><strong>PLASCHEMA case study</strong><br><small>What works, why it works, and where to harden next</small></span><span class="arrow">→</span></a></li>
          </ol>
        </section>
      </main>
    
      <aside class="update-toast" data-update-toast hidden aria-live="polite"><p><strong>A new playbook version is ready.</strong><br>Your current page will stay open until you choose to update.</p><button type="button">Update and reload</button></aside>
      <footer class="site-footer"><div class="footer-inner"><span>Production PWA Engineering Playbook</span><span>Plain language · Detailed systems · Safe offline work</span></div></footer>
    </body>
    </html>

## Assistant

The visual foundation and learning hub are in place. I’m now filling the course with the detailed architecture, lifecycle, storage, and sync material; diagrams are being built from accessible HTML/CSS so they remain responsive, printable, and understandable without a graphics dependency.

## Activity

    file changes: Completed · 3 changes
    Add: /Users/admin/Developer/projects/plaschema/pwa-engineering-playbook/lessons/01-mental-model.html
    <!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#173f32"><title>01 · The PWA mental model</title><link rel="manifest" href="../manifest.webmanifest"><link rel="stylesheet" href="../assets/styles.css"><script type="module" src="../assets/site.js"></script></head><body>
    <a class="skip-link" href="#main">Skip to content</a><header class="site-header"><div class="header-inner"><a class="brand" href="../index.html"><span class="brand-mark">PWA</span><span>Engineering Playbook</span></a><nav class="site-nav"><a aria-current="page" href="../index.html#lessons">Lessons</a><a href="../reference/decision-checklists.html">Checklists</a><a href="../reference/glossary.html">Glossary</a></nav></div></header>
    <main class="shell chapter" id="main"><aside class="toc"><p class="eyebrow">Lesson 01</p><a href="#problem">The problem</a><a href="#four-things">Four separate things</a><a href="#visits">First and later visits</a><a href="#scope">Control and scope</a><a href="#mistakes">Mistakes</a><a href="#check">Knowledge check</a></aside><article class="article">
    <p class="eyebrow">Foundation · about 12 minutes</p><h1>The PWA mental model</h1><p class="lede">A PWA is still a website. Installation changes how it launches. A service worker changes how requests can be handled. Local storage changes what data survives. These are related, but they are not the same feature.</p>
    <h2 id="problem">The problem</h2><p>Teams often say “make it a PWA” as if one switch creates installation, offline pages, durable data, background work, and safe updates. It does not. Treating these as one feature leads to brittle systems: a home-screen icon opens a blank page offline, a cached page shows no data, or a new release deletes work that has not synchronized.</p><div class="callout success"><strong>The useful rule</strong>Describe the exact promise to the user. For example: “After one successful online visit and data download, a signed-in worker can reopen the app, complete a form with two photos, close the browser, and sync later without losing the form.” That sentence is testable.</div>
    <h2 id="four-things">Four separate things</h2>
    <figure class="diagram"><figcaption>Four capabilities that people often call “the PWA”</figcaption><div class="grid two"><div class="node"><b>Web app manifest</b><small>Name, icon, start page, colors, display mode</small></div><div class="node warning"><b>Installation</b><small>OS launcher entry and standalone window</small></div><div class="node primary"><b>Service worker</b><small>Request proxy, shell cache, lifecycle</small></div><div class="node local"><b>Durable data</b><small>IndexedDB records, files, outbox, metadata</small></div></div><p>The manifest supports installation. A service worker can be registered during a normal visit. IndexedDB exists whether the app is installed or not. Installation is not a prerequisite for offline behavior.</p></figure>
    <table class="matrix"><thead><tr><th>Capability</th><th>What it changes</th><th>What it does not guarantee</th></tr></thead><tbody><tr><td>Manifest</td><td>How the app is named, launched, and presented when installed.</td><td>Offline pages or durable business data.</td></tr><tr><td>Service worker</td><td>How requests inside its scope can reach the network or a cache.</td><td>That every page or API response has been cached.</td></tr><tr><td>Cache Storage</td><td>Stores HTTP request/response pairs such as HTML, CSS, and JavaScript.</td><td>Queryable business records or safe write synchronization.</td></tr><tr><td>IndexedDB</td><td>Stores structured records, indexes, metadata, and blobs.</td><td>Server acceptance, conflict resolution, or app-shell availability.</td></tr><tr><td>Installation</td><td>Adds an OS launch surface and may use standalone display.</td><td>Extra data durability or a different service-worker scope.</td></tr></tbody></table>
    <h2 id="visits">First visit, returning visit, offline reopening</h2><figure class="diagram"><figcaption>What changes over time</figcaption><div class="flow"><div class="node warning">First online visit<small>Browser downloads the page</small></div><span class="connector">→</span><div class="node primary">Worker installs<small>Shell files enter Cache Storage</small></div><span class="connector">→</span><div class="node local">Later visit<small>Worker controls requests in scope</small></div><span class="connector">→</span><div class="node server">Offline reopen<small>Cached shell answers navigation</small></div></div></figure><p>The first visit must reach the server. The page registers a service worker. The browser downloads and installs it. During installation the worker caches the files required to start the app. On a later navigation, once that worker controls the page, it can answer from Cache Storage even when the network is unavailable.</p><p>This works in an ordinary browser tab. Adding the app to a home screen is a convenience and presentation choice. A user who has never loaded the app online has no service worker and no cached shell, so there is nothing to open offline.</p>
    <h2 id="scope">Control and scope</h2><p>A service worker only sees requests under its registered scope. A worker at <code>/field/sw.js</code> normally controls <code>/field/…</code>, not the whole origin. Keep the worker at a stable URL and give cache names a unique product prefix. Otherwise an update may never replace the old worker, or cache cleanup may delete another application’s files on the same origin.</p><div class="callout warning"><strong>“Online” is only a hint</strong><code>navigator.onLine</code> reports whether the device appears connected to a network. A captive portal, broken DNS, expired session, or unreachable API can still make the request fail. Let users attempt safe actions and handle the real response.</div>
    <h2 id="mistakes">Common mistakes</h2><ul><li>Testing only the installed standalone window and assuming browser-tab behavior is different.</li><li>Caching <code>index.html</code> but forgetting a required script, route, font, or icon.</li><li>Calling a cached shell “offline-first” while every screen still waits for an API response.</li><li>Caching authenticated API responses without a user boundary, expiry rule, or wipe policy.</li><li>Changing the worker filename on each release, leaving the old registration behind.</li><li>Using service-worker installation and PWA installation as if they mean the same event.</li></ul>
    <div class="quiz" data-quiz id="check"><h3>Knowledge check</h3><p>A worker opens the site in Chrome, does not install it, signs in, downloads reference data, closes the tab, and later returns offline. Can the app work?</p><button type="button" aria-expanded="false">Check answer</button><p data-answer>Yes—if the first visit installed and activated a service worker, the returning page is inside its scope, the complete shell was cached, required business data was saved locally, and the saved session is still allowed offline.</p></div>
    <div class="sources"><h3>Primary sources</h3><ul><li><a href="https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Caching">MDN: PWA caching</a></li><li><a href="https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable">MDN: making PWAs installable</a></li><li><a href="https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine">MDN: Navigator.onLine</a></li></ul></div><nav class="pager"><a href="../index.html">← Home</a><a href="02-capability-levels.html">Capability levels →</a></nav>
    </article></main><aside class="update-toast" data-update-toast hidden aria-live="polite"><p><strong>A new playbook version is ready.</strong></p><button type="button">Update and reload</button></aside></body></html>
    Add: /Users/admin/Developer/projects/plaschema/pwa-engineering-playbook/lessons/02-capability-levels.html
    <!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>02 · Choose the capability level</title><link rel="manifest" href="../manifest.webmanifest"><link rel="stylesheet" href="../assets/styles.css"><script type="module" src="../assets/site.js"></script></head><body><a class="skip-link" href="#main">Skip to content</a><header class="site-header"><div class="header-inner"><a class="brand" href="../index.html"><span class="brand-mark">PWA</span><span>Engineering Playbook</span></a><nav class="site-nav"><a aria-current="page" href="../index.html#lessons">Lessons</a><a href="../reference/decision-checklists.html">Checklists</a><a href="../reference/glossary.html">Glossary</a></nav></div></header>
    <main class="shell chapter" id="main"><aside class="toc"><p class="eyebrow">Lesson 02</p><a href="#ladder">Capability ladder</a><a href="#choose">How to choose</a><a href="#promises">Write the promise</a><a href="#mistakes">Mistakes</a><a href="#check">Knowledge check</a></aside><article class="article"><p class="eyebrow">Product decision · about 12 minutes</p><h1>Choose the capability level</h1><p class="lede">Offline is not one setting. Choose the smallest level that satisfies the real field workflow, then state what remains unavailable.</p>
    <h2 id="ladder">The capability ladder</h2><div class="layers"><div class="layer">Level 3 · Offline write<br><small>Durable drafts, outbox, files, retries, conflicts, sync</small></div><div class="layer">Level 2 · Offline read<br><small>Local reference data, freshness, access scope, refresh</small></div><div class="layer">Level 1 · App shell<br><small>Cached interface, routes, icons, offline explanation</small></div><div class="layer">Web foundation<br><small>Responsive, secure, accessible, reliable online app</small></div></div>
    <h3>Level 1: app shell</h3><p>The interface opens and explains what is available. Static routes work. The app may show a cached profile or an offline page, but business data still needs the server. This suits content that is mostly online but must fail gracefully.</p><h3>Level 2: offline read</h3><p>Users can read data downloaded earlier. Each dataset needs an owner, freshness date, access signature, replacement rule, and missing-data experience. This works for manuals, catalogues, assignments, maps, or field reference lists.</p><h3>Level 3: transactional offline write</h3><p>Users can create or change important records without the server. The app must durably record intent, survive restarts, upload safely, retry without duplicates, expose failures, and resolve conflicts. This is a distributed system running on an unreliable device.</p>
    <table class="matrix"><thead><tr><th>Question</th><th>If “yes”</th><th>Design consequence</th></tr></thead><tbody><tr><td>Must a user finish work with no signal?</td><td>Level 3</td><td>Save locally before showing success.</td></tr><tr><td>Are photos, signatures, or PDFs part of the work?</td><td>Level 3+</td><td>Budget storage, separate blobs, resumable or idempotent upload.</td></tr><tr><td>Can two people edit the same server record?</td><td>Level 3+</td><td>Define version checks and conflict policy.</td></tr><tr><td>Does access change by role or assignment?</td><td>Level 2+</td><td>Scope local data by user and access signature; refresh on change.</td></tr><tr><td>Is device data sensitive?</td><td>Any level</td><td>Threat model, minimize, expire, wipe, harden against XSS.</td></tr><tr><td>Would duplicate submission cause harm?</td><td>Level 3</td><td>Backend-enforced idempotency is mandatory.</td></tr></tbody></table>
    <h2 id="choose">How to choose</h2><ol><li><strong>Start with the job.</strong> Write the step a user must complete during the worst realistic network period.</li><li><strong>Name the offline window.</strong> Ten minutes, one workday, or several weeks lead to different retention and conflict choices.</li><li><strong>Estimate volume.</strong> Count records and maximum file size per user per offline window, then add a safety margin.</li><li><strong>Classify harm.</strong> What happens if data is exposed, lost, duplicated, stale, or submitted twice?</li><li><strong>Confirm the server contract.</strong> A client cannot invent safe idempotency or conflict handling by itself.</li><li><strong>Choose fallbacks.</strong> Background Sync is not available in all major browsers; a foreground coordinator is the portable baseline.</li></ol>
    <h2 id="promises">Write the offline promise</h2><div class="callout"><strong>Template</strong>After <em>[preparation]</em>, <em>[user]</em> can <em>[actions]</em> for <em>[offline duration]</em>. The device keeps <em>[data]</em>. When a connection returns, the app <em>[sync behavior]</em>. The following remain unavailable: <em>[limits]</em>.</div><p>Example: “After signing in and downloading assigned wards, a worker can create enrollments with two files for one day offline. Every save is local first. When the API becomes reachable, records upload one at a time with the same idempotency key. New login and reference refresh remain unavailable offline.”</p>
    <h2 id="mistakes">Common mistakes</h2><ul><li>Choosing libraries before defining the offline promise.</li><li>Calling a memory cache durable.</li><li>Promising “full offline” while authentication expires in eight hours.</li><li>Depending on background browser work without a supported fallback.</li><li>Ignoring the maximum number and size of files.</li><li>Leaving conflict behavior for the implementer to invent.</li></ul>
    <div class="quiz" data-quiz id="check"><h3>Knowledge check</h3><p>A catalogue must be viewable offline, but users never change it. Which level is needed?</p><button type="button" aria-expanded="false">Check answer</button><p data-answer>Level 2. Cache the shell and save a versioned local copy of the catalogue with freshness and replacement rules. A write outbox is unnecessary.</p></div>
    <div class="sources"><h3>Primary sources</h3><ul><li><a href="https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation">MDN: offline and background operation</a></li><li><a href="https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API">MDN: Background Synchronization availability</a></li></ul></div><nav class="pager"><a href="01-mental-model.html">← Mental model</a><a href="03-data-architecture.html">Data architecture →</a></nav></article></main><aside class="update-toast" data-update-toast hidden aria-live="polite"><p><strong>A new playbook version is ready.</strong></p><button type="button">Update and reload</button></aside></body></html>
    Add: /Users/admin/Developer/projects/plaschema/pwa-engineering-playbook/lessons/03-data-architecture.html
    <!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>03 · Design the data architecture</title><link rel="manifest" href="../manifest.webmanifest"><link rel="stylesheet" href="../assets/styles.css"><script type="module" src="../assets/site.js"></script></head><body><a class="skip-link" href="#main">Skip to content</a><header class="site-header"><div class="header-inner"><a class="brand" href="../index.html"><span class="brand-mark">PWA</span><span>Engineering Playbook</span></a><nav class="site-nav"><a aria-current="page" href="../index.html#lessons">Lessons</a><a href="../reference/decision-checklists.html">Checklists</a><a href="../reference/glossary.html">Glossary</a></nav></div></header>
    <main class="shell chapter" id="main"><aside class="toc"><p class="eyebrow">Lesson 03</p><a href="#owners">Sources of truth</a><a href="#layers">Layers</a><a href="#flows">Read and write flows</a><a href="#contract">Interfaces</a><a href="#check">Knowledge check</a></aside><article class="article"><p class="eyebrow">Architecture · about 18 minutes</p><h1>Design the data architecture</h1><p class="lede">A reliable PWA gives every kind of state one clear owner. It then moves data through small layers with one-way dependencies.</p>
    <h2 id="owners">Name every source of truth</h2><table class="matrix"><thead><tr><th>Place</th><th>Owns</th><th>Lifetime</th><th>Do not use it for</th></tr></thead><tbody><tr><td>Component state</td><td>Open menus, current step, temporary input state.</td><td>Current mounted screen.</td><td>Work that must survive reload.</td></tr><tr><td>Shared client state</td><td>Session view, cross-screen preferences, transient coordinator state.</td><td>Current app process; optionally selected persistence.</td><td>Copies of every server record.</td></tr><tr><td>Server-state cache</td><td>Fetched responses and freshness while online.</td><td>Configured memory/persistence window.</td><td>Business outbox unless its persistence semantics are sufficient and tested.</td></tr><tr><td>IndexedDB</td><td>Drafts, files, outbox, cached reference records, migration metadata.</td><td>Across reloads and restarts, subject to browser storage policy.</td><td>Secrets assumed safe from same-origin JavaScript.</td></tr><tr><td>Cache Storage</td><td>HTTP responses: shell files and carefully selected public resources.</td><td>Across visits, managed by service worker.</td><td>Queryable domain records or POST bodies.</td></tr><tr><td>Server</td><td>Shared accepted records, authorization, conflict decisions, audit history.</td><td>System retention policy.</td><td>Unsent device work it has never received.</td></tr></tbody></table>
    <figure class="diagram"><figcaption>Allowed application dependencies</figcaption><div class="layers"><div class="layer">Components · render state and capture user intent</div><div class="connector">↓ call hooks</div><div class="layer">Hooks/adapters · connect React to local or server state</div><div class="connector">↓ call services</div><div class="layer">Feature services and sync coordinator · product rules and workflows</div><div class="connector">↓ call storage or transport</div><div class="layer">IndexedDB repositories + typed HTTP transport</div><div class="connector">↓ use platform primitives</div><div class="layer">Browser storage + backend API</div></div></figure>
    <p>Dependencies point downward. Components do not know Axios, presigned-upload details, database transactions, or retry rules. Storage code does not import React. Services receive typed values and return domain results. This keeps offline behavior testable without rendering the whole app.</p>
    <h2 id="layers">A practical folder shape</h2><pre><code>src/
      api/                    # one authenticated HTTP client and typed wrappers
      lib/offline-db.ts       # database schema and platform storage helpers
      features/enrollment/
        components/           # screens and status views
        hooks/                # React Query and live IndexedDB adapters
        services/
          enrollment.service.ts        # individual API calls
          offline-enrollment.service.ts # local transactions
          sync.service.ts               # durable workflow
        types/                # domain and persisted record shapes
        utils/                # pure mapping and validation</code></pre>
    <div class="callout warning"><strong>Persisted types are contracts</strong>A TypeScript rename does not migrate records already on users’ devices. Every database schema and persisted enum needs an explicit forward migration or compatibility reader.</div>
    <h2 id="flows">Design two different flows</h2><h3>Read flow</h3><figure class="diagram"><figcaption>Online refresh with an offline fallback</figcaption><div class="flow"><div class="node primary">Screen</div><span class="connector">←</span><div class="node local">Live local query</div><span class="connector">←</span><div class="node">Reference service</div><span class="connector">←</span><div class="node server">API stream</div></div><p>The screen reads stable local records. A service refreshes them in the background using a transaction. This avoids a half-old, half-new dataset.</p></figure><h3>Write flow</h3><figure class="diagram"><figcaption>Local success first; server acceptance later</figcaption><div class="flow"><div class="node primary">User saves</div><span class="connector">→</span><div class="node local">Atomic local transaction</div><span class="connector">→</span><div class="node warning">Outbox coordinator</div><span class="connector">→</span><div class="node server">API accepts</div></div><p>The save button succeeds only after the local transaction commits. Network work is a separate state transition. The UI never pretends an API timeout means the local work disappeared.</p></figure>
    <h2 id="contract">Small interfaces keep choices replaceable</h2><pre><code>type SyncStatus =
      | 'pending' | 'uploading' | 'submitting'
      | 'accepted' | 'failed'
    
    interface OutboxRepository&lt;T&gt; {
      enqueue(value: T): Promise&lt;string&gt;
      claimReady(ownerId: string, now: Date): Promise&lt;T | null&gt;
      markAccepted(localId: string, receipt: ServerReceipt): Promise&lt;void&gt;
      markFailed(localId: string, failure: SyncFailure): Promise&lt;void&gt;
    }
    
    interface EnrollmentTransport {
      create(payload: CreateEnrollmentPayload): Promise&lt;ServerReceipt&gt;
    }</code></pre><p>The repository owns atomic local changes. The transport owns the wire format. The coordinator owns order and recovery. A hook triggers the coordinator and exposes progress. A component only renders the result.</p>
    <h3>Questions every architecture must answer</h3><ul class="checklist"><li>Which copy is authoritative before sync and after sync?</li><li>How is data separated between users on a shared origin?</li><li>What survives reload, logout, expiry, and app update?</li><li>Which operation must be atomic?</li><li>How does a screen observe local changes?</li><li>What does the server return so a retry is safe?</li><li>When may local data be removed?</li></ul>
    <div class="quiz" data-quiz id="check"><h3>Knowledge check</h3><p>Should a React Query result be copied into a shared store “so every screen can use it”?</p><button type="button" aria-expanded="false">Check answer</button><p data-answer>Usually no. Let the server-state cache own fetched data and let screens query it by stable keys. Persist only the datasets that have an explicit offline contract, with their own schema and freshness rules.</p></div>
    <div class="sources"><h3>Primary sources</h3><ul><li><a href="https://tanstack.com/query/latest/docs/reference/QueryClient">TanStack Query: QueryClient</a></li><li><a href="https://dexie.org/docs/dexie-react-hooks/useLiveQuery()">Dexie: useLiveQuery</a></li><li><a href="https://www.w3.org/TR/IndexedDB/">W3C: Indexed Database API</a></li></ul></div><nav class="pager"><a href="02-capability-levels.html">← Capability levels</a><a href="04-service-worker-updates.html">Service workers and updates →</a></nav></article></main><aside class="update-toast" data-update-toast hidden aria-live="polite"><p><strong>A new playbook version is ready.</strong></p><button type="button">Update and reload</button></aside></body></html>

## Activity

    file changes: Completed · 4 changes
    Add: /Users/admin/Developer/projects/plaschema/pwa-engineering-playbook/lessons/04-service-worker-updates.html
    <!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>04 · Ship the shell and safe updates</title><link rel="manifest" href="../manifest.webmanifest"><link rel="stylesheet" href="../assets/styles.css"><script type="module" src="../assets/site.js"></script></head><body><a class="skip-link" href="#main">Skip to content</a><header class="site-header"><div class="header-inner"><a class="brand" href="../index.html"><span class="brand-mark">PWA</span><span>Engineering Playbook</span></a><nav class="site-nav"><a aria-current="page" href="../index.html#lessons">Lessons</a><a href="../reference/state-machines.html">State maps</a><a href="../reference/glossary.html">Glossary</a></nav></div></header>
    <main class="shell chapter" id="main"><aside class="toc"><p class="eyebrow">Lesson 04</p><a href="#lifecycle">Lifecycle</a><a href="#cache">Cache policy</a><a href="#updates">Safe updates</a><a href="#compatibility">Version compatibility</a><a href="#recipe">Recipe</a><a href="#check">Knowledge check</a></aside><article class="article"><p class="eyebrow">App shell · about 20 minutes</p><h1>Ship the shell and safe updates</h1><p class="lede">A service worker is a versioned network proxy with its own lifecycle. Treat each release as a coordinated change between open pages, cached files, local data, and the server.</p>
    <h2 id="lifecycle">The lifecycle</h2><figure class="diagram"><figcaption>How a new service worker becomes active</figcaption><div class="state-map"><div class="state"><b>Downloaded</b><small>Browser detects byte changes at the same worker URL.</small></div><div class="state"><b>Installing</b><small>New shell cache is populated. Failure keeps the old worker.</small></div><div class="state wait"><b>Waiting</b><small>Old worker still controls open pages.</small></div><div class="state done"><b>Active</b><small>New worker handles later requests after activation.</small></div></div><p>The waiting stage prevents one page from mixing files from two app versions. A user-approved update may send a message to the waiting worker, call <code>skipWaiting()</code>, listen for <code>controllerchange</code>, and reload once. Do not force this while a user is completing a long form unless the whole release is proven compatible.</p></figure>
    <h2 id="cache">Choose cache policy by resource</h2><table class="matrix"><thead><tr><th>Resource</th><th>Usual policy</th><th>Reason</th></tr></thead><tbody><tr><td>Hashed JS/CSS and icons</td><td>Precache / cache first</td><td>Immutable name identifies exact content.</td></tr><tr><td>SPA shell HTML</td><td>Precache as navigation fallback, or network first</td><td>Must start offline but release freshness matters.</td></tr><tr><td>Public images or fonts</td><td>Cache first revalidate or cache first with limits</td><td>Speed benefit; bounded staleness is acceptable.</td></tr><tr><td>Authenticated API response</td><td>Network only by default</td><td>A shared HTTP cache can cross user or authorization boundaries.</td></tr><tr><td>Offline business data</td><td>IndexedDB with explicit schema</td><td>Needs queries, ownership, migrations, and retention.</td></tr><tr><td>POST/PUT/PATCH/DELETE</td><td>Never response-cache as a read</td><td>Record intent in an outbox and send deliberately.</td></tr></tbody></table>
    <div class="callout danger"><strong>Cache cleanup boundary</strong>Delete only caches with this application’s prefix. Multiple products can share one origin. A broad <code>caches.keys().map(delete)</code> can erase another app’s offline files.</div>
    <h2 id="updates">Prompt versus automatic activation</h2><p><strong>Prompt update</strong> is the safe default for forms and offline writes. It lets users finish or save before the page reloads. <strong>Automatic update</strong> can fit read-only content where mixed-version risk is low and reload cannot lose work.</p><ol><li>Register the worker at one stable URL and request update checks without a stale HTTP cache.</li><li>When a new worker reaches <em>waiting</em>, show a clear, non-blocking prompt.</li><li>Disable or defer activation if an unsaved action cannot survive reload.</li><li>When the user agrees, message the waiting worker.</li><li>The worker calls <code>skipWaiting()</code>.</li><li>The page receives one <code>controllerchange</code> event and reloads once.</li><li>The new worker removes only obsolete, prefixed caches during activation.</li></ol>
    <h2 id="compatibility">The compatibility square</h2><figure class="diagram"><figcaption>A release must keep four versions able to work together</figcaption><div class="grid two"><div class="node primary">Open page<small>May be hours old</small></div><div class="node warning">Active service worker<small>May be one release behind</small></div><div class="node local">Local database<small>May contain years-old records</small></div><div class="node server">Backend API<small>May roll out before or after the client</small></div></div></figure><p>Database migrations must move forward from every supported installed version. APIs should tolerate the supported client window. A new worker should not activate into an old page if it will return incompatible assets. A rollback must understand data already migrated by the failed release.</p>
    <h2 id="recipe">Prompt update recipe</h2><pre><code>const registration = await navigator.serviceWorker.register('/sw.js', {
      updateViaCache: 'none',
    })
    
    function offerUpdate(worker: ServiceWorker) {
      showPrompt(() =&gt; worker.postMessage({ type: 'SKIP_WAITING' }))
    }
    
    if (registration.waiting &amp;&amp; navigator.serviceWorker.controller) {
      offerUpdate(registration.waiting)
    }
    
    registration.addEventListener('updatefound', () =&gt; {
      const worker = registration.installing
      worker?.addEventListener('statechange', () =&gt; {
        if (worker.state === 'installed' &amp;&amp; navigator.serviceWorker.controller) {
          offerUpdate(worker)
        }
      })
    })
    
    let reloading = false
    navigator.serviceWorker.addEventListener('controllerchange', () =&gt; {
      if (reloading) return
      reloading = true
      location.reload()
    })</code></pre>
    <h3>Release checklist</h3><ul class="checklist"><li>Every file required for first paint is in the precache.</li><li>The worker URL and scope did not move accidentally.</li><li>The worker response uses revalidation-friendly HTTP headers.</li><li>Old pages can call the new API during the compatibility window.</li><li>New pages can read existing local records after migration.</li><li>The update prompt works with unsaved and queued work.</li><li>A failed install leaves the old worker usable.</li><li>Rollback has been tested after the new database version opened.</li></ul>
    <div class="quiz" data-quiz id="check"><h3>Knowledge check</h3><p>Why can “always call skipWaiting during install” be dangerous?</p><button type="button" aria-expanded="false">Check answer</button><p data-answer>The new worker can begin controlling a page loaded from the old release. Later requests may receive incompatible files or behavior. A prompt and controlled reload keep one page version together.</p></div>
    <div class="sources"><h3>Primary sources</h3><ul><li><a href="https://web.dev/articles/service-worker-lifecycle">web.dev: service worker lifecycle</a></li><li><a href="https://web.dev/learn/pwa/update/">web.dev: updating a PWA</a></li><li><a href="https://vite-pwa-org.netlify.app/guide/auto-update">Vite PWA: update behavior</a></li><li><a href="https://developer.chrome.com/docs/workbox/modules/workbox-precaching">Workbox precaching</a></li></ul></div><nav class="pager"><a href="03-data-architecture.html">← Data architecture</a><a href="05-local-storage.html">Local storage →</a></nav></article></main><aside class="update-toast" data-update-toast hidden aria-live="polite"><p><strong>A new playbook version is ready.</strong></p><button type="button">Update and reload</button></aside></body></html>
    Add: /Users/admin/Developer/projects/plaschema/pwa-engineering-playbook/lessons/05-local-storage.html
    <!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>05 · Build durable local storage</title><link rel="manifest" href="../manifest.webmanifest"><link rel="stylesheet" href="../assets/styles.css"><script type="module" src="../assets/site.js"></script></head><body><a class="skip-link" href="#main">Skip to content</a><header class="site-header"><div class="header-inner"><a class="brand" href="../index.html"><span class="brand-mark">PWA</span><span>Engineering Playbook</span></a><nav class="site-nav"><a aria-current="page" href="../index.html#lessons">Lessons</a><a href="../reference/state-machines.html">State maps</a><a href="../reference/glossary.html">Glossary</a></nav></div></header>
    <main class="shell chapter" id="main"><aside class="toc"><p class="eyebrow">Lesson 05</p><a href="#stores">Storage choices</a><a href="#schema">Schema</a><a href="#atomic">Transactions</a><a href="#migrations">Migrations</a><a href="#quota">Quota and retention</a><a href="#check">Knowledge check</a></aside><article class="article"><p class="eyebrow">Device data · about 20 minutes</p><h1>Build durable local storage</h1><p class="lede">IndexedDB is the durable business-data layer. Design it like a real database: schema, indexes, transactions, migrations, ownership, retention, and failure handling.</p>
    <h2 id="stores">Use each browser store for its real job</h2><table class="matrix"><thead><tr><th>Store</th><th>Good fit</th><th>Main risk</th></tr></thead><tbody><tr><td>Memory / component state</td><td>Temporary interaction state.</td><td>Lost on reload.</td></tr><tr><td>localStorage</td><td>Small non-sensitive preferences and simple session hints.</td><td>Synchronous, string-only, readable by same-origin JavaScript.</td></tr><tr><td>Cache Storage</td><td>HTTP responses used by a service worker.</td><td>No domain indexes; stale or cross-user data if policy is careless.</td></tr><tr><td>IndexedDB</td><td>Structured records, indexes, large values, blobs, transactions.</td><td>Schema upgrades, quota, eviction, and same-origin script access.</td></tr></tbody></table>
    <h2 id="schema">A useful offline-write schema</h2><pre><code>drafts:      '&amp;ownerUserId, updatedAt'
    outbox:      '&amp;localId, ownerUserId, [ownerUserId+status], retryAt'
    files:       '&amp;id, ownerUserId, localId, [localId+purpose]'
    references:  '&amp;key, ownerUserId, type, serverId, status'
    metadata:    '&amp;ownerUserId, syncedAt, accessSignature, schemaVersion'
    syncState:   '&amp;ownerUserId, needsReport, updatedAt'</code></pre><p>Put the user or tenant boundary in every sensitive record, not only in UI filters. Add indexes for actual queries: owner plus sync status, retry time, file parent, and reference type. Do not index every field “just in case”; indexes increase write and storage cost.</p>
    <h2 id="atomic">Use transactions around business invariants</h2><figure class="diagram"><figcaption>Completing a draft must be one local transaction</figcaption><div class="flow"><div class="node">Read draft</div><span class="connector">→</span><div class="node local">Insert outbox record</div><span class="connector">+</span><div class="node warning">Keep linked files</div><span class="connector">+</span><div class="node">Delete active draft</div><span class="connector">→</span><div class="node primary">Commit all</div></div><p>If any step fails, the transaction rolls back. The user must never end with neither a draft nor a queued record.</p></figure><p>Keep transactions short. Do not wait for network requests inside them. Read the necessary local state, write the complete local transition, commit, and perform network work afterward.</p>
    <h2 id="migrations">Migrations are product releases</h2><figure class="diagram"><figcaption>Safe schema evolution</figcaption><div class="flow"><div class="node">v1 record</div><span class="connector">→</span><div class="node warning">Upgrade transaction<small>Add stores/indexes; transform values</small></div><span class="connector">→</span><div class="node local">v2 record</div><span class="connector">→</span><div class="node primary">Compatibility reader</div></div></figure><ul><li>Never edit an old migration after users may have run it.</li><li>Add a new monotonically increasing version.</li><li>Test an empty database and every supported old fixture.</li><li>Keep persisted state names stable or migrate them explicitly.</li><li>Handle another open tab blocking the upgrade. Ask it to close or reload.</li><li>Decide whether rollback code can read the upgraded schema.</li><li>Do not delete old fields until queued records no longer need them.</li></ul>
    <h2 id="quota">Quota, persistence, and retention</h2><p>Browser storage is best-effort by default. Ask for persistent storage when the device holds important unsent work, but handle refusal. Use <code>navigator.storage.estimate()</code> before accepting large files, catch <code>QuotaExceededError</code>, and show a recovery path.</p><pre><code>async function canStore(additionalBytes: number) {
      const estimate = await navigator.storage?.estimate()
      if (!estimate?.quota || estimate.usage === undefined) return true
      return estimate.quota - estimate.usage &gt; additionalBytes * 1.25
    }</code></pre><div class="callout warning"><strong>Persistent does not mean backed up</strong>The user can clear site data, uninstall a browser, lose the device, or suffer profile corruption. For irreplaceable work, shorten the offline window, provide export/recovery where safe, and explain unsynced risk.</div>
    <h3>Retention rules to decide</h3><ul class="checklist"><li>When accepted records and blobs are removed.</li><li>Whether logout keeps or wipes the current user’s unsent records.</li><li>How shared-device users are separated.</li><li>How stale reference data is replaced.</li><li>How failed records expire or are escalated.</li><li>What happens when free space is insufficient.</li><li>Whether diagnostics may contain personal data.</li></ul>
    <div class="quiz" data-quiz id="check"><h3>Knowledge check</h3><p>Why should “insert outbox record” and “delete draft” share a transaction?</p><button type="button" aria-expanded="false">Check answer</button><p data-answer>They represent one business transition. If only the delete succeeds, work is lost. If only the insert succeeds, the app may show duplicate active work. One transaction commits both or neither.</p></div>
    <div class="sources"><h3>Primary sources</h3><ul><li><a href="https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB">MDN: using IndexedDB</a></li><li><a href="https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria">MDN: quotas and eviction</a></li><li><a href="https://www.w3.org/TR/IndexedDB/">W3C: IndexedDB transactions and durability</a></li><li><a href="https://dexie.org/docs/Dexie/Dexie.open()">Dexie: database upgrades</a></li></ul></div><nav class="pager"><a href="04-service-worker-updates.html">← Service workers</a><a href="06-offline-reads.html">Offline reads →</a></nav></article></main><aside class="update-toast" data-update-toast hidden aria-live="polite"><p><strong>A new playbook version is ready.</strong></p><button type="button">Update and reload</button></aside></body></html>
    Add: /Users/admin/Developer/projects/plaschema/pwa-engineering-playbook/lessons/06-offline-reads.html
    <!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>06 · Make reads honest offline</title><link rel="manifest" href="../manifest.webmanifest"><link rel="stylesheet" href="../assets/styles.css"><script type="module" src="../assets/site.js"></script></head><body><a class="skip-link" href="#main">Skip to content</a><header class="site-header"><div class="header-inner"><a class="brand" href="../index.html"><span class="brand-mark">PWA</span><span>Engineering Playbook</span></a><nav class="site-nav"><a aria-current="page" href="../index.html#lessons">Lessons</a><a href="../reference/decision-checklists.html">Checklists</a><a href="../reference/glossary.html">Glossary</a></nav></div></header>
    <main class="shell chapter" id="main"><aside class="toc"><p class="eyebrow">Lesson 06</p><a href="#contract">Read contract</a><a href="#refresh">Refresh flow</a><a href="#access">Access changes</a><a href="#ui">Honest UI</a><a href="#check">Knowledge check</a></aside><article class="article"><p class="eyebrow">Reference data · about 15 minutes</p><h1>Make reads honest offline</h1><p class="lede">Offline data needs a provenance: who it belongs to, when it was downloaded, which access rules produced it, and when it becomes too old to trust.</p>
    <h2 id="contract">Define the offline-read contract</h2><p>For each dataset, record:</p><ul class="checklist"><li>The owner user, tenant, or public scope.</li><li>The server revision or download time.</li><li>The access signature used to filter it.</li><li>The maximum useful age.</li><li>Whether stale data is still usable or must block the task.</li><li>How the complete dataset is replaced.</li><li>What the screen shows before the first download.</li></ul><p>A freshness duration is a product rule, not a generic cache value. A safety checklist may require the latest version. A list of villages may remain useful for days. A price may be wrong after minutes.</p>
    <h2 id="refresh">Download, validate, then replace</h2><figure class="diagram"><figcaption>Atomic reference-data refresh</figcaption><div class="flow"><div class="node server">Stream from API<small>Bounded memory use</small></div><span class="connector">→</span><div class="node">Parse and validate<small>Reject malformed rows</small></div><span class="connector">→</span><div class="node warning">Filter access<small>Owner and assignment</small></div><span class="connector">→</span><div class="node local">One transaction<small>Replace rows + metadata</small></div><span class="connector">→</span><div class="node primary">Screens update<small>Live local query</small></div></div></figure><p>Do not delete the old dataset before the new download completes. If the request fails halfway, the old complete data remains more useful than an empty or partial cache. For large collections, NDJSON or another streaming format lets the client parse one record per line rather than holding a huge JSON array.</p><pre><code>const needsRefresh =
      !metadata ||
      metadata.accessSignature !== currentAccessSignature ||
      Date.now() - Date.parse(metadata.syncedAt) &gt; maxAgeMs
    
    if (needsRefresh) {
      const rows = await downloadAndValidate()
      await db.transaction('rw', db.references, db.metadata, async () =&gt; {
        await db.references.where('ownerId').equals(ownerId).delete()
        await db.references.bulkPut(scopeRows(rows, currentAccess))
        await db.metadata.put({ ownerId, syncedAt: nowIso, accessSignature })
      })
    }</code></pre>
    <h2 id="access">Access changes are invalidation events</h2><p>If a worker moves from Ward A to Ward B, age alone is not enough. Compare a stable signature of the current authorized IDs with the signature stored during the last complete download. Refresh when it changes. Hide unauthorized cached rows immediately, even if refresh cannot yet complete.</p><div class="callout danger"><strong>Local filtering is not authorization</strong>It reduces accidental display and supports offline UX. The server must still authorize every later mutation because the device can be modified and permissions may have changed.</div>
    <h2 id="ui">Tell the truth in the interface</h2><table class="matrix"><thead><tr><th>State</th><th>Useful message</th><th>Action</th></tr></thead><tbody><tr><td>No local data</td><td>“Download your assigned wards before working offline.”</td><td>Download when the API is reachable.</td></tr><tr><td>Fresh local data</td><td>Show the last complete download quietly.</td><td>Allow work.</td></tr><tr><td>Stale but allowed</td><td>“Using data from 8 September.”</td><td>Allow work and offer refresh.</td></tr><tr><td>Stale and unsafe</td><td>Explain why the action is blocked.</td><td>Require verified refresh.</td></tr><tr><td>Refresh failed</td><td>“The previous complete download is still available.”</td><td>Retry without erasing it.</td></tr></tbody></table>
    <div class="quiz" data-quiz id="check"><h3>Knowledge check</h3><p>Why store an access signature next to the download time?</p><button type="button" aria-expanded="false">Check answer</button><p data-answer>A fresh timestamp only says when data was downloaded. The signature says which assignments or permissions produced it. A changed signature requires invalidation even when the data is only minutes old.</p></div>
    <div class="sources"><h3>Primary sources</h3><ul><li><a href="https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB">MDN: IndexedDB transactions</a></li><li><a href="https://dexie.org/docs/dexie-react-hooks/useLiveQuery()">Dexie: observing local queries</a></li></ul></div><nav class="pager"><a href="05-local-storage.html">← Local storage</a><a href="07-durable-sync.html">Durable sync →</a></nav></article></main><aside class="update-toast" data-update-toast hidden aria-live="polite"><p><strong>A new playbook version is ready.</strong></p><button type="button">Update and reload</button></aside></body></html>
    Add: /Users/admin/Developer/projects/plaschema/pwa-engineering-playbook/lessons/07-durable-sync.html
    <!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>07 · Build a durable write queue</title><link rel="manifest" href="../manifest.webmanifest"><link rel="stylesheet" href="../assets/styles.css"><script type="module" src="../assets/site.js"></script></head><body><a class="skip-link" href="#main">Skip to content</a><header class="site-header"><div class="header-inner"><a class="brand" href="../index.html"><span class="brand-mark">PWA</span><span>Engineering Playbook</span></a><nav class="site-nav"><a aria-current="page" href="../index.html#lessons">Lessons</a><a href="../reference/state-machines.html">State maps</a><a href="../reference/glossary.html">Glossary</a></nav></div></header>
    <main class="shell chapter" id="main"><aside class="toc"><p class="eyebrow">Lesson 07</p><a href="#state">State machine</a><a href="#idempotency">Idempotency</a><a href="#leases">Leases</a><a href="#retries">Retries</a><a href="#conflicts">Conflicts</a><a href="#check">Knowledge check</a></aside><article class="article"><p class="eyebrow">Offline writes · about 25 minutes</p><h1>Build a durable write queue</h1><p class="lede">The outbox is a local record of work the server has not fully acknowledged. Every transition must survive reload, retry, timeout, and partial success.</p>
    <h2 id="state">Model the workflow as stored states</h2><div class="state-map"><div class="state"><b>Draft</b><small>Editable; not ready to send.</small></div><div class="state"><b>Pending</b><small>Committed locally and ready.</small></div><div class="state wait"><b>Uploading</b><small>Files are moving; lease held.</small></div><div class="state wait"><b>Submitting</b><small>Mutation request in progress.</small></div><div class="state done"><b>Accepted</b><small>Server receipt stored.</small></div><div class="state wait"><b>Report owed</b><small>Final batch/device acknowledgement remains.</small></div><div class="state done"><b>Removed</b><small>Safe local cleanup completed.</small></div><div class="state failure"><b>Failed</b><small>Needs review or explicit retry.</small></div></div><p>“Syncing” should not exist only in React memory. If the browser closes during upload, the next launch must see enough durable state to recover. Store the stage, attempt count, retry time, lease expiry, uploaded object keys, receipt, and human-safe error.</p>
    <h2 id="idempotency">Idempotency makes uncertainty safe</h2><p>An idempotency key is a stable identifier for one user intention. Generate it when the draft is created and keep it through edits and retries. The backend stores the result for that key and returns the same logical result when it sees the key again.</p><figure class="diagram"><figcaption>The timeout that creates duplicates without idempotency</figcaption><div class="flow"><div class="node primary">Client sends key K</div><span class="connector">→</span><div class="node server">Server commits record</div><span class="connector">→</span><div class="node failure">Response is lost</div><span class="connector">→</span><div class="node warning">Client retries K</div><span class="connector">→</span><div class="node local">Server returns original receipt</div></div></figure><p>A client-generated key alone is not enough. The server must enforce uniqueness and compare the request safely. Decide what happens if the same key arrives with a different payload.</p>
    <h2 id="leases">Use a lease, not a permanent lock</h2><p>Two tabs, an interval, an online event, and a manual Sync button may all start work. Claim one record in a local transaction. Set a lease expiry long enough for the operation. If the process dies, a later coordinator can reclaim it after expiry.</p><pre><code>await db.transaction('rw', db.outbox, async () =&gt; {
      const current = await db.outbox.get(localId)
      if (!current || current.status !== 'pending') return false
      if (current.retryAt &gt; now || current.leaseUntil &gt; now) return false
      await db.outbox.update(localId, {
        status: 'uploading',
        leaseUntil: addMinutes(now, 5),
      })
      return true
    })</code></pre><p>Also guard the coordinator in memory so one page does not run duplicate loops. The durable lease handles crashes and competing contexts; the memory guard avoids needless work inside one context.</p>
    <h2 id="retries">Retry only what can improve</h2><table class="matrix"><thead><tr><th>Failure</th><th>Default action</th><th>Why</th></tr></thead><tbody><tr><td>Network, timeout, 408, 429, 5xx</td><td>Bounded automatic retry with increasing delay and jitter.</td><td>The request may work later; idempotency protects uncertainty.</td></tr><tr><td>401 / expired session</td><td>Stop the queue and require authentication.</td><td>Repeated requests cannot restore authority.</td></tr><tr><td>Validation error</td><td>Failed; review and edit.</td><td>The same payload will fail again.</td></tr><tr><td>Forbidden assignment</td><td>Failed; refresh access and review.</td><td>Permissions changed.</td></tr><tr><td>Duplicate business identity</td><td>Use server conflict details; do not guess.</td><td>May be a true duplicate, not an idempotent replay.</td></tr><tr><td>File uploaded, create failed</td><td>Keep object key and retry create.</td><td>Avoid repeating a successful upload.</td></tr></tbody></table><p>Cap automatic attempts. After that, preserve the record and expose Retry, Review/Edit, and carefully confirmed Discard. Never discard merely because the network has been bad for a long time.</p>
    <h2 id="conflicts">Conflicts need a product decision</h2><p>If offline users edit shared records, send the base revision or ETag. The server should reject a stale edit with the current record and structured conflict details. Then choose one policy per domain: server wins, client wins with permission, field-level merge, duplicate-as-new, or human review. “Last write wins” is still a policy; write down the harm it accepts.</p><div class="callout success"><strong>Portable baseline</strong>Run synchronization in the foreground on app start, reconnect hints, a modest interval, and a manual button. Background Sync can be an enhancement, not the only path, because it lacks broad browser support.</div>
    <h3>Coordinator order</h3><ol><li>Recover expired leases.</li><li>Finish any final report already owed.</li><li>Load ready records in a stable order.</li><li>Claim one record.</li><li>Upload missing files and persist each object key.</li><li>Submit with the original idempotency key.</li><li>Persist the server receipt and durable report marker together.</li><li>Continue after non-auth record failures.</li><li>Send the final report if any acceptance is owed.</li><li>Only then remove accepted records and blobs.</li></ol>
    <div class="quiz" data-quiz id="check"><h3>Knowledge check</h3><p>The server created a record, but the response timed out. What should the client do?</p><button type="button" aria-expanded="false">Check answer</button><p data-answer>Retry the same logical request with the same idempotency key. The server must return the original result instead of creating a second record.</p></div>
    <div class="sources"><h3>Primary sources</h3><ul><li><a href="https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API">MDN: Background Sync availability</a></li><li><a href="https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient">TanStack Query: persisted client state</a></li><li><a href="https://www.w3.org/TR/IndexedDB/">W3C: IndexedDB atomic transactions</a></li></ul></div><nav class="pager"><a href="06-offline-reads.html">← Offline reads</a><a href="08-files-and-auth.html">Files and auth →</a></nav></article></main><aside class="update-toast" data-update-toast hidden aria-live="polite"><p><strong>A new playbook version is ready.</strong></p><button type="button">Update and reload</button></aside></body></html>

## Activity

    file changes: Completed · 4 changes
    Add: /Users/admin/Developer/projects/plaschema/pwa-engineering-playbook/lessons/08-files-and-auth.html
    <!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>08 · Handle files and offline sessions</title><link rel="manifest" href="../manifest.webmanifest"><link rel="stylesheet" href="../assets/styles.css"><script type="module" src="../assets/site.js"></script></head><body><a class="skip-link" href="#main">Skip</a><header class="site-header"><div class="header-inner"><a class="brand" href="../index.html"><span class="brand-mark">PWA</span><span>Engineering Playbook</span></a><nav class="site-nav"><a href="../index.html#lessons">Lessons</a><a href="../reference/decision-checklists.html">Checklists</a><a href="../reference/glossary.html">Glossary</a></nav></div></header><main class="shell chapter" id="main"><aside class="toc"><p class="eyebrow">Lesson 08</p><a href="#files">File lifecycle</a><a href="#upload">Upload boundary</a><a href="#auth">Offline auth</a><a href="#expiry">Expiry</a><a href="#check">Knowledge check</a></aside><article class="article"><p class="eyebrow">Large data and identity · 18 minutes</p><h1>Handle files and offline sessions</h1><p class="lede">Files magnify storage and retry problems. Authentication adds a time limit and an authorization boundary. Model both explicitly.</p>
    <h2 id="files">The file lifecycle</h2><figure class="diagram"><figcaption>One file, five storage states</figcaption><div class="flow"><div class="node primary">Selected File</div><span class="connector">→</span><div class="node local">IndexedDB Blob<small>Linked to local record</small></div><span class="connector">→</span><div class="node server">Presigned PUT<small>No API bearer token</small></div><span class="connector">→</span><div class="node warning">Object key<small>Persist immediately</small></div><span class="connector">→</span><div class="node done">Attached + local cleanup</div></div></figure><p>Check type, size, and estimated free space before accepting a file. Store the blob separately from form fields so it can be replaced and cleaned independently. Keep its name, MIME type, size, purpose, owner, and parent local ID. Revoke preview object URLs when the screen releases them.</p>
    <h2 id="upload">Keep trust boundaries clear</h2><ol><li>Ask the authenticated API for an upload instruction containing a short-lived URL and object key.</li><li>PUT the exact bytes directly to storage with only the required content headers.</li><li>Do not attach the API bearer token to the storage-domain request.</li><li>Persist the object key immediately. A retry can skip an upload that already succeeded.</li><li>Submit the business record with the keys.</li><li>Use server lifecycle rules to remove uploaded objects never attached to a completed record.</li></ol><div class="callout warning"><strong>Presigned does not mean harmless</strong>Restrict allowed purpose, content type, size, key prefix, expiry, and HTTP method on the server. Configure object-storage CORS for only the deployed app origins and required headers.</div>
    <h2 id="auth">Offline authentication is a product policy</h2><figure class="diagram"><figcaption>Returning session decision</figcaption><div class="flow"><div class="node">Saved identity</div><span class="connector">→</span><div class="node warning">Token still valid?</div><span class="connector">→ yes →</span><div class="node server">Try /me online</div><span class="connector">→ transient failure →</span><div class="node local">Allow stated offline work mode</div></div><div class="flow" style="margin-top:.7rem"><div class="node failure">Expired / revoked when known</div><span class="connector">→</span><div class="node primary">Stop sync and require login</div></div></figure><p>Decide whether an unexpired saved session may open offline, for how long, and with which actions. A cached role is not fresh authorization. Every synchronized request must be checked again by the server. If an online identity check returns a real 401 or role mismatch, clear the session and stop the queue. If the network merely fails, preserving local work is safer than treating it as rejection.</p>
    <h2 id="expiry">Make expiry unsurprising</h2><ul class="checklist"><li>Show when offline access will expire if the user needs to plan field work.</li><li>Save draft changes before presenting a login screen.</li><li>Keep unsent records durably separated from the session token.</li><li>Define whether logout wipes, retains, or transfers unsent work.</li><li>Handle cross-tab logout and role changes.</li><li>Never call an authentication retry loop from each outbox record.</li></ul>
    <div class="quiz" data-quiz id="check"><h3>Knowledge check</h3><p>Why persist an uploaded object key before creating the business record?</p><button type="button" aria-expanded="false">Check answer</button><p data-answer>If create fails or the page closes, the next attempt can reuse the successful upload. This reduces cost and avoids orphaning repeated copies.</p></div><div class="sources"><h3>Primary sources</h3><ul><li><a href="https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html">OWASP: session management</a></li><li><a href="https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria">MDN: storage quota</a></li></ul></div><nav class="pager"><a href="07-durable-sync.html">← Durable sync</a><a href="09-security.html">Security →</a></nav></article></main><aside class="update-toast" data-update-toast hidden><p><strong>A new version is ready.</strong></p><button>Update and reload</button></aside></body></html>
    Add: /Users/admin/Developer/projects/plaschema/pwa-engineering-playbook/lessons/09-security.html
    <!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>09 · Protect sensitive device data</title><link rel="manifest" href="../manifest.webmanifest"><link rel="stylesheet" href="../assets/styles.css"><script type="module" src="../assets/site.js"></script></head><body><a class="skip-link" href="#main">Skip</a><header class="site-header"><div class="header-inner"><a class="brand" href="../index.html"><span class="brand-mark">PWA</span><span>Engineering Playbook</span></a><nav class="site-nav"><a href="../index.html#lessons">Lessons</a><a href="../reference/decision-checklists.html">Checklists</a><a href="../reference/glossary.html">Glossary</a></nav></div></header><main class="shell chapter" id="main"><aside class="toc"><p class="eyebrow">Lesson 09</p><a href="#threats">Threat model</a><a href="#controls">Controls</a><a href="#encryption">Encryption</a><a href="#retention">Retention</a><a href="#check">Knowledge check</a></aside><article class="article"><p class="eyebrow">Security and privacy · 20 minutes</p><h1>Protect sensitive device data</h1><p class="lede">Offline data is a deliberate copy on a device you do not fully control. Minimize that copy, make its lifetime clear, and assume same-origin JavaScript can reach it.</p>
    <h2 id="threats">Draw the threat boundary</h2><figure class="diagram"><figcaption>Ways local data can be exposed or damaged</figcaption><div class="grid two"><div class="node failure">XSS or bad dependency<small>Reads tokens and IndexedDB as the app</small></div><div class="node warning">Shared or lost device<small>Another person opens the browser profile</small></div><div class="node failure">Stale authorization<small>Cached access outlives server permission</small></div><div class="node warning">Storage pressure or clearing<small>Unsent work disappears</small></div><div class="node failure">Logs and diagnostics<small>Personal data leaks into telemetry</small></div><div class="node warning">Malicious local changes<small>Device records cannot be trusted by server</small></div></div></figure>
    <table class="matrix"><thead><tr><th>Asset</th><th>Threat</th><th>Control</th></tr></thead><tbody><tr><td>Session token</td><td>XSS reads JavaScript-accessible storage.</td><td>Prefer secure HttpOnly cookies/BFF when architecture allows; otherwise strong CSP, dependency control, short expiry, no HTML injection.</td></tr><tr><td>Pending personal data</td><td>Shared/lost device or profile access.</td><td>Minimize fields, owner scope, app lock where justified, retention and wipe policy, device guidance.</td></tr><tr><td>Cached references</td><td>Permission changed.</td><td>Access signature, immediate local hiding, server reauthorization at sync.</td></tr><tr><td>Outbox payload</td><td>Tampering or replay.</td><td>Validate and authorize on server; idempotency is not authorization.</td></tr><tr><td>Errors and analytics</td><td>Sensitive values logged.</td><td>Allowlisted structured events, redaction, no raw form payloads.</td></tr></tbody></table>
    <h2 id="controls">Use defense in depth</h2><ul class="checklist"><li>HTTPS and secure service-worker delivery.</li><li>Strict Content Security Policy with no unsafe inline script in the product app.</li><li>Trusted Types where practical and output encoding everywhere.</li><li>Dependency review, lockfile integrity, and minimal third-party scripts.</li><li>Server validation and authorization for every synchronized operation.</li><li>Owner/tenant keys in every sensitive local table and every query.</li><li>Clear local data rules for logout, expiry, reassignment, and device handover.</li><li>No authenticated API responses in a shared service-worker cache by default.</li><li>Redacted errors and privacy-aware observability.</li><li>Documented response for lost devices and stuck sensitive records.</li></ul>
    <h2 id="encryption">Understand encryption limits</h2><p>Encrypting IndexedDB may protect against someone reading raw browser profile files. It does not stop XSS if the running app can also obtain the key. A key stored beside the ciphertext is mostly packaging, not a strong confidentiality boundary.</p><p>Useful stronger designs need a key not automatically recoverable by arbitrary same-origin JavaScript: for example, a user-supplied passphrase that is never stored, a platform-backed credential flow, or server-assisted key release after authentication. These add recovery and offline-availability tradeoffs. Do not promise “encrypted offline data” without documenting the attacker, key location, unlock flow, rotation, recovery, and logout behavior.</p>
    <h2 id="retention">Delete by policy, not hope</h2><p>Keep accepted device records only as long as required for a durable final acknowledgment or user history promise. Delete their blobs in the same cleanup transaction. Decide what happens to failures older than the supported offline window. A user should be warned before any irreversible discard.</p><div class="callout danger"><strong>Important limitation</strong>Browser storage is not a secure vault or guaranteed backup. Sensitive or irreplaceable work may require managed devices, shorter offline windows, additional application lock, or a native container.</div>
    <div class="quiz" data-quiz id="check"><h3>Knowledge check</h3><p>Does encrypting IndexedDB with a key stored in localStorage protect against XSS?</p><button type="button" aria-expanded="false">Check answer</button><p data-answer>No. Malicious same-origin JavaScript can read both the ciphertext and the stored key, or call the app’s decryption code. It may only help against raw-at-rest inspection.</p></div><div class="sources"><h3>Primary sources</h3><ul><li><a href="https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html">OWASP: HTML5 security</a></li><li><a href="https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html">OWASP: session management</a></li><li><a href="https://wstg.owasp.org/latest/4-Web_Application_Security_Testing/11-Client-side/12-Browser_Storage/">OWASP: browser storage testing</a></li></ul></div><nav class="pager"><a href="08-files-and-auth.html">← Files and auth</a><a href="10-testing-and-operations.html">Testing and operations →</a></nav></article></main><aside class="update-toast" data-update-toast hidden><p><strong>A new version is ready.</strong></p><button>Update and reload</button></aside></body></html>
    Add: /Users/admin/Developer/projects/plaschema/pwa-engineering-playbook/lessons/10-testing-and-operations.html
    <!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>10 · Test and operate</title><link rel="manifest" href="../manifest.webmanifest"><link rel="stylesheet" href="../assets/styles.css"><script type="module" src="../assets/site.js"></script></head><body><a class="skip-link" href="#main">Skip</a><header class="site-header"><div class="header-inner"><a class="brand" href="../index.html"><span class="brand-mark">PWA</span><span>Engineering Playbook</span></a><nav class="site-nav"><a href="../index.html#lessons">Lessons</a><a href="../reference/decision-checklists.html">Checklists</a><a href="../reference/glossary.html">Glossary</a></nav></div></header><main class="shell chapter" id="main"><aside class="toc"><p class="eyebrow">Lesson 10</p><a href="#pyramid">Test layers</a><a href="#drills">Failure drills</a><a href="#release">Release</a><a href="#observe">Observe</a><a href="#recover">Recover</a><a href="#check">Knowledge check</a></aside><article class="article"><p class="eyebrow">Quality and operations · 22 minutes</p><h1>Test, release, observe, and recover</h1><p class="lede">The happy path proves little. A production PWA earns trust by surviving interruption at every boundary.</p>
    <h2 id="pyramid">Test at five layers</h2><div class="layers"><div class="layer">Real devices · Android, iOS, installed, browser tab, poor signal</div><div class="layer">Browser integration · service worker, offline reload, multi-tab, updates</div><div class="layer">Workflow integration · IndexedDB + coordinator + mocked transport</div><div class="layer">Storage tests · transactions, migrations, quota errors, cleanup</div><div class="layer">Pure unit tests · mapping, validation, retry and date calculations</div></div><p>Use a fake IndexedDB for fast workflow tests, but keep browser tests because service-worker lifecycle and storage behavior are browser-owned. Keep a small set of versioned database fixtures from released schemas.</p>
    <h2 id="drills">Failure drills</h2><table class="matrix"><thead><tr><th>Interrupt here</th><th>Expected recovery</th></tr></thead><tbody><tr><td>Halfway through draft save</td><td>Transaction leaves the earlier complete draft or the new complete draft, never half a record.</td></tr><tr><td>After file PUT, before object key save</td><td>Possible orphan is cleaned by server lifecycle; retry may re-upload.</td></tr><tr><td>After key save, before create</td><td>Retry skips file upload and submits the stored key.</td></tr><tr><td>After server commit, before response</td><td>Same idempotency key returns original receipt.</td></tr><tr><td>After receipt, before final report</td><td>Durable report marker retries only the report.</td></tr><tr><td>During database upgrade</td><td>Upgrade commits completely or aborts; user sees recovery guidance.</td></tr><tr><td>While a new worker waits</td><td>Old version remains usable; update prompt does not erase a form.</td></tr><tr><td>With two tabs syncing</td><td>Only one valid lease claims each record.</td></tr><tr><td>When token expires</td><td>Queue stops, work stays local, user reauthenticates.</td></tr></tbody></table>
    <h2 id="release">Production release gate</h2><ul class="checklist"><li>HTTPS, manifest, icons, scope, start URL, deep links, and offline navigation verified.</li><li>Service-worker file revalidates and old cache cleanup is prefix-scoped.</li><li>Update tested from the oldest supported client, not only a clean profile.</li><li>Every supported IndexedDB version migrates with real fixtures.</li><li>API compatibility window and rollback are documented.</li><li>Storage estimate, quota error, and failed persistence request have UI paths.</li><li>Outbox failure actions are usable with keyboard and touch.</li><li>Object-storage CORS and orphan cleanup tested from the deployed origin.</li><li>No credentials or personal payloads enter logs, cache, docs, or test fixtures.</li><li>Real device flight-mode/reconnect tests completed.</li></ul>
    <h2 id="observe">Observe outcomes, not private content</h2><p>Useful events include worker version, database version, reference age, queue counts by status, oldest pending age, retry code category, sync duration, update acceptance, migration failure, quota failure, and final report delay. Do not log names, photos, form bodies, tokens, presigned URLs, or unredacted server errors.</p><p>A health view for users should show the last complete reference refresh, last complete sync, pending and failed counts, storage warning, app version, and a safe support identifier.</p>
    <h2 id="recover">Write recovery before the incident</h2><figure class="diagram"><figcaption>Incident decision order</figcaption><div class="flow"><div class="node failure">Bad release</div><span class="connector">→</span><div class="node warning">Stop rollout</div><span class="connector">→</span><div class="node">Preserve local work</div><span class="connector">→</span><div class="node server">Restore compatible API/assets</div><span class="connector">→</span><div class="node local">Verify migration and queue</div></div></figure><p>Never tell users to clear site data before you understand whether it contains unsent work. Prefer a repair release that reads the affected schema. If clearing is unavoidable, explain exactly what will be lost and provide export or assisted recovery where policy permits.</p>
    <div class="quiz" data-quiz id="check"><h3>Knowledge check</h3><p>What is the most valuable test for an idempotent create?</p><button type="button" aria-expanded="false">Check answer</button><p data-answer>Let the server commit, hide or drop the success response, then retry with the same key. Assert that only one business record exists and the original receipt is returned.</p></div><div class="sources"><h3>Primary sources</h3><ul><li><a href="https://web.dev/articles/service-worker-lifecycle">web.dev: lifecycle testing</a></li><li><a href="https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria">MDN: quota and eviction</a></li><li><a href="https://wstg.owasp.org/latest/4-Web_Application_Security_Testing/11-Client-side/12-Browser_Storage/">OWASP: storage testing</a></li></ul></div><nav class="pager"><a href="09-security.html">← Security</a><a href="11-plaschema-case-study.html">PLASCHEMA case study →</a></nav></article></main><aside class="update-toast" data-update-toast hidden><p><strong>A new version is ready.</strong></p><button>Update and reload</button></aside></body></html>
    Add: /Users/admin/Developer/projects/plaschema/pwa-engineering-playbook/lessons/11-plaschema-case-study.html
    <!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>11 · PLASCHEMA case study</title><link rel="manifest" href="../manifest.webmanifest"><link rel="stylesheet" href="../assets/styles.css"><script type="module" src="../assets/site.js"></script></head><body><a class="skip-link" href="#main">Skip</a><header class="site-header"><div class="header-inner"><a class="brand" href="../index.html"><span class="brand-mark">PWA</span><span>Engineering Playbook</span></a><nav class="site-nav"><a href="../index.html#lessons">Lessons</a><a href="../reference/decision-checklists.html">Checklists</a><a href="../reference/glossary.html">Glossary</a></nav></div></header><main class="shell chapter" id="main"><aside class="toc"><p class="eyebrow">Lesson 11</p><a href="#system">System</a><a href="#sync">Sync path</a><a href="#strengths">Strengths</a><a href="#choices">Deliberate choices</a><a href="#hardening">Hardening</a></aside><article class="article"><p class="eyebrow">Real project · verified from source 10 September 2026</p><h1>PLASCHEMA case study</h1><p class="lede">The field-worker application is a transactional offline-write PWA. It always saves enrollment work locally, then synchronizes in a durable foreground queue.</p>
    <h2 id="system">The working system</h2><figure class="diagram"><figcaption>PLASCHEMA field-worker architecture</figcaption><div class="flow"><div class="node primary">React screens<small>Enroll, People, Sync, Profile</small></div><span class="connector">→</span><div class="node">Hooks<small>React Query + useLiveQuery</small></div><span class="connector">→</span><div class="node local">Dexie database<small>drafts, enrollments, files, refs, stats, sync state</small></div><span class="connector">⇄</span><div class="node warning">Foreground coordinator<small>online event + 30s interval + manual</small></div><span class="connector">→</span><div class="node server">API + object storage</div></div><div class="flow" style="margin-top:.8rem"><div class="node">vite-plugin-pwa</div><span class="connector">→</span><div class="node local">Precached shell + SPA fallback</div><span class="connector">→</span><div class="node primary">Update prompt</div></div></figure><p>The generated service worker caches static application files and sends navigations to <code>index.html</code>. It does not cache private API responses. Because service-worker installation happens during a normal visit, the app shell can later work offline in a browser tab without being added to the home screen.</p>
    <h2 id="sync">Enrollment synchronization</h2><figure class="diagram"><figcaption>One queued enrollment</figcaption><div class="flow"><div class="node local">UUID v7 draft + blobs</div><span class="connector">→</span><div class="node">Atomic queue</div><span class="connector">→</span><div class="node warning">Claim 5-minute lease</div><span class="connector">→</span><div class="node server">Presign + PUT files</div><span class="connector">→</span><div class="node server">Create enrollment</div><span class="connector">→</span><div class="node local">Receipt + report owed</div><span class="connector">→</span><div class="node done">Report + delete local data</div></div></figure><p>Object keys are saved after upload so retries skip completed stages. The create request keeps the original idempotency key. Accepted records remain hidden but durable until <code>POST /auth/sync</code> succeeds. Only then are records and file blobs removed.</p>
    <h2 id="strengths">Proven strengths</h2><ul class="checklist"><li>One active owner-scoped draft survives reload and restart.</li><li>Files are durable IndexedDB blobs, not temporary object URLs.</li><li>Draft-to-outbox movement is atomic.</li><li>Idempotency starts at draft creation and survives retry/edit.</li><li>Expired upload/submission leases recover after interruption.</li><li>Transient failures use bounded delays; validation failures remain reviewable.</li><li>Partial batch success still produces a durable final report.</li><li>Reference streams refresh only when missing, older than 24 hours, or ward access changes.</li><li>Home statistics combine server totals with only unsent local work, avoiding retained accepted-row double counts.</li><li>Presigned storage PUTs do not leak the API bearer token.</li></ul>
    <h2 id="choices">Deliberate boundaries</h2><table class="matrix"><thead><tr><th>Choice</th><th>Reason and effect</th></tr></thead><tbody><tr><td>Foreground sync only</td><td>Portable across target browsers; the app must be open to synchronize.</td></tr><tr><td>No API service-worker cache</td><td>Private data stays out of the shared HTTP cache; explicit IndexedDB data has ownership and schema.</td></tr><tr><td>Device-local pending list</td><td>The PWA handles unsent work; server history belongs to admin.</td></tr><tr><td>Unexpired offline session</td><td>Saved identity can continue after transient verification failure, but local expiry stops access.</td></tr><tr><td>One-by-one creates</td><td>Each record has clear idempotency, file stages, receipt, and error.</td></tr><tr><td>No push or background sync</td><td>Not required for the field workflow and avoids uneven platform behavior.</td></tr></tbody></table>
    <h2 id="hardening">Evidence-based hardening opportunities</h2><ul><li>Complete real-device Android and iOS tests for offline reopen, storage pressure, update, upload CORS, and reconnect.</li><li>Request persistent storage earlier in the prepared offline workflow, not only when the enrollment screen mounts, and show whether it was granted.</li><li>Define a stronger shared-device logout/wipe and local-data recovery policy for beneficiary information.</li><li>Review the JavaScript-accessible token design against a cookie/BFF option and strengthen CSP/XSS controls.</li><li>Add full service-worker lifecycle and update-prompt browser tests, including the login surface.</li><li>Verify backend lifecycle cleanup for uploaded objects that never attach to an accepted enrollment.</li><li>Keep schema migration fixtures as the Dexie database evolves.</li></ul><div class="callout success"><strong>The transferable lesson</strong>The strongest part is not a library. It is the sequence of promises: save locally first, persist every irreversible stage, retry with stable identity, report acceptance durably, and delete only after the final obligation succeeds.</div>
    <div class="sources"><h3>Project evidence</h3><ul><li><code>pwa/vite.config.ts</code> and <code>pwa/src/components/update-prompt.tsx</code></li><li><code>pwa/src/lib/offline-db.ts</code></li><li><code>pwa/src/features/enrollment/services/offline-enrollment.service.ts</code></li><li><code>pwa/src/features/enrollment/services/sync.service.ts</code></li><li><code>docs/pwa-enrollment-handoff.md</code></li></ul></div><nav class="pager"><a href="10-testing-and-operations.html">← Testing and operations</a><a href="../reference/decision-checklists.html">Decision checklists →</a></nav></article></main><aside class="update-toast" data-update-toast hidden><p><strong>A new version is ready.</strong></p><button>Update and reload</button></aside></body></html>

## Activity

    file changes: Completed · 4 changes
    Add: /Users/admin/Developer/projects/plaschema/pwa-engineering-playbook/reference/decision-checklists.html
    <!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PWA decision checklists</title><link rel="manifest" href="../manifest.webmanifest"><link rel="stylesheet" href="../assets/styles.css"><script type="module" src="../assets/site.js"></script></head><body><a class="skip-link" href="#main">Skip</a><header class="site-header"><div class="header-inner"><a class="brand" href="../index.html"><span class="brand-mark">PWA</span><span>Engineering Playbook</span></a><nav class="site-nav"><a href="../index.html#lessons">Lessons</a><a aria-current="page" href="decision-checklists.html">Checklists</a><a href="glossary.html">Glossary</a></nav></div></header><main class="shell" id="main"><p class="eyebrow">Operational reference</p><h1>Decision checklists</h1><p class="lede">Copy these questions into a design review. Do not begin transactional offline work until the answers are clear.</p>
    <section id="plan"><h2>Plan</h2><div class="grid two"><article class="card"><h3>Product promise</h3><ul class="checklist"><li>User and field job named.</li><li>Preparation step named.</li><li>Offline duration and data volume estimated.</li><li>Unavailable offline actions stated.</li><li>Harm from loss, exposure, duplication, and staleness ranked.</li></ul></article><article class="card"><h3>Architecture</h3><ul class="checklist"><li>Capability level selected.</li><li>Every data source has one owner.</li><li>Cache Storage and IndexedDB roles separated.</li><li>Local tables, indexes, transactions, and migrations designed.</li><li>Backend idempotency and conflict contracts confirmed.</li></ul></article><article class="card"><h3>Lifecycle</h3><ul class="checklist"><li>Service-worker scope and update policy chosen.</li><li>Old page/new worker/new database compatibility defined.</li><li>Retention, logout, wipe, and device handover defined.</li><li>Rollback after database upgrade designed.</li></ul></article><article class="card"><h3>Quality</h3><ul class="checklist"><li>Target browsers and installed/tab modes named.</li><li>Real-device and interruption scenarios written.</li><li>Privacy-safe events and support view defined.</li><li>Launch and incident owners named.</li></ul></article></div></section>
    <section id="build"><h2>Build in safe slices</h2><ol><li>Responsive online foundation and typed transport.</li><li>Manifest, shell precache, navigation fallback, and update prompt.</li><li>IndexedDB schema, migration fixtures, capacity handling, and live queries.</li><li>Offline reference download with metadata and atomic replacement.</li><li>Local-first form and draft-to-outbox transaction.</li><li>Idempotent server mutation and durable queue state machine.</li><li>File upload stages and orphan cleanup.</li><li>Offline session, expiry, access change, logout, and wipe behavior.</li><li>Error UX, health view, privacy-safe observability, and recovery.</li><li>Browser, real-device, deployment, update, migration, and rollback drills.</li></ol></section>
    <section id="audit"><h2>Audit with evidence</h2><table class="matrix"><thead><tr><th>Risk</th><th>Find evidence in</th><th>Critical failure</th></tr></thead><tbody><tr><td>Data loss</td><td>Transactions, queue states, cleanup order, quota handling.</td><td>UI says saved before a durable commit.</td></tr><tr><td>Duplicate writes</td><td>Key generation, backend constraint, timeout test.</td><td>Retry creates a second logical record.</td></tr><tr><td>Broken updates</td><td>Registration, waiting UI, cache headers, compatibility tests.</td><td>New worker controls incompatible old page.</td></tr><tr><td>Privacy</td><td>Cache routes, local tables, logs, logout, device policy.</td><td>Cross-user display or personal data in telemetry.</td></tr><tr><td>Stale authority</td><td>Access signature, refresh triggers, server guards.</td><td>Server trusts cached local permission.</td></tr><tr><td>Recovery</td><td>Lease expiry, report marker, migration fixtures, runbook.</td><td>User is told to clear unsent work without warning.</td></tr></tbody></table><p>Rank findings: <strong>critical</strong> for likely data loss, exposure, or duplicate harm; <strong>high</strong> for broken core offline promises; <strong>medium</strong> for degraded recovery or operations; <strong>low</strong> for clarity and maintainability.</p></section>
    </main><aside class="update-toast" data-update-toast hidden><p><strong>A new version is ready.</strong></p><button>Update and reload</button></aside></body></html>
    Add: /Users/admin/Developer/projects/plaschema/pwa-engineering-playbook/reference/glossary.html
    <!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PWA glossary</title><link rel="manifest" href="../manifest.webmanifest"><link rel="stylesheet" href="../assets/styles.css"><script type="module" src="../assets/site.js"></script></head><body><a class="skip-link" href="#main">Skip</a><header class="site-header"><div class="header-inner"><a class="brand" href="../index.html"><span class="brand-mark">PWA</span><span>Engineering Playbook</span></a><nav class="site-nav"><a href="../index.html#lessons">Lessons</a><a href="decision-checklists.html">Checklists</a><a aria-current="page" href="glossary.html">Glossary</a></nav></div></header><main class="shell" id="main"><p class="eyebrow">Plain-language reference</p><h1>PWA glossary</h1><p class="lede">The smallest useful meaning of each term, with the decision it affects.</p><div class="grid two">
    <article class="card"><h3>App shell</h3><p>The minimum HTML, CSS, JavaScript, and icons needed to start the interface. It can be cached before business data.</p></article><article class="card"><h3>Background Sync</h3><p>A browser API that may run deferred work in a service worker after connectivity returns. Support is limited, so use it only as an enhancement.</p></article><article class="card"><h3>Cache Storage</h3><p>A browser store for HTTP request/response pairs, usually managed by a service worker. It is not a domain database.</p></article><article class="card"><h3>Conflict</h3><p>Two valid intentions cannot both be applied unchanged, often because a shared record changed while one device was offline.</p></article><article class="card"><h3>Eventual consistency</h3><p>Device and server copies may differ temporarily, but a defined process moves them toward an agreed result.</p></article><article class="card"><h3>Freshness</h3><p>How old local data may be before the app warns, refreshes, or blocks use.</p></article><article class="card"><h3>Idempotency key</h3><p>A stable ID for one user intention. Retrying with the same key must not create a second logical result.</p></article><article class="card"><h3>IndexedDB</h3><p>The browser’s transactional database for structured records, indexes, and large values such as blobs.</p></article><article class="card"><h3>Lease</h3><p>A temporary claim on queued work. It expires so another process can recover after a crash.</p></article><article class="card"><h3>Manifest</h3><p>JSON metadata describing an installable web app’s name, icons, start URL, colors, and display mode.</p></article><article class="card"><h3>Outbox</h3><p>A durable local queue of user intentions that the server has not fully acknowledged.</p></article><article class="card"><h3>Precache</h3><p>Files saved during service-worker installation so they are ready before a user asks for them offline.</p></article><article class="card"><h3>Presigned upload</h3><p>A short-lived, restricted URL that lets a client upload a file directly to object storage.</p></article><article class="card"><h3>Progressive enhancement</h3><p>A baseline experience works broadly; supported browsers receive richer capabilities without breaking the baseline.</p></article><article class="card"><h3>Scope</h3><p>The URL area whose requests a service worker may control.</p></article><article class="card"><h3>Service worker</h3><p>A browser-managed worker that can intercept requests, use caches, receive events, and update independently of a page.</p></article><article class="card"><h3>Source of truth</h3><p>The place allowed to make the final decision for one kind of state at one stage of the workflow.</p></article><article class="card"><h3>Storage eviction</h3><p>The browser removes best-effort origin data under policy or storage pressure.</p></article><article class="card"><h3>Sync coordinator</h3><p>The service that claims queued records, performs ordered stages, persists results, and schedules retries.</p></article><article class="card"><h3>Waiting worker</h3><p>A successfully installed new service worker that has not activated because an older worker still controls pages.</p></article></div></main><aside class="update-toast" data-update-toast hidden><p><strong>A new version is ready.</strong></p><button>Update and reload</button></aside></body></html>
    Add: /Users/admin/Developer/projects/plaschema/pwa-engineering-playbook/reference/sources.html
    <!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PWA primary sources</title><link rel="manifest" href="../manifest.webmanifest"><link rel="stylesheet" href="../assets/styles.css"><script type="module" src="../assets/site.js"></script></head><body><header class="site-header"><div class="header-inner"><a class="brand" href="../index.html"><span class="brand-mark">PWA</span><span>Engineering Playbook</span></a></div></header><main class="shell"><p class="eyebrow">Verified 10 September 2026</p><h1>Primary sources</h1><p class="lede">Recheck these sources before making browser-support or library-version claims. Capability support changes over time.</p><div class="grid two"><article class="card"><h3>Web platform</h3><ul><li><a href="https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Caching">MDN PWA caching</a></li><li><a href="https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable">MDN installability</a></li><li><a href="https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers">MDN service workers</a></li><li><a href="https://web.dev/articles/service-worker-lifecycle">Service-worker lifecycle</a></li><li><a href="https://www.w3.org/TR/IndexedDB/">IndexedDB specification</a></li></ul></article><article class="card"><h3>Storage and libraries</h3><ul><li><a href="https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria">MDN quotas and eviction</a></li><li><a href="https://dexie.org/docs/index">Dexie documentation</a></li><li><a href="https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient">TanStack persistence</a></li><li><a href="https://vite-pwa-org.netlify.app/guide/auto-update">Vite PWA updates</a></li><li><a href="https://developer.chrome.com/docs/workbox/caching-strategies-overview/">Workbox cache strategies</a></li></ul></article><article class="card"><h3>Security</h3><ul><li><a href="https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html">OWASP HTML5 security</a></li><li><a href="https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html">OWASP session management</a></li><li><a href="https://wstg.owasp.org/latest/4-Web_Application_Security_Testing/11-Client-side/12-Browser_Storage/">OWASP browser storage tests</a></li></ul></article><article class="card"><h3>Project evidence</h3><ul><li><code>pwa/vite.config.ts</code></li><li><code>pwa/src/lib/offline-db.ts</code></li><li><code>pwa/src/features/enrollment/services/sync.service.ts</code></li><li><code>docs/pwa-enrollment-handoff.md</code></li></ul></article></div></main><aside class="update-toast" data-update-toast hidden><p><strong>A new version is ready.</strong></p><button>Update and reload</button></aside></body></html>
    Add: /Users/admin/Developer/projects/plaschema/pwa-engineering-playbook/reference/state-machines.html
    <!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PWA state-machine atlas</title><link rel="manifest" href="../manifest.webmanifest"><link rel="stylesheet" href="../assets/styles.css"><script type="module" src="../assets/site.js"></script></head><body><a class="skip-link" href="#main">Skip</a><header class="site-header"><div class="header-inner"><a class="brand" href="../index.html"><span class="brand-mark">PWA</span><span>Engineering Playbook</span></a><nav class="site-nav"><a href="../index.html#lessons">Lessons</a><a href="decision-checklists.html">Checklists</a><a href="glossary.html">Glossary</a></nav></div></header><main class="shell" id="main"><p class="eyebrow">Visual reference</p><h1>State-machine atlas</h1><p class="lede">Use explicit states so reloads and interruptions have one safe next action.</p>
    <h2>Outbox record</h2><div class="state-map"><div class="state"><b>draft</b><small>Edit → pending<br>Discard → removed</small></div><div class="state"><b>pending</b><small>Claim → uploading<br>Cancel → removed</small></div><div class="state wait"><b>uploading</b><small>Files ready → submitting<br>Lease expires → pending</small></div><div class="state wait"><b>submitting</b><small>Receipt → accepted<br>Lease expires → pending</small></div><div class="state done"><b>accepted</b><small>Mark report owed</small></div><div class="state wait"><b>report owed</b><small>Report succeeds → removed</small></div><div class="state failure"><b>failed</b><small>Edit or explicit retry → pending<br>Confirm discard → removed</small></div><div class="state done"><b>removed</b><small>Terminal local state</small></div></div>
    <h2>Failure classifier</h2><figure class="diagram"><figcaption>Choose retry from evidence</figcaption><div class="flow"><div class="node failure">Request failed</div><span class="connector">→</span><div class="node warning">401?</div><span class="connector">yes →</span><div class="node">Stop for login</div></div><div class="flow" style="margin-top:.6rem"><div class="node warning">Network/408/429/5xx?</div><span class="connector">yes →</span><div class="node local">Bounded delayed retry</div><span class="connector">no →</span><div class="node failure">Reviewable failure</div></div></figure>
    <h2>Service-worker update</h2><div class="state-map"><div class="state"><b>installing</b><small>Precache exact release.</small></div><div class="state wait"><b>waiting</b><small>Offer update; old app continues.</small></div><div class="state"><b>activating</b><small>Delete only old prefixed caches.</small></div><div class="state done"><b>active</b><small>Claim clients; page reloads once.</small></div></div>
    <h2>Offline session</h2><figure class="diagram"><figcaption>Saved session restoration</figcaption><div class="flow"><div class="node">No saved session</div><span class="connector">→</span><div class="node primary">Online login</div><span class="connector">→</span><div class="node local">Unexpired saved session</div><span class="connector">→</span><div class="node server">Online verify</div></div><div class="flow" style="margin-top:.6rem"><div class="node warning">Transient verify failure</div><span class="connector">→</span><div class="node local">Allowed offline mode</div><span class="connector">·</span><div class="node failure">Expired or rejected</div><span class="connector">→</span><div class="node">Re-login</div></div></figure>
    <h2>Reference dataset</h2><div class="state-map"><div class="state failure"><b>missing</b><small>Block dependent work; download.</small></div><div class="state done"><b>fresh</b><small>Use locally; refresh by policy.</small></div><div class="state wait"><b>stale allowed</b><small>Warn, use, refresh.</small></div><div class="state failure"><b>stale blocked</b><small>Require verified refresh.</small></div></div>
    </main><aside class="update-toast" data-update-toast hidden><p><strong>A new version is ready.</strong></p><button>Update and reload</button></aside></body></html>

## Activity

    file changes: Completed · 7 changes
    Add: /Users/admin/Developer/projects/plaschema/pwa-engineering-playbook/AGENT_GUIDE.md
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
    Add: /Users/admin/Developer/projects/plaschema/pwa-engineering-playbook/skill/pwa-engineering/SKILL.md
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
    Add: /Users/admin/Developer/projects/plaschema/pwa-engineering-playbook/skill/pwa-engineering/agents/openai.yaml
    interface:
      display_name: "PWA Engineering"
      short_description: "Design and audit production offline PWAs"
      default_prompt: "Use $pwa-engineering to plan a production-ready PWA for this project."
    policy:
      allow_implicit_invocation: false
    Add: /Users/admin/Developer/projects/plaschema/pwa-engineering-playbook/skill/pwa-engineering/references/architecture-and-build.md
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
    Add: /Users/admin/Developer/projects/plaschema/pwa-engineering-playbook/skill/pwa-engineering/references/audit.md
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
    Add: /Users/admin/Developer/projects/plaschema/pwa-engineering-playbook/skill/pwa-engineering/references/learning.md
    # Learning mode
    
    Build one mental model at a time. Start with the user’s real project and choose the smallest relevant lesson from the playbook.
    
    1. Explain the problem in common words.
    2. Separate roles and boundaries before mechanisms.
    3. Use a compact architecture, sequence, state, or ownership diagram when it makes the relationship clearer.
    4. Show one concrete example from the inspected project or a clearly labelled generic example.
    5. Name the common failure and the safe rule.
    6. Ask the lesson’s retrieval question before giving the answer.
    
    Do not dump the complete handbook into one response. Guide the learner to the next lesson based on what they can now explain or apply.
    Add: /Users/admin/Developer/projects/plaschema/pwa-engineering-playbook/skill/pwa-engineering/references/risk-and-quality.md
    # Risk and quality gates
    
    ## Security
    
    - Prefer secure HttpOnly cookie or BFF session designs when architecture permits. If tokens are JavaScript-accessible, state the XSS exposure and compensate with short expiry, strict CSP, dependency control, and no unsafe injection.
    - Treat IndexedDB as same-origin application storage, not a secure vault or guaranteed backup.
    - Scope sensitive rows and queries by owner or tenant, but keep authorization on the server.
    - Define retention, logout, reassignment, device handover, and lost-device behavior.
    - Never place personal payloads, credentials, tokens, presigned URLs, or raw server errors in logs or documentation.
    
    ## Required failure tests
    
    - Close during draft commit, file upload, submit, receipt storage, and final report.
    - Retry after the server commits but the response is lost.
    - Start synchronization from two triggers or tabs.
    - Expire a lease and recover abandoned work.
    - Migrate each supported released database fixture.
    - Refuse persistent storage and exhaust quota.
    - Change user access while reference data is cached.
    - Expire or reject the session with unsent work present.
    - Install a waiting service worker while a form is active.
    - Roll back after the new database version has opened.
    
    Do not recommend clearing browser data until unsent-work impact is known, explained, and accepted.

## Assistant

The full course, visual reference pages, and the explicit-only agent skill are now authored. The skill-creator guidance kept the agent instructions concise while the HTML lessons hold the deeper teaching; the Sites guidance led to a dependency-free, responsive static package that still works without JavaScript.

## Activity

    file changes: Completed · 3 changes
    Update { move_path: None }: /Users/admin/Developer/projects/plaschema/AGENTS.md
    @@ -8,2 +8,8 @@
     
    +For PWA teaching, planning, implementation, or review, also read
    +`pwa-engineering-playbook/AGENT_GUIDE.md` and the relevant playbook lesson or
    +reference page. The reusable Codex skill source lives at
    +`pwa-engineering-playbook/skill/pwa-engineering/` and is invoked explicitly as
    +`$pwa-engineering` when installed.
    +
     Keep `docs/HANDOFF.md` current after any major feature, architecture, command, or integration change.
    Update { move_path: None }: /Users/admin/Developer/projects/plaschema/docs/HANDOFF.md
    @@ -2,3 +2,3 @@
     
    -Last updated: 7 September 2026
    +Last updated: 10 September 2026
     Last verified code commit: `177f909`
    @@ -17,2 +17,3 @@
     | `docs/` | Project guides and handoff | Read before architecture or routing work |
    +| `pwa-engineering-playbook/` | Static HTML PWA engineering course, references and reusable agent skill | Production framework and PLASCHEMA case study |
     
    @@ -130,2 +131,19 @@
     
    +## PWA engineering playbook
    +
    +- `pwa-engineering-playbook/index.html` is the human entry point for the detailed,
    +  plain-language PWA course. It covers the app shell, offline reads, offline
    +  writes, data layers, service-worker updates, IndexedDB, files, authentication,
    +  security, testing, operations and recovery.
    +- The playbook is a dependency-free static site and a lightweight PWA. Serve the
    +  repository over localhost or HTTPS to exercise installation, offline caching
    +  and its prompted update flow; opening files directly remains readable but
    +  cannot register a service worker.
    +- `pwa-engineering-playbook/AGENT_GUIDE.md` is the agent-neutral workflow.
    +- The explicit-only Codex skill source is
    +  `pwa-engineering-playbook/skill/pwa-engineering/` and is invoked as
    +  `$pwa-engineering`. It supports Learn, Plan, Build and Audit modes.
    +- Browser and library claims were verified against primary sources on
    +  10 September 2026. The skill requires re-verification for time-sensitive work.
    +
     ## Commands
    Update { move_path: None }: /Users/admin/Developer/projects/plaschema/docs/pwa-enrollment-handoff.md
    @@ -293,5 +293,12 @@
     
    -## 11. Accessing the PWA offline (after online login)
    +## 11. Accessing the PWA offline
     
    -The PWA is installable and works offline **only after at least one successful online login**.
    +Installation and offline capability are separate. A normal browser visit can
    +install and activate the service worker and cache the app shell, so the PWA can
    +later reopen offline in a browser tab even if the worker never added it to the
    +home screen. The first visit must be online so the browser can cache the shell.
    +
    +Authenticated field work has an additional preparation requirement: the worker
    +must have completed at least one successful online login, the saved JWT must not
    +have expired, and the required ward/facility data must have been downloaded.
     
    @@ -301,3 +308,3 @@
     | --- | --- |
    -| Open installed app / cached shell | Login (first time or after expiry) |
    +| Open installed app or previously prepared browser-tab shell | Login (first time or after expiry) |
     | Navigate between app screens | Upload files or create enrollments on server |
    @@ -324,3 +331,3 @@
     
    -5. **Install on phone**:
    +5. **Optional installation on phone**:
        - Browser menu → “Add to Home Screen” / “Install app”.
    @@ -331,3 +338,3 @@
     ```text
    -Online:  Install PWA → Login → (optional) cache wards/facilities streams
    +Online:  Visit PWA → Login → cache wards/facilities streams → optionally install
     Offline: Open app → Enroll beneficiaries → save locally as Pending
    @@ -409 +416,6 @@
     This is the intended production behaviour. The UI designs already match this model; backend contracts are ready on branch `feat/pwa-enrollment-sync-api`.
    +
    +For the reusable architecture behind these choices, including service-worker
    +updates, data ownership, IndexedDB migrations, sync state machines, security,
    +testing and recovery, see the
    +[`Production PWA Engineering Playbook`](../pwa-engineering-playbook/index.html).

## Activity

    $ /bin/zsh -lc "sed -n '1,320p' /Users/admin/.codex/plugins/cache/openai-bundled/browser/26.707.31428/skills/control-in-app-browser/SKILL.md; find pwa-engineering-playbook -type f | sort; python3 /Users/admin/.codex/skills/.system/skill-creator/scripts/quick_validate.py pwa-engineering-playbook/skill/pwa-engineering"
    status: Failed · exit 1
      Traceback (most recent call last):
        File "/Users/admin/.codex/skills/.system/skill-creator/scripts/quick_validate.py", line 10, in <module>
          import yaml
      ModuleNotFoundError: No module named 'yaml'

## Activity

    $ /bin/zsh -lc "command -v tidy || true; command -v xmllint || true; node -e \"for (const name of ['yaml','js-yaml','cheerio']) { try { console.log(name, require.resolve(name)) } catch {} }\"; git diff --stat; git status --short"
    status: Completed · exit 0
       AGENTS.md                      |  6 ++++++
       docs/HANDOFF.md                | 20 +++++++++++++++++++-
       docs/pwa-enrollment-handoff.md | 22 +++++++++++++++++-----
       3 files changed, 42 insertions(+), 6 deletions(-)
       M AGENTS.md
       M docs/HANDOFF.md
       M docs/pwa-enrollment-handoff.md
      ?? pwa-engineering-playbook/

## Activity

    $ /bin/zsh -lc "find pwa-engineering-playbook -name '*.html' -print0 | xargs -0 -n1 tidy -errors -quiet"
    status: Failed · exit 1
      r code 128
      line 8 column 197 - Warning: discarding invalid character code 157
      line 10 column 405 - Error: <nav> is not recognized!
      line 1 column 451 - Error: <header> is not recognized!
      line 1 column 451 - Warning: discarding unexpected <header>
      line 1 column 638 - Error: <nav> is not recognized!
      line 1 column 638 - Warning: discarding unexpected <nav>
      line 1 column 833 - Warning: discarding unexpected </nav>
      line 1 column 847 - Warning: discarding unexpected </header>
      line 1 column 857 - Error: <main> is not recognized!
      line 1 column 857 - Warning: discarding unexpected <main>
      line 1 column 899 - Error: <aside> is not recognized!
      line 1 column 899 - Warning: discarding unexpected <aside>
      line 1 column 1153 - Warning: discarding unexpected </aside>
      line 1 column 1162 - Error: <article> is not recognized!
      line 1 column 1162 - Warning: discarding unexpected <article>
      line 2 column 44 - Error: <figure> is not recognized!
      line 1 column 447 - Error: <header> is not recognized!
      line 1 column 447 - Warning: discarding unexpected <header>
      line 1 column 634 - Error: <nav> is not recognized!
      line 1 column 634 - Warning: discarding unexpected <nav>
      line 1 column 829 - Warning: discarding unexpected </nav>
      line 1 column 843 - Warning: discarding unexpected </header>
      line 1 column 853 - Error: <main> is not recognized!
      line 1 column 853 - Warning: discarding unexpected <main>
      line 1 column 895 - Error: <aside> is not recognized!
      line 1 column 895 - Warning: discarding unexpected <aside>
      line 1 column 1154 - Warning: discarding unexpected </aside>
      line 1 column 1163 - Error: <article> is not recognized!
      line 1 column 1163 - Warning: discarding unexpected <article>
      line 2 column 52 - Error: <figure> is not recognized!
      line 1 column 460 - Error: <header> is not recognized!
      line 1 column 460 - Warning: discarding unexpected <header>
      line 1 column 647 - Error: <nav> is not recognized!
      line 1 column 647 - Warning: discarding unexpected <nav>
      line 1 column 858 - Warning: discarding unexpected </nav>
      line 1 column 872 - Warning: discarding unexpected </header>
      line 2 column 1 - Error: <main> is not recognized!
      line 2 column 1 - Warning: discarding unexpected <main>
      line 2 column 43 - Error: <aside> is not recognized!
      line 2 column 43 - Warning: discarding unexpected <aside>
      line 2 column 350 - Warning: discarding unexpected </aside>
      line 2 column 359 - Error: <article> is not recognized!
      line 2 column 359 - Warning: discarding unexpected <article>
      line 3 column 43 - Error: <figure> is not recognized!
      line 1 column 434 - Error: <header> is not recognized!
      line 1 column 434 - Warning: discarding unexpected <header>
      line 1 column 621 - Error: <nav> is not recognized!
      line 1 column 621 - Warning: discarding unexpected <nav>
      line 1 column 816 - Warning: discarding unexpected </nav>
      line 1 column 830 - Warning: discarding unexpected </header>
      line 1 column 840 - Error: <main> is not recognized!
      line 1 column 840 - Warning: discarding unexpected <main>
      line 1 column 882 - Error: <aside> is not recognized!
      line 1 column 882 - Warning: discarding unexpected <aside>
      line 1 column 1169 - Warning: discarding unexpected </aside>
      line 1 column 1178 - Error: <article> is not recognized!
      line 1 column 1178 - Warning: discarding unexpected <article>
      line 6 column 62 - Error: <figure> is not recognized!
      line 1 column 454 - Error: <header> is not recognized!
      line 1 column 454 - Warning: discarding unexpected <header>
      line 1 column 641 - Error: <nav> is not recognized!
      line 1 column 641 - Warning: discarding unexpected <nav>
      line 1 column 857 - Warning: discarding unexpected </nav>
      line 1 column 871 - Warning: discarding unexpected </header>
      line 2 column 1 - Error: <main> is not recognized!
      line 2 column 1 - Warning: discarding unexpected <main>
      line 2 column 43 - Error: <aside> is not recognized!
      line 2 column 43 - Warning: discarding unexpected <aside>
      line 2 column 300 - Warning: discarding unexpected </aside>
      line 2 column 309 - Error: <article> is not recognized!
      line 2 column 309 - Warning: discarding unexpected <article>
      line 4 column 60 - Error: <figure> is not recognized!
      line 1 column 457 - Error: <header> is not recognized!
      line 1 column 457 - Warning: discarding unexpected <header>
      line 1 column 644 - Error: <nav> is not recognized!
      line 1 column 644 - Warning: discarding unexpected <nav>
      line 1 column 860 - Warning: discarding unexpected </nav>
      line 1 column 874 - Warning: discarding unexpected </header>
      line 2 column 1 - Error: <main> is not recognized!
      line 2 column 1 - Warning: discarding unexpected <main>
      line 2 column 43 - Error: <aside> is not recognized!
      line 2 column 43 - Warning: discarding unexpected <aside>
      line 2 column 306 - Warning: discarding unexpected </aside>
      line 2 column 315 - Error: <article> is not recognized!
      line 2 column 315 - Warning: discarding unexpected <article>
      line 4 column 1 - Error: <figure> is not recognized!
      line 2 column 60 - Error: <header> is not recognized!
      line 2 column 60 - Warning: discarding unexpected <header>
      line 2 column 247 - Error: <nav> is not recognized!
      line 2 column 247 - Warning: discarding unexpected <nav>
      line 2 column 463 - Warning: discarding unexpected </nav>
      line 2 column 477 - Warning: discarding unexpected </header>
      line 3 column 1 - Error: <main> is not recognized!
      line 3 column 1 - Warning: discarding unexpected <main>
      line 3 column 43 - Error: <aside> is not recognized!
      line 3 column 43 - Warning: discarding unexpected <aside>
      line 3 column 365 - Warning: discarding unexpected </aside>
      line 3 column 374 - ized!
      mn 374 - discarding unexpected <article>
      line 5 column 62 - Warning: replacing invalid character code 128
      line 5 column 63 - Warning: replacing invalid character code 156
      line 5 column 78 - Warning: replacing invalid character code 128
      line 5 column 79 - Warning: discarding invalid character code 157
      line 5 column 512 - Warning: replacing invalid character code 128
      line 5 column 513 - Warning: replacing invalid character code 156
      line 5 column 698 - Warning: replacing invalid character code 128
      line 5 column 699 - Warning: discarding invalid character code 157
      line 7 column 1 - Error: <figure> is not recognized!
      line 1 column 456 - Error: <header> is not recognized!
      line 1 column 456 - Warning: discarding unexpected <header>
      line 1 column 643 - Error: <nav> is not recognized!
      line 1 column 643 - Warning: discarding unexpected <nav>
      line 1 column 854 - Warning: discarding unexpected </nav>
      line 1 column 868 - Warning: discarding unexpected </header>
      line 2 column 1 - Error: <main> is not recognized!
      line 2 colurning: discarding unexpected <main>
      umn 43 - line3 - Warning:pected <aside>
      line 2 column 334 - Warning: discarding unexpected </aside>
      line 2 column 343 - Error: <article> is not recognized!
      line 2 column 343 - Warning: discarding unexpected <article>
      line 3 column 917 - Warning: replacing invalid character code 128
      line 3 column 918 - Warning: replacing invalid character code 156
      line 3 column 927 - Warning: replacing invalid character code 128
      line 3 column 928 - Warning: discarding invalid character code 157
      line 4 column 326 - Error: <figure> is not recognized!
      line 1 column 438 - Error: <header> is not recognized!
      line 1 column 438 - Warning: discarding unexpected <header>
      line 1 column 625 - Error: <nav> is not recognized!
      line 1 column 625 - Warning: discarding unexpected <nav>
      line 1 column 820 - Warning: discarding unexpected </nav>
      line 1 column 834 - Warning: discarding unexpected </header>
      line 1 column 844 - Error: <main> is not recognized!
      line 1 column 844 - Warning: discarding unexpected <main>
      line 1 column 886 - Error: <aside> is not recognized!
      line 1 column 886 - Warning: discarding unexpected <aside>
      line 1 column 1138 - Warning: discarding unexpected </aside>
      line 1 column 1147 - Error: <article> is not recognized!
      line 1 column 1147 - Warning: discarding unexpected <article>
      line 2 column 45 - Error: <figure> is not recognized!
      line 1 column 435 - Error: <header> is not recognized!
      line 1 column 435 - Warning: discarding unexpected <header>
      line 1 column 622 - Error: <nav> is not recognized!
      line 1 column 622 - Warning: discarding unexpected <nav>
      line 1 column 812 - Warning: discarding unexpected </nav>
      line 1 column 826 - Warning: discarding unexpected </header>
      line 1 column 836 - Error: <main> is not recognized!
      line 1 column 836 - Warning: discarding unexpected <main>
      line 2 column 1 - Error: <section> is not recognized!
      line 2 column 1 - Warning: discarding unexpected <section>
      line 2 column 66 - Error: <article> is not recognized!
      line 2 column 66 - Warning: discarding unexpected <article>
      line 2 column 404 - Warning: discarding unexpected </article>
      line 2 column 415 - Error: <article> is not recognized!
      line 1 column 424 - Error: <header> is not recognized!
      line 1 column 424 - Warning: discarding unexpected <header>
      line 1 column 611 - Error: <nav> is not recognized!
      line 1 column 611 - Warning: discarding unexpected <nav>
      line 1 column 801 - Warning: discarding unexpected </nav>
      line 1 column 815 - Warning: discarding unexpected </header>
      line 1 column 825 - Error: <main> is not recognized!
      line 1 column 825 - Warning: discarding unexpected <main>
      line 2 column 1 - Error: <article> is not recognized!
      line 2 column 1 - Warning: discarding unexpected <article>
      line 2 column 174 - Warning: discarding unexpected </article>
      line 2 column 185 - Error: <article> is not recognized!
      line 2 column 185 - Warning: discarding unexpected <article>
      line 2 column 392 - Warning: discarding unexpected </article>
      line 2 column 403 - Error: <article> is not recognized!
      line 1 column 435 - Error: <header> is not recognized!
      line 1 column 435 - Warning: discarding unexpected <header>
      line 1 column 622 - Error: <nav> is not recognized!
      line 1 column 622 - Warning: discarding unexpected <nav>
      line 1 column 791 - Warning: discarding unexpected </nav>
      line 1 column 805 - Warning: discarding unexpected </header>
      line 1 column 815 - Error: <main> is not recognized!
      line 1 column 815 - Warning: discarding unexpected <main>
      line 2 column 109 - Warning: replacing invalid charactemn 473 - Warninnvaliharace 1line 2 column d character cone 2 column 5Warn replacing invalid chaer code 146
      line 2 column 697 - Warning: replar code column 8rning: replinvalid er cline 2 column  Warning: replacing charactne 2 column 840 - Warning:laciialition> is ecognized!
      line 3 column 59 - Warning: discarding unexpectap column 101g: discarding unexp/figcapolumn 217ing:ing invalid character code 134
      line 3 column 218 - Warning: replacing invalid character code 146
      line 3 column 301 - Warning: replacing invalid character code 134
      line 3 column 302 - Warning: replacing invalid character code 146
      line 3 column 499 - Warning: replacing invalid character code 134
      line 3 column 500 - Warning: replacing invalid character code 146
      line 3 column 597 - Warning: replacing invalid character code 134
      line 3 column 598 - Warning: replacing invalid character code 146
      line 3 column 669 - Warning: discarding unexpected </figure>
      line 5 column 29 - Error: <figure> is not recognized!
      line 1 column 382 - Error: <header> is not recognized!
      line 1 column 382 - Warning: discarding unexpected <header>
      line 1 column 577 - Warning: discarding unexpected </header>
      line 1 column 587 - Error: <main> is not recognized!
      line 1 column 587 - Warning: discarding unexpected <main>
      line 1 column 859 - Error: <article> is not recognized!
      line 1 column 859 - Warning: discarding unexpected <article>
      line 1 column 1534 - Warning: discarding unexpected </article>
      line 1 column 1545 - Error: <article> is not recognized!
      line 1 column 1545 - Warning: discarding unexpected <article>
      line 1 column 2211 - Warning: discarding unexpected </article>
      line 1 column 2222 - Error: <article> is not recognized!
      line 1 column 2222 - Warning: discarding unexpected <article>
      line 1 column 2711 - Warning: discarding unexpected </article>
      line 1 column 2722 - Error: <article> is not recognized!

## Activity

    $ /bin/zsh -lc 'python3 -m http.server 4175 --directory pwa-engineering-playbook'
    status: Failed · exit 1
      Traceback (most recent call last):
        File "<frozen runpy>", line 198, in _run_module_as_main
        File "<frozen runpy>", line 88, in _run_code
        File "/usr/local/Cellar/python@3.13/3.13.5/Frameworks/Python.framework/Versions/3.13/lib/python3.13/http/server.py", line 1323, in <module>
          test(
          ~~~~^
              HandlerClass=handler_class,
              ^^^^^^^^^^^^^^^^^^^^^^^^^^^
          ...<3 lines>...
              protocol=args.protocol,
              ^^^^^^^^^^^^^^^^^^^^^^^
          )
          ^
        File "/usr/local/Cellar/python@3.13/3.13.5/Frameworks/Python.framework/Versions/3.13/lib/python3.13/http/server.py", line 1270, in test
          with ServerClass(addr, HandlerClass) as httpd:
               ~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^
        File "/usr/local/Cellar/python@3.13/3.13.5/Frameworks/Python.framework/Versions/3.13/lib/python3.13/socketserver.py", line 457, in __init__
          self.server_bind()
          ~~~~~~~~~~~~~~~~^^
        File "/usr/local/Cellar/python@3.13/3.13.5/Frameworks/Python.framework/Versions/3.13/lib/python3.13/http/server.py", line 1317, in server_bind
          return super().server_bind()
                 ~~~~~~~~~~~~~~~~~~~^^
        File "/usr/local/Cellar/python@3.13/3.13.5/Frameworks/Python.framework/Versions/3.13/lib/python3.13/http/server.py", line 136, in server_bind
          socketserver.TCPServer.server_bind(self)
          ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^
        File "/usr/local/Cellar/python@3.13/3.13.5/Frameworks/Python.framework/Versions/3.13/lib/python3.13/socketserver.py", line 478, in server_bind
          self.socket.bind(self.server_address)
          ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^
      PermissionError: [Errno 1] Operation not permitted

## Assistant

The content and skill package are complete. I’m in verification now: checking every local link and cached asset, exercising the site over localhost, validating update/offline wiring, and then running the existing PWA regression suite.

## Activity

    $ /bin/zsh -lc "curl -sSf http://127.0.0.1:4175/index.html | sed -n '1,8p'; curl -sSI http://127.0.0.1:4175/sw.js; curl -sSf http://127.0.0.1:4175/manifest.webmanifest | sed -n '1,20p'"
    status: Completed · exit 0
      <!doctype html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="theme-color" content="#173f32">
        <meta name="description" content="A detailed, plain-language engineering playbook for production progressive web applications.">
        <title>Production PWA Engineering Playbook</title>
      HTTP/1.0 200 OK
      Server: SimpleHTTP/0.6 Python/3.13.5
      Date: Thu, 10 Sep 2026 13:21:19 GMT
      Content-type: application/javascript
      Content-Length: 2149
      Last-Modified: Thu, 10 Sep 2026 12:45:55 GMT
      
      {
        "name": "Production PWA Engineering Playbook",
        "short_name": "PWA Playbook",
        "description": "A detailed, plain-language guide to production progressive web applications.",
        "start_url": "./index.html",
        "scope": "./",
        "display": "standalone",
        "background_color": "#f6f7f2",
        "theme_color": "#173f32",
        "icons": [
          { "src": "assets/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
          { "src": "assets/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
        ]
      }

## Activity

    $ /bin/zsh -lc 'node --yers'
    status: Failed · exit 9
      node: bad option: --yers

## Activity

    $ /bin/zsh -lc 'mkdir -p pwa-engineering-playbook/scripts'
    status: Completed · exit 0

## Activity

    file changes: Completed · 1 changes
    Add: /Users/admin/Developer/projects/plaschema/pwa-engineering-playbook/scripts/validate.mjs
    import { existsSync, readFileSync, readdirSync } from 'node:fs'
    import { dirname, extname, join, resolve } from 'node:path'
    import { fileURLToPath } from 'node:url'
    
    const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
    const errors = []
    
    function walk(directory) {
      return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const path = join(directory, entry.name)
        return entry.isDirectory() ? walk(path) : [path]
      })
    }
    
    const files = walk(root)
    const htmlFiles = files.filter((file) => extname(file) === '.html')
    
    for (const file of htmlFiles) {
      const source = readFileSync(file, 'utf8')
      const relative = file.slice(root.length + 1)
      for (const required of ['<!doctype html>', '<title>', '<h1']) {
        if (!source.toLowerCase().includes(required)) errors.push(`${relative}: missing ${required}`)
      }
      for (const match of source.matchAll(/(?:href|src)="([^"]+)"/g)) {
        const target = match[1]
        if (/^(?:https?:|mailto:|#)/.test(target)) continue
        const [path] = target.split('#')
        if (!path || existsSync(resolve(dirname(file), path))) continue
        errors.push(`${relative}: missing local target ${target}`)
      }
    }
    
    const serviceWorker = readFileSync(join(root, 'sw.js'), 'utf8')
    for (const match of serviceWorker.matchAll(/'\.\/([^']+)'/g)) {
      const target = match[1]
      if (!existsSync(join(root, target))) errors.push(`sw.js: missing precache target ${target}`)
    }
    
    const manifest = JSON.parse(readFileSync(join(root, 'manifest.webmanifest'), 'utf8'))
    for (const icon of manifest.icons ?? []) {
      if (!existsSync(join(root, icon.src))) errors.push(`manifest: missing icon ${icon.src}`)
    }
    
    if (errors.length) {
      console.error(errors.join('\n'))
      process.exitCode = 1
    } else {
      console.log(`Validated ${htmlFiles.length} HTML pages, local links, manifest icons, and service-worker precache targets.`)
    }

## Activity

    $ /bin/zsh -lc "node pwa-engineering-playbook/scripts/validate.mjs; node --check pwa-engineering-playbook/assets/site.js; node --check pwa-engineering-playbook/sw.js; ruby -e \"require 'yaml'; YAML.load_file('pwa-engineering-playbook/skill/pwa-engineering/agents/openai.yaml'); puts 'openai.yaml parsed'\"; file pwa-engineering-playbook/assets/icon-192.png pwa-engineering-playbook/assets/icon-512.png; git diff --check"
    status: Completed · exit 0
      Validated 16 HTML pages, local links, manifest icons, and service-worker precache targets.
      openai.yaml parsed
      pwa-engineering-playbook/assets/icon-192.png: PNG image data, 192 x 192, 8-bit/color RGBA, non-interlaced
      pwa-engineering-playbook/assets/icon-512.png: PNG image data, 512 x 512, 8-bit/color RGBA, non-interlaced

## Activity

    $ /bin/zsh -lc 'pnpm test:pwa'
    status: Completed · exit 0
      
      > plaschema@ test:pwa /Users/admin/Developer/projects/plaschema
      > pnpm --filter pwa test
      
      backend                                  |  WARN  The field "pnpm.onlyBuiltDependencies" was found in /Users/admin/Developer/projects/plaschema/backend/package.json. This will not take effect. You should configure "pnpm.onlyBuiltDependencies" at the root of the workspace instead.
      
      > pwa@0.0.0 test /Users/admin/Developer/projects/plaschema/pwa
      > vitest run
      
      
       RUN  v4.1.11 /Users/admin/Developer/projects/plaschema/pwa
      
      
       Test Files  8 passed (8)
            Tests  36 passed (36)
         Start at  14:22:32
         Duration  18.06s (transform 1.09s, setup 8.56s, import 4.01s, tests 3.48s, environment 25.17s)
      

## Activity

    $ /bin/zsh -lc 'pnpm lint:pwa'
    status: Completed · exit 0
      
      > plaschema@ lint:pwa /Users/admin/Developer/projects/plaschema
      > pnpm --filter pwa lint
      
      backend                                  |  WARN  The field "pnpm.onlyBuiltDependencies" was found in /Users/admin/Developer/projects/plaschema/backend/package.json. This will not take effect. You should configure "pnpm.onlyBuiltDependencies" at the root of the workspace instead.
      
      > pwa@0.0.0 lint /Users/admin/Developer/projects/plaschema/pwa
      > oxlint
      

## Activity

    $ /bin/zsh -lc 'node pwa-engineering-playbook/scripts/validate.mjs && for page in index.html lessons/01-mental-model.html lessons/07-durable-sync.html lessons/11-plaschema-case-study.html reference/decision-checklists.html reference/glossary.html; do curl -sSf "http://://127.0.0.1:4175/$page" >/dev/null; done'
    status: Failed · exit 3
      Validated 16 HTML pages, local links, manifest icons, and service-worker precache targets.
      curl: (3) URL rejected: No host part in the URL
      curl: (3) URL rejected: No host part in the URL
      curl: (3) URL rejected: No host part in the URL
      curl: (3) URL rejected: No host part in the URL
      curl: (3) URL rejected: No host part in the URL
      curl: (3) URL rejected: No host part in the URL

## Activity

    $ /bin/zsh -lc 'pnpm build:pwa'
    status: Completed · exit 0
      
      > plaschema@ build:pwa /Users/admin/Developer/projects/plaschema
      > pnpm --filter pwa build
      
      backend                                  |  WARN  The field "pnpm.onlyBuiltDependencies" was found in /Users/admin/Developer/projects/plaschema/backend/package.json. This will not take effect. You should configure "pnpm.onlyBuiltDependencies" at the root of the workspace instead.
      
      > pwa@0.0.0 build /Users/admin/Developer/projects/plaschema/pwa
      > tsc -b && vite build
      
      vite v8.2.2 building client environment for production...
      transforming...
      ✓ 1986 modules transformed.
      rendering chunks...
      computing gzip size...
      dist/manifest.webmanifest                                          0.46 kB
      dist/index.html                                                    0.73 kB │ gzip:   0.39 kB
      dist/assets/inter-tight-vietnamese-wght-normal-TKKdAiBA.woff2     10.48 kB
      dist/assets/inter-tight-greek-ext-wght-normal-DQgQPNk4.woff2      11.70 kB
      dist/assets/inter-tight-cyrillic-wght-normal-BS41q_Tv.woff2       16.99 kB
      dist/assets/inter-tight-greek-wght-normal-sS1B39LI.woff2          22.19 kB
      dist/assets/inter-tight-cyrillic-ext-wght-normal-okcGN4Nq.woff2   26.66 kB
      dist/assets/inter-tight-latin-wght-normal-DX-nOvPD.woff2          44.87 kB
      dist/assets/inter-tight-latin-ext-wght-normal-B4u9PlvR.woff2      89.80 kB
      dist/assets/index-DP4uoWhY.css                                    22.44 kB │ gzip:   5.74 kB
      dist/assets/workbox-window.prod.es5-Bd17z0YL.js                    5.65 kB │ gzip:   2.20 kB
      dist/assets/index-BFNVhN0M.js                                    541.76 kB │ gzip: 170.87 kB
      
      ✓ built in 1.20s
      [plugin builtin:vite-reporter]
      (!) Some chunks are larger than 500 kB after minification. Consider:
      - Using dynamic import() to code-split the application
      - Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
      - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
      
      PWA v1.3.0
      mode      generateSW
      precache  9 entries (557.22 KiB)
      files generated
        dist/sw.js
        dist/workbox-2fbc6a65.js

## Activity

    $ /bin/zsh -lc "find node_modules/.pnpm -maxdepth 1 -type d \\( -name 'yamlyaml_*' -o -name 'js-yaml@*' -o -name '*yaml*' \\) -print | sed -n '1,40p'; for page in index.html lessons/01-mental-model.html lessons/07-durable-sync.html lessons/11-plaschema-case-study.html reference/decision-checklists.html reference/glossary.html; do curl -sSf \"http://127.0.0.1:4175/"'$page" >/dev/null || exit 1; done;avis=""; curl -sSf http://127.0.0.1:4175/sw.js | rg "CACHE_NAME|SKIP_WAITING|caches.keys"; curl -sSf http://127.0.0.1:4175/manifest.webmanifest | rg '"'\"name\"|\"scope\"|\"display\"'; layering=true"
    status: Completed · exit 0
      node_modules/.pnpm/js-yaml@5.3.0
      node_modules/.pnpm/js-yaml@4.3.1
      node_modules/.pnpm/js-yaml@3.15.1
      const CACHE_NAME = `${CACHE_PREFIX}2026-09-10-v1`
        event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)))
          caches.keys()
            .then((names) => Promise.all(names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map((name) => caches.delete(name))))
        if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
                  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)))
        "name": "Production PWA Engineering Playbook",
        "scope": "./",
        "display": "standalone",

## Activity

    $ /bin/zsh -lc "sed -n '1,280p' pwa-engineering-playbook/sw.js; sed -n '1,220p' pwa-engineering-playbook/assets/site.js; git diff -- pwa-engineering-playbook/sw.js"
    status: Completed · exit 0

## Activity

    $ /bin/zsh -lc "if [ -e /Users/admin/.codex/skills/pwa-engineering ]; then find /Users/admin/.codex/skills/pwa-engineering -maxdepth 2 -type f -print; else echo 'GLOBAL_SKILL_ABSENT'; fi; node -e \"const yaml=require('./node_modules/.pnpm/js-yaml@4.3.1/node_modules/js-yaml'); const fs=require('fs'); const doc=yaml.load(fs.readFileSync('pwa-engineering-playbook/skill/pwa-engineering/agents/openai.yaml','utf8')); if(doc.policy?.allow_implicit_invocation"'!==false) throw new Error('"'Skill must be explicit-only'); console.log('openai.yaml parsed; explicit-only policy confirmed')\"; rg -n \"password|token=|Bearer [A-Za-z0-9]|VITE_API_URL=.*https\" pwa-engineering-playbook docs/HANDOFF.md docs/pwa-enrollment-handoff.md || true"
    status: Completed · exit 0
      openai.yaml parsed; explicit-only policy confirmed
      docs/HANDOFF.md:41:- “Remember me” stores the token and user in local storage; unchecked sessions use session storage. No password is stored.
      docs/HANDOFF.md:43:- Sonner provides login and session notifications. The existing forgot/reset-password screens are still mock-only.
      docs/HANDOFF.md:62:- Initial and reset passwords can be cryptographically generated in the browser or entered manually. Successful credentials are displayed once for the admin to copy and are not persisted in stores, query caches, URLs or browser storage.
      docs/HANDOFF.md:63:- Field-worker detail uses `GET /users/:id/detail`; edits and status changes use `PATCH /users/:id`, and admin password reset uses `POST /users/:id/reset-password`.
      docs/HANDOFF.md:89:- Login uses `POST /auth/login`, accepts only active field-worker accounts and stores no password.
      docs/HANDOFF.md:213:- Generate field-worker passwords client-side with Web Crypto by default, allow manual passwords, reveal successful credentials once, and keep password recovery admin-controlled without an invitation/setup flow.
      docs/HANDOFF.md:398:- Field-worker list, detail, optional ward access, create/edit/status actions, one-time generated/manual passwords, password reset, activity filtering and attributed beneficiary pagination are implemented.

## Activity

    $ /bin/zsh -lc 'cp -R /Users/admin/Developer/projects/plaschema/pwa-engineering-playbook/skill/pwa-engineering /Users/admin/.codex/skills/pwa-engineering'
    status: Completed · exit 0

## Activity

    $ /bin/zsh -lc "diff -qr pwa-engineering-playbook/skill/pwa-engineering /Users/admin/.codex/skills/pwa-engineering; node -e \"const fs=require('fs'); const yaml=require('./node_modules/.pnpm/js-yaml@4.3.1/node_modules/js-yaml'); const skill=fs.readFileSync('pwa-engineering-playbook/skill/pwa-engineering/SKILL.md','utf8'); const parts=skill.split('---'); const meta=yaml.load(parts[1]); const ui=yaml.load(fs.readFileSync('pwa-engineering-playbook/skill/pwa-engineering/agents/openai.yaml','utf8')); if(meta.name"'!=='"'pwa-engineering'||"'!meta.description) throw Error('"'invalid skill metadata'); if(ui.policy.allow_implicit_invocation"'!==false) throw Error('"'skill must be explicit-only'); if("'!ui.interface.default_prompt.includes('"'"'$pwa-engineering'"')) throw Error('default prompt missing invocation'); console.log('Skill metadata and explicit-only policy validated.')\"; file pwa-engineering-playbook/assets/icon-192.png pwa-engineering-playbook/assets/icon-512.png"
    status: Completed · exit 0
      Skill metadata and explicit-only policy validated.
      pwa-engineering-playbook/assets/icon-192.png: PNG image data, 192 x 192, 8-bit/color RGBA, non-interlaced
      pwa-engineering-playbook/assets/icon-512.png: PNG image data, 512 x 512, 8-bit/color RGBA, non-interlaced

## Activity

    file changes: Completed · 1 changes
    Update { move_path: None }: /Users/admin/Developer/projects/plaschema/docs/HANDOFF.md
    @@ -238,2 +238,18 @@
     
    +On 10 September 2026 after the PWA engineering playbook was added:
    +
    +- The playbook contains 11 detailed lessons, four operational reference pages,
    +  accessible HTML/CSS architecture and state diagrams, a lightweight offline
    +  shell, and a prompted service-worker update flow.
    +- All 16 HTML pages, local links, manifest icons and service-worker precache
    +  targets pass the committed structural validator. Localhost smoke checks return
    +  HTTP 200 for the hub, representative lessons, references, manifest and worker.
    +- The `$pwa-engineering` skill metadata and explicit-only policy validate, and
    +  the installed global copy matches the committed canonical source.
    +- All 36 existing PWA tests pass. PWA lint and production build pass; the build
    +  retains the existing non-blocking large-chunk warning.
    +- No backend files were changed. Automated in-app visual browser control was not
    +  available in this session, so the documented Android/iOS and service-worker UI
    +  checks remain manual release gates.
    +
     At commit `a73ed09`:

## Assistant

The playbook and skill are installed and the existing app still passes its full test, lint, and production-build checks. I’m doing the final integrity pass now, including matching the global skill to its committed source and checking that every lesson, diagram, link, manifest asset, and offline-cache entry is complete.

## Activity

    $ /bin/zsh -lc "rg -n \"password|token|secret|VITE_API_URL\" pwa-engineering-playbook docs/HANDOFF.md docs/pwa-enrollment-handoff.md | sed -n '1,160p'; printf 'HTML pages: '; find pwa-engineering-playbook -name '*.html' | wc -l; printf 'Diagram blocks: '; rg -o 'class=\"diagram\"' pwa-engineering-playbook -g '*.html' | wc -l; printf 'Words in learning content: '; sed 's/<["'^>]*>/ /g'"' pwa-engineering-playbook/{index.html,lessons/*.html,reference/*.html} | wc -w"
    status: Completed · exit 0
      docs/pwa-enrollment-handoff.md:190:- Session token + cached user profile (for offline app access).
      docs/pwa-enrollment-handoff.md:226:Base URL: configure `VITE_API_URL` (e.g. production API). All paths below are prefixed with `/api`.
      docs/pwa-enrollment-handoff.md:234:| `POST /auth/login` | Public | First login; returns token + user |
      docs/pwa-enrollment-handoff.md:239:No logout endpoint — clear token locally. No refresh token — re-login when JWT expires (~8h).
      docs/pwa-enrollment-handoff.md:323:   - On app open: restore session if token not expired.
      docs/HANDOFF.md:37:- Chart colours come from the `--chart-1` … `--chart-5` theme tokens in `frontend/src/index.css`. Recharts mount animations are disabled so charts render deterministically and do not re-animate on every filter change or background refetch.
      docs/HANDOFF.md:40:- Authentication is admin-only. Zustand owns the access token, authenticated user and session status.
      docs/HANDOFF.md:41:- “Remember me” stores the token and user in local storage; unchecked sessions use session storage. No password is stored.
      docs/HANDOFF.md:42:- There is no refresh-token endpoint. A protected-request 401 clears the session, while a transient `/auth/me` failure preserves it and offers retry/sign-out actions.
      docs/HANDOFF.md:43:- Sonner provides login and session notifications. The existing forgot/reset-password screens are still mock-only.
      docs/HANDOFF.md:62:- Initial and reset passwords can be cryptographically generated in the browser or entered manually. Successful credentials are displayed once for the admin to copy and are not persisted in stores, query caches, URLs or browser storage.
      docs/HANDOFF.md:63:- Field-worker detail uses `GET /users/:id/detail`; edits and status changes use `PATCH /users/:id`, and admin password reset uses `POST /users/:id/reset-password`.
      docs/HANDOFF.md:89:- Login uses `POST /auth/login`, accepts only active field-worker accounts and stores no password.
      docs/HANDOFF.md:91:- A protected-request 401, role mismatch or local token expiry clears the session. A transient `/auth/me` failure preserves it and offers Retry or Continue Offline.
      docs/HANDOFF.md:108:- Logout is immediate; no refresh-token or server logout endpoint exists.
      docs/HANDOFF.md:115:- No refresh-token endpoint; clients re-login when the JWT expires.
      docs/HANDOFF.md:128:- PWA API responses are not cached by the service worker. Set `VITE_API_URL` in local and Netlify environments; never commit its deployed value.
      docs/HANDOFF.md:181:- Set a production `VITE_API_URL` separately for both Netlify sites and rebuild after changing it. Do not commit deployed environment values.
      docs/HANDOFF.md:205:- Chart marks may not use the brand lime `#9fe870` directly. It is too light for a data mark (only about 1.44:1 against white), so the chart tokens hold the brand hue at an accessible step and the pale lime is used only as the area wash beneath the trend line.
      docs/HANDOFF.md:213:- Generate field-worker passwords client-side with Web Crypto by default, allow manual passwords, reveal successful credentials once, and keep password recovery admin-controlled without an invitation/setup flow.
      docs/HANDOFF.md:292:- The chart token ramp was validated for lightness, chroma, colour-vision separation and surface contrast before use; the brand lime failed the mark-contrast floor and was replaced for marks while remaining the trend area wash.
      docs/HANDOFF.md:414:- Field-worker list, detail, optional ward access, create/edit/status actions, one-time generated/manual passwords, password reset, activity filtering and attributed beneficiary pagination are implemented.
      docs/HANDOFF.md:433:- Refresh-token support and automatic session renewal.
      pwa-engineering-playbook/skill/pwa-engineering/references/architecture-and-build.md:11:7. For files, define capacity, blob ownership, presign/PUT stages, token isolation, reuse, and orphan cleanup.
      pwa-engineering-playbook/skill/pwa-engineering/references/risk-and-quality.md:5:- Prefer secure HttpOnly cookie or BFF session designs when architecture permits. If tokens are JavaScript-accessible, state the XSS exposure and compensate with short expiry, strict CSP, dependency control, and no unsafe injection.
      pwa-engineering-playbook/skill/pwa-engineering/references/risk-and-quality.md:9:- Never place personal payloads, credentials, tokens, presigned URLs, or raw server errors in logs or documentation.
      pwa-engineering-playbook/lessons/11-plaschema-case-study.html:4:<h2 id="strengths">Proven strengths</h2><ul class="checklist"><li>One active owner-scoped draft survives reload and restart.</li><li>Files are durable IndexedDB blobs, not temporary object URLs.</li><li>Draft-to-outbox movement is atomic.</li><li>Idempotency starts at draft creation and survives retry/edit.</li><li>Expired upload/submission leases recover after interruption.</li><li>Transient failures use bounded delays; validation failures remain reviewable.</li><li>Partial batch success still produces a durable final report.</li><li>Reference streams refresh only when missing, older than 24 hours, or ward access changes.</li><li>Home statistics combine server totals with only unsent local work, avoiding retained accepted-row double counts.</li><li>Presigned storage PUTs do not leak the API bearer token.</li></ul>
      pwa-engineering-playbook/lessons/11-plaschema-case-study.html:6:<h2 id="hardening">Evidence-based hardening opportunities</h2><ul><li>Complete real-device Android and iOS tests for offline reopen, storage pressure, update, upload CORS, and reconnect.</li><li>Request persistent storage earlier in the prepared offline workflow, not only when the enrollment screen mounts, and show whether it was granted.</li><li>Define a stronger shared-device logout/wipe and local-data recovery policy for beneficiary information.</li><li>Review the JavaScript-accessible token design against a cookie/BFF option and strengthen CSP/XSS controls.</li><li>Add full service-worker lifecycle and update-prompt browser tests, including the login surface.</li><li>Verify backend lifecycle cleanup for uploaded objects that never attach to an accepted enrollment.</li><li>Keep schema migration fixtures as the Dexie database evolves.</li></ul><div class="callout success"><strong>The transferable lesson</strong>The strongest part is not a library. It is the sequence of promises: save locally first, persist every irreversible stage, retry with stable identity, report acceptance durably, and delete only after the final obligation succeeds.</div>
      pwa-engineering-playbook/lessons/10-testing-and-operations.html:3:<h2 id="drills">Failure drills</h2><table class="matrix"><thead><tr><th>Interrupt here</th><th>Expected recovery</th></tr></thead><tbody><tr><td>Halfway through draft save</td><td>Transaction leaves the earlier complete draft or the new complete draft, never half a record.</td></tr><tr><td>After file PUT, before object key save</td><td>Possible orphan is cleaned by server lifecycle; retry may re-upload.</td></tr><tr><td>After key save, before create</td><td>Retry skips file upload and submits the stored key.</td></tr><tr><td>After server commit, before response</td><td>Same idempotency key returns original receipt.</td></tr><tr><td>After receipt, before final report</td><td>Durable report marker retries only the report.</td></tr><tr><td>During database upgrade</td><td>Upgrade commits completely or aborts; user sees recovery guidance.</td></tr><tr><td>While a new worker waits</td><td>Old version remains usable; update prompt does not erase a form.</td></tr><tr><td>With two tabs syncing</td><td>Only one valid lease claims each record.</td></tr><tr><td>When token expires</td><td>Queue stops, work stays local, user reauthenticates.</td></tr></tbody></table>
      pwa-engineering-playbook/lessons/10-testing-and-operations.html:5:<h2 id="observe">Observe outcomes, not private content</h2><p>Useful events include worker version, database version, reference age, queue counts by status, oldest pending age, retry code category, sync duration, update acceptance, migration failure, quota failure, and final report delay. Do not log names, photos, form bodies, tokens, presigned URLs, or unredacted server errors.</p><p>A health view for users should show the last complete reference refresh, last complete sync, pending and failed counts, storage warning, app version, and a safe support identifier.</p>
      pwa-engineering-playbook/lessons/09-security.html:2:<h2 id="threats">Draw the threat boundary</h2><figure class="diagram"><figcaption>Ways local data can be exposed or damaged</figcaption><div class="grid two"><div class="node failure">XSS or bad dependency<small>Reads tokens and IndexedDB as the app</small></div><div class="node warning">Shared or lost device<small>Another person opens the browser profile</small></div><div class="node failure">Stale authorization<small>Cached access outlives server permission</small></div><div class="node warning">Storage pressure or clearing<small>Unsent work disappears</small></div><div class="node failure">Logs and diagnostics<small>Personal data leaks into telemetry</small></div><div class="node warning">Malicious local changes<small>Device records cannot be trusted by server</small></div></div></figure>
      pwa-engineering-playbook/lessons/09-security.html:3:<table class="matrix"><thead><tr><th>Asset</th><th>Threat</th><th>Control</th></tr></thead><tbody><tr><td>Session token</td><td>XSS reads JavaScript-accessible storage.</td><td>Prefer secure HttpOnly cookies/BFF when architecture allows; otherwise strong CSP, dependency control, short expiry, no HTML injection.</td></tr><tr><td>Pending personal data</td><td>Shared/lost device or profile access.</td><td>Minimize fields, owner scope, app lock where justified, retention and wipe policy, device guidance.</td></tr><tr><td>Cached references</td><td>Permission changed.</td><td>Access signature, immediate local hiding, server reauthorization at sync.</td></tr><tr><td>Outbox payload</td><td>Tampering or replay.</td><td>Validate and authorize on server; idempotency is not authorization.</td></tr><tr><td>Errors and analytics</td><td>Sensitive values logged.</td><td>Allowlisted structured events, redaction, no raw form payloads.</td></tr></tbody></table>
      pwa-engineering-playbook/lessons/08-files-and-auth.html:2:<h2 id="files">The file lifecycle</h2><figure class="diagram"><figcaption>One file, five storage states</figcaption><div class="flow"><div class="node primary">Selected File</div><span class="connector">→</span><div class="node local">IndexedDB Blob<small>Linked to local record</small></div><span class="connector">→</span><div class="node server">Presigned PUT<small>No API bearer token</small></div><span class="connector">→</span><div class="node warning">Object key<small>Persist immediately</small></div><span class="connector">→</span><div class="node done">Attached + local cleanup</div></div></figure><p>Check type, size, and estimated free space before accepting a file. Store the blob separately from form fields so it can be replaced and cleaned independently. Keep its name, MIME type, size, purpose, owner, and parent local ID. Revoke preview object URLs when the screen releases them.</p>
      pwa-engineering-playbook/lessons/08-files-and-auth.html:3:<h2 id="upload">Keep trust boundaries clear</h2><ol><li>Ask the authenticated API for an upload instruction containing a short-lived URL and object key.</li><li>PUT the exact bytes directly to storage with only the required content headers.</li><li>Do not attach the API bearer token to the storage-domain request.</li><li>Persist the object key immediately. A retry can skip an upload that already succeeded.</li><li>Submit the business record with the keys.</li><li>Use server lifecycle rules to remove uploaded objects never attached to a completed record.</li></ol><div class="callout warning"><strong>Presigned does not mean harmless</strong>Restrict allowed purpose, content type, size, key prefix, expiry, and HTTP method on the server. Configure object-storage CORS for only the deployed app origins and required headers.</div>
      pwa-engineering-playbook/lessons/08-files-and-auth.html:5:<h2 id="expiry">Make expiry unsurprising</h2><ul class="checklist"><li>Show when offline access will expire if the user needs to plan field work.</li><li>Save draft changes before presenting a login screen.</li><li>Keep unsent records durably separated from the session token.</li><li>Define whether logout wipes, retains, or transfers unsent work.</li><li>Handle cross-tab logout and role changes.</li><li>Never call an authentication retry loop from each outbox record.</li></ul>
      HTML pages:       16
      Diagram blocks:       20
      Words in learning content:     8423

## Activity

    $ /bin/zsh -lc 'git status --short; git diff --stat; diff -qr pwa-engineering-playbook/skill/pwa-engineering /Users/admin/.codex/skills/pwa-engineering'
    status: Completed · exit 0
       M AGENTS.md
       M docs/HANDOFF.md
       M docs/pwa-enrollment-handoff.md
      ?? pwa-engineering-playbook/
       AGENTS.md                      |  6 ++++++
       docs/HANDOFF.md                | 36 +++++++++++++++++++++++++++++++++++-
       docs/pwa-enrollment-handoff.md | 22 +++++++++++++++++-----
       3 files changed, 58 insertions(+), 6 deletions(-)

## Activity

    $ /bin/zsh -lc 'node --check pwa-engineering-playbook/assets/site.js && node --check pwa-engineering-playbook/sw.js && node pwa-engineering-playbook/scripts/validate.mjs && git diff --check'
    status: Completed · exit 0
      Validated 16 HTML pages, local links, manifest icons, and service-worker precache targets.

## Assistant

Implemented the complete PWA Engineering Playbook.

Highlights:

- [Open the playbook](/Users/admin/Developer/projects/plaschema/pwa-engineering-playbook/index.html)
- 11 detailed lessons and four reference pages
- 20 responsive architecture, sequence, and state diagrams
- 8,400+ words written in plain language
- Offline-capable static site with manifest, service worker, cache cleanup, and prompted updates
- PLASCHEMA architecture case study and hardening audit
- Explicit-only `$pwa-engineering` skill supporting Learn, Plan, Build, and Audit
- Skill installed globally and verified against the committed source
- Existing handoff documentation corrected and cross-linked
- No backend changes

Validation passed:

- 16 HTML pages, local links, manifest icons, and precache entries
- Skill metadata and explicit-only policy
- All 36 existing PWA tests
- PWA lint and production build
- Localhost HTTP smoke tests

Automated visual browser control was unavailable, so Android/iOS visual and service-worker interaction checks remain documented manual release gates.

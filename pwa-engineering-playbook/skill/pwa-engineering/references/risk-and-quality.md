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

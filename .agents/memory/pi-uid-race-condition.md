---
name: Pi Network user account race condition
description: users.piUid had no uniqueness constraint, letting concurrent Pi sign-ups create duplicate accounts.
---

`users.piUid` (the Pi Network account identifier) had no unique constraint and the
find-or-create flow in the Pi auth route was not atomic — a slow first sign-up request
retried by the client (or any concurrent duplicate request) could insert two user rows
with the same `piUid`. Whichever row a plain `SELECT ... LIMIT 1` happened to return first
then determined which account a Pi user "signed into" — causing intermittent, hard-to-reproduce
sign-in failures reported by real users.

**Why:** No DB-level constraint existed to prevent it, and the create-user path didn't handle
a duplicate-key error, so this was a race, not a deterministic bug.

**How to apply:** Fixed with a partial unique index `CREATE UNIQUE INDEX ... ON users(pi_uid)
WHERE pi_uid IS NOT NULL` (allows unlimited NULLs for non-Pi users) plus a catch on Postgres
error code `23505` in the create-user path that re-fetches by `piUid` instead of erroring.
When adding any other "external identity" login method (OAuth, wallet, etc.), give its ID
column the same unique-index + duplicate-key-recovery treatment up front.

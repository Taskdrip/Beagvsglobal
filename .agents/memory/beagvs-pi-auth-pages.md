---
name: Beagvs Pi auth — real pages vs dead code
description: Which files actually implement the Pi Network sign-in/sign-up flow in this project, and the intent-based contract between client and server.
---

`client/src/pages/Auth.tsx` is **not routed** in `App.tsx` — it's dead code. The
live, routed Pi auth UIs are `client/src/pages/Login.tsx` ("Sign In with Pi")
and `client/src/pages/Signup.tsx` ("Sign Up with Pi"), each with their own
`handlePiAuth`. Any future Pi-auth-flow change must be made in Login.tsx and
Signup.tsx, not Auth.tsx.

**Why:** A first attempt at fixing the Pi sign-up auto-account-creation bug
was made entirely in Auth.tsx and had zero effect in the running app, because
that page is never mounted by the router.

**How to apply:** Before editing an auth-related page, grep `App.tsx`'s
`<Route ... component={X}>` list to confirm the file is actually reachable.

Contract now in place: `POST /api/auth/pi` requires a body field
`intent: 'signin' | 'signup'`. `signin` never auto-creates a user — if no
Beagvs account is linked to the Pi uid, it 404s with
`{ message, needsSignup: true }` and the client (Login.tsx) redirects to
`/signup`. `signup` creates the account if missing (or logs in if it already
exists) and the client always routes through `/onboarding` when
`needsOnboarding` is true, so a picker for buyer/seller/shipping-agent is
mandatory before reaching a dashboard.

`client/src/lib/queryClient.ts`'s `apiRequest` attaches the parsed JSON error
body as `error.body` and the HTTP status as `error.status`, and overwrites
`error.message` with the JSON `message` when present (previously always
`"<status>: <raw text>"`). Any code checking `error.message` against the old
`"401: ..."` format (e.g. `isUnauthorizedError`) must also check
`error.status === 401`.

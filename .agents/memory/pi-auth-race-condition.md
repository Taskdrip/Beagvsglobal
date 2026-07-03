---
name: Pi auth routing race → 404
description: Race condition where Pi Network sign-in leaves users on a 404 page instead of /dashboard or /onboarding.
---

## The rule
Always add redirect routes for `/login`, `/signup`, and `/auth` inside the **authenticated** branch of the wouter `<Switch>` (or equivalent router) that redirect to `/dashboard`. Do this before any route that might briefly trigger `RedirectToLogin`.

## Why
In `Login.tsx`, Pi auth calls `queryClient.setQueryData(["/api/auth/user"], user)` then `setLocation("/onboarding")` in sequence. If React processes these in two render passes:
1. Pass 1: `isAuthenticated=false`, path=`/onboarding` → `RedirectToLogin` fires → `nav("/login")`
2. Pass 2: `isAuthenticated=true`, path=`/login` → NO `/login` route in authenticated tree → hits `<Route component={NotFound}/>` → **404**

## How to apply
In `client/src/App.tsx`, inside the `{isAuthenticated ? <> ... </>}` block, add at the top:
```tsx
<Route path="/login" component={RedirectToDashboard} />
<Route path="/signup" component={RedirectToDashboard} />
<Route path="/auth" component={RedirectToDashboard} />
```
Where `RedirectToDashboard` uses `useEffect(() => nav("/dashboard"), [nav])`.

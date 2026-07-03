---
name: Escrow auth onSuccess pattern
description: How to handle auth completion in inline auth forms without breaking escrow checkout state.
---

## The rule
After an inline `GuestCheckoutAuth` completes, use `invalidateQueries` + `refetchQueries` on `["/api/auth/user"]` — never `window.location.reload()`.

## Why
`window.location.reload()` wipes the entire React Query cache. On the Checkout page, this means the escrow data, listing data, and any pending mutation state are all lost. The page re-mounts, triggers a fresh fetch (which requires auth), and can get into an auth loop if timing is bad.

## How to apply
```ts
onAuthSuccess={async () => {
  await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
  await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
  // Component re-renders naturally once isAuthenticated becomes true.
}}
```

## Extra: escrow double-mutation risk
Do NOT use a `useEffect([authComplete, isAuthenticated])` alongside a direct `createEscrowMutation.mutate()` call in `onAuthSuccess`. There is a small window where the effect fires before the mutation's `isPending` flag is visible to the component, causing two escrows to be created. Use only the direct call in `onAuthSuccess`.

## Extra: escrow authz
`GET /api/escrows/:id` must check `buyerId === userId || sellerId === userId || isAdmin` before returning. Without this check any authenticated user can read any escrow (IDOR). Also, `GET /api/escrows?admin=true` must check `isAdmin` before removing the `userId` filter.

---
name: React form.reset during render
description: Why calling react-hook-form reset() outside useEffect causes React error #301 in production.
---

Calling `form.reset()` from `react-hook-form` **directly in the component render body** (e.g. inside a conditional block, not inside `useEffect`) causes React error #301 ("Too many re-renders") in production.

**Why:** `form.reset()` internally calls React's `setState` (via the RHF store dispatch). Calling `setState` during the render phase triggers an immediate re-render, which React detects as a potential infinite loop and throws.

**How to apply:** Always put `form.reset()` inside a `useEffect`:

```javascript
useEffect(() => {
  if (!open) return;
  form.reset({ ...valuesFromProp });
}, [someId, open]); // reset when the target changes or dialog opens
```

Do NOT do:
```javascript
if (post?.id !== prevId.current) {
  prevId.current = post?.id;
  form.reset({ ... }); // ← crashes in production with error #301
}
```

**Symptoms seen:** Blog tab showed "Something went wrong / Minified React error #301" immediately on load, Update Post button did nothing, posts only loaded after full page refresh (because error cleared the query cache state).

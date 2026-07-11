---
name: Platform fee settings jsonb shape
description: How platform_settings.value is shaped for fee percentages and the NaN pitfall it causes if misread.
---

`platform_settings.value` is jsonb shaped like `{ percentage: <number> }`, not a bare number.
Reading it with `parseFloat(String(value))` produces `parseFloat("[object Object]")` → `NaN`,
which surfaces as "NaN%" fees / "NaN Pi" totals in checkout and listing-creation UIs.

**Why:** Several call sites (listing creation, listing detail, guest checkout, escrow creation)
independently re-implemented fee extraction and most got it wrong; only one admin-settings
call site had the correct pattern.

**How to apply:** Always extract with `value?.percentage ?? value` (coerced to `Number`), and fall
back to a hardcoded default only if that's still `NaN`. Reference implementation lives in the
admin fee-settings tab.

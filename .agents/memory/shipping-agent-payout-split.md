---
name: Shipping agent payout split
description: How the 75/25 shipping-fee split between delivery agent and platform is computed and paid out
---

The shipping fee on an escrow is split 75% to the assigned delivery agent / 25% to the platform, written onto the escrow itself (`shippingAgentId`, `shippingAgentFeeAmount`, `adminShippingFeeAmount`), not onto a separate ledger table.

**Why:** payout requests need to reference a concrete escrow-level payable amount for both sellers and agents, and the escrow is already the natural aggregation point for a given order/shipment.

**How to apply:** Both the admin "assign agent" flow and the agent "self-claim" flow must call the same helper to (re)compute and persist the split whenever an agent is attached to/detached from an escrow's shipment — don't duplicate the 75/25 math inline in route handlers. Payout requests (`sellerPayoutRequests` table) carry a `payeeType` ('seller' | 'agent') plus nullable `sellerId`/`agentId` so the same table and admin review UI serve both seller earnings and agent commission payouts; the amount for agent-type requests comes from the escrow's `shippingAgentFeeAmount`, not from `sellerNetAmount`/`amount`.

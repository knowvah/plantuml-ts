# Batch 4 — Wire it in (the risky one)

One task, alone in its commit. This is the ONLY task in the mission that
changes rendered output, and the only one T1's goldens exist to watch.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T4 | Route `EntityImageDescription`'s name/desc through `BodyFactory` | typescript-pro | `src/core/svek/image/EntityImageDescription.ts` | T2b, T3 | [ ] |

**Routing in `leaf-sizing.ts` stays UNTOUCHED here** (ADR-6). The narrowing
guards come out in batch 5, separately, so a ratchet movement has exactly
one candidate cause.

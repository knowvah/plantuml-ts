# Batch 1 — the second split

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [S2](S2-split-shield-helpers.md) | Relocate shield helpers to `class-shield-helpers.ts` | typescript-pro | `class-layout-helpers.ts`, `class-shield-helpers.ts` (new), import repoints | S1 | [x] `3936ddb5` |

## Why this is not in Batch 0 with S1

S2 rewrites `class-layout-helpers.ts`, and S1 repoints an **import** in that
same file. One writer per file per batch (`parallelism.md`), so they are
sequenced rather than parallel. The dependency is on the file, not on S1's
output — S2 needs nothing S1 produced except a settled `class-layout-helpers
.ts`.

## Batch exit

- `class-layout-helpers.ts` is under 500 lines with headroom for T2's change
  to `memberPortIsP`.
- Every measured count is byte-identical to before S2. A pure relocation
  cannot move a number.

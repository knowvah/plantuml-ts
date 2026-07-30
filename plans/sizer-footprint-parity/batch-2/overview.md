# Batch 2 — Route the usecase sizer through `Footprint`

One task, the mission's substantive change. Depends on T1: both alter atom
resolution, so they are sequenced despite disjoint write-sets.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T2 | Route the usecase sizer through `TextBlockInEllipse`/`Footprint`; retire `usecase-footprint.ts`; delete `AtomImageResolver`'s ink fields | typescript-pro | `src/diagrams/description/leaf-sizing-text.ts`, `usecase-footprint.ts` (delete), `src/core/creole-atoms.ts`, `src/core/sprite-commands.ts` | T1 | [ ] |

**The renderer already does this correctly.** This task makes the sizer
agree, which is the sizer↔renderer parity guard's whole subject.

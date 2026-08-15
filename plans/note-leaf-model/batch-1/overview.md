# Batch 1 — make the leaf types explicit, and pin what must not move

No structural change. This batch buys the two things Batch 2 and 3 need:
the NOTE/TIPS distinction made visible in the model, and a gate that can
see note ORDER (which the standing gates only see indirectly).

| ID | Description | Agent | Writes | Depends on | Done |
|----|-------------|-------|--------|-----------|------|
| T1 | Note-order/uid invariant harness + baseline | typescript-pro | `scripts/note-order-report.ts` | — | [x] |
| T2 | Carry the upstream leaf type on `NoteGeo` | typescript-pro | `class/note-layout-types.ts` + producers | — | [x] |

Parallel: disjoint write-sets.

## Batch exit bar

1. T1 reports, per class fixture, the document order of note vs classifier
   elements and each note's uid — and reproduces identically on two runs.
2. T2's `NoteGeo` states whether each note is upstream's `LeafType.NOTE` or
   `LeafType.TIPS`, and every producer sets it.
3. Rendered output byte-identical; DOT unmoved; all four gates green.

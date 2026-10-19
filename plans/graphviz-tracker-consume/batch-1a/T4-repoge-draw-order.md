# T4 — repoge: note inside a ported component, draw order (item 30)

Prepend [../task-preamble.md](../task-preamble.md). Mission checkout.

## Context
`component/repoge-41-demu604` (37/16): a `component … <<block>> { note as tempSensor_TVs … ; portin ×2;
portout ×2 }`, plus `note bottom of tempSensor`. Layout is equal to native (dsw core a/i wrappers). The
jar's top-level order is: entity `ent0002` (the inner note, whose text continues "would be here /
usually."), then ports `ent0003-0006`, then the bottom note `ent0008`, then link `lnk9` (dashed note link
`tempSensor-GMN7`), with 8 children. Ours starts with the cluster `ent0001`, drops one element and draws
the note-link as an `entity`. Read `in.svg` in full before deciding what the jar draws (memory
"segment-compare-beats-align-counts"). The compare aligns by position, so one missing element shifts
every row after it.

Start at the jar's cluster/leaf draw order for a component with a body, and `SvekResult`/`DotStringFactory`
draw ordering. Also check how the jar numbers the note link's `@id` (`tempSensor-GMN7`).

## Task
Produce a diagnosis artifact per mechanism (order; the missing or extra element; note-link id). Fix with
tests.

## Write-set
`src/diagrams/description/{renderer-draw-sequence.ts,renderer-cluster-note.ts,renderer-note.ts,renderer-note-opale.ts,renderer-cluster.ts,link-note-box.ts,renderer-uid.ts}`,
`tests/unit/description/**`.

## Acceptance
- Given repoge, when rendered, then element order, ids and childCounts equal the jar's (0/0).
- Given the component surveys before and after, then there are no losses; since draw order is shared,
  every mover gets a mechanism.
- Given sokevu (class), then it stays conformant (item 30's other row).

**Observability:** N/A. **Rollback:** reversible.

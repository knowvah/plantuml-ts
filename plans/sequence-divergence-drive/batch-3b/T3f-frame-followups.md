# T3f — else draw order, per-else paint, group/ref command colours

Agent: `typescript-pro`, worktree `sdd1-T3f`. Added 2026-10-20 from T3a's
stop-1 items (journal rows 42-43). Runs in parallel with T3c. One commit per
item. **Read [../batch-2/family-contract.md](../batch-2/family-contract.md)
first — it is part of this prompt.**

## Items
1. **Else draw order.** Upstream draws each else separator among the child
   tiles (`GroupingTile.java:280-281`, `ElseTile`); the port draws every
   else rule right after the frame header, so under index pairing it is
   tag-mismatched against the jar's `polygon`/`text` (32 rows rise +1 per
   else since T3a gave the rule its jar `stroke-width`). Put the else into
   the geo stream at its position and draw it in the jar's order. Compare
   element order against goldens (e.g. bovugo-63-lazo401, daduxi-21).
2. **Per-else paint.** `FrameGeo` carries one paint; each else needs its own
   (its `branchStyleBuilders[i]`): jar probe — a mid-branch `skinparam
   sequenceGroupBorderColor red` strokes the later else red. The condition
   font is already per-else.
3. **`sequenceGroupBodyBackgroundColor`.** A legacy ColorParam read at the
   command (`SequenceDiagram.java:418-419`), not a style; 9 fixtures miss
   their band: cabeve, darupa, koleji, murori, nofegi, padomu, xebixi,
   xeneru, xuzedu. Read the Java chain from the command to `Blotter`.
4. **`group T [c]` comment.** `command-grouping.ts#resolveGroupLabel` drops
   `[c]`; the jar draws it with the body font, LEFT
   (`ComponentRoseGroupingHeader.java:84,90`). pizupi-41 shows it.
5. **`ref#color`.** `command-misc.ts#refOverCommand` discards `match[1]`
   (`CommandReferenceOverSeveral.java:118-119`); `referencePaints` already
   applies `FrameEvent.backColorElement` once it is set (sojufi-84).
6. **`!theme plain` extra canvas rect** (pizupi-41, row 42): the port draws
   a full-canvas background rect the jar does not. Find where, from the
   Java (`TitledDiagram`/`ImageBuilder` background handling), and remove it
   only if it is sequence-owned; if it is in shared chrome, report it.

## Write-set
`src/diagrams/sequence/{geo-frame,ast,command-grouping,command-misc,
renderer,renderer-frame-header,renderer-frame-blotter,sequence-layout-frame,
sequence-layout-events,scale-geo,sequence-page}.ts`, their tests under
`tests/unit/sequence/`. NOT yours (T3c runs in parallel): `layout.ts`,
`text-block-geo.ts`, `sequence-layout-shared.ts`, anything under `src/core/`.

## Acceptance
- The 32 +1/else rows from row 42 fall back at least to their b2 value;
  bovugo-63's else rule pairs with the jar's line.
- Each of the 9 band fixtures draws the band with the jar's fill.
- A mid-branch `sequenceGroupBorderColor` reaches only the later else
  (jar-verified).
- Every riser vs your start has a mechanism; the 367+ pinned goldens stay
  byte-equal.

Quality bar and boundaries: per `family-contract.md`. Observability: N/A.
Rollback: Reversible.

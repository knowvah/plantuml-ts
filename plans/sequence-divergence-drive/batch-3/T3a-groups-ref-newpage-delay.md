# T3a — groups, partitions, ref, newpage, delay

Agent: `typescript-pro`, worktree `sdd1-T3a`. Commit:
`fix(sequence): paint frames, refs, newpages and delays from the style`.
**Read [../batch-2/family-contract.md](../batch-2/family-contract.md) first —
it is part of this prompt.**

## The family
- Grouping frames (`group`, `alt`/`else`, `loop`, `opt`, `par`, `break`,
  `critical`, `partition`): `group { LineColor black; LineThickness 1.5;
  FontSize 11; FontStyle bold }` (`plantuml.skin:116-121`), `groupHeader
  { LineThickness 1.5; BackGroundColor #e; LineColor black; FontSize 13;
  FontStyle bold }` (`:123-129`), `partition { … header { FontSize 13;
  FontStyle bold } }` (`:131-139`, upstream `d99bcb58a55` "give
  sequence-diagram partitions their own style selector"); signature
  `Grouping.java:58-62`, merged in the constructor (`:111`).
  `frame-style.ts` hard-codes these today (it cites `plantuml.skin:102-129`).
- `ref over`: `reference` (`:155-161`) and `referenceHeader` (`:163-170`),
  `Reference.java:66-67,111`.
- `newpage`: `newpage { LineStyle 2 }` (`:189-191`), `Newpage.java:48`.
- `...` delay: signature `lifeLine, delay` (`ComponentType.java:101-105`),
  merged in `Delay.java:51-61`.

`renderer.ts` is yours in this batch (T2e changed `renderNote` /
`renderBoxBackground` in batch 2 — leave them): `renderRefBody`,
`renderFrame`, `renderFrameBackground`, `renderBranchSeparators`,
`renderNewpage`, `renderDelayText` (`renderer.ts:149-330`).

Java: `sequencediagram/{Grouping,GroupingStart,GroupingLeaf,Reference,
Newpage,Delay}.java`; `skin/rose/{ComponentRoseGroupingHeader,
ComponentRoseGroupingElse,ComponentRoseGroupingSpace,ComponentRoseReference,
ComponentRoseNewpage,ComponentRoseDelayLine,ComponentRoseDelayText}.java`.

## Write-set
`src/diagrams/sequence/{renderer,frame-style,renderer-frame-header,
renderer-frame-blotter,ref-body-geo,newpage-style,sequence-delay}.ts`, their
tests under `tests/unit/sequence/` Added 2026-10-20 (journal row 23): the geo
builders for your family, which no batch-3 task otherwise owns:
`sequence-layout-events.ts` (frame and newpage geo only),
`sequence-layout-ref.ts`, and `layout.ts` (newpage geo only). Delete `frame-style.ts` /
`newpage-style.ts` if nothing is left in them.

## Updates from batch 1b (journal rows 16-20)
- Group and reference HEADERS resolve: `groupingStyle(b, type, true,
  backColor?)` and `referenceStyle(b, true)` layer the nested
  `group { header }` / `reference { header }` with
  `Style#mergeNestedChildOver` (T1d). The reference header's
  `BackGroundColor` override (`Reference.java:99-101`) is yours to apply.
- Each `else` branch has its own builder: `FrameEvent.branchStyleBuilders`,
  aligned with `branchLabels` (`SequenceDiagram.java:431-432`,
  `ElseTile.java:98`).

## From T3b (journal row 38)
- `ref-body-geo.ts:130` reads `theme.colors.graph.sequenceShadowing?.reference`;
  read the reference style's shadowing instead (`ComponentRoseReference.java:
  155-159`), the same value as `frame.paint.shadowing`.
- `sequence-shadow.ts#frameShadowDelta` falls back to the theme while
  `FrameGeo.paint` is unset. Once you paint every frame (group body, ref
  body), that branch is dead; say so in your hand-back so T3c deletes it.

## Read-set
`family-contract.md`; `decisions.md#d1`, `#d2`, `#d5`; the write-set files;
`geo-frame.ts`, `geo-annotation.ts:89-160`; `sequence-skin-param.ts`
(`groupingStyle`, reference/newpage/delay styles, `paintOf`).

## Acceptance
- Given `alt x / else y / end`, then frame stroke 1.5 black, header font
  13 bold and condition font 11 bold equal the jar's (unit tests cite the
  skin lines).
- Given `ref over A, B : text`, then body and header paint come from
  `reference` / `referenceHeader`.
- Given `newpage` and `...`, then dash and font come from their merged
  styles.
- Given `grep -rn "[0-9]" frame-style.ts newpage-style.ts` (if kept), then
  every number carries a citation.
- Given the frame/ref/newpage/delay rows at b2, then no row rises without a
  mechanism.

Quality bar and boundaries: per `family-contract.md`. Observability: N/A — no new
observable operations. Rollback: Reversible.

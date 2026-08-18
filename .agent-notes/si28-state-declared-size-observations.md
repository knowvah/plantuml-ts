# SI28 state-declared-size-diagnosis — orchestrator-filed observations

Surfaced by T1–T13 agents (2026-08-18); filed by the orchestrator because agents
were confined to `findings/<bucket>.md`. Records live in
`plans/state-declared-size-diagnosis/findings/`.

## Observation: `BORDER_POINT_SIZE` comment claims EXPANSION_* is unexercised — false
- **Context**: T4 pseudo-state diagnosis of the −36 px ×4 group.
- **Finding**: `src/diagrams/state/state-entity-position.ts:110-112` says
  "EXPANSION_* differ but no state-diagram fixture in the corpus exercises
  them — RADIUS*2 stands in". Four state fixtures do exercise them
  (`bujuta-44-rovo666`, `mimaga-15-doze740`, `nijugi-19-jazi166`,
  `rinisi-79-peko570`); jar sizes them 12×48 / 48×12 by rankdir
  (`EntityPosition.java:120-128`), we declare 12×12 (`state-leaf-node.ts:44`).
- **Impact**: the comment will mislead whoever fixes it; the fix must read
  rankdir. See `findings/pseudo-state.md`.
- **Confidence**: High

## Observation: an id-pattern filter is asymmetric with jar's DOT
- **Context**: T13 evaluating id-aware pairing for the declared-size harness.
- **Finding**: jar's `[*]` pseudo-state marker is a real `shape=circle` node,
  never a `shape=point` anchor, and jar's anchors carry bare ids like
  `zaent0003` (no `__` prefix). Filtering by our `__init_`/`__zaent_` id
  convention dropped real jar nodes on one side only (64/205 scopes
  mis-counted). Filtering both sides by `shape==='point'` aligns real-node
  counts 100 % across the 90 mismatched fixtures.
- **Impact**: any future id-aware pairing (or dot-parity tooling) should filter
  structurally by shape, not by id string. See `findings/METRIC-AUDIT.md`.
- **Confidence**: High

## Observation: two "jar-verified" doc comments are contradicted by current numbers
- **Context**: T1/T2 composite diagnosis (ADR-4 re-verification).
- **Finding**: (a) `state-composite-autonom.ts:114-118` claims byte-exact
  jar verification on `bajelo-54-dixe684`; bajelo now shows −12.03/−12.00 px
  from `clusterPosMap: undefined` at `:195` (`findings/composite-a.md`).
  (b) `state-composite-autonom.ts:160-165` calls `fotuje-06`/`rovese-43`
  "jar-verified" for the title-table-ineligible rule; both remain inexact.
  (c) `layout-ink-extent.ts:82-85` describes an arrowhead-ink over-reach
  (~30 px) motivating `includeArrowheadInk: false` at `:522`; T2 reproduced
  the self-loop geometry exactly and found the workaround itself IS the
  −1.34 px delta on `pebepi-32`/`taxile-56`/`tigibi-80` — the over-reach was
  not reproduced (`findings/composite-b.md`).
- **Impact**: the fix mission should re-verify these comments, not trust them.
- **Confidence**: High for (a)/(c) numbers; Medium for whether (c)'s
  over-reach exists on some other shape.

## Observation: state sizing never routes text through the creole pipeline
- **Context**: T4/T5/T6/T8/T9 independently hit the same family.
- **Finding**: `state-sizing.ts` (`measureLines`, `measureNormalState`,
  fields), `state-note-layout.ts:84-93`, `state-composite-sizing.ts:73`
  measure raw source text; jar routes through `Display.create`/`create8` +
  creole (`EntityImageStateCommon.java:80-81`, `EntityImageState.java:98-99`,
  `EntityImageNote.java:114-118`). Symptoms: literal `<color>`, `**`,
  `<math>`, `<sup>`, `[[link]]`, `|=table|`, tab-stops, `wrapWidth`. The class
  engine already has `creoleVisibleText()`
  (`src/core/svek/image/leaf-sizing-text.ts:158-165`) that state never calls.
- **Impact**: one architectural fix, many fixtures; see SYNTHESIS group.
- **Confidence**: High

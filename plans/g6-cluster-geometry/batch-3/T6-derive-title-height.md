# T6 — Derive jar's real cluster title-table height formula

## Prior observations

- `CLUSTER_TITLE_TABLE_HEIGHT = 3`
  (`src/diagrams/state/state-composite-cluster.ts:96`) is a hardcoded
  single-line-only calibration feeding
  `DotInputCluster.titleTableHeight`. Jar's real title-table HEIGHT
  for `Track_FSM.Run` (single-line title + entry/exit action lines,
  fixture `bajelo-54-dixe684`) is 42. C5 measured gap=47 on a
  multi-line-title fixture.
- The gate: `titleTableEligible` requires `title.lineCount === 1`
  (`state-composite-cluster.ts:289-293`). The doc comment block at
  lines 34-96 records the G5 C3 calibration provenance — read it.

## Context

plantuml-ts state clusters. Decision D2 (decisions.md): derived jar
formula, no calibration constants; must reduce to current behavior on
the 132/134 verified single-line set. The jar source of truth is the
svek cluster header path:
`~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/`
(`Cluster.java`, `ClusterHeader.java`, and whatever they call — grep
`src/main/java/net/`, NEVER just the plantuml subtree; `net/atmp/`
holds live code).

## Task

1. Read jar's cluster header/title-table height computation end to
   end: how title line count, action-zone (`entry`/`exit`/internal
   activity) lines, and stereotype lines each contribute; which font
   params apply (mind FontParam defaults — G5 found ARROW default 13
   vs 14 bugs of exactly this shape).
2. Reproduce, ON PAPER (no code), from the formula: (a) the current
   single-line value that calibrates to titleTableHeight=3 under the
   19px header constant; (b) Run's HEIGHT=42; (c) C5's gap=47
   fixture's expected height. All three must come out of the same
   formula.
3. Verify against ≥3 oracle SVGs by box extraction (one single-line,
   one multi-line, one stereotype and/or action-text) — measured jar
   header heights must match the formula's predictions.
4. Write `batch-3/title-height-derivation.md`: the formula, jar
   file:line citations for every term, the paper reproductions, the
   oracle verification table, and exactly which `titleTableEligible`
   conditions T7 may relax (lineCount only, or also others).

## Write-set

`plans/g6-cluster-geometry/batch-3/title-height-derivation.md` only.
Disposable probes deleted before finishing.

## Read-set

`src/diagrams/state/state-composite-cluster.ts:34-100, 273-360`;
`src/core/graph-layout.types.ts:220-250` (titleTableHeight seam);
jar svek sources above; G5 ledger §C3 (calibration provenance) and
§C5 (gap=47 evidence); oracle SVGs for the 3 verification fixtures.

## Interface contract (consumed by T7)

The derivation doc must state:
`formula(lineCount, actionLines, stereotypeLines, fontMetrics) ->
titleTableHeight`, the eligibility conditions to relax, and the
predicted per-fixture heights for every fixture measured in step 3.

## Acceptance criteria

- Given the formula, when applied on paper to the single-line case,
  then it reproduces current pinned behavior exactly (132/134
  byte-compat is achievable).
- Given Run (=42) and the gap=47 fixture, when computed, then the
  formula matches both without fixture-specific terms.
- Given ≥3 oracle SVGs, when box-extracted, then measured heights
  match predictions.

## Quality bar

No production changes; gates untouched. If the jar path cannot be
pinned to cited lines within budget, journal + STOP (README cond. 5).

## Boundaries

Formula from jar source only — no curve-fitting against oracle
measurements (oracle verifies, never derives). No git mutations.

## Observability / Rollback

N/A — documentation only.

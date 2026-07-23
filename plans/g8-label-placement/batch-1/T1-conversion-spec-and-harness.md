# T1 — Conversion spec + committed delta harness

## Context

plantuml-ts (`/Users/scottseely/git/plantuml-ts`), TypeScript port of
PlantUML (Java at `~/git/plantuml`; grep `src/main/java/net/`).
graphviz-ts pinned layout library (READ-ONLY at
`/Users/scottseely/git/graphviz-ts`). Real `dot` 15.1.0. Vitest;
probes `scripts/_tmp-g8-t1-*.ts` via `npx tsx`, deleted before
finish; Serena MCP for symbols.

## Prior observations (verified — do not re-discover)

- graphviz-ts exposes per-edge label centre:
  `node_modules/graphviz-ts/dist/api/geometry.d.ts:107-110`
  (`EdgeGeometry.label?: {x,y}`, from `ED_label`/`textlabel_t.pos`;
  filled at `graphviz-ts/src/api/geometry.ts:216-218`, computed by
  `src/layout/dot/splines-label.ts#place_vnlabel`).
- The port already surfaces it: `src/core/graph-layout.ts:83-93`
  (`toEdgeEntry` → `labelX/labelY/labelWidth/labelHeight`), type at
  `src/core/graph-layout.types.ts:329-332`. State throws it away:
  `attachTransitionLabel` (`state-transition-label.ts`) is fed only
  `.points` (callers `layout.ts:126`, `state-composite-pass.ts:412`).
- Jar mechanism: dot places the label; jar reads the position back
  (`SvekEdge.java:741-745` via `getXY` colour-scan `:808-813`, draw
  at `:951-954` with `labelShield` offset). Jar computes nothing
  from spline geometry.
- Class precedent: `class-geo-builders.ts#attachEdgeLabel` (ledger
  G2 N62) already consumes `labelX/labelY` — read it for the
  conversion it uses.
- G7's T20 delta harness method: see G7 journal T20/T20b rows; the
  92-entry baseline deltas are recorded there (beguxu-19 0.020833
  allowed, fomusu-59 0.185174 allowed, etc. — the harness must
  reproduce the recorded baseline on the untouched tree).

## Task

1. **Conversion spec.** For the named fixtures — beguxu-19-tize774,
   fomusu-59-fupe538 (self-loop), bemena-23-zebu249,
   pesita-10-dene726, plus ONE flat-pipeline labeled fixture you
   select from the corpus — probe the current pipeline's
   graphviz-returned label centre for each labeled transition, and
   extract the jar oracle SVG's label `<text>` position
   (`oracle/goldens/state/<slug>/`). Derive the exact conversion:
   centre `{x,y}` + measured box `{w,h}` → the port renderer's draw
   anchor, cross-checking against jar's own draw
   (`SvekEdge.java:951-954`, `labelShield`) and the class
   precedent. The SAME arithmetic must hold for every probed label
   (no per-fixture terms — D5). NOTE: today's pipeline sends labels
   at pre-T18 sizes; where that skews the returned centre, verify
   the conversion on a probe that feeds the T18-corrected FIXEDSIZE
   box (simulate at the builder seam) — record both readings.
2. **Harness.** Write `scripts/measure-state-size-deltas.ts`
   (permanent, committed): renders every `size-backlog.json` fixture
   plus the 57 pins, emits per-fixture
   `{slug, delta, allowed, status}` JSON lines + a summary
   (widened/improved/unchanged counts). Deterministic, no network,
   runs in < 2 min. Verify it reproduces the G7-recorded baseline
   deltas on the untouched tree. Add a minimal unit test for its
   comparator arithmetic in `tests/unit/`.
3. Write `plans/g8-label-placement/spec.md`: the conversion formula
   (with the probed per-fixture table: returned centre, oracle
   position, converted anchor, match), the fallback contract (D1),
   and any residual centre-vs-oracle discrepancy with its mechanism.

## Write-set

`scripts/measure-state-size-deltas.ts`,
`plans/g8-label-placement/spec.md`, `tests/unit/**` (harness test
only). Probes deleted. No production `src/` edits. No git mutations.

## Interface contract (consumed by T2, T3)

- spec.md: conversion `anchor = f(centre, box)` — exact, closed-form,
  jar-oracle-verified per fixture.
- Harness CLI: `npx tsx scripts/measure-state-size-deltas.ts` →
  JSON lines `{slug, delta, allowed, status}` + summary; exit 0 iff
  zero widened.

## Acceptance criteria

- Given the named fixtures, when returned centres are converted per
  the spec, then each matches the jar oracle label position exactly.
- Given the untouched tree, when the harness runs, then it
  reproduces the G7-recorded baseline deltas (validity check).
- Given the spec, when T2 reads it, then no further measurement is
  needed before implementing (paper-gate standard).

## Observability requirements

The harness IS the new SLI instrument — this task creates it.

## Rollback notes

Reversible (new script + doc only; plain git revert).

## Boundaries

Stop cond. 5: if the conversion cannot reproduce the oracle
positions, STOP before T2 — report the divergent term, per-fixture
table, ruled-out list. Never modify `../graphviz-ts` (stop cond. 8).

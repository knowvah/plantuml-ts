# T-D3 — layout precision: measure 2-dp quantisation (D3)

**Agent:** typescript-pro (opus) · **Depends on:** batch 4 close · serial.
Prompt = [`fix-task.md`](../fix-task.md) + this file.

## Fixtures

gatula-10-bifu561 (probe case: jar `qux` x 155.42, ours 155.425 → right
edge 209.995 → 224 vs 210.0 → 225), ririlu-13-zipi740's Kal residual
(`LineOfSegments.java:89-111` exhausts its `size` passes on ~1e-14 overlap
under full-precision coords; 2-dp inputs reproduce the jar's
37.325/137.775/238.225 exactly — cdd2 `.agent-notes/cdd2-T12.md`), plus any
row T6 or a close assigned here.

## Mechanism

The jar reads every node position from graphviz's `-Tsvg` text, printed at
2 decimals (`svek/DotStringFactory.java:388-396`); we consume dot-engine's
exact doubles. Read `src/core/layout-epsilon.ts` (module doc: why 2-dp
quantisation was rejected before, and what `absorbLayoutEpsilon` absorbs)
and cdd2 journal rows 10, 31, 38.

## Task — measure, then decide (D3)

1. On the then-current tree, implement quantisation of layout output
   exactly where the jar's parse happens (node positions / cluster boxes /
   spline points as the jar reads them from SVG — read which values the
   jar parses and at what precision; do not quantise anything it keeps
   exact).
2. Measure: class render-all + pin-diff vs the last close; every engine
   surveyed vs `/tmp/cdd3-b0-eng/` (subtract earlier-journaled movers);
   `npm test`; record survey duration before/after.
3. **Adopt** only if it closes fixtures, loses no conformant fixture in any
   engine, and moves no gate red. Then test whether `absorbLayoutEpsilon`
   still changes any outcome; retire it only if not. The commit body states
   the all-engine reach.
4. **Otherwise** revert, journal the measurement, and write
   `proposed-accept -> <evidence>` in `fixtures.md` for gatula and ririlu
   (D6 — maintainer signs).

## Primaries

`src/core/graph-layout.ts`, `src/core/graph-layout-build.ts`,
`src/core/layout-epsilon.ts`, `src/core/TextBlockExporter.ts`; tests.

## Acceptance criteria

- Given the measurement, when journaled, then it lists class and per-engine movers with mechanisms
- Given adoption, when every engine is surveyed, then no conformant fixture is lost anywhere
- Given rejection, when committed, then no `src/` change remains and both rows carry a proposal

## Observability · Rollback

N/A — no new observable operations. Reversible; if adopted, it changes
layout reading for every DOT-backed engine — its own commit.

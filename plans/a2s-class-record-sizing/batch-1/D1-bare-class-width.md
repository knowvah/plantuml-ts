# D1 — Diagnose bare/minimal-class width residuals

## Context

plantuml-ts is a TypeScript port of PlantUML (Java, `~/git/plantuml` = the
spec). Class-diagram node width/height are computed by a dedicated pipeline
and fed to the DOT layout engine; the jar's svek DOT is the oracle.
Mission A2s closes the size deltas. You are a DIAGNOSIS task: find the
MECHANISM; do not edit `src/`.

The size ratchet: `npx tsx scripts/measure-class-size-deltas.ts` renders
`oracle/goldens/class/<slug>/input.puml` and compares node width/height
(inches, 72px/in) against the jar's `svek-N.dot` goldens in the same dir.
Identical delta across fixtures = ONE shared cause (held every time in
this repo).

## Task

Diagnose the mechanism(s) behind these width-residual clusters on
bare/minimal classes (slug lists: `plans/a2s-class-record-sizing/batch-1/clusters.md`):

- **0.018191 in = 1.3098 px — 31 fixtures** (bare/minimal classes, mixed
  links; heights exact at 0.666667in)
- **0.018913 in = 1.3617 px — 9 fixtures**
- The small clusters ≤0.033 in (0.032641×8, 0.02831×6, 0.024647×6,
  0.022501×6, 0.029623×4, 0.032091×4, 0.016841×4 …) — sample enough to say
  whether they share D1's mechanism or are distinct.

For each mechanism: state cause, our `file:line`, Java `file:line`, causal
chain, what you ruled out with evidence. Derive the expected value from the
Java expression BY HAND and check against a jar probe to <0.01px —
agreement proves mechanism; a fitted delta proves only a number.

## Read-set

- `plans/a2s-class-record-sizing/README.md` (Key code map + probe recipe)
- `src/diagrams/class/class-layout-generic-classifier.ts:167-330` (pipeline)
- `src/diagrams/class/class-layout-header-geo.ts` (header width/height)
- `src/diagrams/class/class-badge.ts` (badge/name margins)
- Java: `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageClass.java:100-115`,
  `EntityImageClassHeader.java:111-159`, `svek/HeaderLayout.java:68-78`,
  `svek/SvekNode.java:114-161` (grep the WHOLE `net/` root if a symbol is
  missing — load-bearing code lives in `net/atmp/` too)
- 3-5 fixtures per cluster: `oracle/goldens/class/<slug>/input.puml` + `svek-*.dot`

## Probes

```sh
java -DPLANTUML_DETERMINISTIC_TEXT=true -DPLANTUML_DUMP_DOT=<scratch> \
     -jar oracle/dist/plantuml-oracle.jar -tsvg -o <scratch> <probe.puml>
```

Write probes ONLY under the session scratchpad. Traps: DOT node order ≠
declaration order (ONE element of interest per probe); a single-entity
diagram emits NO DOT (add a throwaway second element + edge). To get our
number for the same probe, mirror `scripts/measure-class-size-deltas.ts`'s
capture (renderSync + WidthTableMeasurer + setLayoutInputObserver) in a
scratch script.

Candidate leads (hypotheses, verify or rule out): width floors upstream
applies that we may not (PName.MinimumWidth, ParamSameClassWidth,
kalWidth*1.3 in EntityImageClass:103-113); name margin composition
(withMargin(3,3,0,0) vs NAME_MARGIN_TOTAL=6); HeaderLayout width = circle +
max(stereo,name) + generic vs our max(headerWidth, memberAreaWidth).

## Boundaries

- Never edit `src/`, `tests/`, `oracle/`, or run state-mutating git.
- A fitted constant is a STOP — report the impasse instead.
- If the mechanism requires the SI1 body-layer port (MethodsOrFieldsArea /
  CucaDiagram cascade), STOP and report with measured size (ADR-1).

## Output (consumed by Batch 2 — return raw data, no prose intro)

One JSON block per mechanism, schema in `batch-1/overview.md`
(mechanism, ourFileLine, javaFileLine, upstreamExpression, probeEvidence,
affectedSlugs, ruledOut, testPlan). Predict the closure set against the
FULL 489-entry backlog, not only your named clusters. ≤2k tokens.

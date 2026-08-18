# T5 — ONE `FrontierCalculator` port

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML (`~/git/plantuml`
is the spec; read the Java before acting; every constant carries `file:line`;
never fit a value). Pure SVG, vitest, 500-line cap. Upstream has ONE
`svek/FrontierCalculator.java` (169 lines) used by every cuca cluster. We
have TWO ports of it: `src/diagrams/description/frontier-calculator.ts`
(176 lines — `RectangleArea`, `Point`, `ENTITY_POSITION_RADIUS`,
`manageEntryExitPoint`, `ensureMinWidth`) and `src/diagrams/state/state-
composite-frontier.ts` (201 lines — `Box`, `Point`, `frontierCalculator`,
`ensureMinWidth`), 35 % textually shared, both citing the same Java. This is
`svek/` territory: `src/core/svek/` already exists (`Cluster.ts`, `Boundary.ts`,
`ClusterDecoration.ts`).

## Task

1. Read `FrontierCalculator.java` whole and `Cluster.java#manageEntryExitPoint`
   (`:410-436`). Read both ports whole. Build a three-column table (Java line
   → description port → state port) of every method/branch. Every difference
   between the two ports is resolved by the Java line — if the Java does not
   settle one (both ports are "faithful" to different readings), STOP
   (README stop 5) with the table journalled.
2. Write `src/core/svek/FrontierCalculator.ts` — one port, structured like the
   Java (class or module, mirror what the Java does), types named as upstream
   (`RectangleArea` from `klimt/geom/RectangleArea` — check whether
   `core/klimt/geom/` already has it; if so import, do not redefine).
   `ENTITY_POSITION_RADIUS` — cite `EntityPosition.java`. `@see` whole file.
3. Rewire: description `frontier-cluster-bbox.ts`, `frontier-shadow-layout.ts`
   (import from core; delete `description/frontier-calculator.ts`); state
   `state-composite-geo.ts` (import from core; delete `state-composite-
   frontier.ts` — or, if `state-composite-pass-types.ts`/`state-composite-
   cluster.ts` need its `Box` TYPE only, leave a type-only file, journal).
4. Merge the two colocated tests into one core test keeping every assertion
   (`tests/unit/core/svek/FrontierCalculator.test.ts` or colocated per repo
   convention for `core/svek/*.test.ts`).
5. Manifest: EMPTY for BOTH engines (`--only component,usecase,state` per
   task; full at batch end). A non-empty diff means the merge changed a
   branch — STOP and diagnose; do not "pick the one that keeps the diff
   empty".

## Write-set

`src/core/svek/FrontierCalculator.ts` (new), `src/diagrams/description/
frontier-calculator.ts` (delete), `src/diagrams/description/{frontier-cluster-
bbox,frontier-shadow-layout}.ts`, `src/diagrams/state/state-composite-frontier
.ts` (delete or type-only), `src/diagrams/state/state-composite-geo.ts`, moved
tests.

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/FrontierCalculator.java` (whole)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Cluster.java:400-440`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/geom/RectangleArea.java`
- `src/diagrams/description/frontier-calculator.ts`, `src/diagrams/state/state-
  composite-frontier.ts` (both whole), callers' import lines only
- `src/core/svek/Cluster.ts:1-40` (import style), `src/core/klimt/geom/` (ls)
- `decisions.md#d1`, `#d8`; README stop 5

## Architecture decisions

D1, D8 (`FrontierCalculator.ts`, upstream name).

## Interface contract

Exports: `manageEntryExitPoint`/`frontierCalculator` (pick the Java's method
names — `FrontierCalculator` constructor + `getSuggestedPosition`/… — mirror
them), `ensureMinWidth`, `ENTITY_POSITION_RADIUS`, `RectangleArea`, `Point`.
Both engines call the same functions.

## Acceptance criteria

- Given `src/`, then exactly one `FrontierCalculator` implementation exists,
  under `core/svek/`, `@see`-ing the Java whole file.
- Given the description and state fixture sets, then `0 fixtures differ` vs
  baseline.
- Given the merged test, then every assertion from both former tests is
  present and each Java-settled difference has a test citing its line.

## Quality bar

4 gates + manifest + dot-sync green. Commit
`refactor(T5): one FrontierCalculator port in core/svek` (body: the merge
table summary).

## Observability

N/A.

## Rollback

Reversible.

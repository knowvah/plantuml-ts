# T12 — USymbol container shape + package paint

**Agent:** typescript-pro (opus) · **Depends on:** T11

## Context

`package X <<Node>>`/`<<Database>>`/`<<cloud>>` and `rectangle X { … }` /
`component X { … }` select the container's shape upstream: `Cluster#drawU`
(`svek/Cluster.java:367-374`, `new ClusterDecoration(packageStyle,
group.getUSymbol(), …)` → `decoration.drawU`) calls `ClusterDecoration#guess`
+ `symbol.asBig` (`svek/ClusterDecoration.java:66-91`). This port only
consumes the USymbol keyword when the container is EMPTY and collapses to a
leaf; a non-empty container always draws the plain folder outline
(`class-container.ts:186-190`'s early return in `closeContainer`;
`diagnosis/A2b-entity-groups.md` E3). Separately, `Cluster#drawU` opens the
package's `[[url]]` *inside* the cluster group before the decoration
(`svek/Cluster.java:337-341,379-382`), so the jar's cluster has exactly one
child, an `<a>` (E4); and `garumi`/`tibatu` prove the inline/`<style>`
package colour must reach the same fill resolution (`diagnosis/A3-
style.md` M3). T11 landed `Namespace.{url,color,usymbol}` — this task wires
them into layout and render. The report is a lead: re-read `Cluster.java`
and `ClusterDecoration.java` before editing.

## Task

1. Tests first: extend `class-namespace-shape.test.ts` /
   `renderer-group.test.ts` for a non-empty `<<Node>>` package (cluster
   childCount matches the jar's), a `[[url]]` package (single `<a>` child),
   and an inline/`<style>`-coloured package (fill/stroke match).
2. `class-namespace-shape.ts`, `class-namespace-folder-outline.ts`,
   `class-namespace-title-table.ts`: thread `Namespace.usymbol` into the
   shape/margin computation for NON-EMPTY containers too (today gated on
   `ns.classifiers.length === 0`). Reuse `src/core/decoration/symbol/
   USymbols.ts` + `src/core/usymbol-shapes.ts` — the description engine
   (`renderer-usymbol-entity.ts`) already uses them and they are
   gradient-aware; do not fork a second symbol-shape implementation.
3. `renderer-group.ts#wrapCluster`: when `Namespace.url` is set, wrap the
   cluster's inner content in an `<a>` (reuse whatever `<a>`-emitting helper
   `renderer-url.ts`/`class-url.ts` exposes for the classifier path) BEFORE
   the `<g class="cluster">`'s other children, matching `Cluster.java:
   337-341`'s open-before-decoration order.
4. Fill/stroke resolution in `class-namespace-shape.ts`: read
   `Namespace.color` (from T11) ahead of the global
   `theme.colors.graph.packageBackground` fallback (M3's fix shape).
5. Layout-moving check: cluster margins now differ per symbol. Run
   `npx tsx tools/render-all.mts measurements/t12-check.json` before and
   after; diff against `measurements/base.json` — confirm the movers are
   exactly the fixtures with a symbol-naming stereotype/keyword container,
   an inline/`<style>` package colour, or a package `[[url]]`. Any other
   mover is a stop-1 halt (re-read the shape helpers, do not paper over).
6. `.agent-notes/cdd-T12.md`: the cluster-margin delta per USymbol kind (if
   non-trivial), and confirmation of the render-all diff from step 5.

## Read-set

Java: `net/sourceforge/plantuml/command/CommandPackage.java:179-181`;
`net/atmp/CucaDiagram.java:358-359`; `net/sourceforge/plantuml/svek/
Cluster.java:337-341,367-374,379-382`; `net/sourceforge/plantuml/svek/
ClusterDecoration.java:66-91`. TS: `src/diagrams/class/class-container.ts:
186-200` (early return); `src/diagrams/class/class-namespace-shape.ts`
(whole); `src/diagrams/class/class-namespace-folder-outline.ts` (whole);
`src/diagrams/class/class-namespace-title-table.ts` (whole);
`src/diagrams/class/renderer-group.ts:75-95` (`wrapCluster`);
`src/core/decoration/symbol/USymbols.ts`; `src/core/usymbol-shapes.ts`;
`src/diagrams/class/renderer-usymbol-entity.ts` (existing consumer
pattern); `src/diagrams/class/renderer-url.ts`, `class-url.ts` (`<a>`
emission pattern). Diagnosis: `diagnosis/A2b-entity-groups.md` E3, E4;
`diagnosis/A3-style.md` M3; `diagnosis/A6-oracle.md` §2 (tibatu:
"package-box fill/stroke = package_color").

## Write-set

`src/diagrams/class/class-namespace-shape.ts`,
`src/diagrams/class/class-namespace-folder-outline.ts`,
`src/diagrams/class/class-namespace-title-table.ts`,
`src/diagrams/class/renderer-group.ts`, their `*.test.ts` files,
`.agent-notes/cdd-T12.md`,
`plans/class-divergence-drive/decision-journal.md` (append-only).

## Interface in (from T11)

`Namespace.{ url?: UrlInfo; color?: string; usymbol?: string }`.

## Acceptance criteria

- Given `dativu-93-pona469` (`<<Node>>`), when rendered, then the cluster
  draws the node USymbol shape and childCount matches the jar's 5
- Given `garumi-63-vuze973`, when rendered, then the package path's `fill`
  is `#DDD` (was `none`)
- Given `dopuzi-50-muxo994`, when rendered, then the cluster's only child is
  a single `<a target="_top" href="…">` wrapping path/line/text
- Given `xitobu-41-lame230`, when rendered, then the package path's fill is
  `#98FB98` (palegreen), stroke `#F00`, stroke-width 2
- Given the 412 conformant fixtures (baseline `measurements/base.json`),
  when `render-all.mts` re-runs, then none of them move (checked by
  slug-set diff, not just count)

## Observability

N/A — no new observable operations; render-path fix only.

## Rollback

Reversible — revert the task's commits; pins are committed with the code.

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build` all green.
`npx tsx tools/render-diff.mts dativu-93-pona469 garumi-63-vuze973 dopuzi-
50-muxo994 xitobu-41-lame230 tibatu-28-jiro743` before/after with
structural+numeric counts in the commit body; `render-all.mts` full-corpus
diff against `measurements/base.json` attached (mover list). Files ≤500
lines, functions ≤30 NLOC, CCN ≤10, ≤5 params.

## Boundaries

Always: reuse `USymbols.ts`/`usymbol-shapes.ts` rather than a new shape
table; confirm every mover against step 5's list before commit. Ask first:
any stop condition in `../README.md`; a mover outside the named reach lists
(E3/E4/M3's `Reach` sections). Never: touch T11's parse-side files; fit a
margin constant without an upstream citation; edit outside the write-set.

## Commit

`feat(cdd-T12): draw USymbol shape, url wrap and paint on packages`

Body: why — E3/E4/M3 each isolate a distinct missing consumer of data T11
already made reachable; this task is the shared render-side fix because all
three write the same cluster-shape files. Note the confirmed mover list
from step 5.

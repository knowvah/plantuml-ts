# T2a — core: json finalize runs the TextBlockExporter tail (D1)

Agent: typescript-pro (opus, effort high), worktree `jff-T2a`. Include
[../task-contract.md](../task-contract.md). Commit: `feat(core): json family
finalize through the TextBlockExporter tail (T2a)`.

## Context
Upstream exports every json-family diagram through one path: `UgDiagram#getExporter`
(`UgDiagram.java:123-131`) takes `getTextBlock` (`JsonDiagram.java:140-142`:
`this`), `addChrome`, then `TextBlockUtils.addBackcolor`, then
`TextBlockExporter.builder(...)`; `exportTo` (`TextBlockExporter.java:159-177`)
sizes `calculateFinalDimension()` (`:198-203`, block + margin), resolves
`computeScaleFactor` (`:205-209`) and draws everything through one scaled
`UGraphic` after translating by the margin (`:173`).

Ours: `finalizeJsonFragment` (`src/core/assemble-svg.ts:246-256`) only
canonicalizes the background and splices `maybeJsonBackgroundRect`; json
scales its own body before chrome. Siblings already run the tail:
`finalizeDescriptionFragment` (back-colour splice, then `exportTo`) and
`finalizeTitledDiagramFragment` (`src/core/TextBlockExporter.ts:404-410`,
mindmap/salt/wbs/gantt with `exportMargin`).

## Task
Make the json/yaml/hcl finalize branch do, **only when `fragment.exportMargin`
is set**: canonicalize the background (as today), splice the background rect
under today's `isSolidNonDefault` rules but sized to the RAW block
(`fragment.width/height`, which `exportTo` then scales — the jar's
`addBackcolor` sits inside the scaled block), keep the content-group handling
for `bodyWrapped` (chrome present) vs unwrapped (no chrome), then return
`exportTo(fragment, body)`. Without `exportMargin`, behaviour is byte-identical
to today. Touch `TextBlockExporter.ts` only if `exportTo` cannot already serve
this shape (e.g. an unwrapped body in the `exportMargin` arm); then the change
must leave mindmap/salt/wbs/gantt bytes unchanged. Read
`exportExtents`/`scaleMarginedBody`/`scaleBodyText` (`TextBlockExporter.ts:265-335`)
before deciding.

Tests first: synthetic fragments (no renderer) in
`tests/unit/core/assemble-svg-json-export.test.ts` — expected numbers derived
from the Java formulas above in the test's comments.

## Write-set
`src/core/assemble-svg.ts`, `src/core/TextBlockExporter.ts` (only if needed),
`tests/unit/core/assemble-svg-json-export.test.ts` (new) and any existing
`tests/unit/core/assemble-svg*.test.ts` that asserts the json branch.

## Read-set
`src/core/assemble-svg.ts:200-345`, `src/core/TextBlockExporter.ts:255-410`,
`src/core/dispatcher-types.ts:180-240`, `src/core/document-margin.ts:115-135`,
`src/diagrams/mindmap/index.ts:200-226` (the sibling producer),
`~/git/plantuml/src/main/java/net/sourceforge/plantuml/UgDiagram.java:115-140`,
`~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/TextBlockExporter.java:155-215,505-520`.

## Interface contract
See [overview.md](overview.md#interface-t2a--t2b).

## Acceptance
- Given today's json fragments (no `exportMargin`), when the full suite and the T2a gate chain run, then all 28 engines are byte-identical to b1 (stop 5/7).
- Given a synthetic json fragment `{width: W, height: H, exportMargin: same(10), scaleSpec: scale 2, bodyWrapped: true}`, then the result's canvas is `trunc(W + 20 + 1) × 2` written as `format(maxX)` (`scaledCanvas`), and every body number is ×2 after the (10,10) shift.
- Given a `scale max N width` spec, then the factor is resolved over `W + 20` (the chromed, margined dim), not over the producer's pre-chrome size.
- Given a non-default solid background, then exactly one background rect is the content's first child, at `W × H` before scaling.
- Given `fragment.dpi` unset, then the factor has no dpi term (D5).

Observability: N/A. Rollback: Reversible.

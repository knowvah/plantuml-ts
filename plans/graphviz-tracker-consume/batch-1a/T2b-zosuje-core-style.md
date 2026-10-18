# T2b — zosuje: component `<style>` FontStyle and description arrow cascade in src/core (item 32)

Prepend [../task-preamble.md](../task-preamble.md). Mission checkout. Depends on T2. Authorized by the D5
amendment (user ruling 2026-10-18).

## Context
After T2, `component/zosuje-43-zebi775` is 13/0. T2's report (`measurements/T2-report.md`) carries both
diagnosis artifacts:
- **A.** `<style> component { FontStyle italic }` never reaches the theme: `collectObjectKindFont`
  (`src/core/style-map-element.ts:30-38`) stores FontName/FontStyle only for object/map/json buckets; the
  consumer is `fontConfigurationFor` (`src/core/decoration/symbol/usymbol-resolve.ts:222`). Java:
  `EntityImageDescription.java:142-172`. 1 diff (`text/@font-style` on `g[5]`).
- **B.** `<style> arrow { LineColor }` has no description-diagram cascade. Only
  `graph.classCascadeArrowColor` exists, built from the class signature `root, element, classdiagram, arrow`
  (`style-cascade-class-snames.ts:13`); reusing it would honour a `classDiagram { arrow }` selector in a
  component diagram, which is not mirroring. Java: `SvekEdge.java:816-821` (`root, element, <diagram>,
  arrow`), `:874-876`. Port consumer: `renderer-edge.ts:129`. 12 diffs (link path/polygon stroke/fill).

## Task
Re-measure first. Confirm each mechanism against the Java, then fix at its origin with failing tests first:
A in `style-map-element.ts` (+ its consumer), B as a description-diagram arrow cascade with the diagram's
own SName (read how the jar names the description diagram's SName) plus a Theme field read by the
description edge renderer. Report whether banatu-09-koce254's root `FontColor` (`usymbol-resolve.ts:140`)
is the same mechanism as A; fix it only if it is.

## Write-set
`src/core/{style-map-element.ts,style-cascade-class*.ts,theme*.ts,decoration/symbol/usymbol-resolve.ts}`
(name any other core file in the artifact; an extra file inside the style/theme seam is a journaled
extension), `src/diagrams/description/{renderer-edge.ts,link-edge-attrs.ts}`, matching `tests/unit/**`.

## Acceptance
- Given zosuje, when rendered, then render-diff is 0/0.
- Given rufopi, then it stays 0/0.
- Given the class, object and state golden ratchets and the description ratchet, then all are green.
- Given the component, usecase, unknown, class and object surveys before and after, then there are no
  conformant losses and every mover has a mechanism (the orchestrator runs the all-engine chain at close).

**Observability:** N/A. **Rollback:** reversible.

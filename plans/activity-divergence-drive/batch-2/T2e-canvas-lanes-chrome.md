# T2e — canvas residuals: polygon ink, lane dividers, chrome (push-forward)

Agent: typescript-pro, worktree `add1-T2e`. Commit: `fix(activity): <mechanism>`.

## Context
T1a ported the root bounds (`canvas-origin.ts`: `TitledDiagram.java:275`
`same(10)`, `Recentred.java:57-59`, `LimitFinder.java:169-213` per-shape
corners, `SvgGraphics.java:129-143` `ensureVisible`). Two inputs to the ink
minimum were left out (journal rows 9, 10, 21):
- **Arrowhead polygons.** `LimitFinder.java:169-176` pads every `UPolygon`
  by `HACK_X_FOR_POLYGON = 10` on X. Edge arrowheads are `UPolygon`s; ours
  are not in the ink-min (`canvas-origin.ts#extendForEdge` says so).
  `nonusu-50-nute147`: the jar's ink-min x is 15 = arrowhead minX 25 − 10.
- **Lane dividers.** `LaneDivider.drawU` draws `new UEmpty(x1 + x2, 1)` at
  the divider ORIGIN before the line at `dx(x1)`; `Swimlanes.java:413-436`
  places it. Jar's first divider is at x=20 on every swimlane fixture; ours
  15. Lane title band y (`sikino`: rect y 1 vs 16) is the same family.
Plus: far-corner +1/+2 canvas width (`cizixu`, `topico`, `fotamo` — diagnose
which shape's far corner) and the document title / legend offset (`cifafo`,
`bigide`: title text x 10 vs 20, y +10; `letare`: legend x +10).

## Rows (b1b)
`numalo-91-pole243`, `cizixu-00-koro700`, `topico-42-fuza478`,
`fotamo-01-rupi481`, `sikino-19-vuca111`, `tefuga-86-xefe850`,
`pakema-21-xema183`, `jakuco-69-dari135`, `povoju-50-raxi136`,
`patagi-39-jone354`, `sopape-11-laxo488`, `cifafo-49-jazi415`,
`bigide-91-bise382`, `letare-59-gore448`.

## Task
Per mechanism: dump, read the Java (quote), port into the ink-min / lane /
chrome model, pin. Arrowhead ink: the arrowhead geometry is already known at
layout (`arrows-regular.ts` is read-only here — import, do not edit). The
title/legend chrome: find where activity applies it (`index.ts` or a shared
`src/core/` wrapper). If the mechanism lives in a SHARED core module used by
other engines, stop and report it (re-slot) rather than editing it.

## Write-set
`src/diagrams/activity/layout/{canvas-origin,assign-coordinates-full,
swimlane-placement,swimlane-lanes,swimlane-lane-origins,swimlane-context}.ts`,
`src/diagrams/activity/activity-renderer-swimlanes.ts`,
`src/diagrams/activity/index.ts`, the tests exercising them, new tests.

## Acceptance
- `numalo-91-pole243`, `cizixu`, `topico`, `fotamo`: zero `svg/@*` diffs.
- Swimlane rows: first divider x equals the jar's 20 (Σ|ours−jar| over the
  swimlane census falls, measured with the repin dry-run).
- 0 unexplained risers; pinned goldens byte-equal.

Rules: see `overview.md`. Quality bar: targeted vitest + typecheck + eslint.

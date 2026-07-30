# Batch 2 — Port base + seams (parallel)

Two tasks, disjoint write-sets, no dependency between them. Neither is
wired in: after this batch every ratchet must be **exactly** where it
started. That is the point — ADR-6 keeps behaviour change out of the port.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T2a | Port `BodyEnhancedAbstract` + `TextBlockLineBefore`, and rewire the class path onto it (ADR-7) | typescript-pro | `src/core/cucadiagram/BodyEnhancedAbstract.ts`, `src/core/klimt/shape/TextBlockLineBefore.ts`, `src/diagrams/class/class-body-enhanced-layout.ts`, `src/diagrams/class/class-body-enhanced-geometry.ts` | T1b | [x] |
| T3 | Both seams — ink fields + `imgFallbackFont` threading | typescript-pro | `src/core/creole-atoms.ts`, `src/core/svek/image/EntityImageDescriptionSupport.ts` | T1b | [x] |

Write-sets remain disjoint, so the two still run in parallel. Both agents
share one worktree: forbid state-mutating git in both prompts; the
orchestrator commits.

## T2a is no longer a pure addition (ADR-7)

Its original framing — "reversible, pure addition, no caller" — is void.
ADR-7 makes `src/core/klimt/shape/TextBlockLineBefore.ts` the single owner
and rewires the class path onto it, so T2a now carries real behavioural
risk. Consumers reached, found by reading:

- `class-layout-generic-classifier.ts:119` and `class-object-map-sizing.ts:417`
  call `measureEnhancedBody` — note the second one puts **object diagrams**
  in the blast radius, not just class
- `renderer-classifier-box.ts:344` calls `renderEnhancedBody`

Gates that now bind T2a as STOP conditions, in addition to the description
ones: class sizing **219/708 w0**, class DOT **708 EQUAL**, and the pinned
SVG goldens — **svg-class 310**, **svg-object 22**. All must be exactly
unmoved: T2a relocates an owner, it does not change geometry.

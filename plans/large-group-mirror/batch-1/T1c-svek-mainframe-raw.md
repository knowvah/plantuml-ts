# T1c — A2 remainder: state + description draw the framed SvekResult un-normalized

**Agent:** typescript-pro (sonnet, high). Prompt = `common-rules.md` + this file.
**Worktree:** `measurements/mkwt.sh T1c`. Added by the orchestrator after T1a
(journal row 8): T1a's remainder is an unported mirror, not library-forced, so
D6 does not let it stay in `DIVERGENCES.md`.

## Why (T1a's finding — re-verify, do not trust)
Under a `mainframe` the jar never calls the `SvekResult`'s `calculateDimension`
(`decorateWithFrame`, `core/DiagramChromeFactory.java:278-337`), so
`moveDelta(6 - minX, 6 - minY)` (`svek/SvekResult.java:130-135`) never runs:
the jar's state box sits at x=7 without a frame and the block at x=1 with one.
Class mirrors this in `src/diagrams/class/layout-ink-extent.ts#mainframePlacement`.
State and description draw the normalized body, so the frame rect is wrong.
T1a's open tests: `tests/oracle/svg-conformance/lgm-t1a-mainframe.test.ts`
("open -- state and description mainframe"), fixtures
`tests/fixtures/lgm-T1a/{state,component,usecase}-frame.*`.

## Write-set
`src/diagrams/state/layout.ts`, `src/diagrams/state/renderer.ts`,
`src/diagrams/state/index.ts`, `src/diagrams/description/layout.ts`,
`src/diagrams/description/layout-ink-shift.ts`,
`src/diagrams/description/layout-geo-post.ts`,
`src/diagrams/description/renderer-ink-extent.ts`,
`src/diagrams/description/index.ts`, `src/core/graph-layout-result.types.ts`
(read-only unless a field is missing), `tests/oracle/svg-conformance/lgm-t1a-mainframe.test.ts`
(flip the open tests), `tests/fixtures/lgm-T1c/`, your tests.
**Forbidden (T1b owns them, running in parallel):** `src/core/svek/**`,
`src/diagrams/state/state-composite-*.ts`, `src/diagrams/state/state-transition-clip.ts`,
`src/diagrams/description/layout-dot-tree.ts`, `src/diagrams/description/frontier-cluster-bbox.ts`.
Also forbidden: `src/index.ts`, `src/core/annotations/**`, harnesses. If the
composite-state path needs a change in a forbidden file, stop and report the
exact change.

## Do
1. Read `SvekResult.java`, `DiagramChromeFactory.java:278-337`, the state and
   description `FileMaker`/`TitledDiagram` path to the chrome, and class's
   `mainframePlacement`; quote each. Confirm the x=7 / x=1 claim on the jar renders.
2. Author state (flat, composite, with notes) and description (component,
   usecase, deployment) `mainframe` fixtures + one with title/legend; render the jar.
3. Port: plumb `DotLayoutResult.originShift` (`src/core/graph-layout.ts`) through
   the state and description margin/shift so a framed diagram draws the raw
   body, and export `RenderFragment.frameInk` (T1a's field, `src/core/dispatcher.ts`)
   = ink + originShift, as mindmap/class do. One mechanism shared by both families
   where the Java is shared.
4. Rule 11 survey before/after; element counts for state, component, usecase, unknown.

## Exit
Frame rect, tab, title and canvas equal the jar on every state/description
fixture of T1a's and yours; the open tests flipped to passing; 0 conformant
losses. Exact DIVERGENCES.md text retiring the `mainframe` entry (read T1a's
proposed text in `.agent-notes/lgm-T1a.md`).

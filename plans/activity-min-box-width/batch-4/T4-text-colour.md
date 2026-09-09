# T4 — Text colour

**Agent:** `typescript-pro` · **Depends on:** T1

## Context

Read [`../decisions.md#d3`](../decisions.md). Ten sites emit
`fill: theme.colors.text` (#181818) in `activity-renderer-shapes.ts`
(`:115, :253, :268, :299, :316, :328, :502`) and `renderer.ts` (`:89, :100`,
the edge labels); the jar draws `#000` on 1869 of its 1915 activity texts
(root `FontColor black`, `plantuml.skin:9`). The swimlane title already
resolves its own colour (`swimlaneTitleFontColor`) — leave it.

## Read-set

- the ten sites above; `activity-style-defaults.ts` — `activityFontColor` (T1)
- `oracle/goldens/svg-activity/text-baseline.json` (T0) — the jar's per-fixture
  fill histograms: which fixtures carry a non-black text and what sets it
  (`rg -l 'FontColor' test-results/dot-cache/activity/*/in.puml`)
- Java: `FtileBox.java:85-89` (`fc` from the style), `FtileDiamondInside`'s
  font configuration, `vcompact/FtileWithNoteOpale.java:89` (note), the
  arrow label's (`ftile/vcompact/FtileFactoryDelegator.java:84`)

## Write-set

See the batch table.

## Task

Tests first. Replace each site with `activityFontColor(theme, <sname>)` for
the element being drawn (action, diamond, note, arrow, circle/spot label).
Do not touch the swimlane renderer. Change nothing else at those sites.

## Acceptance criteria

- Given the default theme, then every activity `<text>` (action, diamond,
  note, edge label, spot label) carries `resolveColorToSvgHex('black')`'s
  form, and `theme.colors.text` no longer appears under `src/diagrams/activity/`
- Given `<style> activityDiagram { activity { FontColor red } }`, then action
  text is red and diamond text is black
- Given the probe, then `text[]/@fill` (1288) falls; T0's `fill` census moves
  on every fixture with text while its `anchor` and `inset` censuses do not

## Observability

N/A.

## Rollback

**Reversible.**

## Quality bar

All four gates green except the expected activity oracle gates; list them.

## Commit

`fix(amb-T4): draw activity text in the root FontColor`

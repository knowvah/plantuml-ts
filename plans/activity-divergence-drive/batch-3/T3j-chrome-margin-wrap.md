# T3j — the document margin wraps the chrome (push-forward, journal row 36)

Agent: typescript-pro, worktree `add1-T3j` (made from the merged batch-3 head).
Commit per mechanism: `fix(activity): <mechanism>`.

## Context
T3g (journal row 36) proved: upstream composes title/legend/caption/header/
footer around the diagram's RAW `TextBlock` (`DiagramChromeFactory.java:
137-149,320-413`, `DecorateEntityImage`), then `TextBlockExporter` adds
`TitledDiagram#getDefaultMargins` `same(10)` around the whole decorated block
(`TextBlockExporter.java:159-176` translate, `:199-203` dimension). Our
activity geometry bakes the margin into the body before `applyChrome` runs
(`canvas-origin.ts`: `CANVAS_ORIGIN_SHIFT = 15` = 10 margin + 5 `Recentred`;
`CANVAS_PADDING_TOTAL = 35` = enlarge 15 + margin 20; `+1` ensureVisible),
and `renderer.ts#renderActivity` returns margin-inclusive dims with no
`preChromeWidth`/`preChromeHeight`. Class solved the same problem (G2 N46:
`class/layout-ink-extent.ts` raw vs document dims; `src/index.ts`
`applyAnnotationChrome` branch on `fragment.preChromeWidth`), but class's
margin is asymmetric `(0,5,5,0)`; activity's is symmetric `same(10)`, so the
post-chrome step must SHIFT the composed body by (+10,+10), not only pad.
Without chrome the output must stay byte-identical (55 pinned goldens).

## Rows
`cifafo-49-jazi415`, `letare-59-gore448`, `bigide-91-bise382` (cohort), and
the 17 other chrome-bearing baseline fixtures T3g listed (bazize, besaga,
bidosa, decudi, demibe, gitoke, lidefe, livigo, lopone, nivese, nusajo,
pateca, rekuxa, tobajo, vamazo, zejuso, zeporo).

## Write-set
`src/diagrams/activity/layout/canvas-origin.ts`,
`src/diagrams/activity/activity-layout-constants.ts`,
`src/diagrams/activity/renderer.ts`, `src/index.ts` (the
`applyAnnotationChrome` activity branch only), their tests, new tests.
`src/core/annotations/**` read-only (T3g showed it is correct).

## Acceptance
- cifafo/letare canvas width +21 gap closed; bigide's MAX winner matches.
- Every chrome-less fixture byte-identical (probe: 0 movers outside chrome
  fixtures); 55 pins byte-equal.
- Non-activity engines untouched (only the activity branch of index.ts).

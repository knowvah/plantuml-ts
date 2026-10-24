# svg-lengthadjust authored gate

`authored-baseline.json` tracks the 64 rows of `tests/fixtures/lengthadjust/` (16 engines x default/none/glyphs/onechar; jar oracles beside each `.puml`).
Per row: weighted `score` never rises; `rootExact` and `textLengthMatch` never flip true to false (D5; SvgGraphics.java:155-158, :699-705).
`textLength: 'baseline'` rows (13) are emitters that write no `textLength` today; their `reason` names it. `rootExact: false` rows carry `pending <task>`.
Re-measure: `npx jiti plans/lengthadjust-document-wide/tools/build-authored-baseline.mts <commit> [--write]`.
Test: `tests/oracle/svg-conformance/lengthadjust.authored.ratchet.test.ts`.

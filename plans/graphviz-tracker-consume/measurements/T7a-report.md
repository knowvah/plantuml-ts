# T7a report (pavuzo textLength)
Commit 7e844d5ea on gtc/S. Files: src/diagrams/state/{state-transition-label.ts,state-geo-types.ts,state-renderer-transitions.ts}, tests/unit/state/transition-label-textlength.test.ts (new).

## Per target row (render-diff)
state/pavuzo-79-zodu430: structural 4 -> 0, numeric 85 -> 85 (unchanged; Δ1 canvas/composite x offset is a separate residual). Survey verdict diverged -> structural-match. All four textLength values equal the jar (52.813 x2, 112.044, 80.194).

## Diagnosis
- Mechanism: the state transition label <text> is drawn via text() with no textLength; text() only emits it when the caller passes one. The jar's SvgGraphics.text emits textLength for every text longer than one char (SvgGraphics.java:700-706), value = measured width of the drawn string. The gap is NOT ortho-specific: no state transition label (inline or xlabel) ever had it.
- Origin: Java SvgGraphics.java:700-706; port src/diagrams/state/state-renderer-transitions.ts buildTransitionLabelMarkup (was :160) never passed textLength; TransitionGeo.label had no field.
- Chain: label drawn -> text() without textLength -> attribute missing -> S diff on every labelled state transition (not only pavuzo).
- Ruled out: ortho/xlabel-specific path (non-ortho label `state A/B; A --> B : EvConfig` lacked it too, pre-fix); layout (layoutEqual already true); one-char skip handled by text() textLengthOf.
- Fix: attachInlineTransitionLabel stores label.textLength = measurer width (ctx.font, the arrow label font) when the label is exactly one verbatim line (box.lines.length===1 && lines[0]===text); renderer passes it. Creole-marked / multi-line labels deliberately unchanged (drawn raw text != measured stripped line; pre-existing residual, not touched).

## Surveys (state, before -> after)
conformant 78 -> 90, structural-match 11 -> 23, diverged 184 -> 160, errored 0. Losses: 0.
conformant gains (12): buniva-95-zije634 fadupe-90-koti079 fojisi-40-zogo372 gifasa-23-zile558 kujaju-47-neku764 livuni-63-fira764 nibelu-74-pido796 piveje-28-zeko469 rifefi-73-rofo730 titika-34-xoze301 vafagi-07-zixo408 zacajo-09-tamu628.
structural-match gains (12): bunade-42-fudu910 dulixa-11-kufe247 kejabo-83-vinu490 moleco-69-sida106 mosigo-88-rove013 nenita-48-zuze128 nimise-04-jove070 pavuzo-79-zodu430 pifido-37-jipu349 viguto-81-gana093 vubale-26-daza585 vumika-03-guko738.
Orchestrator: 12 new conformant rows to re-pin (D6); run census-away-from-jar check.
Files: /private/tmp/claude-501/gtc-T7a/state-{before,after}.json.

## Tests
`vitest run tests/unit/state tests/architecture tests/oracle/svg-conformance`: 130 files collected, 128 pass, 2 fail (3 tests), 7895 pass / 1 skipped. state.golden.ratchet.test.ts passed. typecheck, eslint, prettier clean. New test: 3 tests pass (red before fix).

## Required follow-up OUTSIDE write-set (fails now; good news, residual fixed)
- tests/oracle/svg-conformance/lgm-t1c-svek-chrome.test.ts:54-59 state-title-only and state-frame-chrome expect residual `[textLength path]`; now `[]` -> change to toEqual([]) (and drop LABEL_TEXT_LENGTH const).
- tests/oracle/svg-conformance/lgm-t1a-mainframe.test.ts:112-116 state-frame expects `['svg/g[1]/g[6]/text[1]/@textLength']`; now `[]`.
- Also stale doc: .agent-notes/lgm-T1c.md line ~34 mentions the label textLength residual.

## Residuals / notes for T7b, T8
- Creole/multi-line transition labels still lack textLength (not in scope; no fixture evidence checked).
- pavuzo remaining 85 numeric: Δ1 on composite x/canvas width (219 vs 218) - not investigated (T7b/T8 candidate).
- No write-set extensions. No observations beyond the above.

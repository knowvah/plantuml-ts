# T7b report (pavuzo uniform 1 px x shift)
Commit: b3a26f3ff on gtc/S ("fix(state): fold label boxes into the document-level ink walk"). Files: src/diagrams/state/{layout-ink-extent.ts,layout-ink-transition.ts,state-transition-label.ts} (code + comments), tests/unit/state/{document-label-ink.test.ts (new),transition-label-ink.test.ts (D5 invariance test replaced)}.

## Per target row
state/pavuzo-79-zodu430: structural 0 -> 0, numeric 85 -> 0 (pass=true). Canvas 219, EvShutterReleased glyph x=7.

## Diagnosis
- Mechanism: the document-level ink walk (computeStateDocumentDims, computeStateInkShift, computeStateInkBox) used labelInk=false, folding only the label glyph anchor POINT. The jar folds the label's whole marged-block UEmpty. In an ortho diagram the leftmost ink is the xlabel box at graphviz x=0 (svek-2.dot dot -Tdot: xlp=57 for a 114-wide box), one marginLabel (1) left of its glyphs, so ours had minX=1 -> shift 5; jar minX=0 -> shift 6.
- Origin: Java SvekEdge.java:950-953 (labelText.drawU), TextBlockMarged.java:79-87 (UEmpty over whole block), LimitFinder.java:159-162 (drawEmpty), SvekResult.java:130-135 (moveDelta 6 - minX). Port: src/diagrams/state/layout-ink-extent.ts three buildInkBox(..., false, 'always') calls (document dims, ink shift, ink box).
- Chain: shift 5 vs 6 translates every element 1 px left and shrinks width by 1 (218 vs 219) -> uniform Δ1 on all 85 numerics.
- Ruled out: global translate arithmetic of cluster (jar composite x 60.97 = dot 54.97 + 6, widths equal 143.162); layout (dot positions equal, layoutEqual); LimitFinder arrowhead/edge-port terms (jar glyph x=7 = box 6 + margin 1 is exactly explained by box fold); src/core and dot-engine not involved. Instrumentation not needed (arithmetic closed by jar text x and dot xlp); none added.
- Superseded: the "document-level labelInk:false pinned (D5)" note; the comment claimed 57-59 svg pins held at point fold; the whole state ratchet + survey show no losses with the box fold.

## State survey (before -> after)
conformant 90 -> 99, structural-match 23 -> 14, diverged 160 -> 160, errored 0. Verdict losses: 0.
New conformant (9): dulixa-11-kufe247 kejabo-83-vinu490 moleco-69-sida106 nenita-48-zuze128 pavuzo-79-zodu430 pifido-37-jipu349 vateco-92-pece508 vubale-26-daza585 vumika-03-guko738 (all structural-match/or earlier -> conformant).
maxDelta movers within unchanged verdict: down: bunade-42 46->0.165, mosigo-88 46->0.165, fomusu-59 3->0, fotigo-12 5->0, jaxuxe-73 133->114.8, kupexa-94 68->24, nimise-04 59->4, ruruce-78 80->13, nicebo-05 56->54.6, xetase-70 538->523.
UP (diverged both before/after): lurage-50-kobo763 137.981 -> 233. Mechanism: `skinparam maxMessageSize 150`; our label is unwrapped (attachInlineTransitionLabel calls computeReservedLabelBox without maxWidth; drawn text is one 495-wide line vs jar's wrapped 8 lines), so its now-folded box widens the canvas (viewBox 518 vs jar 285). Wrap gap predates (3 S diffs + height Δ20 already present); the box fold exposes it in the canvas. Candidate follow-on: thread maxWidth through the state label (computeReservedLabelBox options exists).
Files: /private/tmp/claude-501/gtc-T7b/state-{before,after}.json. Orchestrator: re-pin 9 conformant rows (D6) and run the census away-from-jar check.

## Tests
`vitest run tests/unit/state tests/architecture tests/oracle/svg-conformance`: 131 files collected, 131 passed; 7900 tests pass, 1 skipped (includes state.golden ratchet). typecheck, eslint, prettier clean. New test red before, green after.
No out-of-write-set tests pinned the closed residual. No write-set extensions.

## Notes for T8
T8 (D3 cluster title Y) untouched. The doc comments in layout-ink-extent.ts no longer say labelInk false anywhere.

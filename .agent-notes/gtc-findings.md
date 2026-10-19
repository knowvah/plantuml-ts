# graphviz-tracker-consume (gtc) — findings (2026-10-16 .. 2026-10-19)

## Observation: a TRACKER box held open by "the engine" was ours on every row
- **Context**: consuming TRACKER items 14/16/28/29/30/32/33/34 after dot-engine 2.4.0.
- **Finding**: on every named fixture our builder graph already laid out equal to native; all eight
  boxes closed through post-layout drawing fixes in plantuml-ts. Not one residual traced into
  dot-engine (`dot -Tdot` on svek-1.dot was run for xagonu's 367 px loop and matched).
- **Impact**: when an engine fix "doesn't move" a fixture, start from the drawing, not the engine.
- **Confidence**: High

## Observation: one painted hidden link cost 1814 of deroxu's 1924 diffs
- **Context**: T6a census of deroxu-29-gude369.
- **Finding**: compareSvg keys every root child as `g`, so one extra `<g class="link">` (a
  `-[hidden]-` edge the jar draws through UHidden: comment only, extent kept) re-paired 130 sibling
  groups. Removing it left 255 real diffs in 9 families.
- **Impact**: before classifying a large diff, look for one extra or missing top-level element.
- **Confidence**: High

## Observation: stereotype priority ties go to the earliest LABEL, not the earliest declaration
- **Context**: T6j, an 8-way crossed jar oracle (declaration order × label order, skinparam and `<style>`).
- **Finding**: `StyleSignatureBasic#withTOBECHANGED` merges one signature per label in label order and
  `DarkString#mergeWith` keeps the earlier value, so `<<A>><<B>>` takes A's value whichever was
  declared first. The port had last-label-wins in core `stereotypePaint` and in four class/note loops.
- **Impact**: any new stereotype-scoped lookup uses `firstTaggedValue` (theme-element-resolve.ts).
- **Confidence**: High (jar oracle)

## Observation: brief premises were wrong three times; agents caught them by reading the jar SVG
- **Context**: T4 (repoge "draw order" was one opalised note + a note id), T6a ("title/legend order"
  already gone), T6j (tie rule is label order).
- **Finding**: each was disproved by a segment compare or a crossed oracle before any edit.
- **Impact**: brief the measurement, not the conclusion (see memory agents-correct-the-orchestrator).
- **Confidence**: High

## Observation: foreign load turns surveys into fake conformant losses
- **Context**: T2b chain at load 95-145 (another session's dot-engine capture.mjs, a pytest pool).
- **Finding**: 28 "losses" were all `timeout` verdicts on the alphabetically first rows of 9 engines
  (worker spin-up). Re-running those engines gave 0 timeouts, 0 losses. `chain.sh` gained `LOAD_MAX`.
- **Impact**: grep the survey summary for `timeout":[1-9]` before reading diff-eng's loss count.
- **Confidence**: High

## Observation: regenerate parity-report.md last at a close
- **Context**: T6b close; the D9 drift gate went red one commit later.
- **Finding**: `docs/parity-report.md` composes every committed baseline, including the description
  diff-baseline; tightening a baseline after regenerating it leaves the gate red.
- **Impact**: at a close, edit every pin/baseline first, then `npm run parity:dashboard`, then test.
- **Confidence**: High

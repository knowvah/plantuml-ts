# Batch 8 — first conformance pass (pulled into the b7 close by the refusal gate)

Turn-on (T7c, journal row 80) measured gantt at 260 conformant / 1 structural /
4 diverged of 265. The refusal-coverage gate then named 4 corpus rows that
"newly error": two are port defects, two are the gate's known head-window gap
(the jar's Welcome error page sits past the 4096-byte head for sources under 5
lines, `PSystemError.java:217-218`). Fixing the two defects is the gate's
precondition for the b7 close, so batch 8's first two families run now, in
parallel worktrees; the rest of batch 8 (≤ 4 families, stop 16) follows the
b7 capture.

| ID | Family | Rows | Agent | Writes | Done |
|---|---|---|---|---|---|
| [T8a](T8a-tim-date-week-year.md) | `%date` letter `Y` (week year) missing — core TIM, diagnosis artifact in the spec | fecaru-84-gofi396 | typescript-pro (sonnet), gep-T8a | `src/core/tim/builtin/date-format.ts` + test | [x] |
| [T8b](T8b-arrow-colour-crash.md) | `GanttConstraint.ts:25` invented `instanceof HColorSimple` guard crashes on a `<style>` arrow colour | mexito-28-toli086 | typescript-pro (sonnet), gep-T8b | `src/diagrams/gantt/GanttConstraint.ts`, `GanttArrow.ts` + tests | [x] |
| [T8c](T8c-emoji-asset-store.md) | gantt plugin drops `assetStore` → emoji artwork never drawn (gantt tree + 1 harness line) | ribupo-71-poku778 | typescript-pro (sonnet), gep-T8c | `src/diagrams/gantt/index.ts`, `draw/**` call sites, harness | [x] |
| [T8d](T8d-error-line-front-matter.md) | core error page indexes a document-absolute refusal line into the block-only trace (artifact in spec) | authored vega-gantt2 (+ any engine with a header) | typescript-pro (sonnet), gep-T8d | `src/core/error/error-diagrams.ts` + test | [x] |
| close | b8: gates, pins (ribupo promoted, authored bar), chain vs b7 (ribupo only), ledger | orchestrator | per close-procedure | T8c, T8d | [x] |
| re-pin | known-gap refusals: jar Welcome page beyond the head window (3- and 4-line sources) | nakude-77-suji787, papava-92-geve698 | orchestrator (`repin-gantt-routing.mts --write`) | refusal/routing pins | [x] |

## Deferred to gantt-divergence-drive (stop 16: four families used; artifacts in journal row 88)
- nakude: our message is "Gantt diagrams cannot last more than 20 years" for a
  one-day diagram whose only task `displays on same row as` itself — both sides
  error (conformant), but the 20-year path suggests a min/max input the Java
  does not produce; diagnose before pinning anything else that mentions `today`.
- vega-gantt2 (authored, expected-error): core `error/error-diagrams.ts:91`
  indexes a document-absolute refusal line into a trace without the YAML
  front-matter lines → clamps to the last line (T7c, row 80). Core file: needs
  its diagnosis artifact (stop 16).
- `xureco-57-lene839` (`path/@stroke`): transparent link stroke emits `style="stroke:none;"` where the jar emits no style — `src/core/klimt/AbstractCommonUGraphic.ts:107` defaults the back to the string `'none'` while `AbstractCommonUGraphic.java:61` uses the `HColors.none()` singleton, so `DriverPathSvg.java:61-75`'s equal-colour fast path never fires in TS (`driver-path-svg.ts:41-64`). Core, every engine with a transparent line over the default back — a full-gate mission item, not a batch-8 fix.
- `xikovo-87-rosu902` (structural, `svg/@height` 82 vs 90): mechanism not pinned; title-only and hide-footbox-only fixtures pass; `mogafu-27` shows the same 8 px on width. Next step: instrument `GanttLayout.getTotalHeight` terms Java vs TS for both rows.

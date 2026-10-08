# unwind2-S8: bundled skins as the jar; error-page logo and Arecibo

## Observation: the oracle jar no longer crashes on `skin sonyxperiadev` / `skin reddress`
- **Context**: re-rendering upstream issue #2797's repros with
  `scripts/oracle-render.sh` (1.2026.8beta1 fork, ~/git/plantuml 377fbd12).
- **Finding**: upstream fixed #2797 in 11ed6720 (2026-07-26):
  `reddress.skin` is deleted and `sonyxperiadev.skin` is a complete
  `<style>` sheet (plantuml.skin copy + "specifics" section + `@media` dark
  section, css variables). `TitledDiagram#loadSkin` now loads the sheet on
  the `skin` line itself and returns a command error: "Cannot find style X"
  (missing, case-sensitive: `skin Rose` fails), "Incomplete style X: root
  does not define [...]" (`skin strictuml`), "Cannot parse style X: ...".
- **Impact**: docs/upstream-plantuml-issues/01 describes the pre-fix jar;
  the jar renders sonyxperiadev and refuses reddress on every engine.
- **Confidence**: High

## Observation: `parseStyleBlock` ignored `@media` and css variables
- **Context**: applying the new sonyxperiadev.skin through the flat cascade.
- **Finding**: everything after `@media` is DARK scheme upstream
  (`StyleParser.java:150-152`); `--name: v` declares a variable and
  `var(--name)` reads it (`CssVariables.java`). The flat parser applied the
  dark section and emitted `var(--common-background)` as a fill. Both now
  handled in `skinparam-style-block.ts` -- inline `<style>` blocks too.
- **Impact**: any inline `<style>` with an `@media` block changed (survey).
- **Confidence**: High

## Observation: sonyxperiadev residuals are engine style-reading gaps
- **Context**: tests/fixtures/unwind2-S8 skin-*-sonyxperiadev pins.
- **Finding**: the same declarations in an inline `<style>` with no `skin`
  line reproduce every residual: sequence ignores `sequenceDiagram {
  participant / lifeLine / arrow }` and emits `document { BackGroundColor
  white }` raw (`background:white`); state/usecase text ignores `root {
  FontColor }`; no engine reads `root { FontStyle bold }` (the flat Theme
  has no global font style).
- **Impact**: follow-on missions per engine; not the skin loader.
- **Confidence**: High

## Observation: error-page decorations and the clock
- **Context**: `PSystemError#getTextBlock` (`PSystemError.java:214-235`).
- **Finding**: the minute of the hour picks Patreon (1/8/13/55),
  Liberapay (15) or a dedication (30/39/48) before the Arecibo branch;
  `disableTimeBasedErrorDecorations()` has no caller and
  `-DPLANTUML_DETERMINISTIC_TEXT` does not touch it. All 98 cached error
  goldens show only the logo (and one Arecibo, gabeme-89-tiko230): none was
  rendered on a banner minute. The port draws the 52-minute behaviour.
- **Impact**: a golden re-rendered on a banner minute would differ; re-render
  rather than chase it.
- **Confidence**: High

## Observation: `@startfoo` / `@startjcckit` render a homegrown sentinel box
- **Context**: rendering the Unsupported page for the logo check.
- **Finding**: the jar draws `PSystemUnsupported` (black-on-white, logo
  top-right, "Running on ..." + "(License GPL)"); this port's
  `dispatcher.ts#ERROR_SENTINEL` draws "Error: unknown diagram type" in a
  300x60 box. 7 cached goldens (6 jcckit, 1 chronology) show the jar page.
  `renderPSystemUnsupported` is ported but unreached.
- **Impact**: separate routing task; not done in S8.
- **Confidence**: High

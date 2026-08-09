## Observation: skinparam line VALUES are captured before TIM macro
substitution runs, so `!define`d tokens leak through literally

- **Context**: skin-file-loading mission Batch 4 (`reddress.skin`,
  `sonyxperiadev.skin` -- preprocessor+skinparam-grammar skins). Wiring
  `reddress` through `preprocess()` + `resolveSkinparam` to reuse the
  existing TIM macro engine (per the mission brief's own D1).
- **Finding**: `preprocessor.ts`'s `StyleAndSkinparamCollector`
  (`PlainLineFilter`) captures a `skinparam KEY VALUE` line's raw text
  BEFORE `TContext`'s function/variable substitution (
  `applyFunctionsAndVariables`) runs on that line. A `!define NAME value`
  (legacy/function-style, no `$`) OR `!$name = value` (affectation-style)
  token used later as a `skinparam` value is captured LITERALLY, not
  substituted. Verified via two independent, skin-unrelated 2-line repros:
  - `!define ACCENT 1a66c2` + `skinparam classBackgroundColor ACCENT` ->
    `skinparam.get('classbackgroundcolor') === 'ACCENT'` (not `'1a66c2'`).
  - `!$ACCENT = "1a66c2"` + `skinparam classBackgroundColor $ACCENT` ->
    captured as `'$ACCENT'` literally.
  - Control: the SAME `!define ACCENT 1a66c2` DOES substitute correctly
    into an ordinary diagram-body line (`note "ACCENT" as N1` ->
    `note "1a66c2" as N1"`) -- so substitution itself works; only the
    skinparam-line collector's interception point is upstream of it.
- **Impact**: `reddress.skin`'s ENTIRE mechanism depends on this
  (`!ifndef FONTNAME` / `!define FONTNAME "Verdana"` then
  `skinparam class { fontName FONTNAME }`, and every `!ifdef DARKBLUE`
  branch's `!define ACCENT ...` then `skinparam stereotypeCBackgroundColor
  ACCENT`) -- none of these VALUES resolve today, in EITHER bare or any
  `!ifdef`-variant mode; they render as literal macro-name text
  (`fill="BOXBG"`, `stroke="BORDERCOLOR"` in an actual rendered SVG).
  Skin-file-loading Batch 4's `applySkinLayer` DOES correctly thread the
  `!ifdef`/`!ifndef` GATE itself (confirmed: `!define DARKBLUE` threaded
  via `documentRawSourceLines` flips which branch's LITERAL,
  non-macro-referenced values apply, e.g. `skinparam backgroundColor 777`)
  -- the gap is scoped precisely to macro-VALUE substitution inside a
  skinparam line, not gate selection.
- **Why out of scope for Batch 4**: fixing this requires moving the
  `PlainLineFilter` hook point in `TContext`'s per-line processing to AFTER
  substitution (or re-running substitution on captured skinparam values) --
  `preprocessor.ts`/`TContext.ts` internals, touched by every document in
  the corpus that combines `!define`/`!$var` with `skinparam`, well outside
  this batch's write-set and risky to change inline.
- **Confidence**: High (two independent repros + a substitution-works
  control, all offline/reproducible via `preprocessOrError`).

## Observation: the pinned oracle jar itself CRASHES rendering
`skin reddress` / `skin sonyxperiadev` on every diagram type tried

- **Context**: Batch 4 Part B -- authoring fixtures and generating jar
  oracles (`java -DPLANTUML_DUMP_DOT=... -jar oracle/dist/
  plantuml-oracle.jar -tsvg -o ... <puml>`) for these two skins, per the
  mission brief's own "AUTHOR new fixtures + generate jar oracles, don't
  verify synthetically" instruction.
- **Finding**: the PINNED ORACLE JAR (not this port, not graphviz-ts)
  throws and emits an "An error has occurred" crash-diagram SVG for
  EVERY diagram type tried with either skin:
  - `skin sonyxperiadev` + a single state (`state "One" as s1`): jar
    throws `NullPointerException`, `EntityImageStateCommon
    .getStyleStateName(...)` returns null.
  - `skin sonyxperiadev` + a sequence message (`Alice -> Bob : hello`):
    jar throws `NullPointerException` in `Rose.createComponentParticipant`
    ("tmp" is null).
  - `skin reddress` + a single object (`object o1`): jar throws
    `StyleParsingException: bad definition` in `StyleLoader.loadSkinSlow`
    (`SkinParam.getCurrentStyleBuilderInternal` -> `CucaDiagram
    .createLeaf`).
  - `skin reddress` + a sequence message: SAME `StyleParsingException:
    bad definition`, same stack shape.
  - **Control (isolates the cause to these two skins' content, not a
    general skin+diagram-type jar issue)**: `skin rose` on the SAME
    bare object/state fixtures renders CLEANLY (no crash, no dump-DOT
    error) with the SAME pinned jar.
  - **Control (rules out a missing-resource packaging issue)**: `unzip
    -l oracle/dist/plantuml-oracle.jar | grep skin/` confirms
    `skin/reddress.skin` (2204 bytes) and `skin/sonyxperiadev.skin`
    (1078 bytes) ARE bundled in the jar, byte-size-identical to
    `~/git/plantuml/src/main/resources/skin/{reddress,sonyxperiadev}
    .skin` -- the jar reads its own correct, unmodified copy and still
    crashes applying it.
  - No test anywhere in `~/git/plantuml`'s own source tree exercises
    `skin sonyxperiadev` or `skin reddress` (`grep -rln "skin
    sonyxperiadev\|skin reddress" ~/git/plantuml` -- zero hits) --
    consistent with these being effectively untested upstream skins.
- **Impact**: there is NO usable jar SVG oracle for either skin with the
  currently-pinned `oracle/dist/plantuml-oracle.jar`, on ANY diagram
  type -- this blocks byte-exact SVG-fixture pinning entirely for
  Batch 4's Part B/C, independent of anything this port's skin-loader
  does. Resolution can only be verified at the THEME level (unit tests
  against `applySkinLayer`'s output, cross-checked against the verbatim
  embedded `.skin` text), not via an SVG conformance ratchet pin.
- **Not filed under `docs/graphviz-issues/`**: that tracker is scoped to
  graphviz-ts library findings (per CLAUDE.md); this is a PlantUML
  JAR/oracle defect, a different upstream project. No corresponding
  tracker exists in this repo for oracle-jar defects; flagging here is
  the closest existing convention (mirrors `dot-parity-before-visual-qa`
  memory precedent: pin oracle via `.tgz`/jar, and note when the pin
  itself is unreliable for a given input).
- **Confidence**: High (4 independent repro combinations across 2 skins
  x 2 diagram families, a same-jar working control, and a resource-
  presence control).

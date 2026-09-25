# cdd3-T25 -- skinparam genericDisplay old (E3-3)

## Observation: no render-side change needed -- renderer-classifier-badge-tag.ts untouched
- **Context**: the task file's primaries list named
  `renderer-classifier-badge-tag.ts` as a likely write-set member alongside
  `theme.ts`/the skinparam handler table/`class-stereotype-layout.ts`.
- **Finding**: `EntityImageClassHeader.java:90-91`'s `generic = ... ? null :
  entity.getGeneric()` means the tag box is simply NEVER BUILT under old
  fashion -- there is no separate "suppress the render" step, because
  `renderGenericTag` is only ever called when `geo.genericTag !== undefined`
  (`renderer-classifier-box.ts`'s own dispatch), and `geo.genericTag` is
  `undefined` whenever `stereoGeo.genericDim` is `undefined`
  (`computeGenericTagSlackGeo`, `class-layout-header-geo.ts:349`). Gating
  `measureGenericTagDim` itself (measurement layer) was sufficient; the
  render layer needed zero changes.
- **Impact**: for a "never draw X" mechanism, check whether the render call
  is already conditioned on a measurement-layer `undefined` before assuming
  the renderer itself needs a branch.
- **Confidence**: High (jar-verified `bijevi-38-duza931`, 0/0).

## Observation: a top-level Theme boolean needs THREE wiring points, not one
- **Context**: porting `skinparam genericDisplay old` following the
  `strictUml` precedent (`skin/SkinParam.java:1180-1181`).
- **Finding**: a new top-level `Theme`/`SkinparamAccumulator` boolean field
  needs FOUR separate edits, not the two obvious ones (accumulator field +
  key handler): (1) `SkinparamAccumulator` field
  (`skinparam-accumulator.ts`), (2) the key handler
  (`skinparam-key-handlers-table-a.ts`), (3)
  `skinparam-theme-builder.ts#ROOT_SCALAR_FIELDS` (builds the `Partial<Theme>`
  from the accumulator), and (4) `theme-merge.ts#OPTIONAL_SCALAR_KEYS` (the
  EXPLICIT allowlist `deepMergeTheme` copies top-level scalars through --
  missing here silently drops the field with NO error, since
  `ThemeOverride`/`Theme` both type it fine and `applyOptionalScalars` just
  never touches an unlisted key). Confirmed by direct reproduction: a
  standalone `resolveSkinparam` call showed `unknown: []` (handler matched)
  but `theme.genericDisplayOld === undefined` until (4) was added -- the
  symptom looks exactly like "the handler didn't fire" but the handler DID
  fire; the accumulator's value never survived the merge.
- **Impact**: any future top-level (non-`colors`) `Theme` boolean/scalar
  will hit the same silent-drop trap at step (4) if only (1)-(3) are done.
  `skinparam-accumulator.ts#SCALAR_FIELD_NAMES` (undefined-seeding list) is
  a FIFTH list that should also carry the name for completeness, though its
  omission doesn't cause a functional bug (property access on a missing key
  already returns `undefined`).
- **Confidence**: High (reproduced via `npx jiti` standalone script before
  and after the `theme-merge.ts` fix).

## Report

- **Fixtures closed**: bijevi-38-duza931 (class) 7S/7N -> 0/0.
- **Fixtures improved**: none.
- **Fixtures unmoved**: none targeted beyond bijevi.
- **Movers** (render-all pin-diff, pre vs post, 723 class fixtures):
  bijevi-38-duza931 diverged -> conformant (E3-3, the fix). No other
  transitions (`pin-diff.mts` reported "1 transition(s)").
- **Survey scope** (class + object, per task file): object survey
  58/11/11/0/0/0 identical pre/post, 0 per-fixture verdict movers. unknown
  survey (extra, not required by task file) 111/90/621/3/0/0 identical
  pre/post, 0 movers.
- **Mechanism (E3-3)**: `SkinParam#displayGenericWithOldFashion`
  (`skin/SkinParam.java:1180-1181`, `valueIs("genericDisplay", "old")`)
  flips `EntityImageClassHeader`'s ctor (`svek/image/
  EntityImageClassHeader.java:90-91,108-110`) into a branch that (a) never
  builds the separate `<T>` tag box (`generic = null`) and (b) appends the
  raw generic clause `<>`-wrapped onto the LAST display line
  (`Display#addGeneric`, `klimt/creole/Display.java:529-538`), rendered in
  the header NAME's own 14pt font, not the 12pt-italic
  `FontParam.CLASS_STEREOTYPE` the tag box uses.
- **Ported**: `computeHeaderInfo` (`class-stereotype-layout.ts`) now takes
  `genericDisplayOld` and appends `<generic>` to `classifier.display` when
  set (`typeParamsRawText ?? typeParams.join(', ')`, matching the raw
  unsplit-capture convention `GenericTagDim` already documents).
  `computeHeaderDimsGeo`/`resolveGenericDim` (`class-layout-header-geo.ts`)
  skip `measureGenericTagDim` entirely under the flag, so `genericDim`,
  `genericTag`, and the render-side `<rect>`/`<text>` tag box never appear
  -- no `renderer-classifier-badge-tag.ts` change needed (see note above).
  The flag threads `Theme -> measureClassifier -> MeasureGenericClassifier
  Options -> buildHeaderAndStereoGeo -> computeHeaderNameGeo` (builds
  `HeaderInfo.genericDisplayOld`) and separately `-> computeStereoAndTagGeo`
  (reads it back off `headerNameGeo.header.genericDisplayOld`, avoiding a
  6th param / avoiding polluting the shared `StereoGeoOptions` bag used by
  functions that don't need it).
- **Skinparam wiring** (new top-level `Theme.genericDisplayOld?: boolean` +
  `ThemeOverride.genericDisplayOld?: boolean`): `skinparam-accumulator.ts`
  (field + `SCALAR_FIELD_NAMES`), `skinparam-key-handlers-table-a.ts`
  (`genericdisplay` key, case-insensitive `=== 'old'`),
  `skinparam-theme-builder.ts#ROOT_SCALAR_FIELDS`, `theme-merge.ts
  #OPTIONAL_SCALAR_KEYS` (see second note above -- REQUIRED, not optional,
  for the field to survive `deepMergeTheme`).
- **Extensions (D4)**: `theme-merge.ts` (not in the task's primaries list;
  the skinparam-handler-table primary implicitly includes it -- it is the
  same top-level-scalar-boolean wiring chain `strictUml` already uses,
  confirmed no concurrent task (T18/T23/T33) owns it).
- **Test**: `tests/unit/class/class-generic-display-old-t25.test.ts` (red
  confirmed pre-fix, green post-fix) -- skinparam mapping (2 tests),
  `computeHeaderInfo` pure-function unit test, and a full `renderSync`
  jar-exact assertion against `bijevi-38-duza931`'s pinned golden.
- **Gates**: `npx vitest run tests/unit/class tests/unit/core/skinparam*
  tests/unit/skinparam.test.ts` 3040 passed; `tests/oracle/class-dot-parity
  .test.ts` 721 passed; `npm run typecheck` clean; `npx eslint` clean on
  every touched file; full `npm test` 835 files passed, 22848 tests passed,
  the 5 expected worktree-symlink stdlib/sprite failures only (`stdlib-
  packages`, `stdlib-all-exports`, `stdlib-package-files`, `sprite-package-
  files`, `stdlib-remote-e2e`) -- `npm run catalog` not needed
  (`catalog.test.ts` was in the passing set).
- **Main-checkout leak check**: `git -C <main> status --short` shows only
  T18's own known edits (`src/core/{graph-layout-build.ts,
  graph-layout.types.ts, graph-layout.ts, graph-layout-cluster.types.ts,
  svek-dot-emit*.ts, svek-dot-order.ts, svek-dot-together.ts},
  src/diagrams/class/{class-container.ts, class-dot-graph.ts,
  class-command-containers.ts, class-parse-state.ts, class-dot-together.ts,
  class-together.ts, parser.ts, ast.ts}` + description-diagram siblings) --
  no file this task touched appears there.
- **Open artifacts**: none.
- **Commit**: see the single `fix(cdd3-T25): ...` commit on `wt/cdd3-T25`.

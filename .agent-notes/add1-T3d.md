## Observation: two of T3d's four mechanisms need files outside its write-set
- **Context**: Porting ArrowHeadColor (`Worm.java:146-154`,
  `FromSkinparamToStyle.java:153`) and the `activity { BackgroundColor
  red-green }` gradient (dakesa-98-mano758), after confirming
  `activityDiamondFontSize` (table-a.ts/table-b.ts only) and the note
  `#FEFFDD` default (theme.ts only) were both achievable within the
  write-set.
- **Finding**: This port's skinparam pipeline has TWO distinct carriers for
  a new key, and only one is reachable from `skinparam-key-handlers-table-
  {a,b}.ts`/`theme*.ts`:
  1. The GENERIC per-SName `elements` bucket (`acc.elements[sname]`,
     `ElementColors`) — reachable entirely from the handler tables, because
     `acc.elements: Record<string, ElementColors>` already exists on
     `SkinparamAccumulator` and `ElementColors` already carries every field
     a NEW bucket-routed key needs (`fontSize`, `font`, `fontFamily`,
     `fontStyle`, ...). `activityDiamondFontSize` used this path: `diamond`
     was already an `ELEMENT_BUCKET_SNAMES` member and `activityFontSize`
     (`activity-style-defaults.ts`) already read `elements['diamond']
     .fontSize` — only the handler entries were missing.
  2. A dedicated TOP-LEVEL `SkinparamAccumulator` SCALAR field (`acc.arrow`,
     `acc.arrowFontColor`, `acc.activityBackground`, ...) — this is the ONLY
     path for `arrow`-prefixed keys, because `ELEMENT_BUCKET_SNAMES`
     deliberately EXCLUDES `arrow`/`note`/`circle`/`composite` (comment at
     `skinparam-element-buckets.ts:130`, D3: "all four are SHARED SNames
     already routed by description/class/state"). A brand-new scalar field
     requires editing THREE files, none of which match T3d's write-set
     glob: (a) `skinparam-accumulator.ts` (the `SkinparamAccumulator`
     interface + its `SCALAR_FIELD_NAMES` table), (b)
     `skinparam-theme-builder.ts` (`buildColorsOverride`/
     `ACTIVITY_OVERRIDE_FIELDS`, whichever destination), (c) for a Paint-
     typed field specifically, the CONSUMER (the renderer reading
     `theme.colors.X` as a `Paint` instead of flat `string` — for the
     gradient mechanism this is `activity-renderer-shapes.ts:164`'s
     `actColors`, owned by T3f, not T3d).
  Both ArrowHeadColor (needs a new `acc.arrowHeadColor: Paint`) and the
  `activity { BackgroundColor red-green }` gradient (needs
  `acc.activityBackground` widened `string` -> `Paint`, which ALSO needs
  its renderer consumer updated) hit path 2 and are therefore NOT
  achievable from T3d's write-set alone, confirming (not merely repeating)
  T2c's original re-slot finding by actually tracing the accumulator type
  and its two consumers.
- **Impact**: A future core-scoped family taking these two should get
  `skinparam-accumulator.ts` + `skinparam-theme-builder.ts` in its
  write-set explicitly (both are currently excluded by every batch-3
  family's write-set, per `overview.md`). The gradient mechanism ALSO
  needs `activity-renderer-shapes.ts` (T3f's file) for the consumer side —
  it cannot be done by a core-only task in one pass; whoever picks it up
  needs both a core write-set AND the renderer file, or two sequential
  tasks.
- **Confidence**: High (read `skinparam-accumulator.ts`,
  `skinparam-theme-builder.ts`, `skinparam-key-handlers.ts`,
  `skinparam-element-buckets.ts`, and `activity-renderer-shapes.ts:164`
  in full; confirmed via `grep` that no alternate already-wired path
  exists for either key).

## Observation: a shared-field fix can move an equality-pinned fixture in ANOTHER diagram type's committed census, not just activity's
- **Context**: `defaultTheme.colors.noteBackground` is read by
  `activity-renderer-shapes.ts`, `description/renderer-note-opale.ts`,
  `description/renderer-entity.ts`, AND `sequence/renderer.ts`. After
  fixing it, `npx vitest run` (full suite, not just activity) surfaced a
  RED `tests/oracle/svg-conformance/sequence-diff-census.test.ts` failure
  on `TeozTimelineIssues_0004_Test` (diffCount 156->164) — a SEQUENCE
  fixture with four `note right of Alice` lines.
- **Finding**: The move is correct, not a regression: the fixture's own
  cached jar golden (`test-results/dot-cache/sequence/
  TeozTimelineIssues_0004_Test/in.svg`) contains `fill="#FEFFDD"` eight
  times — our note fill now matches it exactly, where before it was the
  unsourced `#FEFECE`. `diffCount` rose anyway (reveal, same mechanism as
  memory `weightedscore-can-rise-on-a-correct-fix`/
  `comparesvg-count-not-monotonic`): removing 8 "wrong fill" diffs exposed
  8 diffs elsewhere that a short-circuited comparison had been hiding.
  The committed artifact that needs a fresh-measurement re-pin is
  `oracle/goldens/svg-sequence/diff-census.json` — OUTSIDE this mission's
  `svg-activity` pin set entirely, and outside any batch-3 family's
  write-set.
- **Impact**: The "all-engine survey" this mission's rules require
  (`svg-parity-survey.ts`/`parity-<engine>.json`) did NOT catch this: that
  survey's `verdict`/`maxDelta` fields track only NUMERIC geometry deltas,
  never color-only changes (confirmed: 0/1141 sequence records changed at
  the raw-JSON level even though a real rendered-SVG color changed on a
  grep-verified sequence fixture). A shared-field color default change
  needs `npx vitest run` (the FULL suite) to catch a downstream
  equality-pinned census in another diagram type, not the per-engine
  parity survey alone.
- **Confidence**: High (grepped the jar's own cached golden SVG directly
  for the fill count; confirmed the per-engine survey script's `verdict`
  field is unchanged across all 7 surveyed engines despite a provably
  different rendered color in at least one sequence fixture).

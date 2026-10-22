# T6a: core creole parity probe for sequence labels

Branch `sdd2/T6a` at mission tip `465c4dd30` (Batches 0-4). This is a
measurement only, so `src/` is unchanged. The scratch seam lives outside the
repo:

- `/private/tmp/claude-501/-Users-scottseely-git-knowvah-plantuml-ts/303eb6e3-f3cf-4737-80a1-e4f9d9cbec55/scratchpad/t6a/`
  - `seam/`: the patched copy of `src/`.
  - `base/`: an untouched copy.
  - `probe.mts`: the harness.
  - `seam-src.patch`: 18 files, +513/-84.
  - `seam-harness.patch`
  - `out-*/rows.json`: per-row results.

## 1. Verdict

### 1.1 Pinned rows

**687/687 pinned rows are identical.** The ratchet manifest
(`oracle/goldens/svg-sequence/ratchet.json`) has 687 entries; journal row 63
says 688. Each row was checked two ways:

- **Against the golden.** Rendered with `renderFixtureSequence`,
  `DeterministicMeasurer` and `fixtureIncludeStore()`, then diffed against
  `golden.svg` with `compareSvg`: zero diffs on every row.
- **Against the current render.** The output is byte-identical to the current
  branch on every row, so the seam adds no change of any size.

### 1.2 Stop 7

Stop 7 does not trigger: the probe found no undiagnosed pinned delta.

### 1.3 One pinned delta outside the ratchet's view (diagnosed)

This delta only appears under a weight-aware measurer, which the ratchet and
the survey do not use.

**What happens.** If the seam uses core's `MeasurerStringBounder`, then
`JarMeasurer` renders 137 of the 687 pinned fixtures differently. Examples:
`benuba`, `bepipo`, `badoba`, `cazusa`.

**Mechanism.** `MeasurerStringBounder.calculateDimension`
(`src/core/measurer-bounder.ts:27-30`) passes the `FontConfiguration` to
`measurer.measure` as if it were a `FontSpec`. A `FontConfiguration` keeps
BOLD in `styles` and has no `weight` field. `JarMeasurer#metricsFor`
(`src/core/measurer-jar.ts:60-62`) checks `font.weight === 'bold'`, so it
measures every bold atom with regular metrics. Bold atoms include group
headers, `**x**` and bold participants.

**Causal chain.** The bold text block comes out narrower. That changes the
tab, header and participant widths, and every lifeline x after them moves.

**Ruled out:**
- **The recorder's text emission.** Its `textRunOf` already measures through
  `atomFontSpec`.
- **Every other seam difference.** Changing only the bounder to one that maps
  BOLD/ITALIC onto `weight`/`style` gives 0/687 differences under
  `JarMeasurer`.

**Why the gates miss it.** `DeterministicMeasurer`
(`src/core/measurer.ts:184-191`) ignores weight. Both the ratchet and
`svg:survey` (`scripts/svg-parity-survey.ts:281,308`) use it.

**Untested.** The sequence production default is `getDefaultMeasurer()`
(`src/core/render-options.ts:130-134`). `CanvasMeasurer` builds a font string
that includes the weight (`measurer.ts:260-261`). I did not run it.

**Requirement for T6b.** T6b must use a FontSpec-aware StringBounder (the
`specBounder` in the scratch seam). It must not use core
`MeasurerStringBounder`.

## 2. What the scratch seam does

New module: `seam/src/diagrams/sequence/sequence-creole-sheet.ts`.

**Block build.** `sequenceLabelBlock(lines, font, opts, measurer) -> LabelBlock`
is built from:
- `Display.create(numberText ? [new MessageNumber(n), ...lines] : lines)`
- core `create0` (`src/core/klimt/creole/DisplayCreole.ts`)
- `LineBreakStrategy.NONE` and `CreoleMode.FULL`
- an `ISkinSimple` that copies `activity-creole-sheet.ts#activitySkinSimple`
- `chromeAtomOps(sprites, fc)`

The upstream path it mirrors is `AbstractTextualComponent.java:86-91` →
`Display.java:644-669` → `getCreole` (`:692-701`) / `createMessageNumber`
(`:703-712`).

**Size and draw.** The size comes from `tb.calculateDimension(bounder)`. The
block is then drawn into a recording `UGraphic`, which turns each shape into
a primitive relative to the block's top-left, in draw order:
- `UText` → a `TextRun` (baseline y, same fields `textAtomRuns` produced).
- `UImage` → a `TextRun.image` (`SequenceRunImage`), so `scale-geo` still
  scales it.
- Any other `UShape` → a "raw" primitive, drawn later through a throwaway
  `UGraphicSvg`. Its `<defs>` go to the document `extraDefs`.

**How it was run.** Two stages, so the two layers could be told apart:
- **Stage 1 ("line").** Only `sequenceCreoleRuns` and `sequenceLabelLineWidth`
  go through core, one display line at a time. Call sites still stack lines
  by `'M'` line height.
- **Stage 2 ("block").** Every label is one block per Display. The block's
  width and height replace line-count stacking at every site listed in §6.2.
  Participant heads stay one block per row, because core
  `createStereotype` throws (see §6.4).

Both stages give 687/687 byte-identical pinned rows. The numbers below are
stage 2 with the FontSpec-aware bounder (`out-final`). "+harness" adds the
nested-diagram registration to the probe's copy of `render-fixture-sequence.ts`
(`out-final-nested`).

**Call sites the seam reached.** Over 1141 rows: 77,091 block builds, every
site in §6.2 reached. The heaviest are `text-block-geo` message label/width
(40,212), the participant row (12,192) and the note body (8,837).

## 3. All rows vs `b4-classify.json` (zero 800)

### 3.1 Totals

| | b4 | seam | seam + harness |
|---|---:|---:|---:|
| zero | 800 | 832 | 835 |
| paint-only | 7 | 12 | 12 |
| geometry | 181 | 182 | 183 |
| structural | 150 | 112 | 108 |
| error | 3 | 3 | 3 |
| Σ ws | 40745 | 35106 | 34977 |
| rows changed | — | 94: **94 fell, 0 rose**, 32 to zero | 94 fell, 0 rose, 35 to zero |

No b4-zero row moved, so there are no losses.

### 3.2 Rises seen mid-probe

Nine rises appeared while the probe was being built. They were caused by the
probe itself, and both causes are fixed in the final seam:
- **Raw `UImage` was unscaled.** In `baketu`, `dolefo` and `tumuke` (dpi 400)
  the image came out 19×14 against the jar's 79×58. Making images structured
  `SequenceRunImage` primitives fixed it.
- **Raw shapes had no width or height.** The participant box was sized from
  `last.x + last.textWidth`, so `fuvumu` drew a 15×14 box against the jar's
  36×34. Sizing rows from the block's own dimensions fixed it.

These are requirements for T6b (§6.1).

### 3.3 Per research-D cluster (expected results for T6b)

Seam column = `b4 ws → seam ws`.

| Cluster | Rows | To zero | Fell, still non-zero | Unchanged | Σ ws | Remaining / owner |
|---|---:|---:|---:|---:|---:|---|
| A svg-sprite | 46 | 13 (bapifu fukaro gofixe kijeka loloke makigi mifafi pimoci puneli ralegi soxafo tijeta vekuno) | 33 | 0 | 3095 → 737 | See note A1 |
| A OpenIconic | 7 | 7 (fanoxo fuvumu giroko jivati kojoma mozege popoda) | 0 | 0 | 998 → 0 | — |
| A emoji | 2 (+rapoto) | 0 | dekapo 329→328, gacemo 36→10 | 0 | | See note A2 |
| B Fission | 8 | 0 | 0 | 8 (felasa nexuxi suneke taboza tugaju xujavu zicadi zajova) | 3132 | T6c: the probe used `LineBreakStrategy.NONE` |
| H `" "` atom | 6 | 0 | kofuti 103→60, nunozo 99→54, rudola 103→60, tatesu 656→60, totebu 40→6 | teoz-ng-001 (203) | 1001 → 240 | T6d |
| K `{{ }}` | 5 | 0 (+harness: cusete, dasutu, lezonu) | rizove 72→31 (→2 +harness), menoke 221→167 (→162) | 0 | 492 → 293 | See note K |
| L data:svg | 2 | 0 | 0 | budevu, vofupo | 123 | T6e |
| M `----` rule | 5 | 0 | bugabo 52→8, jozomu 52→8, sisege 27→19, lafuzo 126→114, dolefo 184→180 | 0 | 441 → 329 | See note M |
| R table | 2 | duzico 129→0 | togopo 118→7 (paint-only) | 0 | | See note R |
| S tree | 2 | bejate, jagoni | 0 | 0 | 112 → 0 | — |
| T ext-colour decoration | 2 | 0 | gibaro 20→6 | migodo (16) | | See note T |
| V `<back:>` | 1 | 0 | 0 | ravire (30) | | See note V |
| W `<code>` | 1 | 0 | nojata 47→1 | 0 | | — |
| X list header | 1 | 0 | gadiva 10→2 (paint-only) | 0 | | — |
| Outside the D creole clusters: block height | 8 | camuxi (`<math>`), xinope (`<img>`), mudiga (`<$sprite>`) | xezipe 195→18 (`<sub>`), todetu 100→34 (`<sub>`), baketu 172→170, tumuke 172→170, dolefo (counted under M) | | | See note BH |
| Outside: AtomText 10 px floor | 2 | gogivi, vegizu | | | | See note FL |
| Outside: ref creole width | 4+2 | cikoca, cusiro, losefo, sefako | mefeke 36→35, nibiju 104→98 | | | See note RW |
| Other | | | gepuce 265→245 (T7f handwritten), savebe 69→33 | | | — |

**A1, svg-sprite residuals.** 30 of the 33 non-zero rows use
`!pragma svgparser sax`, and the port has no SAX sprite parser. Upstream
selects it in `svg/parser/SvgSpriteParserFactory.java:53-80`; a grep of `src/`
for it returns nothing. 11 of those 30 also lack `<linearGradient>` defs
(deluve labite lupomi mataga ralucu rolota ruboxu sebafe sodovo vibaru
zimoci). For `deluve`, rendering the same sprite through the class engine
draws no gradient either, so this is core work and not T6b. The other three
residual rows are kaluna (geometry 2), rapoto and tugonu.

**A2, emoji.** gacemo: the classify harness passes no emoji asset store, but
the survey does, and the survey marks gacemo conformant. dekapo is not
isolated.

**K, embedded diagrams.** `render-fixture-sequence.ts` never calls
`registerNestedDiagramRenderers`. `src/index.ts:317` does, and so does
`render-fixture-activity.ts:121`.

**M, horizontal rule.** The participant head must be ONE block, with
marginX1/X2 equal to `style.getPadding()` (`ComponentRoseParticipant.java:71`).
It must be drawn under Fore and `UStroke.simple()` (`:94-118`). In the jar
the rule runs x 10→94.088 with stroke #181818 and width 1. The probe drew it
47→57 with `stroke=none`.

**R, table stroke.** togopo: the note component's stroke has to be applied
before the text is drawn (`ComponentRoseNote.java:121`
`symbolContext.apply(ug)`). Without it the table lines are 1 against the
jar's 0.5.

**T, extended-colour decoration.** The text primitive must carry the extended
colour lines (`DriverTextSvg.java:134-147`).

**V, back filter.** The text primitive must carry the back colour
(`DriverTextSvg.java:162`). Core already has `backColorFilterDef`.

**BH, block height.** The reservation becomes the text block's own height
(`AbstractTextualComponent.java:110-114`, Sea heights in
`SheetBlock1.java:116-170`) instead of `rows * lineHeight`. This retires the
remainder named in `sequence-creole.ts`.

**FL, 10 px floor.** `AtomText.java:180` (`if (h < 10) h = 10`) applies to a
FontSize-8 stereotype row.

**RW, ref width.** `ref-body-geo.ts:127` measures the raw `[[url]] …` source
text instead of the creole block's width.

## 4. Survey path (`svg:survey -- sequence`, renderSync)

- **Verdicts.** Base: conformant 800, structural-match 130, diverged 213.
  Seam: 836 / 126 / 181. That is 36 rows to conformant and **0 conformant
  losses**.
- **Survey and classify disagree on 4 rows.** All four are conformant in the
  survey and non-zero in classify:
  - **cusete, dasutu, lezonu.** The ratchet harness registers no nested
    renderer. With the registration they reach zero in classify too.
  - **gacemo.** The classify harness has no emoji asset store
    (`classify.mts` passes only `includeStore`), so it draws the
    platform-glyph `<text>` fallback where the jar draws a `<path>`.

## 5. Wall-clock

Every pair below was run back-to-back under the same load. The box was **not
quiet**: other agents were running, and the load average went from 7.5 to
53.5. The b0 stop-17 reference is 34.6 s.

| Path (1141 / 1143 rows) | Time / `uptime` load | base | seam | seam + memo | seam/base |
|---|---|---:|---:|---:|---:|
| Ratchet, `renderMs` (`probe.mts`) | 14:19, 8.9–14.8 | 6981 | 8987 | — | 1.29 |
| Ratchet | 14:19, 11.5 | 6850 | 8770 | — | 1.28 |
| Ratchet | 14:20–21, 11.0–13.3 | 7659 / 6767 | 8660 / 8788 | 4860 / 4771 | 1.13 / 1.30 (memo 0.63 / 0.70) |
| Survey `real` s (worker pool) | 14:24, 11.7 | 42.15 | 47.83 | 44.14 | 1.13 (memo 1.05) |
| Survey | 14:26, 53.5 | 50.06 | 51.04 | 45.07 | 1.02 (memo 0.90) |
| Survey | 14:29, 40.1 | 42.79 | 42.78 | 35.81 | 1.00 (memo 0.84) |

**Unmemoized.** The seam is about 1.3× on the single-process ratchet path and
1.0–1.13× on the survey path. Both are below stop 17's 1.5×.

**Why memoize.** Message labels are rebuilt about 40k times, because the
width sites call `messageLabelWidth` again and again. Memoizing per
`(display, font, opts)` per measurer makes the seam faster than the current
path (0.63–0.90×). Upstream builds each component's TextBlock once
(`AbstractTextualComponent` constructor, memoized `SheetBlock1#initMap`).

## 6. Seam shape for T6b

### 6.1 Module `src/diagrams/sequence/sequence-creole-sheet.ts`

**`sequenceSkinSimple(fc, sprites)` → `{ skin: ISkinSimple, atomOps }`**
- Copies `activity-creole-sheet.ts#activitySkinSimple`.
- Uses `chromeAtomOps(sprites, fc)`.
- `CreoleParser` runs with the nested renderer from
  `getNestedDiagramRenderer()`.

**`sequenceTextBlock(display: readonly string[], font, opts) → TextBlock`**
- Calls core `create0(Display.create(...), { fontConfiguration: font,
  spriteContainer: skin, atomOps }, { horizontalAlignment, maxMessageSize,
  creoleMode: FULL }, {}, { marginX1, marginX2 })`.
- `opts` carries:
  - `align`
  - `numberText`, which becomes element 0 as a `MessageNumber`
  - `marginX1`/`marginX2`, equal to the component padding left/right
    (`AbstractTextualComponent.java:91-92`)
  - later, T6c's `maxWidth` in place of `LineBreakStrategy.NONE`
- Empty display rule (`AbstractTextualComponent.java:86-87`): a lone `""`
  with no number gives no block. A number with an empty label keeps `[""]`,
  which feeds H through `StripeSimple.java:124-126`.

**`sequenceStringBounder(measurer) → StringBounder`**
- Maps `FontConfiguration` to a FontSpec with weight/style. This is
  mandatory (§1.3).
- Do not re-mute the size. `measuringFont` has already applied it.

**`sequenceLabelBlock(lines, font, opts, measurer) → LabelBlock`**
- Returns `{ width, height, primitives }`, the batch-6 contract.
- Draws through a recording `UGraphic` that has the component's `ug.apply`
  chain in place: Fore, Back and stroke, per component as in §3.3 notes M and
  R. This is the activity `DrawContext.changes` pattern.
- Memoized per render.

**Primitive union `SequenceTextPrimitive`:**
- **text:** the current `TextRun` fields. Must also carry what
  `DriverTextSvg` reads beyond them: extended-colour decoration, back colour
  and the sprite-text weight. gizinu and nemeji show `font-weight` 700/900
  and `font-style` lost when a sprite's `UText` goes through the
  `TextRun` shape.
- **image:** the existing `SequenceRunImage`, emitted rounded when a raster
  backs it (`driver-image-svg.ts`). It must be scaled by `scale-geo.ts`.
- **shape:** `UShape` + `UParam` + translate. The emitter draws it through
  `UGraphicSvg` at scaled coordinates and sends its defs to `extraDefs`
  (`renderer.ts:443-458`); `assemble-svg.ts:511` renames the ids.

**Positions.** Primitives are relative to the block's top-left, and call
sites move them with `offsetRun` semantics. Never use
`sequence-layout-participant-label.ts:270` `translateRun`: it overwrites `y`
with one baseline.

### 6.2 Call sites to migrate (current file:line)

**Messages**
- `text-block-geo.ts:400` `placeMessageLabel` (the `MessageNumber` merge
  goes through core `createMessageNumber`)
- `text-block-geo.ts:367` `messageLabelBlock`
- `text-block-geo.ts:485` `messageLabelWidth`
- `text-block-geo.ts:473` `messageLabelRows`
- `sequence-layout-message.ts:87-89` `labelBlockHeightOf` and `:268`
- `sequence-layout-exo.ts:132-145` (width), `:285` (place), `:339-341`
  (height)

**Callers that only use the width** (all through `messageLabelWidth`)
- `sequence-layout-participant-constraints.ts:174,204`
- `sequence-layout-frame-extent.ts:151,186`
- `sequence-layout-parallel-disjoint.ts:75`
- `sequence-layout-link-anchor.ts:69`
- `sequence-layout-message-label.ts:69`
- `sequence-note-anchor.ts:48,122`

**Notes**
- `sequence-layout-note.ts:34-52` `noteBodyRuns`
- `:154-156` `textHeightOf`
- `:199` (`blockWidthOf` → block width)
- `:226-227` `noteTextHeight`

**Participant head**
- `sequence-layout-participant-label.ts:136-147` `labelRows`
- `:366-372` placement
- `:345-352` block size
- `sequence-layout-participants.ts:118-119,282-283`

**Group header and else**
- `sequence-frame-metrics.ts:115-145` `computeHeaderTab`: line 127 is the
  raw measure that drives height, lines 130-134 the per-line width.
- `:151-171` `buildTabRuns`
- `:177-187` `headerWidth`
- `:234-240` `elseComponentWidth`
- `sequence-layout-frame.ts:71-75` `separatorHeight`
- `sequence-layout-frame.ts:85-96` `branchConditionRuns`

**Shared block mirror**
- `sequence-block-align.ts:54-75` `alignedBlockRuns`, used by delay, frame
  and ref. Replaced outright.

**Delay**
- `sequence-delay.ts:67-71`, `:83-100` (`textHeight` from line count)

**Ref**
- `ref-body-geo.ts:72-82` `refBodyLines`
- `:86-88` header dimension, measured raw
- `:108-112` `refBodyHeight`
- `:125-129` `refComponentWidth`, measured raw (the RW rows)
- `sequence-layout-ref.ts:78-81` `bodyRuns`, `:100-104` `headerOf`

**Divider**
- `sequence-layout-divider.ts:37-54` `dividerLabelRuns`, which passes no
  sprites
- `:71-90`: `event.text.split('\n')`, height from line count

**Box title**
- `sequence-layout-box.ts:59-72` `boxLabelRuns` (no sprites)

**Link-anchor label**
- `sequence-layout-link-anchor.ts:104-122` `labelRunsOf`

**Not a label**
- `sequence-layout-lifeline.ts:76` is only the `<title>`, so it stays out of
  scope.

**Emitters** (each needs the image and shape kinds)
- `renderer.ts:71` `creoleRunText`
- `renderer-message.ts:113` `messageLabelRun`
- `renderer-participant-shapes.ts:102` `renderLabelRun`
- `renderer-frame-header.ts:191` `renderHeaderText`
- `sequence-text.ts:149` `sequenceText`
- `scale-geo.ts` must scale the shape primitives.

**Sprites.** Thread `ctx.sprites` to every site; the divider, box, delay and
ref sites pass none today. The probe used a module-global registry for this.

**Deletable with `sequence-creole.ts`.** `text-block-geo.ts:119`
`textBlockRuns` and `sequence-creole-text-atom.ts:129` `sequenceLineWidth`
have no callers in `src/` or `tests/`.

### 6.3 Harness (`tests/oracle/svg-conformance/render-fixture-sequence.ts`)

Add `registerNestedDiagramRenderers((s) => renderSync(s, { measurer }))`, as
in `render-fixture-activity.ts:121` and `src/index.ts:317`. This adds 3 rows
to zero.

The harness mirrors `index.ts`, so this is a harness gap, not a divergence.
T6d should own it, or T6b if it reaches K.

### 6.4 Core

The probe used core unchanged: no file under `src/core` differs. Plain-text
parity needs no core edit.

These additive needs come next:
1. **Participant head with a stereotype as ONE block.** This fixes the M rule
   that spans the participant box. Core `DisplayCreole.createStereotype`
   always throws (blocked on `CircledCharacter`). It needs either an exported
   `getCreole` (additive) or a non-throwing stereotype arm. Sequence already
   draws the badge itself (`badgeFor`/`charBadgeFor`). The probe kept heads
   one block per row. I did not check that `CreoleParser.ts:363` lays out a
   `Stereotype` element correctly inside one block.
2. **SAX sprite parser** (`svg/parser/SvgSpriteParserFactory.java`). This is
   outside T6b and covers about 30 residual A rows. It should be a tracked
   mission, not a T6b item.
3. **Do not change `MeasurerStringBounder`** for this. Other engines share
   it, so a change there is not additive; give sequence its own bounder
   (§1.3).

## 7. Probe limitations

These do not affect the pinned verdict, because no pinned row draws a
non-text primitive.

- **Raw shapes are drawn unscaled.** The x/y is scaled but the shape is not,
  so a `scale`/dpi fixture with vector atoms reads pessimistic.
- **Gradient defs.** Raw-shape defs are forwarded, but no row produced any
  (A1).
- **Sprite text loses fields.** `UText` inside sprites goes through the
  `TextRun` shape and drops weight 900 and decoration.
- **Participant heads stay per row** (§6.4.1).

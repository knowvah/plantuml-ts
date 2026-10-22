# T5b diagnosis: note x, create / divider / ref, delay / space Y

Measured at the B4 close (`465c4dd30`; the worktree classify reproduces
`b4-classify.json` exactly: 0 mismatches, Σ 40745, 800 zero). Every mechanism
below was proved with an env-gated counterfactual probe in this worktree and a
full `classify.mts` run. All probe edits were reverted, and
`git diff --stat src tests` is empty.

**Combined counterfactual (all 13 probes on):** zero 800 → **842**,
Σ 40745 → **27924**, 11 rows fell, **0 pinned rows lost**, 1 riser (nojata
47 → 48, an alignment artifact; see N2).

## Cluster membership (re-derived)

Lifeline-match test: every `<g><title>` lifeline `x1` in ours equals the
jar's within 0.002. 156 of 338 non-zero rows pass.

- **C1, note x (31 rows):** the lifelines match, the source has a note, and
  there is at least one X-axis diff. **14 go to zero** under N1–N5, D2 and D3,
  and 5 fall. The rest are out of family (see Unexplained).
- **C2, create / divider / ref / exo (16 rows):** the lifelines match, the
  row is not in C1, and the source has a divider, create, ref or exo plus an
  X diff. D1–D4 and W1 take **10 to zero**.
  - The "create" label does not describe a mechanism. baxuxa, vekami and
    gabisi are W1. furara and gacujo are N2.
- **C3, delay / space Y (12 rows):** S1, D2, D3 and N4 take **6 to zero**.
  - Research C's camuxi and xinope are **not** delay/space: they are
    `<math>` (the permanent divergence) and an `<img>` load failure. This
    contradicts research-c-vertical.md's "Unexplained remainder".

## N1: note padding reads `<style>` HorizontalAlignment; upstream reads only the skinparam

- **Mechanism.** The port picks the note's 6/15 vs 15/15 text padding (and
  `position`) from the theme bucket. A `<style> note { HorizontalAlignment }`
  block also writes that bucket. Upstream takes the padding from
  `skinparam noteTextAlignment` / `defaultTextAlignment` (the legacy params
  map) only. The `<style>` value aligns lines inside the block and nothing
  else.
- **Origin.**
  - `src/diagrams/sequence/sequence-layout-note.ts:97-101` (`noteAlignment`
    reads `theme.colors.elements.note.horizontalAlignment`). It is used for
    both `notePadding` (`:193`) and `noteBodyRuns` (`:185`).
  - The bucket is also filled by `src/core/style-map-element.ts:259-261`.
- **Upstream.**
  - `Rose.java:110`:
    `textAlign = param.getHorizontalAlignment(AlignmentParam.noteTextAlignment, null, false, null)`.
  - `SkinParam.java:682`: `value = getValue(param.name())`, the params map.
  - `SkinParam.java:731-732`: `getValue("defaulttextalignment")`.
  - `ComponentRoseNote.java:68-70`:
    `textAlignment == CENTER ? topRightBottomLeft(5, 15, 5, 15) : topRightBottomLeft(5, 15, 5, 6)`.
  - Line alignment is `AbstractComponent.java:133-134`
    `return style.getHorizontalAlignment()`.
- **Causal chain.** On duniti, `<style> note { HorizontalAlignment center }`
  gives left padding 15, so the note is 9 px wider (258 vs 249) and the text
  x is +9. The jar keeps padding 6 and centres the lines inside the block
  (195.606 = 120.206 + (228.069 − 77.269) / 2).
- **Ruled out.**
  - Font or measurement: the textLength values are identical.
  - Participant x: the lifelines match.
  - The probe (padding and `position` from the skinparam only, lines from the
    note Style) took dedigi and duniti to 0 with 0 risers.
- **Rows.** dedigi-45-zusi003 (1 → 0), duniti-51-pole084 (11 → 0).
- **Proposed fix.**
  - At parse end, record `state.style.params.getValue('noteTextAlignment')`,
    falling back to `defaulttextalignment`, on the AST. Precedent:
    `applyResponseMessageBelowArrow`, `parser.ts:442`.
  - `noteAlignment` reads that value for padding and position.
  - `noteBodyRuns` takes `noteStyle(...).getHorizontalAlignment()`.
  - Do not touch `style-map-element.ts`: class `EntityImageNote` reads the
    style value there.
  - Write-set is Task A.
- **Confidence.** HIGH.

## N2: multi-line note bodies are built from trimmed, non-blank lines; upstream keeps raw lines

- **Mechanism.** Each body line of a multi-line note is the dispatch loop's
  trimmed line. The non-blank filter drops empty lines. Upstream keeps the
  raw `BlocLines` and only strips the common leading indentation
  (`removeEmptyColumns`). Relative indentation, trailing spaces and blank
  lines all survive into the creole block.
- **Origin.**
  - `src/diagrams/sequence/parser.ts:335`
    (`handlePendingNote(state, trimmedLines, i)`).
  - `parser.ts:258-260` (`trimNonBlank` filters blank lines).
  - `src/diagrams/sequence/command-note-factory.ts:240` emits without
    `removeEmptyColumns`. The ref body already does this right at
    `parser.ts:120-130`.
- **Upstream.**
  - `FactorySequenceNoteOnArrowCommand.java:200-202`:
    `lines = lines.subExtract(1, 1).expandsNewline(false); lines = lines.removeEmptyColumns(); final Display display = lines.toDisplay();`.
  - The same in `FactorySequenceNoteCommand.java:145-147`,
    `...OverSeveralCommand.java:219-221` and `...AcrossCommand.java:199-201`.
  - `BlocLines.java:234`.
- **Causal chain.**
  - Leading spaces: furara's `  zerzer` keeps its 2 spaces, so the jar's text
    x is +7.15 (2 × 3.575) and the note is 7 wider.
  - Trailing spaces: nunozo's `displayed</size> ` draws a `<text> </text>` and
    the note is 3 wider.
  - Blank lines: jafufe's jar draws an empty line at y=273.
- **Ruled out.**
  - Creole measuring: the textLength values are equal once the spaces are
    kept.
  - Trimming before `removeEmptyColumns` (the first probe): 3 rows fewer
    reached zero (cejoxe, gacujo, zizeca), so trailing spaces are kept
    upstream.
  - The probe kept `{{` lines raw. A trimmed `{{` line made cusete and dasutu
    rise. That was a probe artifact and was fixed in the second probe.
  - The blank-line half was not probed; its evidence is the jar text alone.
- **Rows.**
  - To zero: furara-28-sode432, vixapo-60-tuzu421, gacujo-48-leto751,
    cejoxe-28-zeba572, zizeca-16-cavi659.
  - Fell: kofuti 103 → 53, rudola 103 → 53, nunozo 99 → 49 (the remainder is
    the `<size:18>` line height, text family), rizove 72 → 70.
  - Riser: nojata 47 → 48. With N2, `foo();` lands on the jar's x=28.15. The
    +1 is index misalignment from a separate missing `<code>` creole block,
    which we draw as a literal `&lt;code>`.
- **Proposed fix.**
  - Feed `handlePendingNote` the raw source lines, blank lines included. Test
    the `end note` regex on the trimmed line, as now.
  - At `endNoteCommand`, apply `removeEmptyColumns` (from
    `remove-empty-columns.ts`) and do not trim.
  - Write-set is Task A.
- **Confidence.** HIGH (blank lines: MEDIUM, not probed).

## N3: a standalone note's level ignores an activate bound back to the previous message

- **Mechanism.** `noteLevel` uses the running prefix level. Upstream's
  `getLevelAt(note, IGNORE_FUTURE_DEACTIVATE)` adds every activate written
  after the note, skipping notes, that is bound to a message. That activate
  applies at the message, above the note. This is the masibi lead, and it is
  confirmed.
- **Origin.**
  - `src/diagrams/sequence/sequence-layout-note.ts:113`
    (`return activationLevel(ctx.activationStart, anchor)`).
  - `src/diagrams/sequence/sequence-live-events.ts:226`: the note is pushed
    without an `ofSource` entry, so the ported `LiveBoxes#noteLookahead`
    (`sequence-live-boxes.ts:198-210`) can never be reached for it.
- **Upstream.**
  - `NoteTile.java:160-162`:
    `final int level = livingSpace1.getLevelAt(this, EventsHistoryMode.IGNORE_FUTURE_DEACTIVATE); ... getPosC(...).addFixed(dx)`.
  - `LiveBoxes.java:184-204`, the `current instanceof Note` branch:
    `if (le.getParticipant() != p || le.getMessage() == null) continue; if (mode != IGNORE_FUTURE_ACTIVATE && le.isActivate()) level++;`.
- **Causal chain.** In `Bob->Alice: c3 / note right of Alice / activate Alice`
  the activate binds to c3. The jar's note x is posC + 5 and ours is posC:
  every note x is −5 (kocuso 86.163 vs 91.163; masibi 153 vs 158). The trace
  showed `N3 Alice 0 -> 1` on both rows.
- **Ruled out.**
  - Note width: the widths are equal and the shift is constant.
  - A lifeline shift: the lifelines match.
  - The `onMessage` branch: these are `NoteTile`s.
- **Rows.** kocuso-22-ciri203 (11 → 0), masibi-28-tidi862 (14 → 0). 0
  risers.
- **Proposed fix.**
  - `addNote` sets `b.ofSource.set(event, liveNote)`. A vmerged note shares
    the `Notes` entry.
  - `noteLevel`, for a non-`onMessage` RIGHT note:
    `live.boxes.get(anchor).getLevelAt(liveNote, 'IGNORE_FUTURE_DEACTIVATE')`.
  - The same lookup serves `NotesTile.java:162`.
  - Write-set is Task A.
- **Confidence.** HIGH.

## N4: notes on an exo arrow take the exo's forced side

- **Mechanism.** `AbstractMessage#addNote` rewrites every note on a
  `MessageExo`: FROM/TO_LEFT becomes RIGHT and FROM/TO_RIGHT becomes LEFT,
  whatever was written, top/bottom included. The port keeps the written side.
- **Origin.** `src/diagrams/sequence/sequence-layout-note.ts:461`
  (`position = owner.kind === 'messageExo' ? notes[0]!.position : note.position`).
- **Upstream.**
  - `AbstractMessage.java:224`:
    `note = note.withPosition(overrideNotePosition(note.getPosition()));`.
  - `MessageExo.java:62-69`:
    `if (type == FROM_LEFT || type == TO_LEFT) return NotePosition.RIGHT; if (type == FROM_RIGHT || type == TO_RIGHT) return NotePosition.LEFT;`.
  - Consumed at `TileBuilder.java:128-136`.
- **Causal chain.** xogota's `A ->]` + `note right`: the jar draws the note
  LEFT of A (x=15) and we draw it right of A (336.875). That one note is all
  of xogota's diff.
- **Ruled out.** The note anchor, width and level all match once the side is
  forced. The probe made 0 risers.
- **Rows.** xogota-37-pele078 (11 → 0), limajo-73-kife020 (83 → 0),
  pobasa-34-neza994 (102 → 0). Limajo and pobasa have lifeline diffs, so they
  overlap T5a.
- **Proposed fix.**
  - In `layoutNotesOnMessage`, derive the side from `owner.exoType`.
  - Drop the "top/bottom note 0 leaves every note undrawn" branch, because
    upstream overrides those to LEFT/RIGHT too.
  - Write-set is Task A.
- **Confidence.** HIGH.

## N5: a note after `ref` belongs to the Reference and is drawn beside it

- **Mechanism.** A `Reference` is an `EventWithNote`. Its left/right notes
  are drawn by `ReferenceTile` at the ref's own top:
  - right at `last`, left at `first − w`, left drawn first;
  - they widen `getMinX`/`getMaxX` and add no height.
  The port stops note ownership at any frame and stacks the note below as its
  own tile.
- **Origin.**
  - `src/diagrams/sequence/sequence-note-folding.ts:32`
    (`else if (event.kind === 'frame') owner = undefined`).
  - `src/diagrams/sequence/sequence-layout-ref.ts:140-141` draws no notes.
  - `sequence-layout-events.ts:299` (`placeStackedNote`).
- **Upstream.**
  - `Reference.java:166-171`: `addNote` accepts LEFT/RIGHT only.
  - `ReferenceTile.java:76-85`: `noteLeft` / `noteRight` (the last one wins).
  - `ReferenceTile.java:138-150`:
    `noteLeft.drawU(ug.apply(UTranslate.dx(first.getCurrentValue() - wn)), ...)`
    and `noteRight.drawU(ug.apply(UTranslate.dx(last.getCurrentValue())), ...)`.
  - `ReferenceTile.java:163-180` (`getMinX`/`getMaxX`).
  - `getPreferredHeight` is the component's only.
- **Causal chain.** On ficiru, ours adds the note height (33 = 23 + 2·5) to
  every later y, and puts the note at Bob's posC. The jar's note sits at
  `last + paddingX` (163.975 = 70.3 + 86.675 + 2 + 5), y = ref top + 5 (130).
- **Ruled out.**
  - The ref box geometry: there are no ref rect diffs.
  - Participant x: the lifelines match.
  - Draw order is the only residual in mupugi: it falls to 26, and those 26
    are the order. The jar draws left before right.
- **Rows.**
  - To zero: ficiru-65-geda551, gupuze-37-xelo563, jabise-46-luge773,
    rezoma-09-vixi307, xojavo-26-jezu088.
  - Fell: mupugi 115 → 26, which goes to 0 with left-then-right order.
  - rezoma, xojavo and mupugi overlap T5a.
- **Proposed fix.**
  - Fold left/right `onMessage` notes into a `ref` owner.
  - `handleRefEvent` draws the last left note, then the last right note, at
    the tile top, from `first`/`last = first + area`.
  - Feed the note extents to `minEventX` / `refContentRight` and to group
    clearance.
  - Write-set is Task B.
- **Confidence.** HIGH.

## N6: a note after a group `end` belongs to the GroupingLeaf and is drawn at the frame top

- **Mechanism.** The same as N5, but for `GroupingTile`:
  - right notes start at `max`, left notes at `min − w`;
  - they stack horizontally, at `getFrameY` + paddingY;
  - they widen `getMinX`/`getMaxX` and add no height.
- **Origin.** `src/diagrams/sequence/sequence-note-folding.ts:32`, and
  `sequence-layout-frame.ts:241` (`handleFrameEvent`) draws no end notes.
- **Upstream.**
  - `GroupingLeaf.java:123-128`.
  - `GroupingTile.java:275`: `drawNotes(ug.apply(UTranslate.dy(getFrameY())))`.
  - `GroupingTile.java:984-990`:
    `max.addFixed(EXTERNAL_MARGINX2 + getNotesWidth(..., RIGHT))`.
  - `GroupingTile.java:995-1012`, `1023-1040`.
- **Causal chain.** Measured on the susati jar:
  - frame right edge 124.512, note x 129.512 (+5);
  - frame y 51, note y 56;
  - ours stacks the note below the frame (+33 Y), so the width also differs
    (445 vs 549).
- **Ruled out.** This mechanism was identified from the Java and checked
  against jar numbers only; it was **not probed**.
- **Rows.** susati-64-lako047 (104), lirasa-26-tazo607 (322, lifelines
  differ, T5a overlap). Expected: susati falls hard; lirasa is unknown.
- **Proposed fix.** Task B. It collides with group clearance /
  `sequence-layout-frame-extent.ts` if a T5a fix touches the frame extent.
- **Confidence.** MEDIUM. Mechanism HIGH; the row movement is unmeasured.

## N7: note text ignores `wrapWidth` (style `MaximumWidth`)

- **Mechanism.** `ComponentRoseNote` builds its text block with
  `style.wrapWidth()`. The port never line-breaks a sequence note.
- **Origin.** `src/diagrams/sequence/sequence-layout-note.ts:185`: lines come
  only from `\n`, with no `LineBreakStrategy`.
- **Upstream.**
  - `ComponentRoseNote.java:67`: `super(style, style.wrapWidth(), ...)`.
  - `Style.java:330`.
- **Causal chain.** jafufe's `skinparam wrapWidth 50`: the jar wraps the note
  word by word (y 143 … 338). Ours draws one 300-px line, which moves the
  lifelines (+119) and the height (219 vs 401).
- **Ruled out.** Not probed: it needs creole line breaking. The evidence is
  the jar text runs plus the Java.
- **Rows.** jafufe-08-begu830 (189), xujavu-00-xodi798 (1105),
  zajova-30-sagu653 (413). All have lifeline diffs, so they belong to T5a's
  lifeline buckets.
- **Proposed fix.** Port `LineBreakStrategy` into the note's creole runs.
  This is a separate task. It collides with Task A on
  `sequence-layout-note.ts`, so sequence it after A.
- **Confidence.** MEDIUM. Mechanism HIGH; the movement is unmeasured.

## D1: a divider's `getMaxX` omits `xorigin`

- **Mechanism.** `DividerTile#getMaxX` is `xorigin + preferredWidth`. The port
  adds no origin term, so a long divider label widens the document 10 px less
  than the jar does.
- **Origin.** `src/diagrams/sequence/sequence-layout-width.ts:172`
  (`extent = geo.textWidth + DIVIDER_WIDTH_ALLOWANCE + RIGHT_MARGIN`).
- **Upstream.** `DividerTile.java:115-118`:
  `return xorigin.addFixed(dim.getWidth());`. It is maxed into the border at
  `PlayingSpace.java:92-95`.
- **Causal chain.** degire's width is 233 vs 243 (−10 = `originX`). The band
  and label then centre 5 px left.
- **Ruled out.** The text width is not the cause: the label textLength
  values are equal. The probe (`+ originX`) made 0 risers.
- **Rows.** degire-21-dujo330, vujiba-78-foga414, kipabe-50-guti652 and
  sisele-83-gebe678 go to 0. valiva 31 → 21, and 0 with D4.
- **Proposed fix.** Pass `originX` into `computeTotalWidth` (`layout.ts:147`)
  and add it in `dividerContentRight`. Write-set is Task C.
- **Confidence.** HIGH.

## D2 / D3: the divider and newpage band starts at `border1` (PlayingSpace min), not at the participant origin

- **Mechanism.** `DividerTile` and `NewpageTile` draw from `border1` =
  `PlayingSpace.min`, which takes the min over xorigin, the dolls, and every
  tile's `getMinX`. The body is translated by `dx(-min1)` with the same min,
  so the band always starts at the left margin.
- **The port's assumption is wrong.** The port uses `originX`, which is pushed
  right by any left overhang (a left note, an exo, a frame).
  The `layout.ts:379-391` comment claiming "originX, not LEFT_MARGIN" is
  contradicted by zetenu.
- **Origin.** `src/diagrams/sequence/layout.ts:393-394` (divider) and
  `:420-421` (newpage).
- **Upstream.**
  - `DividerTile.java:92-95`:
    `Area.create(getBorder2() - getBorder1() - xorigin.getCurrentValue(), ...); ug.apply(UTranslate.dx(getBorder1()))`.
  - `NewpageTile.java:97-99`.
  - `PlayingSpace.java:318-320`: `getBorder1() { return min.getCurrentValue(); }`.
  - `SequenceDiagramFileMakerTeoz.java:82,141-142`: `min1 = body.getMinX(...)`
    and `UTranslate.dx(-min1...)`.
- **Causal chain.** zetenu has a left note: ours draws the band at 108.387,
  196.587 wide; the jar draws it at 10, 294.975 wide.
  - zudize's Σ 10440 is entirely this band offset, carried through all its
    pages.
  - digula, a title-centred case, still matches: the title shift is applied
    later.
- **Ruled out.**
  - The width formula: the band right edge is equal.
  - The newpage/divider label: the textLength values are equal.
  - The probe (`bandX = LEFT_MARGIN`, `width = totalWidth − LEFT_MARGIN −
    RIGHT_MARGIN`) made 0 risers across 1141 rows.
- **Rows.**
  - D2 to zero: zetenu-41-rece091, dakeve-06-cici445, lipuci-81-vovi162,
    zudize-61-vomi445 (10440).
  - D2 fell: lokavu 384 → 354, lugika 185 → 167, xezipe 195 → 189,
    dugeki, tukobo.
  - D3 to zero: fobube-11-nifo424, giloko-85-gapa789, luzapi-49-rati107.
- **Proposed fix.** In both backfills, set `bandX = LEFT_MARGIN` and
  `bandWidth = totalWidth − LEFT_MARGIN − RIGHT_MARGIN`. Update the doc
  comment. Write-set is Task C.
- **Confidence.** HIGH.

## D4: an empty divider (`====`) measures one text line; upstream measures none

- **Mechanism.** For a label of `""`, `AbstractTextualComponent` builds a
  `TextBlockEmpty` (height 0). The preferred height is therefore
  0 + 8 + 20 = 28, while the port counts one 13-px line and gets 41.
- **Origin.** `src/diagrams/sequence/sequence-layout-divider.ts:88`
  (`blockHeight = lines.length * lineHeight`).
- **Upstream.**
  - `AbstractTextualComponent.java:86-87`:
    `if (display.size() == 1 && display.get(0).length() == 0) textBlock = new TextBlockEmpty();`.
  - `ComponentRoseDivider.java:129-131`: `getTextHeight + 20`.
  - `ComponentRoseDivider.java:76`: `empty` (the label box is not drawn).
- **Causal chain.** valiva: every y after the `====` is +13. Jar separator
  y = 129 = tile top 115 + 28/2.
- **Ruled out.**
  - The separator geometry: the x values and the 3-px band are equal.
  - The probe made 0 risers.
- **Rows.** TeozTimelineIssues_0007_Test (95 → 0), matoke-25-kidu719
  (95 → 0), valiva (with D1) → 0.
- **Proposed fix.** For a single empty line, set `blockHeight = 0`. The
  width then follows: `textWidth = 8`. Write-set is Task C.
- **Confidence.** HIGH.

## S1: bare `|||` is 5 px; upstream is 25

- **Mechanism.** `CommandHSpace` with no value calls `diagram.hspace()`,
  which is `new HSpace(25)`. The port defaults to 5. Its own doc comment
  noted the mismatch and left it unfixed.
- **Origin.** `src/diagrams/sequence/command-misc.ts:169`.
- **Upstream.**
  - `CommandHSpace.java:82-87`:
    `if (StringUtils.isNotEmpty(size)) diagram.hspace(Integer.parseInt(size)); else diagram.hspace();`.
  - `SequenceDiagram.java:278-280`: `events.add(new HSpace(25));`.
  - `HSpaceTile.java:72-75`.
- **Causal chain.** xucibo: everything after the `|||` is +20 (25 − 5). The
  `||50||` is already right.
- **Ruled out.** The `||N||` path, which is explicit and correct. The probe
  made 0 risers.
- **Rows.** xucibo-16-zisi974 (38 → 0), caxali-40-cotu420 (16 → 0); dugeki
  falls.
- **Proposed fix.** Default to 25 (`SequenceDiagram.java:279`). Write-set:
  `command-misc.ts` (Task D).
- **Confidence.** HIGH.

## R1: the `ref` component width measures raw markup, not the creole block

- **Mechanism.** `refComponentWidth` measures each body line string as plain
  text, so `[[link{tooltip}]]` and `[[url label]]` count their full markup.
  Upstream's `getTextWidth` is the creole text block's
  `calculateDimension`.
- **Origin.** `src/diagrams/sequence/ref-body-geo.ts:127`
  (`measurer.measure(l, spec).width`).
- **Upstream.**
  - `ComponentRoseReference.java:156-158`:
    `Math.max(getTextWidth(sb), getHeaderWidth(sb)) + xMargin * 2 + deltaShadow`.
  - `AbstractTextualComponent.java:100-108`
    (`getPureTextWidth = textBlock.calculateDimension(...).getWidth()`).
- **Causal chain.** sefako's `ref over A : [[link{link with tooltip}]]`: ours
  is 125.3 wide, the jar is 60.113 (the header width wins). The body text
  then centres 32.6 px right.
- **Ruled out.** The ref header and the runs: the run textLength values are
  equal. The probe (max over the `sequenceCreoleRuns` extents) made 0
  risers.
- **Rows.** sefako-72-jono850 (13 → 0), cikoca-19-feji527 (81 → 0),
  cusiro-03-mebe823 (93 → 0), losefo-71-dovi176 (82 → 0). The last three
  overlap T5a (lifeline diffs).
- **Proposed fix.** Measure the creole runs that `bodyRuns` already builds.
  Write-set: `ref-body-geo.ts` (Task E).
- **Confidence.** HIGH.

## W1: the sequence engine has no warning banner (the `skinparam ParticipantPadding` deprecation)

- **Mechanism.** `CommandSkinParam` adds a warning for `ParticipantPadding`
  (and `padding`). `DiagramChromeFactory` stacks a banner above the body.
  The activity, mindmap, wbs and salt engines port this; sequence does not.
- **Origin.**
  - `src/diagrams/sequence/index.ts:36-48`: parse and render carry no
    warnings.
  - The harness mirror is
    `tests/oracle/svg-conformance/render-fixture-sequence.ts:118`.
- **Upstream.**
  - `CommandSkinParam.java:95-96`:
    `if ("ParticipantPadding".equalsIgnoreCase(name)) diagram.addWarning(new Warning("Please use CSS style instead of skinparam ParticipantPadding"));`.
  - `DiagramChromeFactory.java:127-128`: `result = addWarnings(result, warnings);`.
- **Causal chain.** baxuxa, vekami and gabisi: the jar is +20 y everywhere
  and 308 wide (the banner); ours has no banner.
- **Ruled out.** `create`: the create-specific geometry is equal once the
  banner is added. The probe (`withWarningBanner` from `activity-warnings.ts`
  at `SEQUENCE_DOCUMENT_MARGIN`, in the harness only) made 0 risers.
- **Rows.**
  - To zero: baxuxa-14-puvo950, vekami-41-sane093, gabisi-10-male675,
    lokavu-60-peku948 (with D2), lugika-07-rozo911 (with D2).
  - Fell: kumovo 132 → 115, zajova 413 → 368, zogane 308 → 288.
  - 8 rows carry the banner.
- **Proposed fix.**
  - Collect the skinparam warnings at plugin parse, as
    `withSkinParamWarnings` does.
  - Render with `withWarningBanner` before the annotation chrome, in both
    `index.ts` and the harness (memory: the conformance harness mirrors
    `index.ts`).
  - Write-set is Task F.
- **Confidence.** HIGH.

## Unexplained (out of T5b's families; what was instrumented, what to instrument next)

Each row was element-diffed with every probe on.

| Rows | Observed (instrumented) | Owner / next instrument |
|---|---|---|
| nunozo, kofuti, rudola (residuals 49 / 53 / 53) | `<size:18>` row: jar baseline +5 (line height of the tallest atom); kofuti/rudola also `scale 2` lifeline rect width 8 vs 16 | creole line height (research-a, text) + scale chrome |
| nojata (48) | `<code>` creole block not ported; we draw `&lt;code>` literally | creole `<code>` atom |
| nibiju (104) | creole `--` / `==title==` separators inside a note drawn literally | creole horizontal-line atoms |
| lezonu, rizove, dasutu, cusete | `{{ }}` embedded diagram in a note: childCount differs | embedded-diagram oracle seam |
| popoda (44) | `!definelong` macro note: jar drops `<b>ALARM:</b> <&flag>` | preprocessor `!definelong` body |
| todetu (100) | `skinparam stereotypePosition bottom` participant text order | participant stereotype |
| raxeca, sulipe (10) | `scale 1000 width` lifeline rect width + tooltip `\n` | scale chrome / url tooltip |
| xezipe (189), putuku (363), tatesu (656) | monochrome paint, `<sub>` line height, `maxMessageSize`, many mixed | message / text families; re-measure after A–F |
| caluni (52), bakuba (153), SequenceArrows_0001/0002 (280) | arrow decoration / self-arrow end geometry (x ±5, stroke width) | message-arrow family |
| camuxi (25) | `<math>`: permanent divergence (KaTeX) | DIVERGENCES (latex/math) |
| xinope (17) | `<img /dev/stdout>` failure block: jar is 1 px taller | image-error text block |
| dolefo (184) | `scale 3.0` title / lifeline scaling | scale chrome |
| peduzi (1), vucomo (63) | `skinparam lengthAdjust`: `@lengthAdjust` / `@textLength` attributes | paint / attribute emission |

No C1–C3 cluster of more than 10 rows is left without a named mechanism.

## Proposed fix tasks (file-disjoint unless called out)

| Task | Mechanisms | Write-set | Expected |
|---|---|---|---|
| A, note text / level / side | N1, N2, N3, N4 | `parser.ts`, `ast.ts` (or `ast-note.ts`), `command-note-factory.ts`, `sequence-layout-note.ts`, `sequence-live-events.ts` | 12 to 0 (dedigi, duniti, furara, vixapo, gacujo, cejoxe, zizeca, kocuso, masibi, xogota, limajo, pobasa); 4 fall; nojata +1 explained |
| B, frame-owned notes | N5, N6 | `sequence-note-folding.ts`, `sequence-layout-ref.ts`, `sequence-layout-frame.ts`, `layout.ts` (`minEventX`) / `sequence-layout-width.ts` (`refContentRight`, `groupContentRight`), an exported emitter in `sequence-layout-note.ts` | 5 to 0 + mupugi to 0; susati falls. **Collides with A** on `sequence-layout-note.ts` and **with C** on `layout.ts` / `sequence-layout-width.ts`: run after A and C, or merge B into C |
| C, divider / newpage band | D1, D2, D3, D4 | `layout.ts`, `sequence-layout-width.ts`, `sequence-layout-divider.ts` | 14 to 0 (degire, vujiba, kipabe, sisele, valiva, zetenu, dakeve, lipuci, zudize, fobube, giloko, luzapi, TeozTimeline_0007, matoke); Σ −10.6k. **Possible collision with T5a** if its fix touches `layout.ts` or `sequence-layout-width.ts` |
| D, hspace default | S1 | `command-misc.ts` | xucibo, caxali to 0 |
| E, ref width | R1 | `ref-body-geo.ts` | sefako, cikoca, cusiro, losefo to 0 |
| F, warning banner | W1 | `src/diagrams/sequence/index.ts`, `tests/oracle/svg-conformance/render-fixture-sequence.ts` (+ an AST `warnings` field: **collides with A on `ast.ts`** unless F keeps warnings off the AST, as activity's plugin `parse` does) | baxuxa, vekami, gabisi to 0 (lokavu, lugika with C); kumovo, zajova, zogane fall |
| G, note wrap | N7 | `sequence-layout-note.ts`, creole line breaking | jafufe, xujavu, zajova (unmeasured); after A |

Measured with all of A + B(N5) + C + D + E + F probes on: zero 800 → 842,
Σ 40745 → 27924, 0 pinned rows lost, 1 explained riser (nojata).

Scratch instruments (session scratchpad, not committed):
`/private/tmp/claude-501/-Users-scottseely-git-knowvah-plantuml-ts/303eb6e3-f3cf-4737-80a1-e4f9d9cbec55/scratchpad/t5b/`

- `cluster.mts`: lifeline-match and per-diff dump.
- `ax.py`: axis split.
- `delta.py`: classify delta.
- `*.json`: per-probe classify outputs.

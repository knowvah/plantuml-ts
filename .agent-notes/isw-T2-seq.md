# isw-T2-seq report

Branch isw/T2-seq. Commits (oldest first): F2 trim-then-measure (786f9e1d6), F3 divider greedy
(3343d91c3), F4 ref body (d1d699931; also carries the parser.test.ts divider expectations that
belong to F3), F5 autonumber span, X note int cast, F1 measurer injection, test re-pin.

## Families (Java -> ours)
- F2: DriverTextSvg.java:113-126 -> TextRun gains drawWidth/drawDx (text-block-geo.ts), built by
  run-draw-metrics.ts#runDrawMetrics (uses core driverTextPlacement) at the two producers
  (textBlockRuns text-block-geo.ts, textAtomRuns sequence-creole-text-atom.ts); renderers emit
  drawnLeftX/drawnWidth (renderer.ts x2, renderer-message.ts, renderer-frame-header.ts,
  renderer-participant-shapes.ts); scale-geo.ts#scaleRun scales both. Layout advance textWidth unchanged.
  Visible: every run with a leading/trailing space (creole atom boundaries, delay/ref/divider/participant
  labels, mono "" runs): textLength = trimmed width, x += leading-space widths.
- F3: CommandDivider.java:57-62 -> command-misc.ts dividerCommand `(.*)`. Visible: divider label keeps
  trailing spaces before `==`; box one space wider.
- F4: CommandReferenceOverSeveral.java:125,132 / CommandReferenceMultilinesOverSeveral.java:142 ->
  ref-body-geo.ts#refBodyLines no per-line trim; parser.ts#handlePendingRef accumulates RAW lines and applies
  BlocLines.removeEmptyColumns (BlocLines.java:234-263) at `end ref` (new remove-empty-columns.ts, a copy of the
  private core/annotations/commands.ts one; hoist to core when convenient). Visible: ref body inner spaces /
  relative indent kept.
- F5: Display.java:703-712 + ComponentRoseArrow#getPreferredWidth -> sequence-layout-participants.ts#scanMessageLabels
  adds number width + MESSAGE_NUMBER_MARGIN. numberTextOf / MESSAGE_NUMBER_MARGIN now exported from
  text-block-geo.ts and shared by layout-message and layout-exo (two copies deleted). Visible: participant gap
  widens when a pair message is autonumbered.
- X: ComponentRoseNote.java:109,115,118 (+NoteBox/Hexagonal :91,97) -> sequence-layout-events.ts#handleNoteEvent
  noteGeo.width = Math.trunc(...). Visible: note polygon width integral. Layout positions untouched.
- F1: renderer-participant-symbol.ts no longer builds WidthTableMeasurer. measureParticipantSymbol(type, theme,
  measurer, shadow) / symbolPreferredWidth/Height take layout's measurer. DRAW path holds none (plugin
  render(geo, theme) is handed none, D1) and no glyph draws text: it now gets a measurer that THROWS if
  consulted (never triggered across 1141 rows). The user ruling "inject the render's measurer" cannot be met on
  the draw side without changing the plugin render signature (src/core/dispatcher.ts, not mine). Inert for scores.

## Scores (seq-scores.mts, all 1141 rows, vs b0-seq.json)
- Owed 127: 119 exactly at pin, 7 below, 1 above.
- ABOVE pin: mezaxa-44-siju322 79 -> 81 (b1 was 81 too). Mechanism: jar canvas 286 vs ours 285. NoteTile#getMaxX
  (NoteTile.java:289-296) = x + (textWidth + 2*paddingX), textWidth = block + 6 + 15 (ComponentRoseNote.java:70-72
  default left alignment, NOT our 10+10), feeds the right extent; our computeTotalWidth (layout.ts:373) has no note
  term and note padding is 10/10 for every style (jar: note 6/15, rnote/NoteBox 4/4 :58, hnote/Hexagonal 12/12 :58).
  I tried per-note padding 6/15: moved 80 rows down but 8 UP (incl owed lidupe) because left/right/over note
  positions are tuned against 10/10 (jar polygon x = posC - textWidth - 5 left, posC + level*5 + 5 right); reverted.
  Needs a note-fidelity mission: padding per style, positions per NoteTile#getX, note term in total width.
  Orchestrator: keep mezaxa pinned at 79? It cannot pass; re-pin to 81 or fund that mission.
- Below pin, owed (tighten): busexe-78-ruzu110 353->349, camebe-75-mujo573 396->392, diruxe-35-xujo142 482->468,
  liluca-64-muva178 51->14, mitefi-27-cubo687 668->511, mivuke-79-fujo526 41->14, peduzi-80-giki495 669->512.
- Below pin, not owed (tighten): TeozTimelineIssues_0002_Test 220->145, bexoce-95-vibe195 220->145,
  boguvi-37-ralo631 79->34, bopizu-70-rese737 117->40, felasa-37-jovu259 92->82, gepuce-64-pivu656 261->259,
  gutate-63-kane985 54->22, jafufe-08-begu830 223->203, jujigi-41-zodo151 109->77, luxiti-90-beca090 32->17,
  mapeji-83-sebu002 220->145, mobobu-53-vita034 54->22, nexuxi-32-gici059 417->412, porulu-24-ciga586 25->8,
  sameli-92-dape565 117->40, suneke-72-kexi504 103->97, taboza-78-vali232 129->124, tefunu-89-zece967 103->97,
  texopo-01-dibi658 120->69, tixune-73-xoca786 33->14, tugaju-41-dovi584 103->97, vetuvo-45-gaku910 24->11,
  vucomo-53-gicu658 731->574, vuniba-19-repo187 107->93, xacete-63-neke615 48->47, xujavu-00-xodi798 1122->1112,
  zicadi-21-koje636 905->900, ziloke-42-lodi019 84->34.
- 13 rows error (syntax refusal) both at b0 and now: bomino-39-tipo216 dolice-60-copi767 fojomu-60-cuda302
  fonudu-70-coma124 jiliba-03-lapi286 junide-55-soka558 ladiro-50-gume805 nidozi-08-daxa280 nizuzi-32-babe798
  nuvoja-46-dezu541 tegasu-93-fima016 vubato-50-gebu534 zoturo-25-jima978 (pre-existing).

## Tests updated (new-jar source)
- annotation-text-placement: `1. right` 39.65, `3. left` 31.688 (bocusa-16-ciju126/in.svg), divider 180.863
  (degire-21-dujo330/in.svg). KNOWN NON-JAR: the moxope-92-roco972 note box assertion pins OUR integral 44-wide
  box; jar box is 86.163..131.163 = 45 (6/15 padding) at a different origin (note-fidelity gap above).
- frame-text-placement: Foo2 x = url x + 121.275 + 3.3 (cikoca-19-feji527/in.svg x=140.575).
- message-label-placement: x list [39.225,72.069,82.875,111.069] from a fresh one-JVM jar render, fixture
  tests/fixtures/isw-T2-seq/message-label-creole.{puml,svg}.
- participant-label-placement: 63.088 / 70.088 / 84.088 and kofuti advances 48.3+7.7 (kofuti-29-goti188/in.svg).
- text-block-geo-metrics: advances [10.806,24.619,31.119], mono 25.594 + new drawWidth/drawDx assertions.
- vertical-terms: 196.156 / 187.625 (lenamo-57-fano574/in.svg).
- command-misc.test.ts, parser.test.ts divider expectations: label keeps trailing space (Java regex, no jar needed).
- renderer-participant-symbol.test.ts: passes DeterministicMeasurer.
- New: run-draw-metrics.test.ts, autonumber-span.test.ts.
- unwind2-s4-delay-jar delay-text now green; delay-newpage still red = stale unwind2-S4/delay-newpage_001.svg
  (orchestrator re-capture; fresh render gives 80.713/17.716 == ours).

## For the orchestrator
- `npm run catalog` (docs/catalog.md drift: new modules run-draw-metrics.ts, remove-empty-columns.ts).
- Re-pin sequence baseline per the lists above; regenerate oracle/goldens/svg-sequence/diff-census.json
  (sequence-diff-census test is stale-record only).
- Not mine: raw float sums (x="53.32500219345093", y="12.777999999999999") come from the title/header chrome
  after renderSequence (renderSequence body is clean, verified): src/core/assemble-svg.ts chrome shift must
  format through svg-format.fmt like SvgGraphics#format. Not a ratchet diff (tolerance 0.01).
- The ratchet gate message is "ROSE" only for mezaxa.

# isw-T2b-seq report

Branch isw/T2b-seq. Commits: 93a5c0029 (render measurer seam), d7f47d7c3 (note tile port), + this report.

## 1. Draw-side measurer (F1)
- Java: n/a (port plumbing). Ours: `DiagramPlugin.render(geo, theme, measurer?)` and `PaginatedPlugin.renderPage(geo, theme, i, measurer?)`
  (src/core/dispatcher.ts); `src/index.ts#assemblePagesUnscoped` passes `ctx.measurer`. Other engines' plugins ignore the optional arg: output unchanged.
- Sequence: `sequencePlugin.render/renderPage` require it (throws if absent); `renderSequence/renderSequencePage(…, measurer)`;
  the measurer rides on `ScaledTheme.measurer` (scale-geo.ts, same reason `scaleK` does: every draw function already takes the theme);
  `renderer-participant-symbol.ts` builds its `DriverStringBounder`/`UGraphicSvg` from `opts.theme.measurer`. Throwing stand-in `UNCONSULTED` deleted.
- Outside the write-set (one argument): tests/oracle/svg-conformance/render-fixture-sequence.ts:106 `renderSequence(geo, theme, measurer)` (needed to keep typecheck; the harness already holds `measurer`).
- Tests: render-measurer-seam.test.ts; updated callers in renderer.test.ts, newpage-separator.test.ts, renderer-participant-symbol.test.ts, renderer-frame-header.test.ts, renderer-lifeline.test.ts, sequence-delay.test.ts.
- Production-visible: none.

## 2. Note fidelity
Teoz is the only path (GlobalConfig.java:47 FORCE_TEOZ; SequenceDiagram.java:318).
- Padding/inset: ComponentRoseNote.java:66-70 `(5,15,5,6)` / `(5,15,5,15)` when text alignment CENTER; ComponentRoseNoteBox.java:58 `(4,4,4,4)`; ComponentRoseNoteHexagonal.java:58 `(4,12,4,12)`;
  getPaddingX/Y = 5 (Rose.java:65-66, NoteBox:73, Hexagonal:73); getPreferredWidth = textWidth + 2*5 (+shadow for `note`) (Note.java:83-87); box drawn `(int)` wide/tall (Note.java:104-115) at tile x + 5 (AbstractComponent.java:140-143).
  Ours: src/diagrams/sequence/sequence-note-tile.ts (pure) + sequence-layout-note.ts (handler; moved out of sequence-layout-events.ts).
- NoteTile#getX (NoteTile.java:155-173), getUsedWidth (:140-153), getMinX/getMaxX (:278-296): ours `noteTile`. `right` adds `level * LIVE_DELTA_SIZE`.
- Document extent: `NoteGeo.minX/maxX` (geo-annotation.ts, scaled in scale-geo.ts). layout.ts `minEventX` uses `minX` (origin shift); `computeTotalWidth` adds `noteContentRight + RIGHT_MARGIN`.
- MECHANISM FOUND beyond the brief: for `note over A, B` the min/max Reals are built in PlayingSpace's constructor (PlayingSpace.java:94-95) BEFORE xorigin.compileNow (SequenceDiagramFileMakerTeoz.java:112), so
  getUsedWidth (reads posB/posD `getCurrentValue()`) sees participants at their initial values (xcurrent = posD.addAtLeast(0), :96 => head widths laid end to end) and that stale width is baked into
  `getX().addFixed(-width/2)` / `.addFixed(width)`. The DRAW (NoteTile.drawU:127-138) re-reads after the solve. Ours: `initialSpan` in sequence-note-tile.ts. Evidence: tests/fixtures/isw-T2b-seq/note-stale-span.* (jar head at x=62.509, note box at x=10).
- Text alignment (noteTextAlignment / defaulttextalignment, SkinParam.java:722-727): note padding left 15 + centred stripes (SheetBlock1) + `position` arms of Note.java:128-136; OVER_SEVERAL forces CENTER unless skin set (Rose.java:100-112).
- Group frame: GroupingTile.java:204-207 folds every child tile's min/max into the frame; `computeFrameBody` now includes notes inside the group (`groupNoteExtents`). (Non-note children still use participant bounds, the prior simplification.)
  This was needed: without it nesuva-86-fuki568 rose 200 -> 209 (note tile became the leftmost thing, shifting the origin 0.116 and un-matching frame x=13).
- Notes written under a message are NOT NoteTile: TileBuilder.java:121-137 wraps the message in CommunicationTileNote{Left,Right,Top,Bottom} / SelfNote*. New `NoteEvent.onMessage` (set by command-note-factory.ts#noteOnArrowCommand).
  `left`/`right`: CommunicationTileNoteLeft.java:100 / ...Right.java:103-110 (posC - width; posC + level*5) with the level of getLevelAt(msg, IGNORE_FUTURE_DEACTIVATE): new `ctx.lastMessageLevels` recorded in handleMessageEvent via `liveLevelAt`.
  `top`/`bottom`: kept on the previous placement (`legacyOverTile`, 10 either side of the two lifelines), NOT ported: CommunicationTileNoteTop/Bottom stack vertically and draw a dashed connector (BottomTopAbstract.java:98-162). They use ComponentType.NOTE always (:92) so padding is `note`'s.
- Fixtures (jar, one JVM each, seam #4): note-{note,rnote,hnote} (left/right/over single/several x 3 styles, multiline), note-level (right/left under nested activations), note-wide, note-align (noteTextAlignment center),
  note-span-{short,wide,later}, note-stale-span. Test: note-tile-jar.test.ts (note bboxes, all text x/y, head x, canvas — equal to the jar at 3 decimals), note-tile-units.test.ts (padding table, onMessage arms).
- Test expectation changed: annotation-text-placement.test.ts moxope note box -> 86.163..131.163 x 85..108 (moxope-92-roco972/in.svg polygon vertices, same box); removed the "KNOWN OPEN" comment.
- Dead code removed: `drawnLess` from `noteShadowGeometry`; handleNoteEvent/computeNotePosition/buildNoteGeo/noteBodyRuns/NOTE_PADDING_Y from sequence-layout-events.ts.

## Scores (seq-scores.mts, all 1141 rows; final = /private/tmp/claude-501/isw-T2b-seq/final-seq-scores.json)
- ROWS ABOVE b0 PIN: none. Rows that rose vs b2a: none. mezaxa-44-siju322: b0 79, b2a 81, now 74 (the 2 width entries cleared; rest is the `&` parallel gap, rx/ry/stroke-width on `note`).
- Sum 303373 -> 150933 (zudize-61-vomi445 203346 -> 55923 dominates). 13 error rows unchanged.
- Rows below b2a (tighten; slug:b2a->now): see the list at the end of this file.
- Intermediate stops I hit and resolved: a first port raised 20 rows above b0 (message-attached top/bottom notes, centre-aligned notes, stale span); each explained above and fixed, none left.

## Production-visible changes (rule 15)
- Every sequence note: box x/width/height, text x/y, per style (note 6+15, rnote 4/4, hnote 12/12; rnote/hnote 4 vs 5 vertical padding => 2px shorter, tile advance 2px shorter).
- `note right of X`: offset is now `level*5 + 5` (was flat 10) — differs from before at level 0 and >= 2. `note left of X`: right edge now 5 from the lifeline (was 10).
- `note over X`: unchanged centre; width +1 (21 vs 20 padding).
- `note over A, B`: box now spans posB1+5 .. posD2-5 at least (was lifeline1-10 .. lifeline2+10), widened by the note text when wider; text centred when the box is wider than the text.
- Canvas width grows when a note reaches past the last participant; origin shifts right when a note overhangs left (tile, 5 beyond the box).
- Group frames widen to contain the notes inside them.
- `skinparam noteTextAlignment|defaulttextalignment center|right`: note padding/stripes now follow.
- Nothing else changed: other engines' output identical (plugin arg is additive).

## Not done / owned elsewhere (each with mechanism)
1. Note outline vertex ORDER and fold: jar emits `M x,y L x,y2 L .. L ..,y` (open path, 6 points) where ours emits `M.. Z` — `noteBox` helper (core) — plus `rnote` = `<rect>` in both but `hnote` is a `<polygon>` in the jar (ComponentRoseNoteHexagonal.java:96-108) and a `<rect>` here (weight-15 diff per hnote). Shape port, separate.
2. CommunicationTileNoteTop/Bottom, CommunicationTileSelfNote{Left,Right}, exo notes: still on legacy/approximate placement (listed above). Parser anchors `note left/right` after a message on from/to without the `reverse` swap (TileBuilder.java:129-135; command-arrow.ts:474-475) — wrong for right-to-left arrows.
3. `NotesTile` (`/ note ...` vmerge, NotesTile.java:119-162): side-by-side stacking by `getStackingOffset` not modelled; they go through NoteTile arithmetic individually.
4. `groupNoteExtents` measures a `right` note's level at frame entry (not at its place in the walk), affecting only its maxX; non-note children (messages) still do not drive the frame bounds.
5. docs/catalog.md drift: `npm run catalog` (new modules sequence-note-tile.ts, sequence-layout-note.ts).
6. tests/unit/stdlib-packages.test.ts "stdlib-all ships a LICENSE" fails in this worktree (npm pack environment; unrelated, not run in a clean tree).

## For the orchestrator
- Re-pin the sequence baseline from final-seq-scores.json (every changed row is a decrease; no pin may rise). Regenerate oracle/goldens/svg-sequence/diff-census.json.
- Outside-write-set edit to review: tests/oracle/svg-conformance/render-fixture-sequence.ts (1 arg).

## Rows below b2a (tighten)
TeozTimelineIssues_0002_Test:145->133 TeozTimelineIssues_0004_Test:115->93 TeozTimelineIssues_0007_Test:177->154 bagexe-03-bozo133:155->137 bepopi-29-dobu802:62->29 bexoce-95-vibe195:145->133 bocusa-16-ciju126:101->68 bulixe-06-boge494:85->36 burujo-63-puti396:47->19 busexe-78-ruzu110:349->337 butosi-00-mali446:59->44 cakelu-69-muza643:191->100 camebe-75-mujo573:392->379 cecuku-78-kezo359:23->18 cedeti-10-bufu072:167->155 cejoxe-28-zeba572:76->74 cetale-74-regu633:169->154 cijaru-11-fele146:75->46 cijozi-08-mavu547:167->158 cinilo-67-macu207:42->29 cocosu-02-vusu863:50->43 cofuse-78-keri294:74->57 coxefo-18-gopo887:150->88 cusete-01-vusi466:89->87 dasutu-58-saje713:109->80 databu-25-mivu307:69->64 decace-28-majo724:25->10 dedefa-06-muge830:47->19 dedigi-45-zusi003:43->36 defega-58-zepa649:42->37 dufupa-80-kavi440:47->19 dugeki-47-celo546:2493->2471 fevipu-45-xela421:30->24 ficiru-65-geda551:67->62 fifasu-62-pipo979:70->69 figezi-68-zefe216:138->61 fobuke-12-dopi544:73->64 fonipa-05-lobe529:23->18 fozeva-08-tife475:114->109 furami-83-pome543:30->24 furara-28-sode432:77->76 fuzove-69-bulo834:70->69 gacujo-48-leto751:205->199 gecopo-99-pude139:79->70 gibuxa-28-kale997:124->62 gidibo-31-cugi403:29->22 gifope-23-jufe872:104->75 giloko-85-gapa789:108->48 gosigu-85-raku124:50->24 h-rnote-style:85->36 jacefu-29-didu005:36->31 jagusu-12-turu662:79->78 jerevu-86-gojo026:80->44 jotege-53-vira701:30->24 karaki-85-ketu935:89->88 kibope-73-jezu646:120->68 kikaso-48-karu319:85->46 kocuso-22-ciri203:55->48 kofuti-29-goti188:141->109 kotixe-11-cufa733:85->36 kovito-91-jonu992:90->67 kukeja-88-zida141:275->254 lavaba-76-lepi228:79->18 ledura-21-bavo866:214->200 legeme-58-daxi851:27->19 lejafe-21-niga299:64->26 lidupe-72-cexa425:387->372 lojore-28-mano308:40->33 loteba-26-konu854:243->138 makuzo-19-tine034:122->118 mapeji-83-sebu002:145->133 masibi-28-tidi862:331->221 matoka-21-jisu767:80->37 matoke-25-kidu719:177->154 mebidu-16-ruve297:309->293 menoke-22-luxo044:210->209 metano-36-gevu843:60->32 mezaxa-44-siju322:81->74 midipu-78-meva271:126->70 migodo-28-fodi331:67->33 mipope-41-daxa497:65->61 mitefi-27-cubo687:511->251 mizugi-66-desi413:94->50 mokige-56-disi349:86->77 movaso-17-jomi483:61->28 moxope-92-roco972:64->32 mozofa-80-puru273:68->35 mucoji-36-bape235:57->50 nedaka-75-tiju705:74->67 nenika-09-domu220:48->17 nibiju-55-kavu710:158->124 nirolu-80-lobo780:68->61 nobase-02-zuvu172:42->35 nojata-23-ropa545:97->66 note-color:114->57 nucumi-51-posa953:392->159 numugo-16-luca722:79->78 nunozo-09-zoce623:137->100 pamuli-34-suxu083:50->24 paruvi-41-jano091:64->35 pebezu-05-dufi104:23->18 peduzi-80-giki495:512->252 pokici-03-lafi659:152->110 ponugi-73-xuzo000:81->39 popoda-09-xavi089:133->63 porepe-36-nebi243:52->45 povuju-50-pido564:54->19 pucini-86-goti091:137->127 putici-74-zenu027:346->337 ravire-24-jaju542:124->81 raxeca-83-rotu897:131->32 recani-60-licu962:171->161 refoxa-14-rusi158:30->24 rezoma-09-vixi307:125->120 rogube-67-sova611:134->61 rudola-01-bibi608:141->109 rusada-38-sopi026:88->48 ruxasu-79-puxa956:69->64 ruxuju-55-jitu721:128->96 ruxuxu-75-jilu612:223->177 sedajo-92-docu424:30->24 sefako-72-jono850:91->56 seloli-77-rixi778:114->57 sisege-95-labu547:55->47 sisena-47-nivo837:21->17 sofavo-23-xuxi628:83->65 suleta-28-lejo742:82->45 sulipe-44-jeta861:60->32 suvodo-70-rogi494:111->109 tefixi-07-xacu656:81->39 tejuzi-96-fano922:110->102 telizo-11-pilo439:39->32 tetoxu-24-mupo410:92->82 titufa-76-tisa795:62->34 todetu-82-rupo943:189->109 todozi-34-jire490:27->12 tuzeli-17-cuko941:299->290 tuzufi-65-xafe699:81->72 vamuge-84-degu929:30->24 vemako-00-lecu427:106->98 vesaze-51-ceji187:82->64 vixapo-60-tuzu421:72->32 vucomo-53-gicu658:574->314 vuniba-19-repo187:93->54 vutazu-28-xogu304:64->40 vuvage-72-meru492:30->24 xaduru-73-jani181:30->24 xaxile-75-soro580:1294->1132 xecopi-26-mego518:131->83 xogota-37-pele078:166->102 xojavo-26-jezu088:112->107 xorixe-91-vaci569:29->24 xujavu-00-xodi798:1112->1111 xujoga-62-lacu610:56->47 xutuvu-44-zoko423:64->29 xuzoxu-26-kafe830:50->43 zacoco-81-robo032:49->32 zajova-30-sagu653:448->444 zakuti-75-kute096:36->8 zazaje-27-roga410:30->24 zetenu-41-rece091:149->92 zizeca-16-cavi659:46->44 zofini-90-tuta329:64->34 zudize-61-vomi445:203346->55923 zupora-06-pazi006:80->37

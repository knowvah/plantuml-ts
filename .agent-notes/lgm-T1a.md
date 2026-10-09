# lgm-T1a -- mainframe sized as DiagramChromeFactory sizes it

Branch `lgm/T1a` (worktree `.claude/worktrees/lgm-T1a`), off `feat/large-group-mirror`.
Gates on the branch tip: `npm run typecheck`, `npm run lint`, `npm run build` clean; targeted suites green
(509 + 87 + 11 + 22 files across unit/integration/oracle; architecture incl. catalog drift green after `npm run catalog`).

## Commits (one per mechanism)

| sha | subject |
|---|---|
| 0e0ad196a | feat(chrome): compose chrome around the margin-less block |
| 951d58da4 | feat(chrome): size the mainframe from LimitFinder ink |
| ecbc62c7f | feat(mindmap): export the LimitFinder ink for the mainframe |
| 8f0174917 | fix(chrome): draw the mainframe's LineStyle dash |
| a976fa82e | test(chrome): pin the mainframe against jar renders on every engine (18 fixtures) |
| b876b649a | chore(catalog): regenerate for the chrome ink and margin modules |

## Mechanisms: Java -> ours

1. **Order.** `UgDiagram.java:124-128` (`getTextBlock` -> `addChrome` -> `DiagramChromeFactory.create`
   -> `TextBlockExporter`), `core/TextBlockExporter.java:159-176,199-203` (margin translate + dim),
   `SvgGraphics.java:129-136` (`ensureVisible`) -> `src/core/document-margin.ts`
   (`documentMarginOf`/`removeDocumentMargin`/`applyDocumentMargin`) + `src/core/annotations/chrome-export.ts#applyExportedChrome`.
   Margin per diagram class: `CucaDiagram` (0,5,5,0) (class row); `SequenceDiagram.java:629-633`
   `modeTeoz() ? same(5) : (5,5,5,0)` with `modeTeoz()` = `GlobalConfig.FORCE_TEOZ || ...` and
   `cli/GlobalConfig.java:47` `static final boolean FORCE_TEOZ = true` => always `same(5)`.
   The teoz block itself is `body + 10` drawn at `translate(5,5)` (`teoz/SequenceDiagramFileMakerTeoz.java:134-168`):
   that part is INSIDE the block chrome receives. Sequence declares the block via
   `RenderFragment.preChromeWidth/Height = totalWidth/Height - 10` (`src/diagrams/sequence/renderer.ts#preChromeDims`,
   unset under `scale`). `src/index.ts` and `render-fixture-class.ts`/`render-fixture-sequence.ts` call the same function;
   the class-only `applyClassDocumentMargin` re-application in `index.ts` (G2 N46) is gone (CUCA row of the table).
2. **Ink.** `BigFrame.java:77-91` (`ww = minX >= 0 ? maxX : width`, same for `hh`) and
   `DiagramChromeFactory.java:332-337` (`computeDelta`) read `TextBlockUtils.getMinMax(original)`
   (`LimitFinder.java:108-215`), never `calculateDimension`. `src/core/annotations/body-ink.ts#inkOfBody` re-applies
   LimitFinder's rules to the serialized body; `chrome.ts#frameInkOf` feeds `chrome-mainframe.ts` (`FramedOriginal.ink`,
   `frameExtent`, `inkDelta`). Scanned diagram types: `FRAME_INK_FROM_BODY` = SEQUENCE, ACTIVITY.
   Validated on the jar's OWN svgs: scanning the jar's mainframe renders reproduces the `ww` of its frame rect
   (seq-frame 97.388 vs 97.387, seq-frame-all 136.919, act-frame 56.35, exact).
3. **Mindmap.** `klimt/shape/TextBlockMarged.java:79-85` draws `UEmpty.create(dim)`; `LimitFinder#drawEmpty`
   (java:159-162) counts it, the SVG never shows it. Mindmap draws through ported klimt, so
   `diagrams/mindmap/index.ts#textBlockInk` runs `TextBlockUtils.getMinMax` and exports `RenderFragment.frameInk`
   (new field, `src/core/dispatcher.ts`). Mainframe only; no cost otherwise.
4. **LineStyle.** `Style.java:299-320` -> `BigFrame.java:93-135`; `annotation-style-types.ts#lineStyle`,
   `annotation-style-overrides.ts` (`linestyle`), `big-frame.ts#dashArray`. Gunecu's frame was filed in cdd-T34 as a
   "sequence-engine dasharray gap"; it is the frame's.

## Fixtures: before -> after (probe: renderSync + WidthTableMeasurer vs `scripts/oracle-render.sh`)

| fixture | before | after |
|---|---|---|
| act-frame / act-frame-all | 6 / 7 diffs | 0 / 0 |
| mindmap-frame | 13 | 0 |
| seq-frame, seq-frame-teoz | 33 | 15 (all `stroke-width`/`rx`/`ry`/lifeline dasharray: sequence style noise present with no chrome) |
| seq-frame-all | 52 | 14 (same noise) |
| seq-frame-long-title, -note-group, -style, seq-title-only, -legend-only, -header-footer | n/m | 14-15 (same noise); root dims + frame rect/tab/title exact |
| class-frame, object-frame, json-frame, hcl | 0 | 0 |
| state-frame / component-frame / usecase-frame | 85 / 44 / 48 | unchanged: OPEN (below) |
| decace / futaxe / gunecu / jutomu / zidova | ws 40/32/44/39/32 | 25/14/16/15/14 |

Frame rect, tab and title of all five sequence fixtures equal the jar's EXCEPT decace-28 (frame width 103.494 vs
104.494): its note-left is 1px narrower in ours (note `M20..65.269` vs jar `25..71`), which also moves Alice 1px; the frame
formula itself is right (same ink rule, validated on the jar's svg). gunecu's remaining diffs are the group-frame width
(`rect[2]/@width` 86.756 vs 94.231) and the noise attrs.

## engdiff (b0-eng -> after, all 28 engines, per-engine surveys): movers=0, conformant-losses=0, no timeout/errored.
The three unknown-bucket fixtures (miveni-64-rexo238, rivino-95-midu088, soseka-43-riru110 -- CLASS) and class
jakaja-15-faze022 stay conformant.

## Element counts (elements.mts sequence class unknown object, b0 -> after): away=0 toward=0.

## Ratchet movers -- sequence diff-baseline (pin -> now), 112 FALLS, 0 RISES, no new error rows (13 pre-existing)
Total weightedScore of the 1141-row set 306549 -> 304705. Re-pin (orchestrator). Cause for the non-mainframe rows:
sequence title/legend/caption/header/footer composed over the FINAL canvas (margin included) instead of the
margin-less block, so a chrome element wider than the body lost the +10 margin (dozens of rows 40-90 -> 14).

bedaja-09-gezu912 25->21; boparo-11-pema294 51->12; bozuru-10-rajo382 67->16; bugaju-81-ciko758 40->14;
cakelu-69-muza643 195->191; cizifu-56-giku099 18->14; cusiro-03-mebe823 124->123; dabozi-63-zuco354 26->24;
davipu-63-veta505 19->15; decace-28-majo724 40->25; digula-66-dipe776 136->130; dinita-73-tige486 39->14;
dofuru-22-zuga032 44->14; dopisa-88-pazo292 51->14; dugeki-47-celo546 2494->2493; falolu-20-sepu020 21->17;
fazaba-22-nusi829 46->14; fekatu-96-kele513 16->14; fexoko-32-feso446 26->24; fijeco-97-zozu841 20->14;
fixecu-74-kote876 19->15; fobapo-56-moko401 29->8; fonope-49-jodi834 43->15; foporo-86-nego484 20->14;
funado-58-dene546 51->17; futaxe-10-xonu513 32->14; gadasu-04-kada675 20->18; ganefo-61-leka777 42->14;
gaxera-69-muma363 62->16; gazave-48-zapu688 24->22; gefobi-11-jena493 45->14; gejeji-12-zofa866 284->35;
gekuko-59-muta575 39->14; gijamu-35-vale058 930->929; giloko-85-gapa789 109->108; gorido-98-taje926 16->14;
gucare-93-petu502 514->513; gunecu-53-jebu067 44->16; gupaki-93-vupa807 51->17; guroti-56-konu524 42->14;
guzoco-99-ginu686 72->68; jafufe-08-begu830 229->223; janodo-62-pave893 40->14; javiki-44-cija459 93->92;
jerika-28-senu049 16->14; jogeto-89-zaco078 16->14; jonoja-01-zani191 12->10; junaxa-14-biko373 30->28;
jutomu-49-kemi074 39->15; kaporo-80-vace949 70->18; kerezi-79-cepe665 27->21; kugete-25-poba470 40->5;
kuputa-52-caxa434 64->18; kuzoba-85-fabe034 14->12; lemevu-44-gupu133 45->14; lojami-06-ligu429 26->14;
losefo-71-dovi176 113->112; losilu-30-ridu614 19->15; makigi-01-zeni607 45->44; mefone-86-soca963 39->14;
merosa-99-nico816 20->14; modamu-43-juci519 24->22; mufote-89-buka575 16->14; mumagu-62-jicu083 18->14;
muvaxa-46-teze620 37->12; najuro-83-tuze073 18->12; naliba-15-rari769 19->15; nereka-67-deco609 66->14;
nosebu-15-fasu691 3065->3064; nosixi-41-rizu505 16->14; pagujo-10-pafe397 48->14; parimu-89-nemi931 22->14;
pomoxu-05-luco302 910->909; rabulu-15-mesu419 38->14; ramive-48-vabu271 91->14; ratufa-96-xagu210 20->14;
rilefo-62-jedi773 78->14; rocipu-63-zafu641 18->14; rokava-82-kavo091 49->14; ropame-50-funo509 50->46;
rujapu-71-bidi404 683->682; sefako-72-jono850 92->91; sisena-47-nivo837 23->21; sofavo-23-xuxi628 89->83;
sojufi-84-bexi933 68->67; solivu-37-vika919 22->20; sopapu-09-riza536 20->14; soxata-16-kafi688 16->14;
sukugi-55-kagi800 20->14; taxoza-93-sugi547 16->14; taxude-25-lamo370 17->15; tejuzi-96-fano922 111->110;
tukobo-89-zebi935 331->330; tumega-91-dadu356 31->27; tupolo-75-ziku881 46->14; tuzaga-87-gene496 41->14;
vemako-00-lecu427 107->106; vicevi-92-zeda652 44->14; xejeta-41-boje080 20->14; xejojo-44-besu904 18->14;
xepoda-56-xema668 24->22; xerugu-77-tapu134 12->10; xesame-35-puka061 19->15; xevovo-09-jeja818 43->14;
xurenu-86-nezu467 41->14; zariro-57-fogu131 46->14; zaviru-83-xixa466 45->14; zerovu-57-cumo773 18->16;
zidova-39-bapi223 32->14; zucesu-12-neno978 42->14; zudize-61-vomi445 203347->203346; zufido-27-laru296 18->14.
(Class/object/description/activity/mindmap/json/state pinned rows: none moved.) The sequence `diff-census.json` will
also move (orchestrator).

## Observations

## Observation: mainframe frames the INK, not the dimension
- **Context**: sizing the sequence/activity/mindmap frame.
- **Finding**: `BigFrame`/`decorateWithFrame` read `TextBlockUtils.getMinMax` (LimitFinder), so arrow polygons count
  +-10 on X, rects -1, and a `TextBlockMarged` counts a `UEmpty` the SVG does not carry (mindmap).
- **Impact**: any future engine handed a mainframe needs ink, not `calculateDimension`; export `frameInk` when the
  engine draws through klimt, else it can be scanned from the body (`FRAME_INK_FROM_BODY`).
- **Confidence**: High (reproduced the jar's own `ww` from its own svgs).

## Observation: under a mainframe a SvekResult is drawn un-normalized (state/description open)
- **Context**: state-frame/component-frame/usecase-frame fixtures.
- **Finding**: jar state box x=11 (block x=1) with a frame vs x=7 without; `decorateWithFrame` never calls the
  original's `calculateDimension`, so `SvekResult.java:130-135` `moveDelta(6 - minX, 6 - minY)` never runs. Class mirrors this
  in `class/layout-ink-extent.ts#mainframePlacement`; state/description draw the normalized body.
- **Impact**: needs `DotLayoutResult.originShift` (core/graph-layout.ts, T0b's files) plumbed through
  `state/layout.ts#applyStateDocumentMargin` + composite path and `description/layout.ts`/`layout-ink-shift.ts`, then
  `frameInk` = ink + m and shift = m + delta. No corpus fixture has a state/description mainframe.
- **Confidence**: High (mechanism), Medium (plumbing cost).

## Observation: engines the brief lists that cannot be probed
- timing (`robust ... as WB` -> "Syntax Error? (Assumed diagram type: class)") and gantt ("unknown diagram type")
  have NO plugin in `src/index.ts` (15 registered); the jar draws a frame on both. Nothing to mirror until ported.
- board, chart, packet (`@start<x>` + `mainframe`) draw a frame in the jar and diverge wholesale from ours for
  unrelated reasons (no document shell attributes, element counts); chronology/files/dot/yaml: the jar draws no frame.
  hcl equals the jar; json equals the jar.
- **Confidence**: High.

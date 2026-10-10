# isw diagnosis: CLASS / OBJECT / DESCRIPTION / core svek

Method: read-only. Our SVG vs new jar via compareSvg for all 70 owed rows + 43 fixtures cited by unit tests (`batch.mts`); stack tracing of every shared `text()` call in a scratch copy of src (`/private/tmp/claude-501/isw-diag-class/scratch`); 3 jar probes (maxMessageSize e2e, `component [ .. ]`, tuliba/lisepi svg). No repo file touched.
Totals: 124 unit failures + 7 DOT-parity ratchets + 48 golden ratchets = 179.
Unit: S=104 (incl 2 flagged S*), P=14, S+D mixed=6 (S expectation + D family F2), pure D=0. Every D lives in the 55 ratchet failures / 70 owed rows.

## (a) Family table

Java F2 core: `DriverTextSvg.java:113-126` -- `if (text.matches("^\\s*$")) text = text.replace(' ', (char) 160); if (text.startsWith(" ")) { space = stringBounder.calculateDimension(font," ").getWidth(); while (text.startsWith(" ")) { x += space; text = text.substring(1);} } text = StringUtils.trin(text); dim = calculateDimension(font, text)`. So drawn x is shifted by the leading-space width, `textLength` is the TRIMMED width, but the layout advance of the atom stays the RAW width.
Ours: `src/core/svg-text-font.ts:~160` (`emittedTextForm` doc: "Not ported: leadingSpaceAdjust ... Verified unexercised by the current corpus") -- that claim is now false. `src/core/svg-shapes.ts:125 text()` has no measurer, so every emitter that goes through it lacks the shift. The klimt path (`core/klimt/drawing/svg/driver-text-svg.ts:102,182`) IS faithful, so description/svek klimt-drawn leaves are fine (all cited description/object fixtures that are 0-diff confirm).

| Fam | Mechanism (Java <-> ours) | #ratchet/unit tests | #owed rows | Fix must touch |
|---|---|---|---|---|
| F2a (E1) member-row / classifier-row creole atoms | DriverTextSvg:118-124 <-> `renderer-classifier-rows.ts:333 renderTextRowAtom`: draws `atom.renderText` (leading spaces stripped by `class-member-creole-render-text.ts:94 textRenderOverride`) at unshifted x. textLength already trimmed (OK). | 24 golden | 24 (+ rexobo partly) | class only: add layout-time leading-space width on the atom (`class-member-creole.ts:322-345 resolveOneAtom`, tab path `class-member-creole-render-text.ts:154-170`, type `class-member-render-atom.ts`), consume at `renderer-classifier-rows.ts:333`. |
| F2c (E3) note-line atoms | same <-> `renderer-note.ts:180 renderNoteLineAtoms` (also plain fallback `renderer-note.ts:280`) | 8 golden (exposant, fogexa, puvono, sekame, vicuro, xicipi, ziripa, xadado) + 3 via F3 | 8 | class only, same atom field as F2a; consume at renderer-note.ts:180/280. |
| F2d (E4) note table cells | same <-> `renderer-note-lines.ts:167 renderTableCellAtom` | 2 golden (jovigo, colede) + 6 unit (S+D) | 2 | class only, same atom field; consume at renderer-note-lines.ts:167. |
| F2b (E2) plain row text | same, plus textLength = untrimmed `row.width` <-> `renderer-classifier-rows.ts:222 renderRowText` (`textLength: row.width`, x = geo.x+row.indent). Hits classifier-name rows (` AB `), object `name : type` type run (jotaga: jar x 220.82 = 125.97+91+3.85) | 1 golden (object jotaga) + 1 unit (S+D) + part of rakuci | 2 (jotaga, rakuci AB) | class only: row builders (class-stereotype-layout / class-object-map-header / class-object-sizing set indent+width) + renderer-classifier-rows.ts:222. |
| F2e (E5) edge-label runs | same + textLength untrimmed <-> `renderer-edge-label.ts:108,219,257` (run.x/run.width come from `class-edge-label-anchor.ts`/`class-edge-label-lines.ts`). e.g. sacacu: label " Brunette ... pseudonym ": jar tl 213.038 / x +3.575; ours tl 220.188 | 4 golden (dofima, jireze, sacacu, rexobo) | 5 (+tujasu object) | class only: label run producers + renderer-edge-label.ts. Also unverified siblings with same pattern: `renderer-edge-extras.ts:203,257,260,268,303`. |
| F2f (E6) namespace/package title | same + textLength untrimmed <-> `class-namespace-title-runs.ts:409 renderTextRun`, `:481 renderNamespaceTitleAuto` (jabama: tl 134.575 vs jar 130.725 -- next run x 144.575 already correct; rakuci ` XY ` tl 26.425 vs 18.725, x +3.85) | 2 golden | 2 | class only. |
| F2g (E7) core error/welcome page | same <-> `core/error/graphic-strings.ts:61-66 drawLine` (advance correct, x of run not shifted) and `core/error/error-page-exact.ts:176-190 drawSegmentLines` (same) | 0 here | 2 (unknown/gujuga-46, vesuzo-97: empty diagram page, 3rd run x 137.75 vs 141.05 = 12pt space) | src/core/error/** (SHARED: every engine's error/empty page). |
| F3 note/legend body lines trimmed at parse | Java `BlocLines.removeEmptyColumns` (`utils/BlocLines.java:234-248`) = drop only COMMON leading space/tab columns, keep trailing; called `CommandFactoryNoteOnEntity.java:236-237`, `CommandFactoryNote.java:157-158`, `CommandFactoryNoteOnLink.java:139`, `CommandFactoryTipOnEntity.java:183`, `CommandMultilinesLegend.java:120`, `CommandMultilinesTitle.java:76`, `CommandMultilinesCaption.java:76` (the `// StringUtils.trim(lines,false)` is commented out) <-> `class-line-merge.ts:79 raw.trim()` / `:105 trimEnd()` then `class-notes.ts:452 textLines.push(line)` (trimmed) joined at `:422`. Consequence: note node width misses interior-indent (kikera "  return b;" +7.15 = 2 spaces@13) and trailing space (pejone/xonamo ".GetType() " +3.575); text x misses shift. tonake legend: trailing space of last line "BackgroundColor " (+3.85 rect width). | 4 DOT (kikera, pacuve, pejone, xonamo) + 5 golden (those 4 + sisolu, all also need F2c) + 1 golden (tonake) | 6 | class: class-notes.ts (~422/452, legend/title/caption body collectors), class-line-merge.ts (provide untrimmed rawLines); then F2c for the shift. |
| F3d description note bodies | same Java <-> `description/note-dispatch.ts:39 pendingNote.lines.push(line)` (trimmed). tuliba-37: line " nested in the source element" (1 leading space) is the jar's widest -> note node 191.300 vs ours 189.512 (+1.7875 because it was 1.7875 narrower than the next line) | 1 DOT (description tuliba-37-liza126) | 0 | src/diagrams/description/ (note-dispatch.ts, parser.ts). |
| F4 description `[ .. ]` bracket label whitespace | jar keeps ` Not Our System That Must Stay  ` (1 leading, 2 trailing; probe: rect 248.775, text x = rect+15+3.85) <-> ours collapses trailing 2 -> 1 (`parseDescription` display = " Not Our System That Must Stay ", rect 244.925). Suspect `command-table-helpers.ts shorthandNode` (`name + ' ' + trailer.trim()`) -> `parse-helpers-strings.ts:393 .replace(/\\s+/g,' ')`; exact line NOT confirmed. Also ours trims `[ A  B ] as C` -> "A  B" and `[  X  ]` -> "X"; jar behaviour for those not probed. | 1 DOT (description detona-13-ziko113) | 0 | src/diagrams/description/. |
| F7 multi-line quoted element display not dedented | Java `CommandCreateElementMultilines.java:169` `lines = lines.trimSmart(1)` runs for BOTH TYPE0 and TYPE1 (`BlocLines.java:305-316`) <-> `class-multiline-element.ts pushBodyLine` (terminator 'quote' branch pushes raw; its comment "TYPE0 ... no dedent upstream either" is contradicted by the jar). unknown/gejuvu-17: `usecase/ test15 as "\n    test 15\n    multiline with alias\n"`: jar lines are "test 15"/"multiline with alias" (ellipse rx 92.776, x 78.82/43.295); ours keeps 4 leading spaces (rx 102.834, +20 width). | 1 golden | 1 | class-multiline-element.ts (description parser already has trimSmart: parser.ts:104-121). |
| R lisepi (object DOT) | pinned allowance `oracle/goldens/object/size-backlog.json` 0.0556in; jar DOT for lisepi is UNCHANGED old->new (header 18pt bold dominates width). Ours ignores `<style> object/map/json {FontSize,..}` (pre-existing: rect rx 2.5 vs 10, stroke, h 58 vs 54), so our 14pt rows now carry +7.7 from 2 spaces -> delta 0.1408in. Not a new port defect; stale pin. | 1 DOT | 0 | re-pin only (do not raise: orchestrator decision) or fix `<style>` for object. |
| F1 (not in this group's code) | `new WidthTableMeasurer()` module constants: activity-text-sheet-diamond.ts:45, activity-text-placement.ts:24, activity-renderer-swimlanes.ts:37, activity-renderer-composite.ts:49, activity-text-sheet.ts:169, activity-creole-sheet.ts:268, activity-renderer-bars.ts:37, layout/canvas-origin-text-ink.ts:20, layout/compress/edge-label-anchor.ts:74; sequence/renderer-participant-symbol.ts:201. NONE in class/object/description/core-svek (grep clean; hits there are comments). | 0 | see (c) | - |

Shared (src/core) vs engine: only F2g (src/core/error) and the optional shared helper for F2 (a pure `leadingSpaceAdvance(raw, measure)` next to `emittedTextForm`, `core/svg-text-font.ts`; `core/svg-shapes.ts#text` can stay measurer-free if callers pass the shifted x and the trimmed textLength) are shared. Everything else is `src/diagrams/class/**` or `src/diagrams/description/**`. Other users of `text()` that were not exercised here but share the gap: `renderer-classifier-badge-tag.ts:265`, `class-empty-package.ts:298`, `renderer-list-number-atom.ts:34`, `class-cluster-header.ts:224`, `core/usymbol-shapes.ts:111,134`, `core/latex.ts:127`.

Not a defect (verified): all unit tests citing fixtures that render 0-diff vs new jar (see S below). Space-width literal in `class-object-fields.ts:99` (`width===0 ? fontSize*4`) is consistent with jar (object nufoju-44 0 diff, tab stop = 8 spaces).
`class-package-style.ts:272,283` (`width===0` guards) -- see S*.

## (b) Per failing test file (S/P/D/R)

Evidence for S: fixture renders 0-diff against new jar (`unknown/doboco-09, sijisi-94, xoxega-30, gujigi-63, pixexi-81, focaci-80, jixamu-89, nadedo-37, baloca-83, bepafe-03, ririlu-13, camuna-58, mugobo-34, daxeno-00, beleso-08, figeze-77, nukera-08, nufoju-44, dojanu-92, julixi-10, nucite-98, rozugu-82, rivino-95, ponono-25, sumocu-27, temise-16, lejoga-79, roputo-88, rubecu-40, nuveji-19, tivezu-91, lipazi-06, vonago-16, xamule-03, lurupu-11`), or new golden/in.svg value read directly, or exact n x space delta.

| Test file | n | S | P | D | R | Notes |
|---|---|---|---|---|---|---|
| oracle/class-dot-parity | 4 | | | | 4 | F3 (kikera 76.413 vs 69.262; pacuve 305.131 vs 297.981; pejone/xonamo 398.975 vs 395.400) |
| oracle/description-parity.ratchet | 2 | | | | 2 | detona-13 = F4 (248.775 vs 244.925); tuliba-37 = F3d (191.300 vs 189.512) |
| oracle/object-dot-parity | 1 | | | | 1 | lisepi = R (stale pin + pre-existing `<style>` gap) |
| svg-conformance/class.golden.ratchet | 47 | | | | 47 | F2a 24, F2c 8, F3+F2c 5, F2e 4, F2d 2, F2f 2, F3-legend 1, F7 1 (+ tonake counted in F3-legend) |
| svg-conformance/object.golden.ratchet | 1 | | | | 1 | jotaga = F2b |
| unit/description/layout-dot-tree | 1 | 1 | | | | jar `test-results/dot-cache/*/babafi-51-dixi026/in.svg` text "can be used by a" textLength 106.488 (test: 91.0875) |
| unit/description/renderer-note-opale | 1 | 1 | | | | inferred (note text "cloud's note" has 1 space); no fixture |
| class-badge-leaftype-t3e | 1 | 1 | | | | doboco-09 0-diff |
| class-body-enhanced-blank-rows | 1 | 1 | | | | blank row = lone space 3.85 (StripeSimple.java:125-126 adds " " atom) |
| class-business-usecase-cdd5 | 1 | | 1 | | | 117.533 vs 117.5335 |
| class-circle-usymbol-routing | 1 | 1 | | | | sijisi-94 0-diff |
| class-classifier-ink-reservation | 1 | 1 | | | | xoxega-30 0-diff |
| class-cluster-header | 8 | 8 | | | | new jar `class/xenere-07-kuji864/svek-1.dot` WIDTH="252" (old 229); legend 204.6->227.7 |
| class-creole-extended-color-b7fu-r1 | 2 | 2 | | | | ziripa-77: jar `<line x1="43.119">` / `155.65` equal OURS; test constants stale |
| class-dot-width-floors | 3 | | 3 | | | fround noise (72.99500198 vs 72.995) |
| class-edge-geo | 1 | 1 | | | | vonago-16 0-diff |
| class-edge-geometry-t6 | 6 | 6 | | | | lipazi-06 0-diff |
| class-edge-label-wrap-cdd7 | 4 | 3 | 1 | | | e2e (maxMessageSize 60) re-rendered by new jar: 0 diffs vs ours; P = 70.8499985 vs 70.85 |
| class-edge-labels | 1 | 1 | | | | xamule-03 0-diff |
| class-fd-size-mechanisms | 1 | 1 | | | | gujigi-63 0-diff |
| class-generic-tag-multiline-t6fu | 1 | 1 | | | | delta = 2 x 3.3 |
| class-geo-builders | 3 | 1 | 2 | | | S ("this is" +3.575) with P noise; P: 7.2312498 vs 7.23125, 13.7312498 vs 13.73125 |
| class-ink-box-t31 | 5 | 5 | | | | pixexi-81, focaci-80 0-diff |
| class-ink-box | 1 | 1 | | | | jixamu-89 0-diff |
| class-json-maximum-width | 1 | 1 | | | | nadedo-37 0-diff |
| class-json | 7 | 7 | | | | baloca-83, bepafe-03 0-diff |
| class-kal-overlap | 1 | 1 | | | | ririlu-13 0-diff |
| class-kal | 2 | 1 | 1 | | | camuna-58 0-diff; P dx -28.0750008 |
| class-layout-edge-labels | 1 | 1 | | | | mugobo-34 0-diff |
| class-member-creole | 2 | 2 | | | | lone-space atom width 0 -> 3.575; tab stop 8 spaces (nufoju 0-diff) |
| class-namespace-shape | 2 | 1* | 1 | | | P: polygon 29.787 vs 29.788. S*: `getWTitle(..,'')` returns 9.85 not 50 because `namespaceTitleLines('')` builds the StripeSimple " " atom (width 3.85). Java: `ClusterHeader.java:getTitleBlock` returns 0-width empty block only for `label==null`; an empty Display lexes to " " (width 3.85). Which one our `''` means is unprobed; no class fixture has an empty title (only usecase/ ones). Needs one jar probe to turn S* into S or D. |
| class-namespace-title-runs | 6 | 6 | | | | jabama jar: 2nd run x=144.575 (test 140.725); "«profile» profile" +3.85; daxeno-00 0-diff |
| class-note-embedded-diagram-conformance | 1 | 1 | | | | jar xadado image width 112 (test 105) |
| class-object-map-sizing | 8 | 7 | | S+D 1 | | S: beleso-08, figeze-77, nukera-08, nufoju-44 0-diff; jotaga: width 87.15->91 is S, then type-run indent must also gain the 3.85 (F2b) |
| class-object-raw-members | 1 | 1 | | | | nukera-08 |
| class-package-leaf-routing | 1 | 1 | | | | gujigi-63 |
| class-package-skinparams-t21 | 1 | 1 | | | | dojanu-92 |
| class-shield-magnetic-border | 1 | 1* | | | | same S* as getWTitle (empty title) |
| class-stereotype | 4 | 4 | | | | dofima header +11.55/2 centring; julixi-10, nucite-98 0-diff |
| class-usecase-actor-routing | 1 | 1 | | | | test literal was a probe capture; delta = 3.85 x ellipse factor |
| class-usymbol-stereotype-sprite-cdd7 | 1 | | 1 | | | 40.213 vs 40.212 |
| desc-embed-ensure-visible | 1 | 1 | | | | rozugu-82 0-diff |
| mainframe-svek-unnormalized | 1 | 1 | | | | rivino-95 0-diff |
| note-bullet-wrap | 1 | 1 | | | | ponono-25/sumocu-27 0-diff |
| note-layout-measure | 5 | 5 | | | | temise-16, lejoga-79, roputo-88 0-diff; jovigo/xadado note SIZE matches jar DOT |
| note-layout | 1 | 1 | | | | rubecu-40 |
| note-table-cell-align-cdd6 | 2 | | | 2 (S+D) | | colede (F2d): cell widths S; cell text x needs shift |
| note-titled-separator-cdd6 | 2 | 2 | | | | nuveji-19 0-diff |
| renderer-classifier-badge-sprite-offset-t3e | 2 | 2 | | | | tivezu-91 0-diff; jajebe-95 reduced: badge dx 32.781->38.556 is layout (jajebe diffs are only text x) |
| renderer-entity-port | 1 | | 1 | | | textLength 12.513 vs 12.512 |
| renderer-note-lines | 3 | | | 3 (S+D) | | jovigo (F2d): grid lines S, cell text x D |
| renderer-usymbol-entity-leaf-style-cdd7 | 4 | 4 | | | | synthetic; deltas 7.7 / 4.95 / 0.96 = n x space |
| core/svek/image/EntityImageDescriptionDelegates | 1 | 1 | | | | tab stop 56 -> 30.8 (8 spaces) |
| core/svek/image/EntityImageNoteLink | 2 | 2 | | | | state golden `fotigo-12-gufu949/svek-1.dot` label WIDTH 111/117 (old 104/110) == ours |
| core/svek/image/creole-text-lines | 1 | 1 | | | | tab stop |
| core/svek/image/leaf-sizing-creole | 1 | | 1 | | | 181.6624985 vs 181.6625061 |
| core/svek/image/leaf-sizing-folder-title | 2 | 2 | | | | gujigi-63 |
| core/svek/image/leaf-sizing-note | 4 | 4 | | | | goldens: xufexu-38 1.285851in=92.581, tijexo-10 1.362847in=98.125, nobiza-91 9.768403in=703.325 == ours |
| core/svek/image/leaf-sizing-sea-layout | 1 | 1 | | | | empty line = " " atom (StripeSimple.java:125-126) |
| core/svek/image/leaf-sizing-widen-routing | 5 | 3 | 2 | | | P: 61.724998 vs 61.725, 57.3624992 vs 57.3625 |

Sum: 124 unit tests. A fix for F2/F3 leaves the 6 S+D tests needing only expectation updates (their D part is fixed by the code change).

## (c) Owed rows NOT explained by any class/description family

19 rows with `data-diagram-type="ACTIVITY"` (diagnose with the activity group): unknown/ barada-07-veca157, cagoze-40-tete366, cezeje-11-roxe484, cimice-03-zata362, doveka-76-fiza931, febuci-08-zogi253, jipapo-14-kevu587, jopisi-58-rika067, kakitu-70-kuvi013, lipiki-79-fapu237, lonosi-76-xoka469, nijipa-25-pede639, pajeki-99-bezu928, rucuga-83-tosu408, taliti-27-vuzo488, tuvigo-52-redo102, vezozu-78-pici074, xaxene-93-doka767, zakuke-30-sobi867. Signature: our textLength SMALLER than jar by n x space (e.g. barada "A is B" 22.688 vs 28.737 = 2 x 3.025@11pt; cimice 153.225 vs 159.825 = 2 x 3.3), i.e. the label was measured with the old width table: consistent with F1 (the WidthTableMeasurer module constants listed above) -- UNVERIFIED by me; jopisi/pajeki/taliti/tuvigo/xaxene also show +3.3/+3.85/+3.025 x shifts (activity-side F2). No usecase/ owed rows exist.
All other owed rows are explained: 49 = F2a 24, F2c 8, F3+F2c 5, F2e 5, F2d 2, F2f 2, F2b 1, F7 1, F3-legend 1; plus 2 F2g (gujuga-46, vesuzo-97) = 51; 70 - 51 = 19 activity.

Probe/scratch artefacts: /private/tmp/claude-501/isw-diag-class/ (owed-out.txt, trace-out2.txt, jar1/, jar2/, jar-tuliba-37-liza126/, jar-lisepi-64-mudo307/).

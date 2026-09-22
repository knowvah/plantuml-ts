# cdd-T28 — chrome text through the shared creole pipeline

Status at hand-off: **HALTED on stop condition 1 (twice).** The seam change
is written, typechecks, and is measured below; it cannot be made green
without two changes in files outside T28's write-set (§4).

## Observation: the chrome seam's faithful fix is a klimt `TextBlock`, and the whole pipeline already existed

- **Context**: `blocks.ts#buildAnnotationBlock` drew title/legend/header/
  footer/caption from raw strings via a local `parseCreole`/`measureLines`/
  `drawLines` trio.
- **Finding**: `Style#createTextBlockBordered` (`style/Style.java:353-369`)
  — the one method all five elements reach (`EntityImageLegend.java:47-55`,
  `DiagramChromeFactory.java:342-356/362-376/382-413`, the last via
  `DisplayPositioned.java:118-128#createRibbon`) — opens with
  `note.create0(fc, alignment, spriteContainer, lineBreak, CreoleMode.FULL,
  null, null)` (java:358-359). Every piece of that call chain is ALREADY
  ported and wired in this repo: `Display#create0` →
  `DisplayCreole#getCreole` → `ISkinSimple#sheet` → `CreoleParser` (T10g
  removed its last `blockedOnSibling` seam) → `Sea`/`SheetBlock1`/
  `SheetBlock2`, with `StripeTable`/`StripeTree`/`AtomTable`/`AtomTree`
  live, and `core/klimt/document-shell.ts#renderDrawableToFragment` as the
  sanctioned `UDrawable` → SVG-fragment seam. The fix is ~90 lines of
  wiring (`blocks-creole.ts`), zero new creole code.
- **Impact**: `kacico-91-bati232`'s legend went 23 structural + 63 numeric
  diffs → **0 structural + 13 numeric** in one step, and the drawn markup
  is byte-shaped like the jar's (`x y fill font-size textLength
  font-weight`, `style="stroke:#000;stroke-width:1;"`) because it is now
  klimt's own `DriverTextSvg` emitting it, not `core/svg.ts#text`.
- **Confidence**: High — Java method bodies read; output diffed against the
  cached oracle for six fixtures.

## Observation: routing a chrome line through the seam must also carry the BORDER colour, or every `----` rule paints `stroke:none`

- **Context**: `usecase/pivudu-29-pele178` (a legend with a `----`
  horizontal rule) started drawing the rule — at `stroke:none`.
- **Finding**: `TextBlockBordered#drawU`'s last statement is
  `toDraw.drawU(ugOriginal.apply(color).apply(new UTranslate(left, top)))`
  (`klimt/shape/TextBlockBordered.java:141`), where `color` is the border
  colour, or the resolved background when `noBorder()` (zero thickness,
  java:114-119,126-134), or `HColors.none()`. `CreoleHorizontalLine` and a
  table's own rules paint with the graphic's FOREGROUND, so without that
  `apply(color)` they come out `stroke:none`. Text is unaffected — every
  atom carries its own `FontConfiguration.color`.
- **Impact**: fixed in `blocks-creole.ts` by wrapping the block in a
  `UDrawable` that applies `new Fore(color)`; `pivudu`'s rule now matches
  the jar's `stroke:#000;stroke-width:1;` exactly and that fixture's
  diff-baseline ratchet went from FAIL back to PASS. This is the chrome
  analogue of `.agent-notes/C6-annotation-creole.md`'s "a box sized from a
  string that is never drawn": routing text through a seam also moves which
  graphic state that text is drawn under.
- **Confidence**: High — Java read to `file:line`, before/after measured.

## Observation: an empty klimt content `<g>` serialises SELF-CLOSING, and `unwrapContentG` rejects it — 13 fixtures error

- **Context**: after the seam change, `npm test` showed 14 fixtures newly
  routing to `NONE` (routing-conformance stop condition) across class,
  object, usecase, sequence and unknown.
- **Mechanism**: a chrome text block that draws NO ink leaves
  `SvgGraphicsCore.gRoot` empty; the XML writer serialises it as
  `<g font-family="sans-serif" lengthAdjust="spacing"/>`.
  `document-shell.ts#unwrapContentG` (`:304-311`) requires the body to END
  with `</g>` and otherwise throws `unwrapContentG: malformed klimt SVG
  output`, which `renderSync`'s outer catch (`src/index.ts:386`) turns into
  an error page — hence no `data-diagram-type`, hence routing `NONE`.
- **Origin**: `src/core/klimt/document-shell.ts:304-311`, reached from
  `:417`.
- **Two ways to reach a no-ink chrome block**: (a) a `{{ }}` embedded
  diagram, whose renderer throws at the chrome seam (D9 gives the nested
  renderer to T27, not here) and whose `EmbeddedDiagram.drawU` catches and
  draws nothing; (b) a chrome line whose only atom is a sprite/emoji/img,
  which chrome's `AtomOps` cannot resolve (§4b).
- **Ruled out**: not the `extraDefs` merge (`extractDefs` already handles
  `<defs/>`); not measurement (the block reports a real 42×42); not the
  class engine (identical source renders at baseline).
- **Verified fix (probe, applied then reverted)**: one line at the top of
  `unwrapContentG` — `if (/^<g(?:\s[^>]*)?\/>$/.test(withoutPi)) return '';`
  — takes the newly-erroring set from 14 to 1.
- **Confidence**: High — reproduced in isolation (the raw `getSvgString()`
  output is quoted above), fixed and re-measured over the full suite.

## Observation: the chrome seam has no sprite/emoji/img channel, and the gap can CRASH, not just drop ink

- **Context**: `sequence/nereka-67-deco609` is the 1 fixture the probe does
  not rescue. Its legend is `|<#blue><color:#CE93D8><$docker>    | App1 |`.
- **Finding**: `buildAnnotationBlock`'s four-parameter contract carries no
  `SpriteRegistry`/asset channel (`descAtomOps`'s two resolvers have no
  counterpart here), so `<$docker>` resolves to nothing, the table cell
  measures 0 wide, and `TextBlockMarged#drawU`'s `UEmpty.create(dim)` hits
  `UEmpty`'s own `width == 0` guard (`klimt/shape/UEmpty.java:45-47`,
  faithfully ported at `UEmpty.ts:18`) — `width=0`, an error page.
- **Reach**: 24 corpus fixtures put a `<$sprite>`/`<:emoji:>`/`<img:>`/
  `{{ }}` atom in chrome text (grep over every `in.puml` in the cache).
  Before T28 those drew the literal markup as text; after, they draw
  nothing (and one crashes).
- **Impact**: the seam needs the resolver bundle threaded
  `src/index.ts#applyAnnotationChrome` → `applyChrome` → `buildAnnotationBlock`
  → `blocks-creole.ts#chromeAtomOps`. `chrome.ts` and `blocks.ts` are in
  T28's write-set; `src/index.ts` and the three `render-fixture-*.ts`
  harnesses that call `applyChrome` are not.
- **Confidence**: High — the throwing guard identified by name, the fixture
  reproduced, the corpus counted.

## Observation: `skinParam` with a capital P is silently dropped by this port

- **Context**: instrumenting `repuga-78-xora226` (`skinParam
  CaptionFontSize 10` / `CaptionFontColor blue`), one of the four fixtures
  T28 was asked to classify.
- **Finding**: NOT a chrome-creole mechanism. `RE_SKINPARAM_LINE`
  (`src/core/preprocessor.ts:107`) is `/^skinparam\s+(\w+…)\s+(.+)$/` —
  case-SENSITIVE — while upstream compiles every command regex with
  `Pattern.CASE_INSENSITIVE` (`regex/Pattern2.java:114`, applied to
  `CommandSkinParam`'s own `(skinparam|skinparamlocked)` leaf,
  `command/CommandSkinParam.java:58`). `preprocess()` returns an EMPTY
  skinparam map for repuga's source, so the caption keeps the 14/`#000`
  defaults.
- **Impact**: general, not caption-specific — any `skinParam`/`SkinParam`
  spelling anywhere in the corpus is dropped wholesale. One-character fix
  (`/i` on that regex, with the block-open/close siblings at `:115-118`
  checked alongside), in a file no batch-7 task's write-set names.
- **Confidence**: High — Java read to `file:line`; the empty map observed
  directly from `preprocess()`.

## Classification of the four "suspect, unattributed" fixtures (T28 step 3)

| fixture | verdict | mechanism |
|---|---|---|
| `nucite-98-kuga991` | NOT chrome | `<style> class { MaximumWidth 100 }` — class/note body word-wrap. Our legend-free source draws `Long Long Long` as one run where the jar wraps at 100px into a 23-child block. `fixtures.md`'s T24 hint stands; no correction made. |
| `nufini-44-jofo787` | NOT chrome | Same mechanism (`MaximumWidth` on `class` and `note`). T24 hint stands. |
| `repuga-78-xora226` | NOT chrome creole | `skinParam` case sensitivity, above. |
| `ropera-76-jico895` | NOT chrome | Its TITLE is already exact; the 3 structural diffs are the class node's own `<style> class { FontStyle italic; FontSize 18; header {…} }` cascade (member rows draw 14/upright where the jar draws 18/italic). |
| `rusuzi-21-kile910` (extra) | **FIXED** | `title <font size=18>Pragma Multi Test</font>` — 3 structural + 182 numeric → **0/0, conformant**. |

## Before → after (render-diff, structural + numeric)

| fixture | before | after | note |
|---|---|---|---|
| `kacico-91-bati232` | 23 + 63 | **0 + 13** | table + tree drawn; 34/34 children. Residual: 8px tree-indent and one `line/@y1`. |
| `galili-87-zivo129` | 7 + 48 | **3 + 0** | residual is the `<back:red>` filter only (§4c). |
| `manube-50-xora983` | 12 + 51 | **4 + 0** | creole now parsed INSIDE the table cells; residual is the three `<back:>` filters only. |
| `nucite-98-kuga991` | 10 + 7 | 10 + 7 | unmoved (different mechanism). |
| `nufini-44-jofo787` | 8 + 5 | 8 + 5 | unmoved. |
| `repuga-78-xora226` | 3 + 47 | 3 + 47 | unmoved. |
| `ropera-76-jico895` | 7 + 55 | 7 + 55 | unmoved. |
| `rusuzi-21-kile910` | 3 + 182 | **0 + 0** | conformant. |
| `beruje-75-jimu270` | 2 + 0 | 2 + 0 | unmoved (M7's `<back:>` filter, not chrome). |

## §4 — the exact out-of-set changes this task is blocked on

a. `src/core/klimt/document-shell.ts#unwrapContentG` (`:304-311`): return
   `''` for a self-closing empty content `<g …/>`. One line, measured: 14
   newly-erroring fixtures → 1.
b. A sprite/emoji/img resolver channel into the chrome seam:
   `src/index.ts` (both `applyChrome` call sites) + the three
   `tests/oracle/svg-conformance/render-fixture-*.ts` harnesses, feeding
   `blocks-creole.ts#chromeAtomOps`. Closes `nereka-67-deco609` and
   restores the 24 sprite/emoji-in-chrome fixtures.
c. `<back:color>`: `FontConfiguration` (`klimt/shape/UText.ts`) needs the
   `extendedColor` field `CommandCreoleStyle.ts`'s own doc comment already
   names as deferred, plus the `feFlood` filter emission in
   `driver-text-svg.ts` (the filter machinery itself exists,
   `svg-graphics-shadow.ts:93-106`). Closes galili, manube, beruje.
d. `activity/letare-59-gore448`'s weightedScore rise 72 → 88 needs two
   unported creole features, both outside the write-set: `CreoleMode.FULL`'s
   `#`/`*` ordered-list numbering (`CreoleStripeSimpleParser.java:119-147`,
   never ported for either mode — the jar draws `1.`, we draw `#`) and the
   `<a target="_top" href=…>` wrapper klimt does not emit for a url atom.

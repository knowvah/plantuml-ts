# T1 — user-text → attribute audit table

Method (`.agent-notes/codeql-2026-09-19.md`): every path is RENDERED through
`renderSync` with `x"onload="alert(1)` (and `x--><script>evil()</script><!--`
wherever a comment is involved), every occurrence in the SVG is classified
(inside a tag = attribute, text content, inside `<!-- -->` = comment), and
the output is parsed with `@xmldom/xmldom` (D7). Nothing below was concluded
from reading alone. Probes: `tests/unit/core/attribute-injection.test.ts`.
Oracle bytes are quoted verbatim from `findings/oracles/<name>/jar.svg`,
rendered with `scripts/oracle-render.sh`.

Verdicts: `escaped` (an entity is present, OR the accepting grammar restricts
the charset so no `& < " >` can arrive — the "Escaped where" column says
which and cites it), `swapped` (`"`→`'`), `raw` (defect), `synthetic` (not
derived from user text), `n/a` (unported / no sink; why), `dot-audit-only`.

Tally: 61 rows — escaped 41 · swapped 3 · raw 5 · synthetic 4 · n/a 7 ·
dot-audit-only 1.

## Oracle findings (the three the brief asked for, plus one)

- **`tooltip-gt`** (`A -> B : [[http://e.com{a>b} t]]`): jar emits
  `title="a>b" xlink:title="a>b"` — `>` RAW. Port emits `title="a&gt;b"
  xlink:title="a&gt;b"` (`src/core/svg.ts:139` `XML_RE = [&<>"]`).
  **D3 stands** (no flip): `escapeXml` should escape `& < "` only.
- **`quoted-alias`**: the brief's `class "n" as "a b"` is a JAR SYNTAX ERROR
  (line 2) — `NameAndCodeParser.java:52-60` `CODE1` is the unquoted `CODE`
  pattern; a quoted code exists only as `CODE4 = [%g]([^%g]+)[%g]` (`:67`),
  i.e. `class "a b"`. Rendered that: jar emits `<!--class a b-->`,
  `<!--link C to a b-->`, `data-qualified-name="a b"`, `id="C-to-a b"`
  (space raw in the id). Port emits byte-identical comments/ids.
  **D4 stands**: escape only, no charset validation.
- **`font-name-chars`** (`skinparam defaultFontName a"b&c<d`): jar emits
  `font-family="a'b&amp;c&lt;d"` — `"`→`'` swapped AND `&`/`<` escaped.
  Port emits `font-family="a&b<c"`-style raw (xmldom fatal: `Unescaped '<'
  not allowed in attributes values`). The known `raw` defect; T3a's target
  bytes are the jar's.
- **`comment-close`** / **`comment-close-desc`** (added; class, package, link
  and component named `x--><script>evil()</script><!--`): jar emits
  `<!--class x- -><script>evil()</script><!- - -->`,
  `<!--cluster p- -><script>evil()</script><!- - -->`,
  `<!--link A to x- -><script>evil()</script><!- - -->`,
  `<!--entity c- -><script>evil()</script><!- - -->` — `--` defanged to
  `- -` everywhere (`XmlWriter.java:119`). Jar link id:
  `id="A-to-x-->&lt;script>evil()&lt;/script>&lt;!--"` (`<` escaped, `>`
  raw). Jar `data-qualified-name="p--..script.evil....script...--.B"`
  (non-word → `.`; a fidelity note, not this mission's).

## NEW finding — live `<script>` via the class-diagram comments (`raw`)

`src/diagrams/class/renderer-group.ts:83` (`<!--class ${name}-->`), `:93`
(`<!--cluster ${name}-->`) and `:123` (`<!--link ${from} to ${to}-->`)
interpolate the user's code without the `--` defang the description path gets
from `XmlWriter.comment` (`src/core/klimt/drawing/svg/xml-writer.ts:103-108`).
`class "x--><script>evil()</script><!--"` renders
`<!--class x--><script>evil()</script><!---->`: the `-->` closes the comment,
`<script>evil()</script>` is a live element, `<!---->` re-opens and closes.
It is WELL-FORMED XML, so D7's parse gate is blind to it — the test file adds
a `liveMarkup` DOM walk (no `script` element, no `on*` attribute) and carries
four `it.todo`s for this. Comment context, not attribute context, so the
brief's stop condition was not literally met; the orchestrator should read
this before T2/T3 run. `object` and `package` share the sink.

## Table

| Path | Sink (file:line) | Escaped where | Verdict | Note |
|---|---|---|---|---|
| class / object display name → `<text>` | klimt text emission, `src/core/klimt/drawing/svg/svg-graphics-elements.ts:227` | `src/core/svg-format.ts:186` `escapeText` (`& <`) | escaped | `x"onload="alert(1)` → text `x"onload="alert(1)`; `<`→`&lt;`, `"`/`>` raw as the jar |
| class / object code → `<!--class NAME-->` | `src/diagrams/class/renderer-group.ts:83` | none | raw | `class "x--><script>evil()</script><!--"` → `<!--class x--><script>evil()</script><!---->` (live `<script>`); jar `<!--class x- ->…<!- - -->`. A `"` in a comment is legal (`<!--class x"onload="alert(1)-->`) |
| package / namespace name → `<!--cluster NAME-->` | `src/diagrams/class/renderer-group.ts:93` | none | raw | `<!--cluster p--><script>evil()</script><!---->`; jar `<!--cluster p- ->…` |
| class link endpoints → `<!--link A to B-->` | `src/diagrams/class/renderer-group.ts:123` | none | raw | `<!--link A to x--><script>evil()</script><!---->`; jar `<!--link A to x- ->…` |
| class / object / package code → `data-qualified-name=` | `src/diagrams/class/renderer-group.ts:84`, `:94` | `escAttr` `:52` (`[&<>"]`) | escaped | `data-qualified-name="x&quot;onload=&quot;alert(1)"`, `"x--&gt;&lt;script&gt;…"`; jar dots non-word chars (see oracles) |
| class link id `<alias>-to-<alias>` | `src/diagrams/class/renderer-edge.ts:118` | `escapeIdAttr` `:96` (`[&<"]`; `>` deliberately raw, jar-verified) | escaped | `id="A-to-x&lt;b&amp;c'd"`, `id="C-to-a b"`; NOT synthetic when the entity is declared by a quoted code (`class "a b"`) — D4 record above |
| class entity / link uids `ent0001`, `lnk3` | `src/diagrams/class/renderer-uid.ts:67`, `:72` | — | synthetic | counters |
| state display name / description → `<text>` | state text emission (`src/core/svg.ts` `text`) | `src/core/svg.ts:161` `escapeXmlText` | escaped | `state S2 : x"onload="alert(1) & <b>` → `x"onload="alert(1) &amp; &lt;b>` |
| state code → `data-qualified-name=` | `src/diagrams/state/renderer-group.ts:66` | `escAttr` `:57` (`[&<>"]`) | escaped | `data-qualified-name="x--&gt;&lt;script&gt;evil()…"` |
| state transition → `<!--link S1 to S2-->` | `src/diagrams/state/renderer-group.ts:112` (raw interpolation) | transition grammar: a quoted-code endpoint is not parsed (probe `S1 --> "x-->…"` emits NO link), so only `\w` aliases reach it | escaped | `<!--link S3 to S1-->` only; same defect shape as the class rows if a quoted endpoint is ever accepted — T3a should defang here too |
| state uids `ent…`/`lnk…` | `src/diagrams/state/renderer-uid.ts:69`, `:74` | — | synthetic | counters |
| component / usecase code → `<!--entity NAME-->` | `src/core/svek/DecorateEntityImage.ts:339` `UComment` | `src/core/klimt/drawing/svg/xml-writer.ts:103-108` `comment()` `--`→`- -` | escaped | `<!--entity x- -><script>evil()</script><!- - -->`, byte-identical to the jar (`comment-close-desc`) |
| description package → `<!--cluster NAME-->` | `src/core/svek/Cluster.ts:289` `UComment` | `xml-writer.ts:103-108` | escaped | same defang |
| description link → `<!--link A to B-->` | `src/core/svek/SvekEdge.ts:203` `commentForSvg` → `UComment` | `xml-writer.ts:103-108` | escaped | `<!--link A to x- -><script>evil()</script><!- - -->` |
| description code → `data-qualified-name=` | `UGroup` → `xml-writer.ts:87` `attribute()` | `src/core/svg-format.ts:167` `escapeAttribute` (`& < "`) | escaped | attribute written by the XmlWriter seam |
| description link id `<code>-to-<code>` | `src/core/svek/SvekEdge.ts:218` `idCommentForSvg` → `xml-writer.ts:87` | `svg-format.ts:167` | escaped | `id="A-to-x-->&lt;script>evil()&lt;/script>&lt;!--"` — identical to the jar |
| description uids | `src/diagrams/description/renderer-uid.ts:39`, `:44` | — | synthetic | counters |
| participant / actor name → `<g><title>` + `<text>` | `src/diagrams/sequence/renderer-lifeline.ts:56` | `escapeXmlText` (`svg.ts:161`) | escaped | `<title>x-->&lt;script>evil()&lt;/script>&lt;!--</title>`; `"` raw in text |
| participant code / alias → id / class / comment | — | — | n/a | no sink: the sequence renderer emits no id, class or comment from participant codes (probe: code absent from the SVG) |
| sequence `box` title → `<text>` | sequence text | `escapeXmlText` | escaped | text only |
| `[[url]]`, `[[url{tooltip}]]` on a class → `href`/`xlink:href`/`title`/`xlink:title` | `src/core/svg.ts:396` `linkWrap` | `svg.ts:401-402` `escapeXml` (`[&<>"]`) | escaped | `href="http://e.com/x&quot;onload=&quot;alert(1)" … title="x&quot;onload=&quot;alert(1)"`; after D3 `>` stays raw as the jar's `title="a>b"` |
| `[[url…]]` in sequence message / note | `src/diagrams/sequence/sequence-text.ts:157`, `:175` → `linkWrap` | `svg.ts:401-402` | escaped | `title="x--&gt;&lt;script&gt;evil()&lt;/script&gt;&lt;!--"` |
| `[[url{tooltip}]]` on a participant | `src/diagrams/sequence/renderer-participant-shapes.ts:269` → `linkWrap` | `svg.ts:401-402`; a `"` anywhere in the tail is rejected upstream of the sink (no `<a>` emitted) | escaped | `href="http://e.com/x&lt;b&amp;c" … title="t&lt;u&amp;v"`; tail grammar `src/diagrams/sequence/sequence-parse-helpers.ts:282` |
| `[[url…]]` on a state / in its transition label | `src/diagrams/state/renderer-box.ts:172` → `linkWrap` when reached | `svg.ts:401-402`; transition-label `[[…]]` is not creole-parsed (literal text, `escapeXmlText`) | escaped | payload version on the declaration emits no `<a>`; label renders `[[http://e.com/x"onload=…]]` as text |
| `[[url…]]` on component / usecase / their link label | `linkWrap` when reached; link label not creole-url-parsed | `svg.ts:401-402` / `escapeText` | escaped | payload version emits no `<a>`; label is literal text |
| `[[url…]]` in activity action labels | activity label text | `escapeXmlText` | escaped | not creole-url-parsed: `act [[http://e.com/x"onload=…]]` is literal text |
| `[[url{a>b}]]` tooltip — D3 gate | `svg.ts:401-402` | `escapeXml` escapes `>` today | escaped | port `title="a&gt;b"`; **jar `title="a>b" xlink:title="a>b"` (raw)** → D3 stands |
| `<img:path>`, `<img:path{scale=…}>` | `src/core/creole-atoms.ts:282` `CANNOT_DECODE_TEXT`; drawing stub `src/core/klimt/drawing/svg/svg-graphics.ts:157` throws "deferred per D3-prime" | path never reaches an attribute; rendered as literal `(Cannot decode)` (class body, message) or as escaped literal text (note) | n/a | image embedding deferred (D6 names `sanitizeSvg` as the wiring point) |
| `<$sprite>` reference | `<image xlink:href="data:image/png;base64,…">` from the sprite grid | data URI is built from the hex body (`src/core/sprite-commands.ts:142` body charset `[-_A-Za-z0-9]+`), never from the name; unknown name → literal text `&lt;$x"onload=…>` | synthetic | sprite NAME grammar (`sprite-commands.ts:79`, `:107`, `:142`) rejects `< & "` (syntax page) |
| inline SVG sprite `sprite $x <svg…>` carrying `<script>`/`onload` | `src/core/sprite-commands.ts:107-109` registers; `src/core/sprite-registry.ts:182` returns `undefined` for SVG sprites | never drawn; `<$evil>` is literal text | n/a | SVG-sprite drawing is behind the same D3-prime stub; D6 wiring point |
| creole `<color:…>` → `fill=` | `src/core/klimt/creole/command/CommandCreoleColorChange.ts:25` | grammar `(#[0-9a-fA-F]{1,6}\|#?\w+)`; unknown `\w+` name resolves away (0 occurrences of `xonloadq`) | escaped | payload → tag not recognised → literal text `&lt;color:x"onload=…>` |
| creole `<back:…>` → `fill=` | `CommandCreoleStyle.ts:143` | grammar `#hex6\|\w+` (+ gradient) | escaped | same |
| creole `<size:…>` → `font-size=` | `CommandCreoleSizeChange.ts:30` | grammar `\d+` | escaped | payload → literal text |
| creole `<font:…>` → `font-family=` (`"`) | `CommandCreoleFontFamilyChange.ts:22` (`[^>]+`) → `font-family` | swap sites: `src/core/svg-text-font.ts:31` `DQUOTE_RE` (string path: `svg.ts`/`svg-shapes.ts:112,150`) and `src/core/klimt/drawing/svg/svg-graphics-elements.ts:83` `split('"').join("'")` (klimt path) | swapped | `font-family="x'onload='alert(1)"` in both a message and a class body; `<font color=… size=…>` with the payload falls through to the same tag → `font-family="color=x'onload='alert(1) size=x'onload='alert(1)"` |
| creole `<font:a&b<c>` → `font-family=` (`& <`) | same | none for `&`/`<` at either swap site | raw | `font-family="a&b<c"` (xmldom fatal); jar `font-family="a'b&amp;c&lt;d"` — `it.todo` |
| creole `<font color= size=>` (attribute form) | `CommandCreoleColorAndSizeChange.ts:64-65` | grammar `\d+` / `#hex6\|\w+` | escaped | `<font color="red" size="20">` → `font-size="20" fill="#F00"`; payload does not match and falls to the `<font:` row |
| inline `#color` on class (`#red/blue`, `#?light:dark`, `#name`) → `fill=`/`stroke=` | `src/diagrams/class/class-declaration-extractors.ts:50` `COLOR_RE`; links `class-relationship-parser.ts:140` `REL_COLOR`; notes `class-notes.ts:51`, `:352` | grammar `#\w+[-\\\|/]?\w+` family — payload is a syntax error | escaped | unknown `\w+` name reaches `fill="#xonloadq"` verbatim (charset-safe; fidelity: jar would resolve or drop) |
| inline `#color` on participant / arrow / note / group / box → `fill=` | `src/diagrams/sequence/sequence-parse-helpers.ts:274` `(#\w+)$`; `sequence-arrow-regex.ts:288` `LIFECOLOR`; `command-note-factory.ts:29`; `command-grouping.ts:102` | grammar `#\w+` | escaped | `fill="#xonloadq"`; a valid `box … #red` emits `fill="#red"` (unresolved name — fidelity note) |
| inline `#color` on state / transition | `src/diagrams/state/state-commands-declarations.ts:96` `COLOR_OPT` | grammar `#\w+…` | escaped | `fill="#xonloadq"` |
| inline `#color` on component / usecase / link | `src/diagrams/description/link-grammar-regex.ts:153` `COLOR_TOKEN = \w+[-\\\|/]?\w+` | grammar | escaped | `fill="xonloadq"` (no `#`) |
| inline `#color` suffix on activity actions (`:a; #red`) | `src/diagrams/activity/dispatch-support.ts:23` `RE_ACTION` `(#\w+)` | grammar `\w+` | escaped | `fill="#xonloadq"` |
| activity `#red:act;` prefix, `\|#red\|lane\|` swimlane colour, `partition "…" {` | — (no arm in `src/diagrams/activity/parser.ts` / `node-dispatch.ts`) | — | n/a | unported syntax: each renders the syntax-error page (source echoed as escaped text) |
| `@startjson` `#highlight` / header colour | `src/core/command/CommandCreateJson.ts:71-73` | grammar `\w+…`; highlight key is text | escaped | `#highlight "x\"onload=…"` → text only |
| `skinparam *FontName` (`"`) → `font-family=` | `svg-text-font.ts:31` (sequence/string path), `svg-graphics-elements.ts:83` (klimt path) | swap `"`→`'` | swapped | `font-family="x'onload='alert(1)"` for `defaultFontName`, `classFontName`, `titleFontName`, `arrowFontName`, `classAttributeFontName` |
| `skinparam *FontName` (`& <`) → `font-family=` | same two sites | none | raw | port `font-family="a&b<c"` (both paths: `defaultFontName` in sequence, `classFontName` in class); jar `font-family="a'b&amp;c&lt;d"` — two `it.todo`s |
| `skinparam svgLinkTarget` → `target=` | `src/core/svg.ts:396` `linkWrap(…, target = '_top')` | not wired: `svg.ts:390-394` doc, named remainder g2 N15 | n/a | `target="_top"` constant in every `<a>`; payload absent |
| `skinparam linetype` → DOT `splines=` | `src/core/skinparam-key-handlers-table-a.ts:189-192` | enum: only `ortho` / `polyline` are stored | escaped | payload absent; see the DOT row |
| `skinparam dpi` | — (no handler in `skinparam-key-handlers-table-*.ts`) | — | n/a | unported; payload absent |
| `skinparam style / defaultTextAlignment / monochrome / shadowing / handwritten` | key handlers | normalised or dropped | escaped | zero occurrences of the payload in the SVG |
| `<style>` `FontName` → `font-family=` | `src/core/style-map-theme.ts:85` (arrow cascade) → link-label text | `svg-text-font.ts:31` swap | swapped | class link label `font-family="x'onload='alert(1)"`; `sequenceDiagram { FontName }` and `root { FontName Courier }` on entity text are not cascaded (no occurrence) — same `& <` hole as the font rows |
| `<style>` `FontColor / BackgroundColor / LineColor / HyperlinkColor / LineStyle` | colour resolver | resolved / dropped | escaped | zero occurrences of the payload |
| `!theme NAME` / `skin NAME` | `src/core/tim/EaterTheme.ts:109` keyword; `skin` is unported (`src/core/preprocessor.ts:36-37` cites upstream's `^skin\s+([\w.]+)$`, port renders the syntax page) | name selects a file, never emitted | n/a | zero occurrences; a theme's CONTENT is skinparam and takes the rows above |
| `@startdot` labels / ids / tooltips / node names | `src/diagrams/dot/layout.ts:51` `renderSvg(ast.dotContent, 'dot')` (`@knowvah/dot-engine`) | the engine's SVG writer | escaped | `id="x&quot;onload=&quot;alert(1)"`, `xlink:title="x&quot;onload=&quot;alert(1)"`, `<title>x&#45;&#45;&gt;&lt;script&gt;evil()…</title>` |
| title / header / footer / caption / legend → `<text>` | `<g class="title">` etc. | `escapeXmlText` | escaped | text only, all three diagram families probed |
| note and message text (`" < & >`) → `<text>` | sequence / class / state / activity note text | `escapeXmlText` / `escapeText` | escaped | `a "b" &lt;c> &amp; d` — `"` and `>` raw as the jar; comment payload → `x-->&lt;script>evil()&lt;/script>&lt;!--` |
| sequence divider / group / ref / delay / return text | sequence text | `escapeXmlText` | escaped | text only |
| class members, class and participant stereotypes → `<text>` | class body / stereotype text | `escapeText` / `escapeXmlText` | escaped | `«x"onload="alert(1)»`, `«x&amp;b»` |
| activity action labels, swimlane names, if/else/while labels → `<text>` | activity text | `escapeXmlText` | escaped | `|x&lt;b&amp;c'd|`; `endwhile (…"q")` with a `"` is a syntax error (grammar), the rest render |
| `@startjson` / `@startyaml` keys and values → `<text>` | `src/diagrams/json/renderer.ts:12` `text` from `core/svg.js` | `escapeXmlText` | escaped | `x-->&lt;script>evil()&lt;/script>&lt;!--` as a key and a value |
| syntax-error page (every grammar-rejected payload) | `src/core/error/PSystemErrorUtils.ts` | text escaping | escaped | echoes the source as `<text>`: `class "x"onload="alert(1)"`, `&lt;b&amp;c` |
| DOT emission (`src/core/svek-dot-emit.ts`, `svek-dot-emit-labels.ts`, `svek-dot-emit-clusters.ts`) | `svek-dot-emit-labels.ts:17` `hex()`; label tables `:54-61` (`labelTable`, `edgeLabelTable`), `:74`, `:94`, `:135` (`shieldTable`, `portTable`, `rowPortTable`); `svek-dot-emit.ts:133-143`; `svek-dot-emit-clusters.ts:76`, `:228`, `:298`, `:343` | `hex()` formats a NUMBER (`(n & 0xffffff).toString(16)`) as `#rrggbb`; every label table emits only `WIDTH`/`HEIGHT` (integers via `trunc`) and `BGCOLOR`/`COLOR` (via `hex`) around empty `<TD></TD>` cells; node ids are `rec.sh` and cluster ids `cluster.id` (synthetic); `linetype` arrives as the `ortho\|polyline` enum | dot-audit-only | no user STRING is interpolated into DOT, so no escaping function exists and none is needed; label TEXT is measured (width/height) and drawn by the port, never handed to graphviz. Nothing changed. |

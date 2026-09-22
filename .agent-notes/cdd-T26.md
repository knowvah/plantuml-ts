# cdd-T26 — inline images, sprites, openiconic, emoji atoms

## Summary

Of the six named fixtures, only ONE (`jabama-09-kago823`) is genuinely an
image/sprite atom-resolution gap; the diagnosis report's labels for the
other five were wrong in ways that mattered (see per-fixture sections).
`rotisi-30-loge424` and `malara-55-moce209`'s bodies already render sprites
correctly (R2i's prior work) — their ONLY residual is the diagram TITLE,
which is chrome (D5, `src/core/annotations/blocks.ts`, T28's seam).
`manube-50-xora983` has ZERO sprite content — it is a legend/table creole
parsing gap (also chrome, T28). `ziripa-77-zizo842` has ZERO sprite content
either — it is a creole extended-color-decoration gap, disproving the
diagnosis report's M7 attribution. `gekope-01-ricu859`'s OpenIconic glyph
renders byte-identical to the jar; its residual is a missing tab-stop
expansion in `class-member-creole.ts` (T24's file, same batch).

Fixed: `jabama-09-kago823` (diverged -> conformant). Verified via
`npm run svg:survey -- class --out <scratch>` + `pin-diff.mts` against the
committed `parity-class.json`: **exactly one transition**
(`jabama-09-kago823: diverged -> conformant`), zero regressions across all
723 class fixtures (492/104/127/0/0, up from 491/104/128/0/0).

## Observation: the diagnosis report mislabeled 3 of 6 fixtures as sprite/image work

- **Context**: the brief flagged `ziripa-77-zizo842` as possibly not
  sprite-related and told me to verify against the jar SVG before
  implementing (Context note). I extended the same verification to all six
  named fixtures before writing any code, per CLAUDE.md's "read the Java
  first" / "verify a scope claim" rules.
- **Finding**: `manube-50-xora983`'s source
  (`test-results/dot-cache/class/manube-50-xora983/in.puml`) contains ZERO
  `<$sprite>`/`<img:>` references — it is a `legend`/table with
  `<back:#FF0000>   </back>` cells. Our current render shows the ENTIRE
  legend table literal (`|= |= Type |`, `|<back:#FF0000> </back>| Type A
  class |`, etc.) as raw, unparsed text — creole/table syntax is not run
  inside a `legend` block AT ALL. `ziripa-77-zizo842`'s source contains
  `<u:#FF0000>toto</u>`, `<w:green>green</w>`, `<s:#00FFFF>strike</s>`,
  `<back:red>ok</back>` — again zero sprite/img markup; these are creole
  DECORATION tags with an extended colour argument.
- **Impact**: neither fixture belongs to T26 (img/sprite/openiconic/emoji
  atom resolution). See their own sections below for disposition.
- **Confidence**: High — read each fixture's raw `.puml` directly.

## Observation: A3-style.md §M7's mechanism is disproven by direct jar SVG read

- **Context**: the T26 brief's Context note suggested `ziripa`'s mechanism
  "more closely matches diagnosis/A3-style.md §M7's wave-underline
  `<filter>` mechanism". M7 itself states (HIGH confidence, but explicitly
  "did NOT read the Java filter-emission code") that `beruje-75-jimu270`'s
  `<w>This is wave</w>` (no colour) needs an SVG `<filter>` def.
- **Finding**: read `test-results/dot-cache/class/beruje-75-jimu270/in.svg`
  directly. Its ONE `<filter>` (`feFlood flood-color="#FFF000"`) is
  attached to `<back:#FFF000>string nouvelAttributi</back>`'s `<text
  filter="url(#...)">` — NOT to `<w>This is wave</w>`, which instead emits
  plain `text-decoration="wavy underline"` (no filter). Our port's CURRENT
  render for `beruje-75-jimu270` already matches the wave/strike output
  exactly (`compareSvg`: `structural=2`, both attributable to the MISSING
  `<back:>` filter, not to `<w>`). M7's own mechanism attribution (filter
  belongs to `<w>`) is factually wrong for its own cited fixture; the
  filter belongs to `<back:>`.
- **Impact**: M7 should be corrected (filter mechanism = `<back:color>`,
  not `<w>`) or retired in favour of a new, correctly-attributed mechanism
  — see "ziripa disposition" below. Not amended in `diagnosis/A3-style.md`
  itself (outside T26's write-set); flagged here per stop 11 (a
  HIGH-confidence report mechanism disproved by measurement).
- **Confidence**: High — direct jar SVG read, corroborated by
  `compareSvg`'s own diff output on the live fixture.

## rotisi-30-loge424 / malara-55-moce209 — title is chrome, not this task

- **Before**: `rotisi-30-loge424` 30 numeric diffs, all a uniform
  Δ2.152px vertical cascade (everything below the title shifted down).
  `malara-55-moce209`: large numeric diffs from a title/body geometry
  mismatch.
- **Mechanism**: `class Toto`'s body content (`<$bug16>`, `<$printer8>`,
  etc, member rows) ALREADY renders byte-identical `<image>` elements to
  the jar (verified: `measurements/out/rotisi-30-loge424.ours.svg`'s
  `<image>` `xlink:href` base64 PNGs render for every member-row sprite —
  R2i's prior work). The ONLY divergent element is `<g class="title">`,
  which our port draws via `src/core/annotations/blocks.ts
  #buildAnnotationBlock` (measures/draws each display LINE as plain text,
  `measureLines`/`drawLines`, no creole atom resolution at all) — literally
  `I am &lt;$bug16> and &lt;$printer8> and &lt;$printer4>` as one raw
  string. This is EXACTLY D5's decision: "Chrome creole is fixed at the
  shared seam, for every diagram type" — `title`/`legend`/`header`/
  `footer`/`caption` all route through `core/annotations/blocks.ts`, owned
  by T28, gated on "the full suite with zero unjournaled movers in ANY
  engine" (a class-only wrapper was explicitly rejected in D5).
- **File + one-line change needed**: `src/core/annotations/blocks.ts
  #buildAnnotationBlock`/`measureLines`/`drawLines` need to route each
  display line through the shared creole atom lexer (`buildLineAtoms`,
  `core/klimt/creole/legacy/StripeSimple.ts`) instead of a raw
  `measurer.measure(line, font)` call, resolving `<$sprite>`/successfully-
  decoded `<img:data:...>` atoms to `<image>` elements the same way
  `class-member-atom-resolve.ts#resolveInlineAtom` already does for member
  rows.
- **Disposition**: STOP (stop condition 1 / D5). Not this task's write-set
  (`src/core/annotations/`); T28's territory per the brief's own explicit
  boundary note ("title (diagram title) is CHROME... that is T28's seam").
- **Confidence**: High (direct SVG/source read, D5 citation).

## jabama-09-kago823 — FIXED: namespace/cluster-title `<img:>` fallback

- **Before**: `structural=0 numeric=88`, all a uniform +108px canvas-width
  / +54px-per-child cascade (`svg:width 268 exp -> 376 act`).
- **Mechanism**: `namespace "MyNamespaceName <img:HelloWorld.png{scale=
  1.5}>" as net.f-oo` — this is a REAL `<img:>` reference, but to a plain
  file path (not a data URI, not `http`), which `AtomImg.create`'s
  file-exists check fails under upstream's own non-`INSECURE` security
  profile (`~/git/plantuml/.../klimt/creole/atom/AtomImg.java:171-177`),
  landing on the short `(Cannot decode)` fallback — NOT a rendered
  `<image>`. This port's browser-safe architecture (no filesystem access in
  `src/`, project CLAUDE.md) means this branch is ALWAYS taken for a
  file-path `<img:>` reference, deterministically. The fallback mechanism
  itself was ALREADY fully ported (`src/core/creole-atoms.ts
  #CANNOT_DECODE_TEXT`, `src/core/klimt/creole/legacy/StripeSimple.ts
  #IMG_FALLBACK_FONT`/`buildLineAtoms`) and used by the description engine
  — the gap was that `class-namespace-shape.ts#renderNamespaceFolder`/
  `getWTitle` and `class-namespace-title-table.ts#namespaceTitleTableDims`
  drew/measured `geo.label`/`display` as ONE raw string, never routing it
  through `buildLineAtoms` at all (same "title/cluster-title render path
  drops to literal text" shape the brief named for this task, but for the
  NAMESPACE title, which is class-diagram structural content, not
  diagram-wide chrome — D5 only lists title/legend/header/footer/caption).
- **Fix**: new `src/diagrams/class/class-namespace-title-runs.ts`
  (`namespaceTitleRuns`, `namespaceTitleWidth`, `renderNamespaceTitleRuns`)
  resolves a title label through `buildLineAtoms`, producing one run per
  `CreoleAtom` `'text'` kind (a markup-free label reduces to exactly ONE
  run at the base font — measurement- and render-IDENTICAL to the
  pre-existing single-string path, verified by the `renderNamespaceFolder`
  test asserting byte-identical output with/without a measurer for a
  plain label). Wired into `getWTitle` (render sizing),
  `namespaceTitleTableDims` (DOT-graph sizing — this is what actually
  drove the +108px cascade, not the visible title glyph box), and
  `renderNamespaceFolder` (draw, now taking an optional `measurer` — falls
  back to the untouched single-`<text>` path when absent, e.g. hand-built
  test fixtures). `renderer.ts`'s one call site now threads its own
  already-available `measurer` through.
- **Scope note**: `renderNamespaceRect` (`skinparam packageStyle rect`) and
  `renderEmptyPackageIcon` (collapsed-empty package leaf) have the
  IDENTICAL literal-string gap, unfixed — no fixture in this task's set
  exercises either path. Named here rather than fixed speculatively.
  `<$sprite>`/a successfully-decoded `<img:data:...>` atom (the `'inline'`
  `CreoleAtom` kind) is also unhandled in `namespaceTitleRuns` — skipped,
  not drawn — for the same reason (no fixture to verify against).
- **Write-set extension**: `class-namespace-shape.ts`,
  `class-namespace-title-table.ts`, `class-namespace-title-runs.ts` (new),
  `renderer.ts` are NOT in T26's literal write-set, but are not owned by
  any other batch-7 task either (checked against T24/T25/T27/T28's lists).
  Extended per `decisions.md`'s push-forward clause ("Choose the exact
  split of a hot file between two tasks when the write-sets are ambiguous,
  provided no two agents write one file in the same batch"). Verified
  zero-regression via `pin-diff.mts` against the full 723-fixture class
  survey (see Summary).
- **After**: `structural=0 numeric=0` (conformant).
- **Confidence**: High — jar-verified byte-exact (`>MyNamespaceName</text>`
  bold, `>(Cannot decode)</text>` monospace non-bold, same y, sequential
  x), full-corpus re-survey shows exactly this one transition.

## manube-50-xora983 — disposition: NOT this task, chrome legend parsing (T28)

- **Before/after (unchanged — no fix attempted)**: numeric diffs dominated
  by a ~83px horizontal offset cascade plus legend box width/height (jar
  114x163 vs ours 280x159).
- **Mechanism**: the `legend`/`endlegend` block's `|= |= Type |` /
  `|<back:#FF0000> </back>| Type A class |` pipe-table creole syntax is
  drawn as ONE literal string per row (`>|&lt;back:#FF0000> &lt;/back>|
  Type A class |<`) — creole/table parsing does not run inside a `legend`
  block at all in this port. The jar's `<filter><feFlood>` defs (3, one per
  coloured cell) are the RENDERED result of `<back:color>` once the table
  IS parsed — a downstream consequence of the parsing gap, not a
  standalone "sprite recolour" feature. There is no `<$sprite>`/`<img:>`
  reference anywhere in this fixture's source.
- **Disposition**: NOT T26 (no image/sprite content to resolve). Matches
  D5's chrome-creole decision (`legend` is explicitly named alongside
  `title`/`header`/`footer`/`caption`) — T28's territory, and per D5's own
  citation, table/creole parsing inside a legend needs MORE than
  `buildLineAtoms` (it needs the creole-TABLE-cell parser,
  `core/creole.ts`, per `StripeSimple.ts`'s own module doc comment on why
  cell-alignment/table markup is a separate, already-ported subsystem).
  Corrects the brief's own acceptance-criterion premise ("its sprite-
  recolour `<filter>` defs" — there is no sprite here to recolour).
- **Confidence**: High — direct `.puml`/`in.svg` read, zero sprite tokens
  in source.

## ziripa-77-zizo842 — disposition: NOT this task, NOT M7, a new mechanism

- **Before/after (unchanged — no fix attempted)**: `structural=5
  numeric=0` (clean, isolated): `defs[1][childCount]` (missing 1 filter),
  `text[2]/@text-decoration=underline` (should be a coloured `<line>`, not
  CSS text-decoration), `text[6]/@text-decoration=line-through` (same,
  strike), `text[8]/@filter` (missing, `<back:red>`'s feFlood),
  `g[5][childCount]` (13 vs 11 — the 2 missing `<line>` elements).
- **Mechanism**: `<u:#FF0000>toto</u>` and `<s:#00FFFF>strike</s>` (BOTH
  carry an extended colour) render in the jar as a manual coloured
  `<line>` drawn under/through the text (`stroke:#F00`/`stroke:#0FF`,
  `stroke-width:0.464`) — NOT the CSS `text-decoration` attribute this
  port emits for every underline/strike run regardless of colour.
  `<w:green>green</w>` (ALSO carries a colour) renders as plain
  `text-decoration="wavy underline"` with NO colour applied at all —
  coincidentally already byte-identical to what this port emits (both sides
  drop the colour for WAVE specifically), so wave is NOT a residual here.
  `<back:red>ok</back>` needs the SAME `<filter><feFlood
  flood-color="#FF0000">` mechanism as `beruje-75-jimu270`'s `<back:>` (see
  the M7 disproof above) and `manube-50-xora983`'s legend cells — ONE
  shared BACKCOLOR-filter mechanism, reused across three fixtures/three
  unrelated render paths.
- **Root cause of why nothing is wired**: `src/core/klimt/creole/command/
  CommandCreoleStyle.ts`'s `EXTENDED_COLOR_ARM` regex group is
  NON-CAPTURING (`(?::(?:#[0-9a-fA-F]{6}|\w+))?`) — the colour is matched
  (so `<u:#FF0000>` is recognized as a valid UNDERLINE activation) but
  never extracted into a variable, and `AddStyle.ts`'s own doc comment
  confirms: "the captured color VALUE is consumed but not yet applied...
  this port's `FontConfiguration` has no `extendedColor` field yet — a
  driver-side rendering concern, deliberately deferred." Fixing this needs:
  (1) capturing the colour group, (2) widening `FontConfiguration` with an
  `extendedColor` field (`AddStyle.ts`, `UText.ts`), (3) new render logic
  in EVERY consumer of underline/strike/backcolor text-decoration
  (`renderer-note.ts`/`renderer-note-lines.ts` for this fixture,
  `renderer-classifier-rows.ts` for `beruje-75`, chrome/legend for
  `manube-50`, plus sequence/state's own copies) to emit a coloured
  `<line>` (u/s) or `<filter><feFlood>` (back) instead of a bare CSS
  `text-decoration` string.
- **Disposition**: NEITHER this task (zero sprite/img content) NOR M7 (M7's
  own cited mechanism — filter belongs to `<w>` — is disproven by direct
  jar SVG read; see above). This is a THIRD, previously-unnamed mechanism:
  "creole extended-colour decoration rendering" — an engine-wide
  `FontConfiguration` widening comparable in shape/scope to `cdd-T19`'s
  M8a finding (also filed as out-of-task, engine-wide). Recommend filing to
  `planning/next-missions.md` rather than forcing a fix into any single
  batch-7 task's write-set.
- **Confidence**: High for the mechanism (jar-verified, isolated 5/0 diff,
  zero residual once accounted for); the exact fix SHAPE (where the
  coloured-line geometry constant comes from, e.g. `stroke-width:0.464`)
  is unverified — not read the Java's underline-line-drawing method.

## gekope-01-ricu859 — instrumented: tab-stop expansion missing (T24's file)

- **Before/after (unchanged — no fix attempted)**: large numeric diffs,
  every one a positional shift (Δ99/Δ112/Δ56/Δ43 etc on classifier member
  columns) — NOT a size/icon interaction bug.
- **Mechanism**: `<size:12><&key></size><b>ID      \t\t Integer` — the
  OpenIconic `<&key>` glyph itself is BYTE-IDENTICAL to the jar (verified:
  our `<path d="M19.5,38 C18.12,38...">` for the key icon matches the
  oracle SVG's own path exactly, both fixtures' 4 icon occurrences). The
  divergence is entirely in the trailing `<b>ID      \t\t Integer` bold
  run: jar tokenizes on tab characters (`AtomText#getWidth`/`#drawU`,
  `klimt/creole/legacy/AtomText.java:239-256,210-233` — ALREADY ported in
  this repo as `src/core/klimt/creole/legacy/AtomText.ts`'s
  `atomTextWidth`/`tokenizeOnTabs`/`advanceToTabStop`, with a full,
  jar-verified `tabStop = fontSize*4 = 56px` doc comment) and draws ONE
  `<text>` per non-tab token at the advanced x (jar: `<text ...>ID</text>`
  at x=23, then `<text ...>Integer</text>` at x=135 = 23 + [56 (tab1) + 56
  (tab2)]). This port's `class-member-creole.ts#resolveOneAtom`'s `'text'`
  branch (`class-member-creole.ts:343`,
  `const width = measurer.measure(atom.text, spec).width;`) NEVER calls
  `atomTextWidth`/`tokenizeOnTabs` — it measures the WHOLE string
  (including literal tab characters, which the width table treats as
  0-width, same as a space) as one box, and the corresponding render path
  draws it as ONE literal `<text>ID      \t\t Integer</text>` (verified:
  `measurements/out/gekope-01-ricu859.ours.svg` — width 57.487, exactly
  `measure("ID")+measure("Integer")` with zero tab-stop expansion, and the
  raw tab characters are embedded in the SVG text content, which will not
  render as visible tabs in a browser either).
- **File + one-line-ish change needed**: `class-member-creole.ts
  #resolveOneAtom`'s `'text'` branch (line ~343) needs to route through
  `atomTextWidth(atom.text, spec.size, (s) => measurer.measure(s,
  spec).width)` (already exported from `core/klimt/creole/legacy/
  AtomText.ts`) instead of a plain `measurer.measure` call; the render side
  (likely `renderer-classifier-rows.ts`, not clearly owned by any
  batch-7 task) needs to split a tab-bearing text atom into one `<text>`
  per `tokenizeOnTabs` non-tab token at its own advanced x, mirroring
  `AtomText#drawU`'s two-tokenizer-call shape.
- **Disposition**: STOP (stop condition 1) — `class-member-creole.ts` is
  explicitly T24's write-set (same batch-7, running in parallel). Not
  OpenIconic/img/sprite/emoji atom resolution (T26's actual scope); the
  icon itself needs no change.
- **Confidence**: High — byte-exact icon path comparison, exact arithmetic
  match on the jar's `x=135` position (23 + 2×56).

## Observation: DIVERGENCES.md href byte-shape criterion is vacuous for this task

- **Context**: acceptance criterion "every `href` this task emits follows
  the byte-shape of the existing `DIVERGENCES.md` sprite/img pass-through
  entry."
- **Finding**: the only fix landed (`jabama-09-kago823`) emits ZERO new
  `href`s — its fix path is the `(Cannot decode)` TEXT fallback, not an
  `<image>` element. No other fixture in this task's set was fixed.
- **Impact**: nothing to verify against `DIVERGENCES.md` this round.
- **Confidence**: High.

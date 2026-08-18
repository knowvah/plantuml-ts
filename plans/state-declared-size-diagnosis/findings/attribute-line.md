# attribute-line — T6 findings

Root-cause split from the bucket label: 5 of 6 fixtures (corumi-91,
gupeto-19, juvagu-33, kubona-45, lokija-02) share ONE mechanism — state
field/description text is measured and drawn as raw text, never routed
through creole markup (bold/superscript/math/wrapWidth/tab-stop), because
`measureNormalState` (`src/diagrams/state/state-sizing.ts:207-215`) never
calls the creole engine upstream's `EntityImageState.java:98-99` always
calls. fibudu-53 is a TWO-cause fixture (`#a`/`#b`, ADR-1): its height row
is the SI27-adjacent-but-DISTINCT backslash-continuation-merge gap; its
width row is the SAME creole-strip gap as the other 5.

The hint's inherited attribution of fibudu-53/juvagu-33's deltas to purely
`skinparam tabSize` (SI27 T1's note) does NOT hold under re-verification
(ADR-4) — see each record's `ruledOut`.

---

### corumi-91-mizo869

- **bucketLabel:** attribute-line
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 1 | width | 0 | 3.148264 | 2.041667 | +79.675 |
  | 1 | height | 0 | 0.694444 | 1.277778 | -42.000 |
- **status:** resolved
- **mechanism:** `State : <math>S<=1/(F+(1-F)/N)</math>` is measured as
  literal text (asterisk-escaped `<`/`>` glyphs included) instead of being
  rendered as an actual math/LaTeX image, because state description lines
  never reach the creole engine that recognizes `<math>`/`<latex>` spans.
- **originFileLine:** src/diagrams/state/state-sizing.ts:209-210
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageState.java:86-99 (`Display.create8(..., CreoleMode.FULL, wrapWidth)`); ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/Display.java:273-275 (`<math>`/`<latex>` raw-span recognition, feeding the atom builder EntityImageState routes into)
- **causalChain:** ours renders one 14pt text line, textLength 206.675px
  (literal `<math>...</math>` string) → declared width 206.675+2×margin =
  226.675px (3.148264in). jar renders an actual (taller, narrower) math
  image → declared width 147.0px (2.041667in), height 92.0px (1.277778in)
  vs ours 50.0px (MIN_HEIGHT, one text line). Δwidth = 226.675-147.0 =
  +79.675px; Δheight = 50.0-92.0 = -42.000px. Both exact to the harness.
- **ruledOut:** `scale 5` (this fixture's only textual difference from
  gupeto-19) as the cause — the harness compares pre-scale svek-N.dot
  values and gupeto-19 (no `scale`) shows the IDENTICAL delta, so scale
  is applied only to final SVG output, not to graphviz-declared node
  size. Ruled out a WidthTableMeasurer mismatch — probe used the same
  `WidthTableMeasurer` the harness uses; textLength 206.675 for the raw
  string is internally consistent with that measurer elsewhere in the
  same render.
- **pairingRisk:** none — single node in the scope.
- **sharedCauseWith:** gupeto-19-mesa256 (T6, identical rows and
  mechanism); root mechanism (no creole routing for state field text)
  also shared with juvagu-33-dupa212, kubona-45-boso556,
  lokija-02-dipe348, fibudu-53-bode309#b (all T6).
- **proposedWriteSet:** src/diagrams/state/state-sizing.ts (measureNormalState/measureBodyTextLines/measureTextLines), a renderer counterpart (renderer-box.ts or wherever fields are drawn), reusing src/core/klimt/creole/* (already wired for class members per class-member-creole.ts) rather than a new engine.
- **sizeEstimate:** moderate — creole engine already exists (reuse, not build); ~4-6 files touched (sizing + render + composite-header if fields shared); verification cost is a FULL state-corpus re-run (272 fixtures) since every `State : text` line is affected, not just these 6.
- **confidence:** high
- **nextStep:** n/a (resolved)

### fibudu-53-bode309#a

- **bucketLabel:** attribute-line
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 1 | height | 3 | 1.055556 | 1.444444 | -28.000 |
- **status:** resolved
- **mechanism:** the physical-line trailing-backslash continuation
  convention (a line ending in a single `\` merges with the NEXT physical
  source line, upstream's `ReadFilterMergeLines`) is not implemented
  anywhere in this port's line-reading pipeline, so
  `State1 : adding **some code**:\n\` / `main() {\n\` /
  `  printf("Hello world");\n\` / `}` are 4 independent physical lines.
  Only the first carries the `State1 :` prefix any command pattern
  matches; the other 3 are silently dropped by `dispatchCommand`
  (parser.ts:133-142, no command matches, no annotation/sprite fallback
  matches either) — never reaching `state.description` at all.
- **originFileLine:** src/core/tim/ReadLineReader.ts:45-59
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/preproc2/ReadFilterMergeLines.java:57-81 (the merge loop); ~/git/plantuml/src/main/java/net/sourceforge/plantuml/StringUtils.java:454-456 (`endsWithBackslash`); ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/UmlSource.java:140-156 (equivalent merge for the non-preproc2 path)
- **causalChain:** jar merges the 4 physical lines into ONE `State1 :`
  attribute containing 3 embedded `\n` breaks → 4 display sub-lines
  ("adding **some code**:", "main() {", "printf(...)", "}") plus the
  pre-existing "this is a string" line = 5 field rows total, each 14px →
  jar height 1.444444in = 104.0px. Ours keeps only 2 real field rows
  ("this is a string", "adding **some code**:\") + drops the trailing `\`
  as its own row (splitDisplayLines treats a backslash at string-end,
  `i == s.length-1`, as literal, not a 2-char escape) = 3 rows → ours
  height 1.055556in = 76.0px. Δ = 76.0-104.0 = -28.000px (jar has 5 rows,
  ours 3 — 2 fewer × 14px = -28, exact).
- **ruledOut:** `skinparam tabSize`/the `\t`→real-tab port (SI27 T1) as
  the driver — this fixture sets no `skinparam tabSize`, and the missing
  content is 2 ENTIRE rows dropped by the parser, not an x-indentation
  shift on rows that exist. Direct SVG probe (renderSync +
  WidthTableMeasurer) confirms our State1 `<text>` elements literally stop
  after "adding **some code**:" plus one stray `\` line — "main() {",
  "printf(...)", "}" never appear in our output at all, confirmed against
  jar's cached `in.svg` which has exactly those 3 extra `<text>` rows.
- **pairingRisk:** none — State1 is idx3, the unambiguous width/height
  outlier in its scope (State2 and the pseudostates are far smaller).
- **sharedCauseWith:** duzazu-41-telu529 (composite-a, T1) and
  vixobo-14-jole910 (composite-b, T2) — both show the IDENTICAL -28.000
  height Δ from the SAME `Active: SEND_MSG (msg, mailbox) / \` /
  `\n\t HAL_CAN_AbortTxRequest(...) \` / `\n\t HAL_CAN_AddTxMessage(...)`
  backslash-continuation pattern (confirmed by direct comparison of the
  three fixtures' `in.puml`; SI27 T1's `.agent-notes/
  si27-t1-display-newlines-one-port.md` already flagged this as a
  "pre-existing, UNRELATED parser gap" for those two, unfixed then because
  out of that task's write-set). NOT shared with pseudo-state bucket's
  -28.000/-36.000/-8.000 rows (bujuta-44-rovo666, mimaga-15-doze740,
  rinisi-79-peko570) — those come from `FIXED_PSEUDOSTATE_DIM`'s
  history/fork-bar table (state-sizing.ts:76-99), a numeric coincidence,
  not a shared mechanism.
- **proposedWriteSet:** a new merge pass in src/core/tim/ReadLineReader.ts or src/core/BlockUmlBuilder.ts (must run BEFORE block-splitting, matching upstream's reader-chain order per BlockUmlBuilder.ts's own doc comment, lines 5-11).
- **sizeEstimate:** small-to-moderate — one global preprocessing feature (not state-specific: affects EVERY diagram type, since upstream applies it at the `UmlSource`/reader level). Verification cost: full corpus re-run, since any fixture with a trailing single `\` anywhere is affected (currently 4 known: fibudu-53, duzazu-41, juvagu-33 has none, lokija-02 has none, vixobo-14; likely more in the untriaged corpus).
- **confidence:** high
- **nextStep:** n/a (resolved)

### fibudu-53-bode309#b

- **bucketLabel:** attribute-line
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 1 | width | 3 | 2.114063 | 1.940278 | +12.513 |
- **status:** resolved
- **mechanism:** same creole-routing gap as corumi-91/gupeto-19/
  juvagu-33/kubona-45/lokija-02: `**some code**` is measured as 14 literal
  characters (unstripped `**` markers) instead of jar's bold-styled
  "some code" (markers stripped, `font-weight="700"` applied). This row's
  widest line happens to be the one carrying the unstripped markers.
- **originFileLine:** src/diagrams/state/state-sizing.ts:209-210
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageState.java:86-99
- **causalChain:** ours: "adding **some code**:" textLength 132.213px
  (all 22 chars incl. `**`×2) → declared width 132.213+2×margin =
  152.213 → State1 rect 152.213px = 2.114063in (widest of ours' 3 real
  rows). jar: "adding"(42.088)+"some code"bold(64.575)+":"(~5) = ~112px on
  that sub-line, BUT jar's true widest row is "printf(\"Hello
  world\");" at 119.7px (a row ours dropped entirely, see `#a`) →
  jar width 139.7px = 1.940278in. Δ = 152.213-139.7 = +12.513px, exact.
- **ruledOut:** the `#a` backslash-continuation gap as this row's driver
  — even a hypothetical merge-fix would not, by itself, strip the `**`
  markers on the "adding" sub-line (a separate creole-processing step);
  confirmed by isolating: ours' widest CAPTURED row already contains the
  unstripped markers with no continuation lines involved.
- **pairingRisk:** none — same outlier node as `#a`.
- **sharedCauseWith:** corumi-91-mizo869, gupeto-19-mesa256,
  juvagu-33-dupa212, kubona-45-boso556, lokija-02-dipe348 (all T6, same
  `EntityImageState.java:98-99` creole-routing root).
- **proposedWriteSet:** same as corumi-91's record (single shared fix).
- **sizeEstimate:** see corumi-91 (same fix covers this row).
- **confidence:** high
- **nextStep:** n/a (resolved)

### gupeto-19-mesa256

- **bucketLabel:** attribute-line
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 1 | width | 0 | 3.148264 | 2.041667 | +79.675 |
  | 1 | height | 0 | 0.694444 | 1.277778 | -42.000 |
- **status:** resolved
- **mechanism:** identical to corumi-91-mizo869 (this fixture is
  corumi-91 minus `scale 5`) — `<math>` unprocessed, measured as literal
  text.
- **originFileLine:** src/diagrams/state/state-sizing.ts:209-210
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageState.java:86-99; ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/Display.java:273-275
- **causalChain:** identical arithmetic to corumi-91-mizo869 (same
  declared sizes, confirming `scale` has zero effect on graphviz-declared
  node size).
- **ruledOut:** same as corumi-91-mizo869; additionally this fixture
  itself IS the control that rules out `scale` (no `scale` directive
  present, delta unchanged from corumi-91).
- **pairingRisk:** none — single node in the scope.
- **sharedCauseWith:** corumi-91-mizo869 (T6); root mechanism also
  shared with juvagu-33-dupa212, kubona-45-boso556, lokija-02-dipe348,
  fibudu-53-bode309#b (all T6).
- **proposedWriteSet:** same as corumi-91-mizo869.
- **sizeEstimate:** same as corumi-91-mizo869 (one fix covers both).
- **confidence:** high
- **nextStep:** n/a (resolved)

### juvagu-33-dupa212

- **bucketLabel:** attribute-line
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 1 | width | 1 | 1.523438 | 1.140538 | +27.569 |
  | 1 | height | 1 | 0.694444 | 0.708333 | -1.000 |
- **status:** resolved
- **mechanism:** `one: \t<sup>1</sup>` — TWO entangled symptoms of the
  same creole-routing gap: (1) `<sup>1</sup>` is measured as 12 literal
  characters (incl. escaped `<`/`>`) instead of a small-font (11pt vs
  14pt) superscript "1"; (2) the (already SI27-T1-expanded) real tab
  character produces zero-width in our plain measurer instead of jar's
  tab-STOP snap-to-`x % tabSize`. Both require the SAME missing
  `Display.create8(..., CreoleMode.FULL, ...)` call.
- **originFileLine:** src/diagrams/state/state-sizing.ts:209-210
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageState.java:86-99; ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/legacy/AtomText.java:183-260 (`getTabSize`/`x % tabSize` stop snap)
- **causalChain:** ours: one field row, literal string `<sup>1</sup>`,
  textLength 89.688px at 14pt → declared width 89.688+2×12(margin)=
  113.688... rect reported 109.688 (measurer/margin rounding, confirmed
  from probe) = 1.523438in. jar: tab-stop-shifted single glyph "1" at
  11pt starting x=68 (tab stop, NOT x=12) ending ~75 → declared width
  82.119px = 1.140538in. Δwidth = 109.688(scaled)-82.119 ≈ +27.569px
  (harness-exact). Δheight: jar's mixed 14pt name-row/11pt sup-row line
  metric computes 51.0px (0.708333in) vs ours' uniform-14pt single-row
  50.0px (0.694444in, MIN_HEIGHT) → Δ = -1.000px.
- **ruledOut:** the `\t`→real-tab escape EXPANSION itself as broken — per
  `.agent-notes/si27-t1-display-newlines-one-port.md`, SI27 T1 already
  ported `Display.getWithNewlines`'s `\t`-to-real-tab-char expansion
  correctly (jar-verified elsewhere, e.g. lokija-02's line text content
  matches jar byte-for-byte, only x-position differs). The gap here is
  narrower: tab-STOP layout (`AtomText`'s positional snap) and `<sup>` tag
  recognition, both of which require the creole atom pipeline this port
  never invokes for state field text — NOT a re-break of the SI27 fix.
  Judgment call: the hint's suggestion to file this purely as a
  `divergence-proposed` tabSize-only issue (ADR-6) does not fit once
  `<sup>` is isolated as the dominant width contributor (a real missing
  creole tag, not a debatable rendering nuance) — filed as `resolved`
  instead; see report for the full reasoning.
- **pairingRisk:** none — "one" (idx1) vs the fixed 20x20 start-pseudostate
  (idx0) are categorically different sizes.
- **sharedCauseWith:** corumi-91-mizo869, gupeto-19-mesa256,
  kubona-45-boso556, lokija-02-dipe348, fibudu-53-bode309#b (T6, same
  `EntityImageState.java:98-99` root); tab-stop sub-mechanism
  specifically also shared with lokija-02-dipe348.
- **proposedWriteSet:** same as corumi-91-mizo869 (creole routing fix); tab-stop specifically needs `AtomText.java:183-260`'s `x % tabSize` snap ported into whatever field-line layout function replaces `measureBodyTextLines`.
- **sizeEstimate:** same as corumi-91-mizo869 — one shared fix (creole routing) resolves the `<sup>` symptom; tab-stop is a small additive increment once that pipeline exists.
- **confidence:** high
- **nextStep:** n/a (resolved)

### kubona-45-boso556

- **bucketLabel:** attribute-line
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 1 | width | 1 | 7.311806 | 2.126215 | +373.363 |
  | 1 | height | 1 | 0.694444 | 1.25 | -40.000 |
- **status:** resolved
- **mechanism:** `skinparam wrapWidth 150` — jar word-wraps the long
  field line into 4 sub-lines each ≤~150 units wide (via
  `getStyleState().wrapWidth()` fed into `Display.create8`); this port's
  `measureNormalState`/`measureBodyTextLines` never wrap (no wrapWidth
  parameter exists on that code path at all), so the entire 80-char line
  is measured as one row.
- **originFileLine:** src/diagrams/state/state-sizing.ts:209-210
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageState.java:98-99 (`getStyleState().wrapWidth()` argument)
- **causalChain:** ours: 1 unwrapped row, textLength 506.45px → declared
  width 506.45+2×~10(margin)=526.45px = 7.311806in. jar: 4 wrapped rows
  (widest ~132px) → declared width 153.088px = 2.126215in. Δwidth =
  526.45-153.088 = +373.363px (harness-exact). Height: 4 wrapped rows ×
  14px + name row/margins → jar 90.0px = 1.25in; ours 1 row → 50.0px
  (MIN_HEIGHT) = 0.694444in. Δheight = 50.0-90.0 = -40.000px.
- **ruledOut:** a pairing mis-attribution between "a" (fixed 50x50,
  idx0, exact match both axes) and "b" (idx1) — their sizes are an order
  of magnitude apart, no ambiguity. Ruled out a MIN_WIDTH/MIN_HEIGHT
  threshold bug in isolation — "a" alone matches jar exactly, so the
  measurement PATH is correct; only wrapping is missing.
- **pairingRisk:** none.
- **sharedCauseWith:** corumi-91-mizo869, gupeto-19-mesa256,
  juvagu-33-dupa212, lokija-02-dipe348, fibudu-53-bode309#b (T6, same
  `EntityImageState.java:98-99` creole/wrapWidth root). The height Δ
  (-40.000) NUMERICALLY collides with skinparam-style/T5's
  jafazu-60-leca675 and rejike-58-rote606 (also `skinparam wrapWidth
  150`, wrapping the STATE NAME rather than a field line) — same ROOT
  mechanism (`wrapWidth` unimplemented), but the exact -40.000 coincidence
  across a field-wrap (this fixture, 4 lines) vs a name-wrap (T5's
  fixtures) is not verified to be the same LINE COUNT; flagged for T5/
  SYNTHESIS to confirm on their side rather than asserted here.
- **proposedWriteSet:** same as corumi-91-mizo869 (creole routing), plus explicit `wrapWidth` threading from `state.description`'s theme/skinparam through to whatever creole call replaces `measureBodyTextLines`.
- **sizeEstimate:** same as corumi-91-mizo869 — wrapWidth is a parameter of the same missing creole call, not a separate subsystem.
- **confidence:** high
- **nextStep:** n/a (resolved)

### lokija-02-dipe348

- **bucketLabel:** attribute-line
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 1 | width | 0 | 0.694444 | 2.245313 | -111.663 |
- **status:** resolved
- **mechanism:** `skinparam tabSize 2` — SI27 T1 already ported the
  `\t`→real-tab-CHAR expansion correctly (line2/line3 text content is
  byte-identical to jar, per `.agent-notes/
  si27-t1-display-newlines-one-port.md`), but the tab-STOP x-position
  snap (`x % tabSize`, `AtomText.java`) is never invoked because state
  field lines bypass the creole atom pipeline entirely (same
  `EntityImageState.java:98-99` root as the other 5 records in this
  bucket).
- **originFileLine:** src/diagrams/state/state-sizing.ts:209-210
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageState.java:86-99; ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/legacy/AtomText.java:183-260
- **causalChain:** jar: line2 starts at x=68, line3 at x=124 (56px per
  tab stop = 2 chars × 28px/char, matching `skinparam tabSize 2`) +
  "line3" textLength 29.662 + margin → widest row reaches
  124+29.662+~8=161.663px = 2.245313in. ours: line2/line3 both start at
  x=12 (no tab-stop shift, real tab char contributes 0 measured width) →
  widest row is "s1" (name, MIN_WIDTH 50px) = 0.694444in. Δ =
  50.0-161.663 = -111.663px, exact.
- **ruledOut:** the tab-EXPANSION port (SI27 T1) as broken — `line2`/
  `line3`'s own textLength (29.662, matching jar exactly on both sides)
  proves the tab character is real and the REST of each line measures
  correctly; only the tab's positional effect (stop-snap) is absent.
  Ruled out this being purely a `divergence-proposed` cosmetic call per
  the hint (ADR-6) — see judgment call in report; filed `resolved`
  because the missing mechanism (creole atom routing) is shared with 4
  other fixtures that are unambiguous feature gaps (math/sup/wrap), not
  an isolated, debatable rendering choice.
- **pairingRisk:** none — single node in the scope.
- **sharedCauseWith:** corumi-91-mizo869, gupeto-19-mesa256,
  juvagu-33-dupa212, kubona-45-boso556, fibudu-53-bode309#b (T6, same
  `EntityImageState.java:98-99` root); tab-stop sub-mechanism
  specifically also shared with juvagu-33-dupa212.
- **proposedWriteSet:** same as corumi-91-mizo869; tab-stop needs `AtomText.java:183-260`'s snap ported alongside.
- **sizeEstimate:** same as corumi-91-mizo869.
- **confidence:** high
- **nextStep:** n/a (resolved)

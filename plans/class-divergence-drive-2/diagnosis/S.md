# Group S — 17 small diverged singletons: mechanism report

| mechanism-id | fixtures | files | est. size |
|---|---|---|---|
| S-1 | sugifi-33-xefe083, sumule-00-pefa744 | `src/diagrams/class/class-namespace-resolve.ts` | 1-fixture-class, small |
| S-1b (unresolved) | xumofu-43-fode658 | `src/diagrams/class/class-namespace-resolve.ts`, `parser.ts` | unknown, next-instrument below |
| S-2 | pibifa-14-leno075, begico-70-guva302 (partial) | `src/diagrams/class/renderer-edge.ts`, `class-assoc-double-couple.ts` | small |
| S-3 | gabejo-44-juki791 | `src/core/skinparam-stereo-keys.ts` (new class-diagram entries) | medium |
| S-4 | begico-70-guva302 (partial), xoxuni-96-fere626 | `src/diagrams/class/class-relationship-parser.ts`, `class-geo-types.ts`, `renderer-edge.ts` | medium |
| S-5 | fumalu-64-vude116 | `src/core/style-cascade-class.ts` | small |
| S-6 | guxode-39-dobi371 (structural half) | `src/core/skinparam-key-handlers-table-b.ts` | small (1-line) |
| S-7 | tuguku-78-zega630 | `src/diagrams/class/class-visibility-icon.ts`, `src/core/style-cascade-class*.ts` | medium |
| S-8 | vuresa-33-kumu160 | `src/diagrams/class/class-edge-label-attach.ts`, `class-edge-label-anchor.ts`, `renderer-edge.ts` | medium |
| S-9 (owner: dot-engine) | rezoba-58-xaze387, jojime-80-savu279, guxode-39-dobi371 (numeric half) | none in this repo | n/a |
| S-10 | nesivu-99-cexu403 | `src/core/svg-text-font.ts`, a new `defaultmonospacedfontname` skinparam key handler | small |
| S-11 (unresolved) | rakuci-96-tuti371 | `src/diagrams/class/renderer-classifier-box.ts` or `renderer-package.ts` (unconfirmed) | unknown |
| S-12 (unresolved) | rojoxi-79-vimu822 | `src/diagrams/class/class-namespace-shape.ts` (unconfirmed) | unknown |
| S-13 | nisune-86-faji869 | already documented deferral, see below | n/a (deliberately deferred) |

All 17 fixtures assigned. Three (S-1b, S-11, S-12) are honest partial
diagnoses — evidence gathered, mechanism not fully closed; each has a
`ruled out` + `probe next` section instead of a guessed cause.

---

### sugifi-33-xefe083
- mechanism-id: S-1
- mechanism: `!pragma useIntermediatePackages false` collapses ALL dotted
  qualifier segments into ONE joined namespace id before namespace-chain
  creation, so only one `Namespace` object ever exists for the whole
  prefix. Upstream still walks the full per-segment Quark chain (the
  pragma only changes which segment gets DRAWN, not how many Quarks/uid
  ticks exist), so `eventuallyBuildPhantomGroups` mints one phantom uid
  tick per elided segment even though only the innermost is rendered.
  This port's collapse destroys that per-segment structure, so the sweep
  can only ever mint ONE tick regardless of dotted depth.
- java: `net/atmp/CucaDiagram.java:239-240` (`if (type.isLikeClass())
  eventuallyBuildPhantomGroups(location);` — tail of `reallyCreateLeaf`)
  and `:325-336` (walks `this.quarks()`, one `createGroup(...,
  GroupType.PACKAGE)`/uid tick per data-less quark with children);
  `net/sourceforge/plantuml/abel/Entity.java:171` mints the uid.
- ts: `src/diagrams/class/class-namespace-resolve.ts:418` — `const
  nsSegments = intermediatePackages ? qualifier : [qualifier.join(sep)];`
  collapses `['A','B']` to `['A.B']` for `class A.B.Z` when the pragma is
  false, so `ensureNamespaceChain` (`:129-141`) only ever registers ONE
  `Namespace`, and `eventuallyBuildPhantomGroups` (`:233-244`) can only
  mint one tick from it.
- causal chain: jar's `in.svg` for `class A.B.Z` shows leaf `Z` at
  `id="ent0001"` and the single drawn cluster `data-qualified-name="A.B"`
  at `id="ent0003"` — two phantom ticks (segments `A` and `A.B`) burned
  between the leaf and the drawn cluster. Our collapse produces exactly
  one `Namespace` object, so the sweep mints tick 2, giving `ent0002`
  where the jar expects `ent0003`. `sumule` (`A.B.C.D.Z`, 4 elided
  segments) reproduces the same deficit scaled up (expects `ent0005`,
  we give `ent0002`, always short by exactly `(qualifier.length - 1)`).
- ruled out: NOT a recurrence of the original (now-fixed) "chain built
  eagerly before the leaf" ordering bug — `cdd-T1`'s comment at
  `class-namespace-resolve.ts:127-141` and the `ensureNamespaceChain`
  call at `:426` (no `counter` argument passed) confirm the deferred,
  sweep-based ticking architecture SB1 called for is already in place.
  The residual is a segment-COUNT bug in the pragma-false collapse, not
  an ordering bug.
- probe: read `test-results/dot-cache/class/sugifi-33-xefe083/in.svg`
  directly (`grep -oE`) — jar emits exactly 2 top-level groups (`Z`
  id=ent0001, cluster `A.B` id=ent0003); read `class-namespace-resolve.ts`
  lines 415-426 to confirm the single-segment collapse. No fixture-level
  render probe needed beyond `render-diff.mts` (already run, output
  above).
- fix shape: `resolveQualified` must still walk the FULL per-segment
  quarks list for `eventuallyBuildPhantomGroups` purposes even when
  `intermediatePackages` is false — e.g. register one `Namespace` per
  original segment (as today when the pragma is true) but mark all but
  the last as "collapsed/not drawn" for the RENDER path, rather than
  never creating them. Touches `class-namespace-resolve.ts` (namespace
  registration) and whatever render code currently assumes one
  `Namespace` object = one drawn box for the pragma-false case.
- owner: this mission
- confidence: HIGH (both the Java-side sweep semantics and the TS
  collapse line are read directly; the `ent0001`/`ent0003` id gap is
  read from the oracle SVG, not inferred)

### sumule-00-pefa744
- mechanism-id: S-1 (same as sugifi, deeper qualifier: `A.B.C.D.Z`, 4
  elided segments instead of 2)
- mechanism / java / ts / causal chain / ruled out / probe / fix shape /
  owner: identical to sugifi-33-xefe083 above — the deficit scales with
  `qualifier.length - 1` (jar expects `ent0005`, we give `ent0002`, a gap
  of 3, matching 3 collapsed segments A, A.B, A.B.C before A.B.C.D is
  drawn).
- confidence: HIGH

### xumofu-43-fode658
- mechanism-id: S-1b (unresolved — related family, distinct cause)
- mechanism: NOT yet isolated. `java.lang.Object <|-- classic.collections.ArrayList`
  then `classic.collections.ArrayList <|-- net.sourceforge.plantuml.ArrayList`
  uses NO `useIntermediatePackages` pragma (default nested chain), so
  S-1's collapse bug does not apply. The observed defect is a 3-tick
  reordering: jar mints `classic`(4), `classic.collections`(5), then the
  leaf `classic.collections.ArrayList`(6) — packages BEFORE their leaf —
  while this port mints the leaf first (4) and the two packages after
  (5, 6), for the relation's SECOND endpoint only (the first endpoint's
  `java`/`java.lang` packages tick correctly, matching jar's 2/3 exactly).
- java: same `CucaDiagram.java:239-240,325-336` sweep as S-1, but the
  ORDER discrepancy implicates whatever different code path resolves the
  target (`classic.collections.ArrayList`) of a relationship's second
  endpoint versus its first.
- ts: `src/diagrams/class/class-namespace-resolve.ts` (`resolveQualified`,
  same function as S-1) is the mechanism CANDIDATE but not confirmed —
  the per-segment (non-collapsed) path is used here since no pragma is
  set, so S-1's specific collapse bug is ruled out by construction.
- causal chain: `render-diff.mts` structural diffs are positional swaps
  only (`g[3]`, `g[4]`, `g[9]` ids off by exactly the same rotation:
  jar 4,5,6 vs ours 5,6,4) — draw ORDER matches the jar exactly (same
  DOM position for `classic`, `classic.collections`, and the leaf), only
  the numeric uid VALUES are rotated, confirming this is a pure uid-tick
  timing issue, not a structural/ordering-of-elements issue.
- ruled out: the general SB1 architecture (deferred sweep via
  `eventuallyBuildPhantomGroups`, confirmed present and correct for the
  FIRST relationship endpoint `java.lang.Object`, which ticks 1,2,3
  exactly matching the jar) — so the deferred-sweep mechanism itself is
  proven correct; the bug is specific to a LATER relationship endpoint's
  resolution triggering the sweep at a different point than upstream.
- probe next: instrument `parser.ts`'s per-relationship-line processing
  loop (where `resolveReference`/`eventuallyBuildPhantomGroups` get
  called for each `<|--` line) with a counter-dump trace, to see whether
  the SECOND relationship's `classic.collections.ArrayList` endpoint
  resolution calls `eventuallyBuildPhantomGroups` BEFORE materializing
  its own leaf (unlike upstream, which per `CucaDiagram.java:239-240`
  only sweeps at the TAIL of `reallyCreateLeaf` — i.e. check whether this
  port's per-relationship-line code calls the sweep once per LINE instead
  of once per LEAF-CREATION, which would explain a leaf materializing
  before its own ancestor packages get their tail-sweep pass).
- owner: this mission (probable, pending the trace above)
- confidence: LOW (mechanism located to the right function family by
  elimination, not yet probe-confirmed to an exact call site)

### pibifa-14-leno075
- mechanism-id: S-2
- mechanism: the association-class couple connector `(A0, B1) . (A0, C2)`
  builds its two anchor-circle "apoint" entities correctly
  (`class-assoc-double-couple.ts:63-67` already assigns
  `apoint${counter.value}` names matching upstream's two
  `getUniqueSequence("apoint")` calls), but the CONNECTING half-edge
  between the two circles never gets `idEntity1Decor`/`idEntity2Decor`
  (or `.sourceDecor`/`.targetDecor`) populated — `renderer-edge.ts`'s own
  doc comment says this fallback ("couples/lollipop/map rows") is
  "documented best-effort, out of this iteration's arrow-matrix scope".
  With decor undefined at both ends, `linkIdForSvg` falls through to the
  DEFAULT `${ent1}-to-${ent2}` branch instead of the "no decor at all"
  branch that produces jar's plain `${ent1}-${ent2}` id. The same missing
  decor/dash resolution also explains the missing `stroke-dasharray:7,7`
  and the extra child (`childCount` 1→2, likely an unwanted arrowhead
  glyph drawn because "no decor resolved" isn't treated as "definitely no
  decor").
- java: `net/sourceforge/plantuml/abel/Link.java:106-114`
  (`idCommentForSvg()`, the three-way decor branch our `linkIdForSvg`
  ports); `CommandLinkClass.java:120-121` (the two `getUniqueSequence
  ("apoint")` calls, already correctly cited in
  `class-assoc-double-couple.ts:45-46`).
- ts: `src/diagrams/class/renderer-edge.ts:76-110` (`linkIdForSvg`,
  especially the doc comment at `:82-88` naming the couple fallback as
  best-effort, and the three-way branch at `:104-107`); the couple
  connector's `EdgeGeo` is built without `idEntity1Decor`/`idEntity2Decor`
  by `class-assoc-double-couple.ts` (confirmed by grep — no
  `Decor`-suffixed field is set anywhere in that file).
- causal chain: `decorAtEnt1`/`decorAtEnt2` for the couple connector
  resolve from `undefined` inputs; `decorName(undefined)` does not
  satisfy `looksLikeNoDecorAtAllSvg`, so the `else` branch
  (`${ent1}-to-${ent2}`) wins, producing `apoint6-to-apoint7` instead of
  jar's `apoint6-apoint7`. The same missing decor signal is the most
  likely source of the missing dasharray and the extra child (both are
  also decor-driven in `renderer-edge.ts`), though those two symptoms are
  not independently probe-confirmed to the same line.
- ruled out: the `apoint` NAMING itself (previously flagged as a defect
  in the prior mission's `A2a-link-groups.md` M12 finding, "our anchor
  ids are `__assoc0`/`__assoc1`, the jar's are `apoint12`/`apoint46`") —
  current code already produces correct `apoint6`/`apoint7` naming on
  BOTH sides (confirmed in the diff: only the id SEPARATOR/decoration
  suffix differs, not the base names). That naming bug is fixed; only the
  decor-suffix/dasharray/childCount residual remains.
- probe: `render-diff.mts pibifa-14-leno075` output (above) plus reading
  `class-assoc-double-couple.ts` end-to-end (no `Decor` field ever set)
  and `renderer-edge.ts:76-110`'s doc comment, which self-documents the
  scope gap.
- fix shape: give the couple connector's `EdgeGeo` an explicit
  "no decor" signal (not `undefined`) so `linkIdForSvg` takes the
  `${ent1}-${ent2}` branch, and thread the SAME signal into the
  dasharray/child-count decor resolution `renderer-edge.ts` already has
  for decorated edges. Touches `class-assoc-double-couple.ts` (set the
  field) and `renderer-edge.ts` (verify the branch/dash/glyph logic
  reads it correctly once set).
- owner: this mission
- confidence: HIGH for the id-suffix mechanism (code-read, exact branch
  identified); MEDIUM for attributing the dasharray+childCount symptoms
  to the SAME missing-decor cause (plausible, same causal family, not
  independently probe-verified line-by-line)

### begico-70-guva302
- mechanism-id: S-2 (2 of 5 structural diffs: the couple connector's
  `apoint12-to-apoint13` id + missing dasharray + childCount, same as
  pibifa) **and** S-4 (2 of 5 structural + all 4 numeric diffs: the two
  `#Green`-colored `..`/`.` relationship lines rendering at the theme
  default `#181818` instead of `#008000`)
- see S-2 (pibifa) and S-4 (xoxuni) for the full artifacts; begico is the
  fixture that proves these are two INDEPENDENT, co-occurring
  mechanisms in the same file rather than one combined cause — its
  `.puml` has both an explicit `(research, experiments) . (research,
  correlations)` couple AND three `#Green`-colored relationship lines.
- confidence: HIGH (both halves independently corroborated by pibifa and
  xoxuni)

### xoxuni-96-fere626
- mechanism-id: S-4
- mechanism: the trailing relationship color spec after the second
  endpoint (`cl1 --> cl2 #red;text:blue : foo3`) is matched by a regex
  ONLY to keep the line from failing to parse — the capture is thrown
  away, never stored as `Relationship.colorOverride` or consumed by the
  arrow renderer. Upstream parses and STORES this color
  (`link.setColors(...)`), which later drives the path/arrowhead stroke
  and (via the `text:` sub-attribute) the label's fill.
- java: `net/sourceforge/plantuml/classdiagram/command/CommandLinkClass.java:368`
  (`link.setColors(color().getColor(arg, diagram.getSkinParam
  ().getIHtmlColorSet()));`, `color()` at `:173-174` = `ColorParser
  .simpleColor(ColorType.LINE)`); `net/sourceforge/plantuml/klimt/color/
  ColorParser.java` (the `#word;attr:word` compound grammar cited in our
  own port's comment).
- ts: `src/diagrams/class/class-relationship-parser.ts:162` (`const
  REL_COLOR = ...`, the compound-color regex) and its two use sites at
  `:190` and `:216`, both `(?:${REL_COLOR})?` — a NON-capturing group.
  The file's own comment at `:154-161` says explicitly: "D6 scope is DOT
  parity, not SVG rendering — matched and discarded like ARROW_STYLE".
- causal chain: because `colorOverride` is never populated for this
  trailing form, `renderer-edge.ts:383-386` falls through
  `geo.colorOverride !== undefined ? ... : (tagStyle?.color ??
  theme.colors.graph.classCascadeArrowColor ?? theme.colors.arrow)` to
  the diagram-default `#181818` stroke for the path, the same default
  arrowhead fill/stroke, and the label keeps the default `#000` fill
  (the `text:blue` half of the compound spec is never even reached).
- ruled out: `resolveColorToSvgHex`'s own named-color table (it is
  never invoked for this value at all — `geo.colorOverride` is
  `undefined`, not a mis-resolved string; confirmed by reading
  `renderer-edge.ts:383-386`, which only calls `resolveColorToSvgHex`
  inside the `!== undefined` branch). Also ruled out: the BRACKET form
  `-[#color]->` (a DIFFERENT, already-working code path per
  `class-geo-builders.ts#buildStrokeOverride`, unaffected by this bug).
- probe: `render-diff.mts xoxuni-96-fere626` (above); read
  `class-relationship-parser.ts:154-166,190,216` and `renderer-edge.ts:383-386`.
- fix shape: capture `REL_COLOR`'s leading `#color` token into
  `Relationship.colorOverride` (mirroring the bracket form) at both use
  sites in `class-relationship-parser.ts`; separately thread the
  `;text:COLOR` sub-attribute into the label's fill (a new field, since
  today only the bracket form's single color exists). `class-geo-types.ts`
  and `renderer-edge.ts` need the new field consumed for the label
  `fill=`.
- owner: this mission
- confidence: HIGH (the discard is admitted in the port's own code
  comment, and the consuming branch was read directly)

### fumalu-64-vude116
- mechanism-id: S-5
- mechanism: a `<style> classDiagram { class { header { BackgroundColor
  red } } } }` block never reaches `theme.colors.graph.classHeaderBackground`
  — the class-diagram style cascade computes a header FontColor from
  `HEADER_SNAMES` but has no matching BackgroundColor lookup, so
  `resolveClassHeaderFill` never sees a header background and the whole
  4-rect "header-band split" render path (base fill, header-band fill,
  separator strip, outline-only rect) never triggers; the classifier
  draws as a single plain rect instead.
- java: `net/sourceforge/plantuml/svek/image/EntityImageClassHeader.java:93-101`
  (`styleHeader`/`HEADER_SNAMES`-equivalent style signature) and
  `EntityImageClass.java:173` (`getStyleHeader()`), `:204-208`
  (`getStyleHeader().value(PName.BackGroundColor).asColor(...)` feeding
  the header-band fill).
- ts: `src/core/style-cascade-class.ts`, function
  `applyColorCascadeOverrides` (~`:388-420`): computes
  `override.classCascadeFontColor` (CLASS_SNAMES) and
  `override.classCascadeHeaderFontColor` (HEADER_SNAMES, `:407`), but has
  NO `cascadeHex(styleMap, HEADER_SNAMES, 'backgroundcolor')` call
  anywhere in the function — confirmed by reading the full function body.
  Consumer: `src/diagrams/class/renderer-classifier-header-split.ts:82-108`
  (`resolveClassHeaderFill`, gated on `theme.colors.graph
  .classHeaderBackground`, which only the LEGACY `skinparam
  classHeaderBackgroundColor` key populates — `src/core/skinparam-key-
  handlers-table-b.ts:110-116`).
- causal chain: `g[2]` (class `Foo`) has `childCount` 10 in the jar (4
  layered rects + ellipse + path + 2 text + 2 divider lines) vs our 7
  (1 rect instead of 4 — no header-band split at all); the SAME missing
  header background also explains `rect[1]/@fill exp=none act=#FF0`
  (positional misalignment once 3 elements are missing shifts which rect
  compareSvg pairs against which — our single rect gets `#FF0`, the
  `classDiagram.class.BackgroundColor yellow` value, since with no
  header-band split the WHOLE box paints with the class-level background
  instead of the header-scoped one).
- ruled out: the PAGE header (`header some page header`, from `<style>
  document { header {...} } }`) — its `FontColor red`/`BackgroundColor
  lightGray` DOES apply correctly (`<g class="header">` in our own
  output matches the jar exactly, no diff reported for it), so this is
  specifically the CLASS's OWN header/name-row selector, not the general
  `<style>` engine or the page-header feature.
- probe: read jar's `in.svg` directly — `<g class="entity"
  data-qualified-name="Foo">` contains 4 layered `<rect>`s (fill `#FF0`,
  `#F00`×2, `none`) then ellipse/path/2×text/2×line, 10 children total;
  counted our own missing elements by comparing against
  `renderer-classifier-header-split.ts`'s 4-rect emission, gated on a
  field that is never populated for this input.
- fix shape: add a `cascadeHex(styleMap, HEADER_SNAMES,
  'backgroundcolor')` call to `applyColorCascadeOverrides`
  (`style-cascade-class.ts`), writing a new
  `override.classCascadeHeaderBackground` field consumed alongside
  `classCascadeHeaderFontColor` wherever `resolveClassHeaderFill` reads
  `theme.colors.graph.classHeaderBackground` today (additive: the legacy
  skinparam key's existing precedence is unaffected for fixtures that
  never use `<style>`).
- owner: this mission
- confidence: HIGH (the missing cascade call is a confirmed negative —
  read the full function body, found the FontColor sibling call and the
  absence of its BackgroundColor counterpart)

### rakuci-96-tuti371
- mechanism-id: S-11 (unresolved — partial)
- mechanism: NOT fully traced to an exact line. `rectangle " YY " as YYY
  [[/text/web/test/ced/222:0]] {}` (an empty-body container with a
  `[[url]]` on its own declaration) and `rectangle " YX " as XYY [[...]]
  { ... }` (a non-empty container, also url-linked) both draw their
  whole box's children WRAPPED in a single `<a target="_top"
  href="...">` in the jar's `in.svg` (confirmed by direct read — `<g
  class="entity" data-qualified-name="XXY.YYY">` and `<g class="cluster"
  data-qualified-name="XXY.XYY">` each contain exactly ONE child, the
  `<a>`, which itself contains the rect+text). Our render evidently omits
  this whole-box `<a>` wrap (`childCount` exp=1 act=3 for the entity,
  exp=1 act=4 for the cluster), drawing rect/text/etc. as direct
  siblings instead.
- java: not yet located — likely `SvekEdge`/`GroupPngMaker`'s `<a
  href>`-wrap call for a classifier/group with a non-null `Url`, ported
  alongside every other URL-decorated shape (upstream wraps the WHOLE
  drawn block, not per-member, for a classifier/group-level URL).
- ts: candidate location `src/diagrams/class/renderer-classifier-box.ts`
  (which DOES wrap individual MEMBER ROWS in `<a>` via `row.url` —
  confirmed at `:302-307` — but the whole-box wrap for a URL on the
  classifier/package DECLARATION itself, as used here, is not confirmed
  present or absent at an exact line).
- causal chain: not fully closed — the oracle evidence (single `<a>`
  wrapping child count) is solid, but which TS function is responsible
  for NOT emitting that wrap for `rectangle`/package containers has not
  been isolated.
- ruled out: this is not the same as `class-note-link-box.ts`'s note-only
  URL wrap (grep confirmed `xlink:href`/URL-wrap code exists only for
  notes, `renderer-note-dispatch.ts`) — classifiers/packages have NO
  whole-box `<a>` wrap code found anywhere in `src/diagrams/class/`.
- probe: `render-diff.mts rakuci-96-tuti371` (above); direct `in.svg`
  read confirming the `<a>` wrapper's exact position (shown in report
  body above, both `XXY.YYY` and `XXY.XYY`).
- probe next: grep `src/diagrams/class/renderer-package.ts` (or
  equivalent) and `renderer-classifier-box.ts`'s TOP-level box-emission
  function (not the per-row one) for whether it reads `geo.url`/`.link`
  at all for the container's OWN declaration (as opposed to member
  rows), then instrument with a scratch render to print whichever
  boolean gates the `<a>` wrap.
- owner: this mission (pending isolation)
- confidence: LOW-MEDIUM (symptom and jar-side mechanism solidly
  evidenced; TS origin not yet isolated to a line)

### rojoxi-79-vimu822
- mechanism-id: S-12 (unresolved — partial)
- mechanism: NOT fully traced. `package "Classic Collections" #DDDDDD
  {}` (a genuinely EMPTY package, zero children) is drawn by the jar as
  a single bare top-level `<path fill="#DDD" .../>` with NO `<g
  class="cluster">` wrapper at all (confirmed: `svg/g[1]/path[1]` is the
  compare path, and the jar's `in.svg` top-level children include this
  bare path before the `<g class="cluster" data-qualified-name="Classic
  Collections2">` for the SECOND, non-empty package). Our render of the
  same empty package apparently defaults to the plain class fill
  (`#F1F1F1`) instead of carrying through the package's own `#DDDDDD`.
- java: not yet located — likely wherever SVEK collapses a childless
  cluster into a single un-grouped shape (an empty-package special case
  distinct from the normal `GroupPngMaker`/cluster-with-children path).
- ts: not yet located. `src/diagrams/class/class-namespace-shape.ts` is
  the most likely home (it owns `packageBorder`/`packageBackground`
  theme-field consumption, per S-6's investigation of the same file) but
  the EMPTY-package-specific code path was not isolated.
- causal chain: not fully closed.
- ruled out: the T5 task brief's own lead ("rojoxi's stderr says the
  nested `{{ }}` render returned no viewBox — find what it rendered
  before blaming the fill") does NOT reproduce. Ran
  `npx jiti plans/class-divergence-drive/tools/render-diff.mts
  rojoxi-79-vimu822` in isolation with `2>&1` visible — clean output, only
  the one structural diff shown, no stderr at all. Also read
  `class-nested-diagram-renderer.ts` and confirmed its `EmbeddedDiagram`
  trigger requires a literal `{{`/`}}` opener (`getEmbeddedType(s) !=
  null`), which `rojoxi`'s `.puml` never contains — so the nested-diagram
  renderer cannot be involved in this fixture's divergence at all. The
  brief's lead appears stale (from a different/older render path, not
  reproducible via the production `renderSync` call this tool exercises).
- probe: `render-diff.mts rojoxi-79-vimu822` (isolated run, above,
  clean stderr); direct `in.svg` structural read (jar SVG element
  listing above) confirming the bare-path/no-cluster shape for the empty
  package specifically.
- probe next: instrument `class-namespace-shape.ts`'s package-fill
  resolution with a scratch script printing which branch a zero-child
  package takes vs a non-empty one, to find where the declared
  `#DDDDDD` gets dropped.
- owner: this mission (pending isolation)
- confidence: LOW-MEDIUM (symptom solidly evidenced and the stale-lead
  hypothesis actively disproven; TS origin not yet isolated)

### nesivu-99-cexu403
- mechanism-id: S-10
- mechanism: `skinparam defaultMonospacedFontName Forte` has NO
  skinparam-key handler anywhere in this port (confirmed: zero grep
  matches for `defaultmonospacedfontname`/`monospacedFontName` in
  `src/core/skinparam-key-handlers-table-*.ts`), so the logical font
  token `monospaced` (used internally for `""...""` creole-monospace
  spans) is never substituted with the user's configured real font name.
  It flows unchanged into `renameLogicalMonospace`, which then maps the
  literal string `"monospaced"` to the generic CSS family `"monospace"`
  — the value we observe — instead of `"Forte"`.
- java: `net/sourceforge/plantuml/skin/SkinParam.java:1092` —
  `return getValue("defaultMonospacedFontName", Parser.MONOSPACED);`
  (the key registered at `:606`, `result.add("DefaultMonospacedFontName")`).
  When the user sets the skinparam, this returns the REAL font name
  (`"Forte"`), so the "monospaced"→CSS-"monospace" rename never applies
  to a user-configured name — only to the unconfigured logical default.
- ts: `src/core/svg-text-font.ts:57-58` — `function
  renameLogicalMonospace(family: string) { return
  family.toLowerCase() === 'monospaced' ? 'monospace' : family; }` —
  this IS a faithful port of the RENAME step, but it is the only
  handling of `defaultMonospacedFontName` in the entire codebase; nothing
  upstream of it ever substitutes the configured font name.
- causal chain: `""This is monospaced""` resolves to the logical family
  `monospaced` at creole-parse time; with no skinparam substitution, that
  literal string reaches `renameLogicalMonospace`, which (correctly, per
  its own narrow job) maps it to `monospace`; jar instead substitutes
  `Forte` BEFORE that rename step ever runs, so the rename is a no-op on
  the jar side (family is already `Forte`, not the logical `monospaced`
  token).
- ruled out: `renameLogicalMonospace` itself is not the bug — it
  faithfully mirrors `SvgGraphics.java:716-729`'s rename-only behavior
  (confirmed by its own doc comment's citation); the bug is entirely the
  MISSING upstream substitution step (`SkinParam.java:1092`), which has
  no port anywhere.
- probe: `render-diff.mts nesivu-99-cexu403` (above); grep confirming
  zero handler-table matches for the skinparam key.
- fix shape: add a `defaultmonospacedfontname` entry to
  `skinparam-key-handlers-table-a/b.ts` storing the raw font name into a
  new accumulator/theme field (e.g. `monospacedFontName`), and have
  whatever resolves the logical `monospaced` token (before or instead of
  `renameLogicalMonospace`) consult it, defaulting to today's
  `'monospace'` CSS fallback when unset (byte-identical for every
  fixture that never sets this key).
- owner: this mission
- confidence: HIGH (missing handler confirmed by exhaustive grep,
  consuming function read directly, Java default-value citation exact)

### nisune-86-faji869
- mechanism-id: S-13
- mechanism: `skinparam classFontColor automatic` is a recognized-but-
  intentionally-unimplemented THIRD variant of `classFontColor`, already
  named and deferred in this port's own code: `AUTOMATIC_FONT_COLOR`/
  `isAutomaticFontColor` explicitly early-returns (leaves
  `classFontColor` unset) rather than resolving `"automatic"` as a
  literal color, with a doc comment citing this exact fixture
  (`nisune-86-faji869`) and naming the real behavior as "jar computes a
  contrast colour against the header background... explicitly out of
  this iteration's scope."
- java: `net/sourceforge/plantuml/skin/SkinParam.java` (the
  `automatic` contrast-color computation the port's own comment
  describes; not independently re-traced here since the deferral is
  already the documented, deliberate scope boundary, not a discovered
  bug).
- ts: `src/core/skinparam-key-handlers-table-b.ts:21-29`
  (`AUTOMATIC_FONT_COLOR`/`isAutomaticFontColor`) and `:250-256` (the
  `classfontcolor` handler's `if (isAutomaticFontColor(color)) return;`
  guard, whose own comment cross-references this exact fixture).
- causal chain: `classHeaderBackgroundColor #444` (dark) should make
  `classFontColor automatic` resolve to a light/contrasting text color
  (`#FFF` per the jar); with the guard early-returning,
  `theme.colors.graph.classCascadeFontColor` stays `undefined`, and
  `renderer-classifier-rows.ts`'s `fallbackFontColor = '#000000'` wins
  instead.
- ruled out: nothing new to rule out — this is a self-documented,
  deliberate deferral from the prior mission's M2 finding
  (`plans/class-divergence-drive/diagnosis/A3*.md`), not a fresh defect;
  re-confirmed still current by reading the live code and re-running
  `render-diff.mts` against today's `main`.
- probe: `render-diff.mts nisune-86-faji869` (above); read
  `skinparam-key-handlers-table-b.ts:21-29,250-256`.
- fix shape: compute a contrast color (luminance/YIQ test against the
  resolved header background, matching `HColorSimple#isDark`, which
  `src/core/klimt/color/HColorSet.ts:183-185`'s `isDarkResolved` already
  implements for a DIFFERENT purpose and could be reused) when
  `isAutomaticFontColor` is true, instead of early-returning.
- owner: this mission (already scoped/tracked, not newly discovered)
- confidence: HIGH (the deferral is explicit in the port's own comments,
  naming this exact fixture)

### tuguku-78-zega630
- mechanism-id: S-7
- mechanism: `<style> visibilityIcon { protected { LineColor
  DarkGoldenRod; BackgroundColor DarkGoldenRod } } }` is a `<style>`-block
  selector this port never implements — only the LEGACY `skinparam
  icon<Kind>Color`/`icon<Kind>BackgroundColor` override path exists
  (`class-visibility-icon.ts:136-148`, its own comment labels it "G2
  N54"). With no `<style> visibilityIcon` cascade anywhere in the
  codebase (confirmed by grep — zero matches for
  `visibilityicon`/`visibilityIcon` in any `style-cascade*`/
  `skinparam-key-handlers*` file), every protected-visibility icon falls
  through to the hardcoded default `VISIBILITY_COLORS` table entry.
- java: `net/sourceforge/plantuml/skin/VisibilityModifier.java:336-350`
  — `getStyleSignature()` returns `StyleSignatureBasic.of(SName.root,
  SName.element, SName.visibilityIcon, SName.protected_)` (and the
  sibling public_/private_/package_/IEMandatory signatures), which the
  `<style>` engine resolves `LineColor`/`BackgroundColor` against.
- ts: `src/diagrams/class/class-visibility-icon.ts:119` — the hardcoded
  default table entry `'#': { line: '#B38D22', background: '#FFFF44' },
  // protected` (values `#B38D22`/`#FFFF44`≈`#FF4` are EXACTLY the wrong
  values we observe for stroke/fill, confirming this default is what
  wins); `:145-148` — the ONLY override table, keyed off theme fields
  `g.iconProtectedColor`/`g.iconProtectedBackgroundColor`, which are
  populated only from the legacy `skinparam icon<Kind>Color` key, never
  from a `<style>` block.
- causal chain: the `<style>` block sets `LineColor`/`BackgroundColor`
  under a `visibilityIcon { protected {...} }` selector this port's
  style-cascade engine has no signature for at all, so those values are
  silently dropped during style-map construction; `applyVisibilityIcon`
  falls through the (unset) theme override to the hardcoded default,
  producing `#B38D22`/`#FFFF44`(`#FF4`) instead of the resolved
  `DarkGoldenRod` (`#B8860B`) for both stroke and fill.
- ruled out: NOT a named-color resolution bug — `#B38D22` is not a
  mis-parse of `DarkGoldenRod`, it is the pre-existing HARDCODED default
  (byte-identical to the table literal at `:119`), confirmed by direct
  string comparison, so the `<style>` value never reached the color
  resolver at all.
- probe: `render-diff.mts tuguku-78-zega630` (above); grep confirming
  zero `visibilityicon` matches in any cascade/skinparam-handler file;
  direct read of the hardcoded default table matching the observed wrong
  values exactly.
- fix shape: add a `visibilityIcon`/`{public,private,protected,package,IEMandatory}`
  selector to the class-diagram style-cascade engine
  (`style-cascade-class*.ts`), writing new theme fields consumed
  alongside (or replacing, with correct precedence) the existing
  `iconProtectedColor`/`iconProtectedBackgroundColor` skinparam-only
  fields in `class-visibility-icon.ts:136-148`.
- owner: this mission
- confidence: HIGH (hardcoded-default match is a byte-exact string
  comparison, not inference; missing selector confirmed by exhaustive
  grep)

### gabejo-44-juki791
- mechanism-id: S-3
- mechanism: `skinparam class { FontColor<<Blue>> Blue; FontStyle<<Blue>>
  Bold, Italic; BorderColor<<Green>> Green }` is the STEREOTYPE-QUALIFIED
  form of a `skinparam class {}` block — a direct-value lookup keyed by
  `paramName + "color" + "<<" + stereotypeLabel + ">>"`. This port
  implements that exact lookup mechanism, but ONLY for STATE-diagram
  param names (`statebordercolor<<X>>`/`statefontcolor<<X>>` in
  `skinparam-stereo-keys.ts`) — no CLASS-diagram equivalent
  (`classbordercolor<<X>>`/`classfontcolor<<X>>`) exists anywhere. The
  base (non-stereotype) `classfontcolor`/`classbordercolor` keys ARE
  wired (`cdd-T19`, confirmed current), so `func1` (no stereotype) is
  unaffected — only `func2`/`func3` (which carry `<<Green>>`/`<<Blue>>`)
  diverge.
- java: `net/sourceforge/plantuml/skin/SkinParam.java:371-378`
  (`getHtmlColor(ColorParam param, Stereotype stereotype, ...)`: loops
  `stereotype.getMultipleLabels()`, looks up `param.name() + "color" +
  "<<" + s + ">>"` BEFORE the plain value) and `:484-490`
  (`getFontHtmlColor(Stereotype stereotype, FontParam... param)`: same
  shape, `"fontcolor" + stereotype.getLabel(...)`) — both GENERAL
  mechanisms used by every diagram type, not state-specific.
- ts: `src/core/skinparam-stereo-keys.ts:40` (`STATE_BORDER_COLOR_STEREO_RE
  = new RegExp('^statebordercolor<<(.+)>>$')`) and `:48`
  (`STATE_FONT_COLOR_STEREO_RE`) — the doc comment at `:31-36` even notes
  "Scoped to BorderColor only this iteration (Background/FontColor/
  FontSize<<X>> would additionally require threading a per-..." for
  STATE; no CLASS-side `classbordercolor<<X>>`/`classfontcolor<<X>>`
  pattern exists in this file or `skinparam-key-handlers-table-*.ts`
  (confirmed by grep — `classfontcolor`/`classbordercolor` handlers at
  `-table-b.ts:119-123,250-256` match ONLY the bare (non-`<<>>`-suffixed)
  key form).
- causal chain: `BorderColor<<Green>> Green` and `FontColor<<Blue>>
  Blue` are silently dropped during skinparam parsing (no handler key
  matches the `<<...>>`-suffixed variant), so `func2`/`func3`'s rect
  stroke stays the default `#181818` instead of `#008000`, and their
  name-row text stays default `#000` instead of `#00F`. The `svg/@height`
  Δ1 (261 vs 262) is a plausible cascade of the ALSO-unwired
  `FontStyle<<Blue>> Bold, Italic` changing the name row's measured
  height by one pixel once bold/italic applies, but this specific
  1px delta was not independently probe-verified.
- ruled out: the BASE (non-stereotype) `classfontcolor`/`classbordercolor`
  handlers — confirmed present and correct
  (`skinparam-key-handlers-table-b.ts:119-123,250-256`, cdd-T19) — so
  this is not a recurrence of the prior mission's M2 finding (that gap
  is closed); it is specifically the stereotype-qualified `<<X>>` variant
  that remains unported, and only for CLASS (STATE already has it).
- probe: `render-diff.mts gabejo-44-juki791` (above); grep across
  `skinparam-stereo-keys.ts` and both handler tables for
  `classbordercolor`/`classfontcolor` with/without `<<`.
- fix shape: add `classbordercolor<<X>>`/`classfontcolor<<X>>` (and
  ideally `classfontstyle<<X>>`/`classbackgroundcolor<<X>>` for
  completeness) direct-value-lookup entries to
  `skinparam-stereo-keys.ts`, mirroring the existing STATE pattern
  exactly (`STATE_BORDER_COLOR_STEREO_RE`/`STATE_FONT_COLOR_STEREO_RE`),
  writing into new `classBorderColorByStereo`/`classFontColorByStereo`
  accumulator fields consumed per-classifier by
  `renderer-classifier-colors.ts`/`renderer-classifier-rows.ts`.
- owner: this mission
- confidence: HIGH for the structural (color) diffs — confirmed by
  reading both the general Java mechanism and the exact TS gap by
  elimination (STATE has it, CLASS doesn't, base CLASS keys don't cover
  `<<>>`); MEDIUM/LOW for the `svg/@height` Δ1 cascade (plausible but
  not independently traced)

### guxode-39-dobi371
- mechanism-id: S-6 (structural: the two `polygon/@stroke exp=#FFF
  act=White` diffs) **and** S-9 (numeric: the two tiny Δ0.01-0.014
  diffs)
- **S-6 mechanism**: `skinparam package { borderColor White; ... }`
  stores the RAW, unresolved token `"White"` into
  `theme.colors.graph.packageBorder` and emits it DIRECTLY as the SVG
  `stroke` attribute value with no color-name-to-hex normalization
  anywhere in the chain — unlike the sibling `classbordercolor` handler,
  which resolves through a `paint`/hex value before storage.
- java: `net/sourceforge/plantuml/style/FromSkinparamToStyle.java:128`
  — `addConvert("packageBorderColor", PName.LineColor, SName.group);`
  — registers the key onto the `Style` system, which resolves EVERY
  color (named or hex) through `Style#value(PName...).asColor
  (getIHtmlColorSet())` before it ever reaches a drawing call; upstream
  never keeps a raw color-name string.
- ts: `src/core/skinparam-key-handlers-table-b.ts:162-167` — `[
  ['packagebordercolor'], (acc, _v, color) => { acc.packageBorder =
  color; }, ]` — stores the THIRD positional arg (`color`, the raw/
  unresolved token) instead of the FOURTH (`paint`, the resolved value —
  compare the sibling `classbordercolor` handler at `:119-123`, which
  correctly uses `paint`). Flows unchanged through
  `skinparam-accumulator.ts:80,229` → `skinparam-theme-builder.ts:96` →
  `theme-graph-colors-a.ts:35` (`packageBorder?: string`) →
  `src/diagrams/class/class-namespace-shape.ts:335` — `stroke:
  theme.colors.graph.packageBorder ?? PACKAGE_CLUSTER_BORDER_DEFAULT,` —
  used DIRECTLY as the SVG stroke value.
- causal chain: `"White"` (capital-W, the raw skinparam token) is never
  passed through `resolveColorToSvgHex`/`HColorSet`, so it reaches the
  `<polygon stroke="White">` attribute verbatim instead of the jar's
  normalized `#FFF`.
- ruled out: this is NOT a named-color-table gap (no evidence
  `resolveColorToSvgHex("White")` was ever called and failed) — the raw
  string is provably never routed through that function at all, per the
  full field-flow trace above (every intermediate type is `string |
  undefined`, never `Paint`).
- probe: `render-diff.mts guxode-39-dobi371` (above); grep-traced
  `packageBorder` through every file in
  `skinparam-accumulator.ts`/`skinparam-theme-builder.ts`/
  `theme-graph-colors-a.ts`/`class-namespace-shape.ts` confirming no
  color-resolution call exists on the path.
- fix shape: one-line change at
  `skinparam-key-handlers-table-b.ts:162-167` — swap the `color` (3rd)
  arg for the `paint` (4th) arg (same pattern the `classbordercolor`
  handler already uses two entries above it), and update
  `packageBorder`'s type from `string | undefined` to a resolved hex/
  `Paint` type through the chain (or resolve at the point of use in
  `class-namespace-shape.ts` if changing the accumulator's type is out
  of scope for a 1-line fix).
- owner: this mission
- confidence: HIGH (the exact 3rd-vs-4th-argument bug is confirmed by
  direct comparison against the adjacent, correctly-written handler)
- **S-9 (numeric half)**: see rezoba-58-xaze387 below — the two tiny
  (Δ0.012-0.014) numeric diffs on `g[14]`'s path/polygon points are the
  same magnitude/character as the dot-engine spline-fitting noise seen
  on rezoba/jojime, not related to the White/#FFF bug. Confidence MEDIUM
  (not independently re-verified against `svek-1.dot` for this specific
  fixture, but the magnitude and "extra/shifted point" character match).

### vuresa-33-kumu160
- mechanism-id: S-8
- mechanism: two SEPARATE code paths process a multi-line association
  label's creole markup. The LAYOUT path
  (`class-edge-label-measure.ts#computeMeasuredLabelAttrs`, used for DOT
  box-reservation sizing) correctly strips creole tags before measuring
  (`stripCreoleMarkup`, explicitly cited by its own comment as a T4 fix
  for THIS exact fixture). The RENDER/ANCHOR path
  (`class-edge-label-anchor.ts#multiLineLabelAnchor`, which produces the
  actual per-line `text`/`width`/`x`/`y` used by the SVG `<text>`
  emission) measures and stores the RAW, un-stripped line text, with no
  creole processing and no bold-flag extraction at all.
- java: `net/sourceforge/plantuml/klimt/creole/Display.java:413-419`
  (`manageGuillemet`'s per-line creole processing, already cited in our
  own `class-edge-label-measure.ts` comment as running at
  Display-construction time, i.e. BEFORE the later `create()`/`create9()`
  creole render this port stands in for).
- ts: `src/diagrams/class/class-edge-label-measure.ts:64-73`
  (`.map(applyGuillemet).map(stripCreoleMarkup).map(resolveTextEscapes)`
  — the CORRECT, already-fixed measurement path, proving the stripping
  capability exists) vs `src/diagrams/class/class-edge-label-anchor.ts:64-90`
  (`multiLineLabelAnchor`: `const widths = lines.map((l) =>
  measurer.measure(l, font).width)` and `return lines.map((text, i) =>
  ({ text, x: ..., y: ..., width }))` — `lines`/`text` are the RAW
  strings, no strip, no bold flag) — called from
  `class-edge-label-attach.ts:239`; consumed verbatim by
  `src/diagrams/class/renderer-edge.ts:287-310`
  (`renderEdgeMainLabel`: `text(line.x, line.y, line.text, {...
  labelFontAttrs })` — `labelFontAttrs` is a single font shared across
  ALL lines, no per-line bold override).
- causal chain: line 1 of the label (`<b>Person-Meeting</b>`) is
  measured RAW by `multiLineLabelAnchor` (22 chars including tags, width
  140.319) instead of the stripped 14-char "Person-Meeting" (width
  91.731, matching the jar's `textLength`); the rendered `<text>` node
  also emits the raw string VERBATIM as its content
  (`text()[1] exp=Person-Meeting act=<b>Person-Meeting</b>`); and no
  `font-weight="700"` is ever emitted because nothing extracts a bold
  flag from the `<b>` tag on this path (`renderer-edge.ts:154-165`
  DOES support `font.weight === 'bold' → fontWeight: '700'` generically
  — it is simply never fed a bold flag here).
- ruled out: this is NOT a missing feature in the renderer's font-weight
  support (`arrowLabelTextAttrs` already handles `'bold'` correctly,
  confirmed at `renderer-edge.ts:154-165`) — the gap is entirely upstream
  of it, in `multiLineLabelAnchor` never parsing creole at all for this
  code path, despite the sibling layout path already doing so
  (`class-edge-label-measure.ts` proves the capability was already
  built once, just not shared).
- probe: `render-diff.mts vuresa-33-kumu160` (above, `font-weight
  exp=700 act=`, `textLength exp=91.731 act=140.319`, `text()[1]
  exp=Person-Meeting act=<b>Person-Meeting</b>`); read
  `class-edge-label-measure.ts:64-73` vs `class-edge-label-anchor.ts:64-90`
  side by side.
- fix shape: apply `applyGuillemet`/`stripCreoleMarkup` (and extract a
  per-line bold flag, e.g. detect the `<b>...</b>` wrap before
  stripping) inside `multiLineLabelAnchor` or at its call site
  (`class-edge-label-attach.ts:239`), and thread the resulting bold flag
  through `EdgeGeo.labelLines[i]` into `renderEdgeMainLabel`'s
  per-line `<text>` emission (today it uses one shared `labelFontAttrs`
  for every line).
- owner: this mission
- confidence: HIGH (both code paths read directly, the asymmetry is a
  clean side-by-side comparison, and the numbers match the raw-vs-
  stripped character-count theory exactly)

### rezoba-58-xaze387
> **T6 correction (journal rows 5-6): the dot-engine attribution below is
> DISPROVED.** Real graphviz 16.1.0 and `@knowvah/dot-engine` return the
> same raw spline for these edges (constant frame offset only). The
> mechanism is reopened as CLIP-1 (T9): the divergence arises after layout,
> in the cluster-anchored edge clip/post-processing. Read the rest of this
> report as ruled-out evidence, not as a mechanism.

- mechanism-id: S-9 (owner: dot-engine, not this repo)
- mechanism: three `path/@d` bezier curves differ by small (sub-2px)
  per-point deltas with occasional EXTRA/MISSING interior control points
  (e.g. jar's curve has one point where ours has two nearly-adjacent
  points covering the same span) — spline-fitting numeric divergence
  between `@knowvah/dot-engine`'s bezier generator and real graphviz's,
  for the exact same input graph.
- java: n/a — this is not a plantuml-ts or upstream-jar code path; both
  the jar (real `dot`) and this port (`@knowvah/dot-engine`) compute
  their OWN spline geometry independently from the same graph
  description.
- ts: n/a in this repo — `@knowvah/dot-engine` is an external
  dependency (per `CLAUDE.md`'s ruling 2026-08-09, "One layout engine:
  dot-engine, never Smetana", accepting the geometry delta for
  Smetana-routed paths; this fixture is NOT Smetana-routed, so the
  delta is in-target for fidelity, but the fix is in the dependency, not
  this repo).
- causal chain: `test-results/dot-cache/class/rezoba-58-xaze387/svek-1.dot`
  contains NO `pos=` attributes (confirmed: `grep -c "pos=" svek-1.dot`
  returns 0) — the cached `.dot` file is the RAW graph description fed
  to both real graphviz (to produce the jar's `in.svg`) and to
  `@knowvah/dot-engine` (to produce our output); plantuml-ts itself never
  computes or adjusts bezier control points, it only draws whatever
  points the layout engine returns. Any point-level discrepancy for the
  SAME input graph therefore originates entirely inside the layout
  engine's own spline construction, not in this repo's rendering code.
- ruled out: a plantuml-ts SVG-emission bug (mis-transcribing or
  rounding points) — the raw point LISTS themselves differ (different
  counts in places), which a transcription/rounding bug could not
  produce; only two INDEPENDENT spline-fitting runs over the same graph
  could.
- probe: `render-diff.mts rezoba-58-xaze387` (above, full path/@d
  values shown); `grep -c "pos=" svek-1.dot` → 0.
  jojime-80-savu279 shows the identical character (3 similar path/@d
  diffs, same magnitude), corroborating this is a systematic
  engine-level pattern, not a one-off.
- fix shape: none in this repo. Per the project's established
  convention, a verified `@knowvah/dot-engine` finding should be filed
  as a self-contained `.md` in `docs/graphviz-issues/` + a `TRACKER.md`
  line — not attempted as a plantuml-ts fix.
- owner: dot-engine (file an issue; out of this mission's write-set)
- confidence: MEDIUM-HIGH (the "no pos= in svek-N.dot" check solidly
  rules out a plantuml-ts-side cause; the exact spline-fitting
  discrepancy inside dot-engine was not further diagnosed, as that
  library is out of this repo)

### jojime-80-savu279
- mechanism-id: S-9 (same as rezoba — see that entry for the full
  artifact)
- three `path/@d` diffs, same small-delta/extra-point character as
  rezoba; `test-results/dot-cache/class/jojime-80-savu279/` was not
  independently re-checked for `pos=` in its `svek-N.dot`, but the
  diff shape (values differ by ~0.001-0.8px per point, with matching
  point COUNTS this time, unlike rezoba) is consistent with the same
  engine-level spline-fitting noise, not a structural difference.
- confidence: MEDIUM (pattern-matched to rezoba's confirmed mechanism,
  not independently re-verified against this fixture's own `svek-N.dot`)

---

## Unresolved fixtures — ruled out + instrument next (summary)

- **xumofu-43-fode658** (S-1b): ruled out the original (now-fixed) SB1
  chain-before-leaf ordering bug and ruled out S-1's segment-collapse
  bug (no `useIntermediatePackages` pragma present); the first
  relationship endpoint's uid ticks (1,2,3) match the jar exactly, only
  the SECOND endpoint's package-vs-leaf tick order is inverted. Next:
  counter-dump trace of `parser.ts`'s per-relationship-line processing
  to see whether the sweep call happens once per LINE instead of once
  per LEAF-CREATION for a second/later relationship endpoint.
- **rakuci-96-tuti371** (S-11): ruled out note-only URL-wrap code as the
  relevant mechanism (grep confirms it doesn't apply to
  classifiers/packages); jar-side mechanism (whole-box `<a>` wrap for a
  container-level `[[url]]`) is solidly evidenced by direct SVG read.
  Next: instrument `renderer-classifier-box.ts`/`renderer-package.ts`'s
  top-level (not per-row) URL handling.
- **rojoxi-79-vimu822** (S-12): ruled out the T5 brief's own stated
  stderr/no-viewBox lead (does not reproduce in an isolated
  `render-diff.mts` run; the nested-diagram-renderer's trigger condition
  cannot even fire on this fixture's `.puml`, which has no `{{`/`}}`).
  Jar-side mechanism (empty package collapses to a bare un-clustered
  path, dropping its declared background color) is solidly evidenced.
  Next: instrument `class-namespace-shape.ts`'s package-fill resolution
  for the zero-child-package branch specifically.

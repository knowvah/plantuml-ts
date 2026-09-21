# A2a — LINK groups (`<g class="link">`) with child-count / dasharray mismatches

Bucket source: `bucket-gg_count_all.json` (138 fixtures). Of those, **52** have at
least one `[childCount]` or `@stroke-dasharray` diff whose owning `<g>` resolves
to `class="link"` in BOTH trees. The other 86 are entity/cluster/note/legend/title
groups (owned by the sibling agent). My 52 are listed in
`<scratchpad>/A2a-mine.json`; per-slug resolved diffs in `<scratchpad>/resolved.json`
and `<scratchpad>/sigs.json` (missing/extra child-tag multiset per group).

Instruments used: `render-all.ts` (all 138 rendered through production `renderSync`,
`out/<slug>.ours.svg` + `.jar.svg`), `resolve2.py` (resolves each comparator path to a
real element and reads its `class`), `sig.py` (per-group missing/extra child tags +
jar text content), `probe.ts` (hand-authored minimal `.puml` renders — isolates M4),
plus an id-keyed (order-independent) dasharray comparison.

**Comparator caveat honoured throughout:** `compare.ts:509-547` pairs children
positionally / by LCS-on-tag. A link emitted in a different ORDER produces
`missing X in g[n] / extra X in g[n+1]` pairs that look like child-count defects but
are not. I checked every fixture's link-group id sequence against the jar
(`jar-vs-ours link id list`) and split those out into M11/M12 below.

---

## M1 — Qualifier box (`Kal`) is parsed but never drawn

**Mechanism.** A qualified association (`class1 [Qualifier] --> class2`) makes
upstream build a `Kal` per qualified end. `Kal` is a `UDrawable`: it draws a
`URectangle(textDim.delta(4,2))` filled with the `class.qualified` style's
BackGroundColor, stroked `UStroke.withThickness(0.5)`, then the text at
`UTranslate(2,1)` — i.e. exactly the jar's `<rect …stroke-width:0.5>` + `<text>`
pair inside the link group. `SvekEdge#drawU` draws them last, just before
`ug.closeGroup()`. This port parses the qualifier into
`Relationship.fromQualifier`/`toQualifier` and then uses it for ONE purpose only:
setting the DOT `:h` shield flag. No `Kal` equivalent exists anywhere in `src/`.

**Origin.**
- Java: `~/git/plantuml/src/main/java/net/sourceforge/plantuml/classdiagram/command/CommandLinkClass.java:345-353` (`kal1`/`kal2` → `LinkArg.withKal`); `net/sourceforge/plantuml/svek/SvekEdge.java:242-246` (construct), `:1015-1019` (`kal1.drawU(ug)` / `kal2.drawU(ug)` inside the group), `:1069-1077` (`computeKal` placement), `:540-562` (`getExtremitySimplier`'s `translateForKal` — the arrow decoration is pushed out by the box width/height); `net/sourceforge/plantuml/svek/Kal.java:126-140` (`drawU`: rect + text), `:104-121` (`position` + `entity.ensureMargins`).
- TS: `src/diagrams/class/class-relationship-parser.ts:307-308` (parsed), `src/diagrams/class/class-shield-helpers.ts:118-126` (`shieldedClassifierIds` — the ONLY consumer), `src/diagrams/class/class-port-rows.ts:216` (`qualifierShielded`), `src/core/svek-dot-emit.ts:118` (`:h`). Grep of the whole repo for `fromQualifier|toQualifier` returns exactly these sites plus tests — no render site.

**Causal chain.** Qualifier text reaches the AST → only the shield flag is derived →
the geo builder never produces a box → `renderer-edge.ts` emits path + polygons only
→ the link group is short one `<rect>` + one `<text>` per qualified end. Secondary:
`Kal` also calls `entity.ensureMargins(...)` (`Kal.java:107,111,115,119`) and shifts the
extremity by `getTranslateForDecoration()`, so the whole diagram's geometry differs
too (this is why these fixtures also carry large numeric deltas).

**Reach (19 of 52).** FULLY explains the link-group child-count diffs in:
`baneru-00-kuro607`, `comaxe-39-goza236`, `goloxu-09-nero458`, `kadifi-56-bili996`,
`kopida-02-vaje995`, `mucoti-34-seve858`, `pumocu-32-fiji248`, `rilali-81-gifu188`,
`sefazi-02-defe499`, `tikovu-50-gale862`, `vileca-45-melo541`, `vorimi-67-gudu296`,
`vuzoro-99-kizi978`, `xoxega-30-vuju324`.
PARTIAL (qualifier box + a second mechanism in the same group):
`coxose-20-nifu136` (+M4), `ririlu-13-zipi740` (+M4),
`camuna-58-veca254` (+M10), `nafiki-56-jixu680` (+M10), `rifuzu-80-nixo780` (+M10).

**Fix shape.** New module `src/diagrams/class/class-kal.ts` (measure + position +
emit), wired from: `class-layout-edge-labels.ts`/`class-dot-graph.ts` (margins — the
node-size side), `class-edge-geo.ts` (box anchor + extremity translate),
`renderer-edge.ts` (emit rect+text). Theme: `class.qualified` style block
(`Kal.java:90-96`) — `camuna`/`nafiki` prove it is a real style block (`#008000`
background, `ivory` text from their `<style>`), so `theme-graph-colors-*.ts` needs the
signature. **Risk: HIGH** — `ensureMargins` + `translateForKal` move node positions, so
every one of the 19 fixtures shifts, and any conformant fixture using `[...]` on a link
would too. A repo-wide grep of `test-results/dot-cache/class/*/in.puml` for a
qualifier bracket should bound that before starting.

**Confidence: HIGH.** Java method bodies read (`Kal#drawU`, `SvekEdge:1015-1019`);
TS absence proven by exhaustive grep; rendered `baneru`, `comaxe`, `coxose`,
`camuna` side by side — jar's extra children are exactly `<rect fill=… stroke-width:0.5>`
+ `<text>` carrying the qualifier string.

---

## M2 — Visibility modifier on a link LABEL: reserved but never drawn, char never stripped

**Mechanism.** `Aaa *--> "1..100" Entry : -entries`. Upstream's `LinkArg.build`
detects the leading visibility character, strips it from the display, and stores a
`VisibilityModifier`; `SvekEdge#addVisibilityModifier` then merges
`visibilityModifier.getUBlock(...)` LEFT of the label block. At draw time that block
emits `<g data-visibility-modifier="PRIVATE_METHOD"><rect …/></g>` (jar-verified in
`canuti`'s SVG: a 6×6 `rect`, `stroke:#C82930`, `fill:none`). This port implements the
MEASUREMENT half only — `applyVisibilityIcon` reserves `size+2` × `size+3` for the DOT
label box — and deliberately skips both the strip and the glyph at render time.

**Origin.**
- Java: `net/sourceforge/plantuml/svek/SvekEdge.java:302` (`labelOnly = addVisibilityModifier(block, link, skinParam)`), `:363-374` (the method body: `getUBlock` → `withMargin(v,0,1,2,0)` → `mergeLR(visibility, block, CENTER)`); `net/sourceforge/plantuml/klimt/creole/Display.java:415-416` (the strip); `net/sourceforge/plantuml/skin/VisibilityModifier.java:100-102` (block dimension).
- TS: `src/core/edge-label-box.ts:168-190` (`applyVisibilityIcon` — measurement only), `:347` (called from `computeReservedLabelBox`); **`src/diagrams/class/class-edge-geo.ts:111-131`** states the gap in-source: "*T12a deliberately left OUT of the rendered text because upstream also draws an icon glyph this port does not render (stripping the char alone would delete information)*". `src/core/skin/VisibilityModifier.ts:89+` already exists and carries the drawable.

**Causal chain.** Label box is reserved at the correct width → renderer draws
`geo.label.text` = `applyGuillemet(rel.label)` with NO visibility handling →
`<text>` says `-entries` (jar says `entries`) and the `<g data-visibility-modifier>`
sibling is absent → childCount short by exactly 1 `<g>` per such label.

**Reach (3 of 52), all FULL:** `canuti-20-jotu614` (3 groups),
`gikipi-69-pepo172` (1), `gixesa-28-feri809` (4).

**Fix shape.** `class-edge-geo.ts#attachEdgeLabel` (apply the strip + record an icon
anchor), `class-geo-types.ts` (new `EdgeGeo.visibilityIcon` field),
`renderer-edge.ts#renderEdgeMainLabel` (emit the `<g data-visibility-modifier>`
wrapper via the existing `src/core/skin/VisibilityModifier.ts`). Layout/DOT: **no
change** — the reservation is already correct, which is why the jar's label x
(`168.32`) and our x (`160.319`) differ by exactly the 8px the icon+margin occupies.
**Risk: LOW-MEDIUM** — render-only; the reserved box is unchanged so DOT parity is
untouched, but the label `<text>` x shifts on every affected edge.

**Confidence: HIGH.** Both method bodies read; the port's own doc comment names the
omission; `canuti` rendered side by side shows the exact missing `<g>` and the
un-stripped `-`.

---

## M3 — `[[url]]` on a link: not parsed, no `<a>` wrapper

**Mechanism.** `a1 --> a2 [[http://www.google.com]] : foo`. `CommandLinkClass`
builds a `Url` and calls `link.setUrl(url)`; `SvekEdge#drawU` opens
`ug.startUrl(url)` right after `ug.startGroup(...)` and closes it before the Kal
draws, so EVERY drawn primitive of the link nests inside one `<a>`. The jar's link
group therefore has exactly ONE child (`<a>`). `Relationship` in this port has no
`url` field at all — the `[[...]]` token is consumed/ignored by the relationship
grammar.

**Origin.**
- Java: `net/sourceforge/plantuml/classdiagram/command/CommandLinkClass.java:356-361` (`link.setUrl`); `net/sourceforge/plantuml/svek/SvekEdge.java:859-861` (`startUrl`), `:990-991` (`closeUrl`).
- TS: `src/diagrams/class/class-relationship-ast.ts:65-200` — no `url` member (grep of `class-relationship-ast.ts` + `class-relationship-parser.ts` for `\burl\b` returns nothing); `src/diagrams/class/renderer-url.ts:1-60` implements the CLASSIFIER-level `<a>` wrap only, and its own header scopes itself to `EntityImageClass#drawU`.

**Causal chain.** Url never reaches the AST → `renderer-edge.ts` emits path +
polygon + text as direct children → jar has 1 child (`<a>`), we have 3.

**Reach (2 of 52), both FULL:** `fitini-85-kupo803`, `kutazo-40-texe886`.

**Fix shape.** `class-relationship-parser.ts` (capture `[[...]]`, reuse
`src/diagrams/class/class-url.ts`'s `UrlInfo`), `class-relationship-ast.ts` (+`url`),
`class-edge-geo.ts`/`class-geo-types.ts` (carry it), `renderer-edge.ts` (wrap the
whole group body with `linkWrap` from `src/core/svg.ts`). **Risk: LOW** —
render-only, zero geometry change, and `linkWrap` already exists. Only 2 fixtures
move.

**Confidence: HIGH.** Java read; TS absence proven by grep; both fixtures rendered.

---

## M4 — A dotted/dashed BODY is discarded when a decor wins the relationship type

**Mechanism.** Upstream keeps decor and line style as INDEPENDENT fields of
`LinkType`: `getLinkType()` builds `new LinkType(decors2, decors1)` from the head
glyphs, then applies `result.goDashed()` iff either arrow body contains `.`. This
port collapses both into a single `RelationshipType` enum via `resolveType(kind1,
kind2, dashed)` and then RE-DERIVES the dash from that enum through a static table.
Because `resolveType` gives composition/aggregation/extension precedence over the
dashed flag, and `EDGE_DECORATION_MAP.composition/.aggregation/.extension` all
hard-code `dashed: false`, the body style is silently dropped.

**Origin.**
- Java: `net/sourceforge/plantuml/classdiagram/command/CommandLinkClass.java:491-509` (`getLinkType` — `goDashed()` applied INDEPENDENTLY of the decors); `net/sourceforge/plantuml/decoration/LinkType.java:71-81,115-121` (`linkStyle` is a separate field).
- TS: `src/diagrams/class/class-arrow-grammar.ts:248-254` (`resolveType` consumes `dashed` and returns only a type; `resolveArrow:294-297` never returns the dashed-ness), `src/diagrams/class/class-dot-edges.ts:34-40` (`EDGE_DECORATION_MAP` — the re-derivation), `src/diagrams/class/class-edge-geo.ts:420` (`const dashed = rel.dashed ?? decor.dashed`), `src/diagrams/class/renderer-edge.ts:391-393` (`geo.dashed ? {strokeDasharray:'7,7'} : {}`).

**Causal chain + isolating experiment.** `probe.ts` renders four minimal fixtures:
`A ..> B` → `dependency` → dasharray PRESENT; `A *..> B` → `composition` → dasharray
ABSENT; `A [q] *..> B` and `A *.r.> B` → also absent. The qualifier and the direction
word are NOT involved — the single variable is the decor glyph. `rel.dashed` is set
only by the association-couple/subsume paths (`class-assoc-couple.ts:274,294`), so
ordinary links fall through to the type-derived default.

**Reach (2 of 52, both PARTIAL — these fixtures also carry M1).**
Id-keyed (order-independent) dasharray comparison over all 52 finds exactly two real
losses: `coxose-20-nifu136` (`HashMap-V2` from `*.r.>`, `HashMap-V3` from `o.d.>`) and
`ririlu-13-zipi740` (same two arrows). Every other `stroke-dasharray` diff in the 52
is either an order-pairing artifact (M11) or the groupInheritance solid-ing (M7) —
notably `pijiju-95-xexi872`'s is the REVERSE direction and belongs to M7.

**Fix shape.** Carry the body style on `ArrowInfo` (`class-arrow-grammar.ts`
`resolveArrow` already computes `canonical.includes('.')` at `:300`) → set
`Relationship.dashed` in `class-relationship-parser.ts` → the existing
`rel.dashed ?? decor.dashed` fallback at `class-edge-geo.ts:420` then does the rest.
Roughly a 3-line change. **Risk: MEDIUM** — `dashed` also feeds the DOT
`style=dashed` attribute (`class-edge-geo.ts:286`) and can move layout; scope it
narrowly and re-pin. Only 2 corpus fixtures use the combination, so the blast radius
is small but must be measured, not assumed.

**Confidence: HIGH** (mechanism), **HIGH** (reach — measured by id, not by position).

---

## M5 — `note on link`: measured into the label box, never drawn

**Mechanism.** `link.getNote()` builds an `EntityImageNoteLink` and merges it
LR/TB with the label block; the merged block is drawn inside the link group, so the
jar emits the note's two `<path>`s (body + folded corner) plus its `<text>` as
children of `<g class="link">`. This port builds the merged MEASUREMENT
(`computeMergedLabelBox`) so the DOT reservation is right, but the class geo/renderer
has no note-box emitter — unlike the state engine, which does
(`state-transition-label.ts:339` `noteBoxFields`).

**Origin.**
- Java: `net/sourceforge/plantuml/svek/SvekEdge.java:307-327` (note → `mergeLR`/`mergeTB` into `labelText`), `:440-445`, `:956-980` (draw).
- TS: `src/core/edge-label-box-note-merge.ts` (`computeMergedLabelBox`), `src/diagrams/class/class-layout-edge-labels.ts:192,200-232` (measurement wiring); `grep noteBox src/diagrams/class/*.ts` → **no hits** (the state engine's `state-transition-label.ts:334-339` is the only implementation).

**Causal chain.** Correct box reserved → nothing emitted → link group short 2
`<path>` + 1-2 `<text>` per note.

**Reach (5 of 52), all FULL:** `lipazi-06-care921` (2 groups),
`lozego-15-coci435` (1, also short an `<image>` — a sprite inside the note),
`nuvake-96-gofe203` (2), `tunelu-64-xica833` (1), `vonago-16-zime449` (1).

**Fix shape.** Port the state engine's `noteBoxFields` shape into
`class-edge-geo.ts` + `class-geo-types.ts`, emit from `renderer-edge.ts` reusing
`src/diagrams/class/renderer-note.ts`'s note-path builder. **Risk: LOW-MEDIUM** —
render-only (the reservation already exists and is unchanged), but `lozego`'s
`<image>` child means sprite support inside the note is in scope.

**Confidence: HIGH.** Java read; TS absence proven by grep; `lipazi` rendered —
jar's extra children are literally the note rect path, the corner path and the text.

---

## M6 — Extremity decors the class grammar cannot name (REDEFINES / DEFINEDBY / `^` / middle circle)

**Mechanism.** `LinkDecor` upstream has 25 members. `class-arrow-decor-map.ts`'s
`HEAD_TO_DECOR` maps 22 glyphs onto a 14-member class-side `LinkDecor` union that
omits `redefines`, `definedBy`, `arrowTriangle`, `circle`, `circleFill`,
`circleConnect`, `halfArrowUp/Down` — and the class engine has NO middle-decor
concept at all. `class-arrow-grammar.ts:190-215` folds `<||`, `<|:`, `^` into the
`'extends'` KIND for type resolution, but `headToDecor` returns `'none'` for them,
so nothing is drawn. Separately, `-0)-`'s middle circle comes from a different regex
group entirely (`INSIDE`), which this port does not read.

**Origin.**
- Java: `net/sourceforge/plantuml/decoration/LinkDecor.java:70-104` (the enum incl. `REDEFINES(decors1("<||"),decors2("||>"))`, `DEFINEDBY(decors1("<|:"),decors2(":|>"))`, `EXTENDS(...,"^")`, `CIRCLE_CONNECT(decors1("0)"),decors2("(0"))`), `:174-222` (`getExtremityFactoryLegacy` — one factory per member); `net/sourceforge/plantuml/classdiagram/command/CommandLinkClass.java:498-507` (the `INSIDE` middle-circle arms).
- TS: `src/diagrams/class/class-arrow-decor-map.ts:38-60` (`HEAD_TO_DECOR` — `<||`/`||>`/`<|:`/`:|>`/`^`/`0)`/`(0` all absent → `headToDecor:63` returns `'none'`), `src/diagrams/class/class-relationship-ast.ts:49-63` (the truncated union), `src/diagrams/class/class-arrow-grammar.ts:190-215` (the `'extends'` fold, with its own scope note "*D6: DOT parity, not the rendered marker shape*"). No `middleDecor` anywhere in `src/diagrams/class/`.

**Important finding — the drawables already exist.** `src/core/svek/extremity/`
contains `ExtremityExtendsLike.ts`, `ExtremityCircleConnect.ts`, `ExtremityCircle.ts`,
`ExtremityArrow.ts`, `ExtremityHalfArrow.ts`, and `link-decor.ts:47-68` already names
all 21 upstream factories including `REDEFINES`/`DEFINEDBY`. The gap is purely the
class-side glyph→name wiring, not a missing port.

**Reach (3 of 52), all FULL:**
- `nixema-71-tuke505` — `A <|:-- B` (DEFINEDBY: polygon + 2 ellipses) and `A --||>C` (REDEFINES: polygon + line). Both ends draw NOTHING for us.
- `zuramo-86-liku129` — `foo <||--^ bar` (REDEFINES at tail, EXTENDS-`^` at head): jar 4 children, we have 1.
- `cenubi-27-xova754` — `foo1 -0)- foo2` (`INSIDE == "0)"` → `withMiddleCircleCircled1`): jar draws an arc `<path>` + an `<ellipse>` at the line midpoint; we draw neither.

**Fix shape.** Extend `class-relationship-ast.ts`'s `LinkDecor` union + the
`HEAD_TO_DECOR` table + `renderer-arrowhead.ts`'s dispatch to reach the already-built
`src/core/svek/extremity/*` factories; add a `middleDecor` field + a mid-path emitter
for the `INSIDE` family. **Risk: LOW-MEDIUM** for the head decors (purely additive —
today those glyphs render nothing, so no conformant fixture can regress); **MEDIUM**
for the middle decor, which also sets `labelShield = 7` upstream
(`SvekEdge.java:373-376`) and therefore moves label placement.

**Confidence: HIGH.** Both Java tables read; TS tables read; all three fixtures
rendered and their jar children matched against the named factory.

---

## M7 — `skinparam groupInheritance`: `sametail` is emitted, but neither consequence is implemented

**Mechanism.** When N or more extends-like links share a tail, `DotData
#removeIrrelevantSametail` keeps their `sametail` and attaches a `Neighborhood` to
the parent leaf. Two things then follow, and this port does NEITHER:
1. **`Link#getType()` returns `new LinkType(LinkDecor.NONE, LinkDecor.NONE)` whenever `getSametail() != null`.** That constructor uses `LinkStyle.NORMAL()`, so a grouped link loses BOTH its arrowheads AND its dash. Every grouped edge in the jar is a bare, solid `<path>` with no polygon.
2. `GeneralImageBuilder` wraps the parent in `EntityImageProtected(…, 20, neighborhood, …)`, whose `drawUntranslated` calls `Neighborhood#drawU` — ONE shared triangle (`drawExtends`: a `UPolygon` (0,0),(7,20),(-7,20) rotated to each contact) plus a connecting line per child.

This port emits the `sametail` DOT attribute and inflates the parent node by the
20px border (`protectedIds` → `protectedPad`), but the renderer still draws a
per-edge triangle and never draws the shared one.

**Origin.**
- Java: `net/sourceforge/plantuml/dot/DotData.java:122-161` (`removeIrrelevantSametail`); **`net/sourceforge/plantuml/abel/Link.java:238-239`** (the decor+style suppression — this is the exact line that makes the jar's grouped edges bare); `net/sourceforge/plantuml/decoration/LinkType.java:71-72` (`LinkStyle.NORMAL()`); `net/sourceforge/plantuml/svek/GeneralImageBuilder.java:110-114`; `net/sourceforge/plantuml/svek/EntityImageProtected.java:87-90`; `net/sourceforge/plantuml/dot/Neighborhood.java:69-121` (`drawU` + `drawExtends`).
- TS: `src/diagrams/class/class-dot-graph.ts:226-252` (`protectedIds` + `sametailByRelIndex` computed), `:260-261` (`protectedPad` — the ONLY consumer of `protectedIds`), `src/diagrams/class/class-dot-edges.ts:165-166` (attribute emitted), `src/core/graph-layout-build-edges.ts:98`. No `Neighborhood` equivalent; `renderer-edge.ts`/`renderer-arrowhead.ts` never consult `sametail`.

**Causal chain.** Layout is right (the `sametail` attribute reaches graphviz) → at
render time each grouped edge still gets its own triangle `<polygon>` → every
grouped link group has 2 children where the jar has 1, and `pijiju`'s dotted
`implements` links additionally keep a dasharray the jar drops. The shared triangle
the jar draws lives in the ENTITY group, not the link group, so it does not appear
in this bucket's diffs.

**Reach (5 of 52), all FULL for the link-group half:** `lazeju-60-boki114` (7
groups), `mefike-75-vova900` (3), `xifuza-00-paze682` (2), `pijiju-95-xexi872` (2 —
this also owns both of that fixture's "extra dasharray" diffs),
`jakapi-64-tine258` (2).

**Fix shape.** Two separable pieces. (a) **Suppression** — thread `sametailByRelIndex`
into `class-edge-geo.ts` and force `sourceDecor/targetDecor = 'none'` and
`dashed = false` for a grouped link, mirroring `Link.java:238-239`. Cheap, and it
alone closes all the link-group child-count diffs. (b) **The shared triangle** —
a new `Neighborhood` drawable emitted into the parent entity group; needs each
grouped edge's start contact point, so it must run after edge geo. **Risk: (a) LOW**
(5 fixtures, all currently non-conformant); **(b) MEDIUM** (new geometry in the
entity group).

**Confidence: HIGH.** All four Java method bodies read; TS consumers enumerated by
grep; `lazeju` rendered — jar's groups contain one `<path>` and nothing else.

---

## M8 — Role labels (`"quantifier"/role`) are parsed and then read nowhere

**Mechanism.** `User "owner"/"1" -- "0..n"/"items" Item` gives upstream both a
quantifier AND a role per end; `SvekEdge` builds `startTailText`/`endHeadText` from
the quantifiers and `startTailRoleText`/`endHeadRoleText` from the roles, and draws
all four. This port parses `fromRole`/`toRole` and never reads them.

**Origin.**
- Java: `net/sourceforge/plantuml/svek/SvekEdge.java:329-351` (all four text blocks built), `:1023-1030` + `drawRoleLabel` (the role is drawn on the opposite side of the line from its quantifier).
- TS: `src/diagrams/class/class-relationship-parser.ts:303-304` (parsed), `src/diagrams/class/class-relationship-ast.ts:100-101` (stored). **`src/diagrams/class/class-layout-edge-labels.ts:412-425`** states the gap in-source: "*`Relationship.fromRole`/`toRole` are parsed and stored … but never READ anywhere in `src/` … This is a genuinely UNBUILT feature*". Corroborated at `class-dot-edges.ts:119` ("*read nowhere in `src/` yet*").

**Reach (2 of 52), both FULL:** `nenexe-35-zere033`, `mugobo-34-fede498` — jar 4
`<text>`, we draw 2.

**Fix shape.** `class-layout-edge-labels.ts` (reserve the role box — upstream's
`else if` fallback at `SvekEdge.java:447-466` uses the role in place of the
cardinality when that end has no multiplicity), `class-edge-label-anchor.ts`
(`attachPortLabels` — a second anchor per end), `class-geo-types.ts`,
`renderer-edge.ts`. **Risk: MEDIUM** — new DOT label reservation moves geometry for
any fixture using bare role syntax; the in-source note already flags this as a
zero-fixture-rise hazard.

**Confidence: HIGH.** Java read; the port documents its own omission; both
fixtures rendered.

---

## M9 — `constraint on links` decoration unbuilt

**Mechanism.** `constraint on links: enten/eller` makes `CucaDiagram` attach a
`LinkConstraint` to the two adjacent links; `SvekEdge#drawU` then samples the
bezier, picks the nearest square corner and calls `linkConstraint.drawMe(ug,
skinParam)` — which emits a dashed `<line style="stroke-dasharray:3,3">` plus the
constraint `<text>`, both inside the link group. This port models `linkConstraint`
as a BOOLEAN used only to reserve the 10×10 `CONSTRAINT_SPOT`.

**Origin.**
- Java: `net/sourceforge/plantuml/svek/SvekEdge.java:993-1011` (`getSquare` + `linkConstraint.setPosition` + `drawMe`), `:430-444` (the `CONSTRAINT_SPOT` reservation).
- TS: `src/diagrams/class/class-relationship-ast.ts:181` (`linkConstraint?: boolean` — the display text is not even retained), `src/diagrams/class/class-layout-edge-labels.ts:370-375` (the only consumer: the 10×10 reservation). `src/core/abel/Link.ts:303-312` + `src/core/cucadiagram/CucaDiagram.ts:144-146` DO carry a real `LinkConstraint` object, but the class engine's AST does not use it.

**Reach (1 of 52), PARTIAL:** `gujigi-63-roki030` — explains the missing `<line>` +
`<text>` in `g[10]`–`g[13]`. That fixture's `g[21]`/`g[22]` diffs are M11 (order).

**Fix shape.** Widen `Relationship.linkConstraint` from `boolean` to carry the
display text, plumb through `class-edge-geo.ts`, emit from `renderer-edge.ts`.
The position formula needs bezier sampling (`SvekEdge.java:997-1008`). **Risk: LOW**
— the 10×10 reservation already exists, so layout is unchanged; 1 fixture.

**Confidence: MEDIUM-HIGH.** Java read and the TS boolean confirmed; I did not
verify the exact `drawMe` body (`LinkConstraint.java`), so the `stroke-dasharray:3,3`
+ text shape is taken from the rendered jar SVG rather than from source.

---

## M10 — A multi-line quantifier renders its `\n` literally

**Mechanism.** Upstream builds the quantifier via `Display.getWithNewlines(...)
.create(cardinalityFont, CENTER, skinParam)` — two physical lines for
`"customer\n1"`, hence two `<text>` elements. This port passes the raw
multiplicity string straight to `portLabelAnchor` with no `splitDisplayLines` call,
so one `<text>` is emitted containing the literal two-character `\n`.

**Origin.**
- Java: `net/sourceforge/plantuml/svek/SvekEdge.java:330-340` (`Display.getWithNewlines` on `getQuantifier1()`/`getQuantifier2()`).
- TS: `src/diagrams/class/class-edge-label-anchor.ts:305-321` (`attachPortLabels` — `portLabelAnchor(tailMultiplicity, …)`, raw string). Note the MEASUREMENT side is already correct: `src/core/edge-label-box.ts:427-434` (`computeQuantifierBox`) DOES call `splitDisplayLines` and reserves `lines.length * font.size`. Only the render side is missing the split.

**Reach (3 of 52), all PARTIAL (these fixtures are also M1):**
`camuna-58-veca254`, `nafiki-56-jixu680`, `rifuzu-80-nixo780` — all three use
`"customer\n1"`. Verified in `camuna`'s rendered SVG: our `<text>` reads
`customer\n1`; the jar has `customer` at y=228.853 and `1` at y=238.853.

**Fix shape.** `class-edge-label-anchor.ts#portLabelAnchor` — split, then emit one
anchor per line stacked at `font.size` (the same shape `multiLineLabelAnchor`
already implements for the main label); `class-geo-types.ts` +
`renderer-edge.ts#renderEdgeCardinalityLabels` to iterate. **Risk: LOW** —
render-only, reservation already correct, 3 fixtures.

**Confidence: HIGH.** Java read; TS call site read; rendered proof.

---

## M11 — Link EMISSION ORDER (comparator pairing artifact, **not** a child-count defect)

For these fixtures the jar and our output contain the **same set** of link ids in a
**different order**, so `compare.ts`'s positional pairing lines link *n* up against
link *n+1* and reports symmetric `missing X in g[n] / extra X in g[n+1]` pairs plus
mirrored `stroke-dasharray exp '' act '7,7'` diffs. Nothing is actually missing.

| slug | evidence |
|---|---|
| `bicabi-42-coto932` | `AddObjectWindow-backto-DrawOptionsBox` / `-backto-Gtk` transposed |
| `cobumi-83-bapu892` | `MindMapNode-backto-MindMap` emitted 3 positions later |
| `delasa-80-jusu462` | 293 links, same set, reordered |
| `tedeba-19-lisi250` | `Graphic-to-GraphicDecorator` moved from index 1 to index 4 |
| `gujigi-63-roki030` | (partly — `g[21]`/`g[22]` only; `g[10]`–`g[13]` are M9) |

**Hand-off:** these belong to the **A1 (order)** bucket, not A2a. I have not
diagnosed the ordering rule. `pr-workflow`-style note: the `<g class="link">`
emission order is upstream's `Bibliotekon` line order, which is worth a dedicated
diagnosis.

---

## M12 — Link COUNT differs (a whole `<g class="link">` present on one side only)

Also not a per-group child-count defect; listed for completeness with the first
structural fact for each.

| slug | finding |
|---|---|
| `guxode-39-dobi371` | **We emit an extra link group `A-B` for `A -[hidden]- B`.** Upstream drops it at `net/sourceforge/plantuml/svek/SvekEdge.java:835-836` (`if (link.isInvis()) return;`, reached via `abel/Link.java:177-182` → `LinkType#isInvisible`). This port recognises `hidden` as a NON_COLOR_KEYWORD and **discards** it (`src/diagrams/class/class-arrow-grammar.ts:354`), so the edge renders. **Own mechanism, LOW risk, 1-fixture fix** — carry `hidden` onto `Relationship` and skip the group in `renderer-edge.ts`. Confidence HIGH. |
| `lejoga-79-poji465`, `vudepo-27-cuvo793` | Jar emits an extra note-anchor link (`GMN10-RowHybridMacroStage` / `GMN8-…`) for `Note left of X`; we emit none. Note-to-target connector, not diagnosed here. |
| `temise-16-neco018` | We emit an extra `N1-apoint21`; the jar does not. Free-floating `note as N1` connector. |
| `begico-70-guva302`, `pibifa-14-leno075`, `pajoka-72-reju527`, `besepi-37-rori892` | Association-class couple `(A,B) . (C,D)`: our anchor ids are `__assoc0`/`__assoc1`, the jar's are `apoint12`/`apoint46`; the two half-edges are also emitted in swapped order and with the `-to-`/`-backto-` decor suffix on the opposite half. Naming + half-edge orientation, adjacent to A1. |

---

## Unclassified within my 52

None. Every one of the 52 is assigned to at least one mechanism above.
`gujigi` (M9+M11), `pijiju` (M7 only — its dasharray diffs are M7's solid-ing),
and the four association-couple fixtures (M12) are the ones where the assignment took
an order/id check rather than a child-tag signature.

---

## Summary table

| sub-bucket | reach (of 52) | confidence |
|---|---|---|
| M1 Qualifier (`Kal`) box unbuilt | 19 (14 full, 5 partial) | HIGH |
| M2 Visibility icon on link label unbuilt | 3 full | HIGH |
| M3 `[[url]]` on link → no `<a>` wrap | 2 full | HIGH |
| M4 Dotted body lost when decor wins the type | 2 partial | HIGH |
| M5 `note on link` box measured, not drawn | 5 full | HIGH |
| M6 REDEFINES/DEFINEDBY/`^`/middle-circle decors unwired | 3 full | HIGH |
| M7 `groupInheritance` decor+dash suppression & shared triangle | 5 full | HIGH |
| M8 Role labels (`"q"/role`) unbuilt | 2 full | HIGH |
| M9 `constraint on links` line+text unbuilt | 1 partial | MEDIUM-HIGH |
| M10 Multi-line quantifier `\n` literal | 3 partial | HIGH |
| M11 Link emission ORDER (→ hand to A1) | 5 | HIGH (as artifact) |
| M12 Link count differs (incl. `-[hidden]-`) | 8 | HIGH for `guxode`; MEDIUM others |

Highest value per unit of risk: **M7(a)** (suppress decor+dash on `sametail` links —
one predicate, 5 fixtures), **M3** (2 fixtures, render-only), **M10** (3 fixtures,
render-only), then **M2**/**M5** (render-only, reservation already correct).
**M1** is the largest reach by far but carries the highest geometry risk, because
`Kal` feeds `ensureMargins` and the extremity translate.

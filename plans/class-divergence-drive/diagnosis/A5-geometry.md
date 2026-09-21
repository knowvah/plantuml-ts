# Bucket A5 — edge / shape geometry (class corpus)

Scope: the 69 "diverged" fixtures with a structural `path/@d` or polygon-vs-path
diff, plus the 50 whose only diffs are numeric. Every claim below cites the Java
method body and the TS body; where I could not close the loop I say so and name
the next instrument instead of guessing.

Rendered while writing this (22 fixtures): bajotu, bejusa, sokevu, cenubi,
nuxoni, temise, xoteci, jikase, bejeli, dacisu, gamevo, pakemi, delano, faxoga,
jinema, gojofu, camupi, jubobo, gatula, xosiza, bitove, class-inheritance-
interface-assoc, gobuco, boseba, lilura, majuva, tepazu, xidura, puvono, sekame.

---

## M1 — cluster-anchored edges are never `simulateCompound`-clipped

**Mechanism.** When a relationship endpoint is a package/namespace, svek routes
the edge to a `zaent…` point anchor placed *inside* the cluster, then trims the
returned spline back to the cluster's rectangle. We emit the identical DOT (the
DOT-parity gate is 710/711) and then draw the spline **raw**, so the edge starts
(or ends) deep inside the package box instead of on its border, and carries one
cubic where the jar carries the 3–4 that the trim's de Casteljau loop produces.

**Origin.**
- Java: `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:252-258`
  sets `ltail`/`lhead` when `startUid`/`endUid` begins with `Cluster.CENTER_ID`;
  `SvekEdge.java:671-672` then does
  `dotPath = dotPath.simulateCompound(lhead…getRectangleArea(), ltail…getRectangleArea())`.
  The trim itself is `klimt/shape/DotPath.java#simulateCompound` (8 midpoint
  subdivisions, `XCubicCurve2D#subdivide`).
- TS: `src/core/spline-clip.ts:135` (`clipSplineStart`) / `:171` (`clipSplineEnd`)
  is a faithful port of that method — but its **only** callers are
  `src/diagrams/state/state-transition-clip.ts:123-124` and
  `src/diagrams/description/layout-geo-post.ts:53,61`. The class engine builds the
  anchors (`src/diagrams/class/class-shield-helpers.ts:73-78`,
  `class-dot-graph.ts:439`) and then never clips:
  `grep -rn "clipSpline" src/diagrams/class` returns nothing.

**Causal chain.** bajotu-30-soku184 (`package p1 { class cl1 } ; p1 --> cl2`) —
its single diff. Jar: `M115,119.013 C…122.384 C…129.143 C115,141.97 115,149.6`
(y=119 is exactly the cluster rect's bottom, `M8.5,6 … L8.5,119 …`). Ours:
`M115,72.077 C115,74.296 115,119.082 115,149.598` — start 47 px inside the box,
one segment. Both ends agree (149.6 / 149.598) and the arrowhead polygon is
byte-identical, so only the *tail* is unclipped. bejusa-95-gafo325 shows the same
on all three of its diffs, two of them at the `lhead` end (start points agree to
0.003, the jar's tail is trimmed).

**Reach — FULLY explains bajotu and bejusa; partial for the rest.** Exactly the
17 fixtures whose cached `svek-*.dot` contains a `zaent…->` / `->zaent…` edge,
and all 17 are in the A5-69 set (no cluster-anchored fixture is conformant):
bajotu-30-soku184, bejusa-95-gafo325, cocube-46-tusu692, delasa-80-jusu462,
guxode-39-dobi371, jojime-80-savu279, lojiga-09-meka859, mujopi-30-zadi566,
nijeli-04-ponu844, pecabi-95-demu756, pisobo-93-sipa138, rezoba-58-xaze387,
runane-30-vena766, sanixi-31-nofa193, sijisi-94-ripu606, sokevu-87-toce485,
vusute-48-xono099.

**Fix shape.** This repo. Thread the cluster rect through `class-edge-geo.ts`
(it already has `anchors: Map<nsId, zaent-id>`) and call the existing
`clipSplineStart`/`clipSplineEnd`. No dot-engine change.

**Confidence: HIGH** for the mechanism (Java read; our spline verified raw
against the cluster rect). **MEDIUM** that the clip alone makes bajotu exact: I
replayed `clipSplineStart` on our own spline with the cluster rect (6,6,117,113)
and got 4 segments starting 119.338 against the jar's 3 starting 119.013. The
last control point agrees (141.969 vs 141.97), so the raw splines agree near the
tail and the residual is in the earlier control points — a dot-engine-vs-graphviz
spline-shape delta, not a clip bug. *Next instrument if it matters:* dump our raw
point list for `zaent0001->sh0011` and compare against `dot -Tsvg svek-1.dot`'s
own `<path>` (the `-Tplain` bbox for this fixture is `0.80408 2.375`).

---

## M2 — plain class note: body is a `<polygon>` in the wrong vertex order, fold is an open 3-point path with the wrong paint

**Mechanism.** Upstream draws a normal note as **two `UPath`s**: the pentagon body
with the *style* stroke (0.5), and the dog-ear as a separate closed 4-point path
that inherits the note **background fill** and the **default** stroke (1). We draw
a `<polygon>` body whose vertices run the other way round the outline, and a
3-point unclosed fold with `fill=none` and stroke 0.5.

**Origin.**
- Java: `svek/image/EntityImageNote.java:275-289` — `drawNormal` does
  `ug = ug.apply(noteBackgroundColor.bg()).apply(borderColor); final UGraphic
  stroked = applyStroke(ug); stroked.draw(polygon); ug.draw(Opale.getCorner(...))`.
  The corner is drawn on `ug`, **not** `stroked`, hence 1 not 0.5, and `ug` still
  carries the background, hence `fill="#FEFFDD"`.
  `svek/image/Opale.java:134-147` `getCorner` = `moveTo(w-10,0) lineTo(w-10,10)
  lineTo(w,10) lineTo(w-10,0) closePath`. `Opale.java:149-157` `getPolygonNormal`
  starts `moveTo(0,0)` then goes **down the left side** (`lineTo(0,height)`).
- TS: `src/diagrams/class/renderer-note.ts:366-382` — `polygon([{x,y},
  {x+w-f,y},{x+w,y+f},{x+w,y+h},{x,y+h}], …)` then
  `[moveTo(x+w-f,y), lineTo(x+w-f,y+f), lineTo(x+w,y+f)]`. The correct fold is
  already ported at `src/core/svek/image/Opale.ts:180-190` (`opaleCorner`, used by
  `renderTipNote`/`renderOpaleNote` only), and a correct two-path body+fold at
  `src/core/svg-shapes.ts:394-418` (`noteBox`, used by activity/files/sequence).

**Causal chain (nuxoni-26-xala894, `note as Note1`).**
Jar: `<path d="M6,6 L6,29 L97.119,29 L97.119,16 L87.119,6 L6,6" stroke-width:0.5 fill=#FEFFDD/>`
     `<path d="M87.119,6 L87.119,16 L97.119,16 L87.119,6" stroke-width:1 fill=#FEFFDD/>`
Ours: `<polygon points="149.963,19.5,231.081,19.5,241.081,29.5,241.081,42.5,149.963,42.5" …/>`
     `<path d="M231.081,19.5 L231.081,29.5 L241.081,29.5" fill="none" stroke-width="0.5"/>`
Four diffs per note: element name, `@d`, `@fill`, `@stroke-width`.

**Reach — FULLY (per note element).** 14 fixtures carry at least one of the two
signatures: befasi-62-vimu310, mububu-79-nalu431, nuxoni-26-xala894,
ribove-58-tefu515, soboro-52-pevi612, temise-16-neco018, tunelu-64-xica833,
vonago-16-zime449, xadado-92-lazo250, xekeje-31-taba218, xoteci-81-jena668,
zakuta-81-pese010, ziruni-05-fona846, zosaxa-86-mora157. (In note-bearing
fixtures with an order cascade the note `<g>` pairs against something else and
the signature is masked — so 14 is a floor, not a ceiling.)

**Fix shape.** This repo, one function: rewrite `renderNote`'s two `parts.push`
calls to emit `getPolygonNormal`'s point order as a `<path>` and to reuse
`opaleCorner` with `fill = noteBackground`, `strokeWidth = 1`.

**Confidence: HIGH** — Java method read end to end; both SVGs diffed element by
element.

---

## M3 — stereotype spot: 8 of the corpus's letters have no captured glyph outline, and at least one classifier kind maps to the wrong letter

**Mechanism (M3a — missing letters).** `<<(X,color)>>` sets the spot character.
We parse and honour the **colour** but silently fall back to the kind's default
letter whenever `X` is outside a 9-entry table, so the jar draws e.g. an `S`
outline and we draw a `C` outline — a structural `@d` diff (different command
letters, different count) inside an otherwise byte-perfect entity.

**Origin.**
- Java: the spot is a `CircledCharacter` (`klimt/shape/CircledCharacter.java:65-74`)
  which draws a `UCenteredCharacter`; the SVG driver is
  `klimt/drawing/svg/DriverCenteredCharacterSvg.java:71-81` —
  `font.createTextLayout(c)` → `svg.drawPathIterator(xpos, ypos, t.getOutline(...))`.
  **Note the oracle seam:** the `<text>` shortcut at `:65` fires only for
  `FileFormat.SVG_DETERMINISTIC`, and `-DPLANTUML_DETERMINISTIC_TEXT=true` only
  swaps the *StringBounder* (`FileFormat.java:185-187`) while the format stays
  `SVG`. So the oracle's spot glyphs are **real system-font outlines** and cannot
  be computed — a new letter has to be scraped from an oracle SVG, exactly the
  way the existing table was.
- TS: `src/diagrams/class/class-badge.ts:477-492` `resolveBadgeLetter` — the
  table is `C I A E @ P M F ?`; anything else `return badgeLetter(kind)`. The
  outline data is `BADGE_GLYPH_D` in the same file. The comment there already
  names the gap ("corpus also uses R/J/O/W/D/Q/S/X").

**Causal chain.** jikase-93-tipa633 (`<<(D,orange)ABC>>`): jar `M122.086,27.315
L122.086,35.292 L122.75,35.292 Q124.194,35.292 …` (a `D`: stem then bowl); ours
`M125.473,37.143 Q124.892,37.442 …` — the same byte sequence our `C` emits
everywhere else (cf. nuxoni's default spot). bejeli-39-sina124 (`(S,#FF7700)`):
the ellipse `fill="#F70"` matches exactly, only the glyph differs — colour path
correct, letter path not.

**Reach — FULLY (per spot).** 16 fixtures declare a spot letter outside the 9:
befasi-62-vimu310, bejeli-39-sina124, dacisu-77-paca840, jikase-93-tipa633,
mububu-79-nalu431, ribove-58-tefu515, rideze-59-lizu265, rusuzi-21-kile910,
soboro-52-pevi612, vegubu-29-bomu147, zakuta-81-pese010, ziruni-05-fona846,
zosaxa-86-mora157, gamevo-26-runo973, puvono-84-doro361, sekame-22-meze147
(the last three reach it through `!define QO (Q,orchid)`-style macros).
Two more are outside A5: cutasu-32-zete658, xogixe-78-zuro619.

**Mechanism (M3b — wrong default letter for a kind).** tepazu-23-zapo261 and
xidura-26-teki974 declare `class/enum/interface/annotation/abstract class/entity`
with no spot override; the 6th entity's spot is `M379.614,137.5 L371.895,137.5
L371.895,125.107 L379.614,125.107 L379.614,127.265 …` in the jar (an all-straight
outline) and our `C` Q-curve outline. lilura-67-cati343 shows the same single
diff. That is a kind→letter mapping defect in `class-badge.ts#badgeLetter`, not a
missing outline — the letter the jar draws is already in our table.
Reach: lilura-67-cati343, tepazu-23-zapo261, xidura-26-teki974 (1 structural diff
each, so a fix makes all three conformant).
**Confidence: M3a HIGH, M3b MEDIUM** — I did not read `EntityImageClassHeader`'s
kind→char switch; *next instrument:* grep
`src/main/java/net/.../svek/image/EntityImageClassHeader.java` for
`getCircledCharacter` and compare its `LeafType` switch against
`class-badge.ts#badgeLetter`.

---

## M4 — the `-0)-` middle decoration is not drawn at all

**Mechanism.** A link with a middle marker (`foo1 -0)- foo2`) gets two extra
children in the jar's `<g class="link">`: a half-circle arc and a filled circle,
both at the path's midpoint. We emit only the edge path.

**Origin.** Java: the midpoint comes from `klimt/shape/DotPath.java:154+`
`getMiddle()` (subdivides every bezier, picks the minimum-cost candidate and its
tangent angle); `SvekEdge#drawU` then draws the decor there. TS: nothing — no
`getMiddle` port exists (`grep -rn "getMiddle" src/` is empty), and the decor map
`src/diagrams/class/class-arrow-decor-map.ts` has no middle-marker entry.

**Causal chain (cenubi-27-xova754, its 5 diffs).** Jar's link group has three
children: the edge path, `<path d="M29.539,92.104 A10,10 0 0 0 43.681 92.104"
stroke-width:1.5 fill=none/>`, `<ellipse cx="36.61" cy="85.033" rx="6" ry="6"
fill="#FFF" stroke-width:1.5/>`. Ours has one; the comparator reports
`childCount 3 vs 1` and mis-pairs the remaining attributes onto `path[1]`.

**Reach — FULLY, and small.** cenubi-27-xova754 is the **only** class fixture
containing the syntax (`grep -lE '\-\(0|0\)\-' */in.puml`). Fixing it makes that
fixture conformant.

**Fix shape.** This repo: port `DotPath#getMiddle` into `src/core/klimt/shape/
DotPath.ts` (which already documents it as unported at `:107`) and add the decor
in `renderer-edge.ts`.

**Confidence: HIGH** for "absent"; **MEDIUM** for the exact arc arithmetic — I
read `getMiddle`'s loop but not the decor factory that consumes it.

---

## M5 — edge `d` is emitted end-to-start (direction only; drawing is unchanged)

**Mechanism.** Upstream normalises every spline to run entity1 → entity2 before
serialising it. For a set of inheritance edges we emit the reversed point array.
The arrowhead polygons are *not* affected (they pair off `matchesFromTo`
separately), so the rendered picture is identical — but the `d` string is the
mirror of the jar's, and the comparator charges 8 numeric diffs per edge.

**Origin.**
- Java: `svek/SvekEdge.java:643-655` — `normal = tmpStartPoint.distance(tmpPos1)
  + tmpEndPoint.distance(tmpPos2); inversed = …; if (inversed < normal) dotPath =
  dotPath.reverse();` ("Sometime, GraphViz inverses the result line").
- TS: `src/diagrams/class/class-edge-geo.ts:346-379` `normalizeEdgePoints` — a
  port of exactly that, but it *replaces* `reversed = dotSwap` with the distance
  verdict, and falls back to the bare `dotSwap` whenever
  `rel.idEntity1FullId`/`idEntity2FullId` is absent or `nodeCenter` cannot resolve
  it (`:361-375`).

**Causal chain.** delano-03-xino845 g[8]: jar `d` points
(76.019,146.269)(77.319,172.869)(78.56,198.13)(79.86,224.72); ours
(79.86,224.716)(78.559,198.129)(77.322,172.864)(76.02,146.272) — an exact
element-wise mirror, ≤0.006 per coordinate. Same in g[9], and in jinema/zogari/
mefaca/faxoga/jabeme/fexedu.

**Reach.** 37 fixtures contain at least one exactly-mirrored `path/@d`; **7 are
PURE** (mirrored `@d` is their *only* diff, so fixing this alone makes them
conformant): delano-03-xino845, faxoga-34-moja699, fexedu-26-dira713,
jabeme-35-logi109, jinema-90-laga721, mefaca-83-lebu193, zogari-39-ziza794.
Partial in: befasi, bivevo, dacisu, dudimi, dujinu, duvuti, famizo, gamevo,
garumi, gaxipe, givoli, joguva, lozijo, lujaje, mububu, mupuzo, nadepi, pareli,
paziji, pukuzu, ribove, rojoxi, soboro, tekena, tiguma, vuvico, xodopa, zakuta,
ziruni, zosaxa.
Every PURE fixture's affected edges are inheritance (`<|--` / `extends` /
`implements`) with at least one endpoint inside a `package`/`namespace`.

**Fix shape.** This repo, `class-edge-geo.ts#normalizeEdgePoints`.
**Confidence: HIGH** that the divergence is a pure direction flip (mirror verified
numerically across 37 fixtures). **MEDIUM-LOW** on the trigger: my hypothesis is
that `nodeCenter(posMap, anchors, idEntityNFullId)` misses for namespace-qualified
ids, so the code falls through to `reversed = dotSwap`. *Next instrument:* log
`(dotSwap, c1===undefined, c2===undefined, normal, inversed)` for the two edges of
delano-03-xino845 — if `c1`/`c2` are undefined the hypothesis holds; if they
resolve, the defect is in `nodeCenter`'s anchor substitution instead.

---

## M6 — visibility-modifier icon is centred on one line, not on the wrapped member block (exactly 21 px)

**Mechanism.** The `+`/`-` member icon is laid out by `PlacementStrategyVisibility`,
which centres the icon against `maxHeight12` — the **whole member's** block
height, which for a wrapped member is several lines. We feed it a single-line
row height and the first line's baseline.

**Origin.**
- Java: `klimt/geom/PlacementStrategyVisibility.java:63-69` —
  `maxHeight12 = Math.max(height1, height2); result.put(icon, new XPoint2D(0, 2 + y
  + (maxHeight12 - height1) / 2))`, fed from
  `cucadiagram/MethodsOrFieldsArea.java:395-410` (`getLayout`).
- TS: `src/core/klimt/geom/PlacementStrategyVisibility.ts:46-49` is a byte-exact
  port and is **not** the live path for class members; the class engine computes
  the icon y itself in `src/diagrams/class/class-visibility-icon.ts:336-342`
  (`visibilityIconOriginY(rowBaselineY, rowHeight)`, `centeringDelta` at `:104`),
  where `rowHeight` is the per-line height.

**Causal chain (pakemi-72-cani346, `skinparam wrapWidth 200`, its ONLY diff).**
The member wraps to 4 lines (baselines 61.889/75.889/89.889/103.889, block 48→104,
height 56). Icon block height 16. Java: `2 + (56-16)/2 = 22` → top 70 → `cy=80.5`
(jar). Ours: `2 + (14-16)/2 = 1` → top 49 → `cy=59.5`. Δ = 20 − (−1) = **21**,
which is exactly the observed delta.

**Reach — FULLY.** pakemi-72-cani346 and vubofi-17-dedi529 (1 diff each; both go
conformant). Only wrapped members are affected.

**Fix shape.** This repo: `class-visibility-icon.ts` + its caller in
`class-member-rows.ts` must pass the member's full wrapped block height and top.

**Confidence: HIGH** — arithmetic reproduces the 21 px exactly from the Java.

---

## M7 — canvas width/height off by 1–9 px with zero ink diffs

**Mechanism (partial).** The SVG's `width`/`height`/`viewBox` come from
`SvgGraphics.finalizeRootAttributes` (`klimt/drawing/svg/SvgGraphics.java:800-813`,
`(int)(maxX * scale)`), and `maxX`/`maxY` are accumulated by
`SvgGraphics.java:129-135` `ensureVisible`: `if (x > maxX) maxX = (int)(x + 1)` —
a truncating, order-sensitive running max, seeded at construction with the
diagram's computed dimension (`SvgGraphics.java:143`,
`ensureVisible(minDim.getWidth(), minDim.getHeight())`).

For camupi-97-gezi072 (80 vs 79) **every drawn coordinate matches within 0.01** —
the rightmost ink is the edge label at 27.89+36.238 = 64.128, far below either
value. So the canvas is driven by `minDim`, and our `minDim` is <1 px smaller,
crossing the truncation boundary. The same holds in the other direction for
gatula-10-bifu561 (+1 width) and jubobo-22-fapu993 / xosiza-60-sobu480 (+1 height).
This is therefore **not** a `Math.ceil`-vs-`(int)` bug at the emit site; our
`ensureVisible` port (`src/core/klimt/drawing/svg/svg-graphics-elements.ts`,
documented at `src/core/TextBlockExporter.ts:24-55` and `src/core/layout-epsilon.ts:12`)
already reproduces the quirk.

**Reach.** 24 of the 50 are exactly 1.0 on `@viewBox[2]`/`@width` or
`@viewBox[3]`/`@height`. 13 of those have **no other diff at all** (camupi,
gatula, jixamu, jubobo, kexaca, siteza, tamixa, tebore, tenomi, ticuxa, tilipa,
vafaka, xosiza) — those are pure `minDim` cases. The others (dofima, jireze,
tijira, sicile, lapoma, nenepe, lacote, xefeme) pair the width diff with
**sub-pixel text `@x` deltas** (0.195–0.349), i.e. they are downstream of a text
measurement difference, not of the canvas rule.

**Fix shape.** Unresolved. Not a rounding site.
**Confidence: MEDIUM** that the canvas rule itself is correctly ported and the
residual is in `minDim`. **LOW** on where `minDim` diverges. *Next instrument:*
for camupi-97-gezi072 print our pre-margin layout dimension and compare against
`dot -Tplain test-results/dot-cache/class/camupi-97-gezi072/svek-1.dot` (`graph 1
0.80408 2.375` → 57.894 × 171 px); the jar's `minDim` must land in [79,80) and
ours in [78,79), so the question is precisely which margin/label term supplies the
≈21 px in each axis.

---

## M8 — mid-path direction marker offset (sub-pixel to ~6.5 px, x only)

**Mechanism: NOT ESTABLISHED.** In bitove-03-sanu160 the small triangle drawn
beside an association label has identical y coordinates
(89.985/91.995/97.075) and a uniform **x** shift of 0.58; in
class-inheritance-interface-assoc the same signature with 0.804. Because a pure-x
shift cannot come from sliding along a diagonal spline (that would move y too),
the anchor is not a point on the curve. In gobuco-16-ruke239 (0.23),
lojepe-37-liri985 (0.636), lapoma-04-vaga142 (0.23) and dorelu-66-lixu637 (6.545)
the triangle **and** the adjacent `text/@x` move together by the same amount, so
those are a label-anchor case, a different sub-mechanism from bitove's.

**Reach.** bitove-03-sanu160, class-inheritance-interface-assoc (marker only, 4
diffs each — both would go conformant); gobuco-16-ruke239, lojepe-37-liri985,
lapoma-04-vaga142, dorelu-66-lixu637 (marker + label).

**Confidence: LOW.** *Next instrument:* read `SvekEdge.java`'s `linkArrow` /
`LinkArrow` draw block (around `:900-1000`, `getXY(fullSvg, …)` colour probes) and
`klimt/shape/DotPath.java:154-180` `getMiddle`, then compare against
`src/diagrams/class/class-edge-label-anchor.ts` and `class-magic-arrow.ts`. Do not
touch this before M1/M5 land — both change the point array the marker anchors to.

---

## Cascade-only (an A1/A2a/A4 defect upstream of any geometry)

These sit in the A5-69 list only because a `path/@d` happened to be one of the
attributes that mis-paired after an ordering, `@id`, `childCount` or style defect
put the wrong two elements side by side. Their first structural diff is `@id`,
`@class` or `childCount`, and the `@d` values compared are from **different
edges** (the `@id`/`@codeLine` on the same element disagree too).

besepi-37-rori892, bicabi-42-coto932, camuna-58-veca254, cicovi-23-zipe215,
cirojo-62-dubo306, cobumi-83-bapu892, cocube-46-tusu692, daxeno-00-kasu166,
delasa-80-jusu462, diroxo-41-zezo954, fogexa-30-zupo141, givofi-11-xumu978,
gokoru-18-daba136, gujigi-63-roki030, guxode-39-dobi371, kevoda-64-mije856,
lejoga-79-poji465, momoba-92-bole393, pejone-71-tige404, popesa-39-sobe866,
tedeba-19-lisi250, tegefa-14-koxo759, vudepo-27-cuvo793, xamule-03-jeda376,
xonamo-50-podo529, zepeki-75-pifo352.
(cocube, delasa and guxode ALSO carry M1; their cluster edges are genuine.)

Worked example: cicovi-23-zipe215 `svg/g[1]/g[1]/@class exp=entity act=cluster` —
the jar's first child is an entity, ours a cluster, so every subsequent `path/@d`
compares a class body against a package outline.

The `groupInheritance` fixtures the brief flagged (lazeju-60-boki114,
mefike-75-vova900, pijiju-95-xexi872, xifuza-00-paze682) are **not** in A5: their
diffs are `childCount exp=1 act=2` per link group — we emit one child more than
the jar per merged inheritance group. That belongs to the A2a link-group owner.
xosiza-60-sobu480 (crowfoot) has zero structural diffs; its only defect is the
M7 +1 height. bujedi-30-cize673 (`linetype ortho`) is not in the non-conformant
geometry set at all.

## Unclassified (real geometry, no mechanism proven)

- **boseba-99-zopo693** (1 structural diff), **majuva-44-luta965** (1): a single
  edge takes a completely different route (jar straight `M321.99,59 C…380.67,59`,
  ours a wide arc). Both fixtures also carry 681/114 numeric diffs, i.e. their
  node placement already differs — so this is a layout-ordering consequence, not
  an edge-drawing one, but I did not prove it. LOW.
- **The "identical 78.454" trio** delano/faxoga/jabeme is *not* a shared
  cross-diagram mechanism: the three `.puml` files are the same diagram with the
  namespace blocks reordered, so it is one edge measured three times (and it is
  M5). Likewise gojofu/paroxa (both exactly 20) and pakemi/vubofi (both exactly
  21, = M6) are duplicate-content pairs.
- **`Class::member` port anchors** (gojofu-46-xaci340, paroxa-83-lofa387,
  pegeso-72-mana305, monoda-73-guto455, nadono-22-gidu983, nenepe-70-keri784,
  xefeme-77-fagu709, nugecu-04-tona107): the jar reserves extra space above the
  first port row (gojofu's whole diagram sits 15 px lower in the jar and is 8 px
  taller). 53 corpus fixtures use the syntax. This is a node-sizing/port-row
  mechanism (`src/diagrams/class/class-map-port-rows.ts`), not edge geometry —
  it should be one dedicated mission. LOW; not investigated further.
- **pixexi-81-sete111**: `skinparam package BorderThickness 4` shifts the cluster
  outline by 5.389 — a stroke-inset question in the cluster path builder. LOW.
- **dorafa-63-soba922**: `skinparam sameClassWidth true` appears unimplemented
  (every node keeps its own width). Not geometry. LOW.
- **medosa-71-ligu412**: the two class separator `<line>`s end at different y2
  (jar both 114.79, ours 111.549 / 118.035) — the jar equalises them. LOW.
- **kupetu-36-kive480** (Δ0.011 on one `@d` coordinate) and
  **konomi-00-gico141** (Δ0.315 on one `text/@y`): single sub-pixel outliers, no
  mechanism. Note the retired `bipudo-23` lesson in
  `oracle/accepted-divergences.json` — kupetu's 0.011 is one hundredth over the
  0.01 band and is a serialization-precision candidate, not necessarily a gap.

---

## Suggested order of attack

1. **M5** (7 fixtures conformant outright, 30 more improved, one function).
2. **M2** (14 fixtures, one function, the pieces are already ported).
3. **M1** (17 fixtures, wiring only — `spline-clip.ts` exists).
4. **M6** + **M4** + **M3b** (5 fixtures conformant, all small and exact).
5. **M3a** — needs oracle-scraped outlines for R/J/O/W/D/Q/S/X; mechanical but
   data-bound, and it must be scraped, not computed (see the oracle-seam note).
6. **M7**, **M8**, and the port-row family — each needs instrumentation first.

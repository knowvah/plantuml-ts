# T5a — lifeline x placement and lifeline count (diagnosis)

Measured at the B4 close (`b4-classify.json`: 800 zero, 181 geometry, 150
structural, 7 paint, 3 error). No `src/` change; every counterfactual below ran
in a scratch copy of `src/` behind env gates. The scratch baseline was checked
first: its census is byte-identical to the worktree's, and its per-row `ws`
equals `b4-classify.json` on all 74 box rows.

## Instrument

- **Lifeline census** (scratch `census.mts`). Renders every non-zero row through
  the ratchet path (`renderFixtureSequence` + `DeterministicMeasurer`). It pulls
  each lifeline group (`<g><title>…</title><rect/><line x1=…>`) from ours and
  from the jar, then compares the count, the order of titles, and per-lifeline
  `x1 - x1_jar`.
- **Text-set test** (`textset.mts`). Compares the multiset of `<text>`
  (content, textLength) between ours and the jar. When it differs, the lifeline
  delta follows from label content, not from row layout. That sorts the
  "layout" rows apart from the "label content" rows.
- **Counterfactuals** (`cfdiff.mts`, real `compareSvg` + `weightedScore`):
  - `T5A_DOLL`/`T5A_DOLLY`: Doll constraints, englober Y, rect and width.
  - `T5A_VEC`: vector sprite atoms contribute their width.

## Re-derived clusters (338 non-zero rows)

| Cluster | Planning | B4 now | Composition |
|---|---|---|---|
| 1 first lifeline x differs | 160 | **84** | box 53 · label content 21 · layout 10 |
| 2 later lifelines differ, first equal | 94 + 10 | **94** | box 12 · label content 66 · layout 16 |
| 3 lifeline count differs | 37 | **4** | all `skinparam handwritten true` |
| 4 nested boxes | 7 | **7** | inside the 74 box rows |
| lifelines all equal | — | 156 | box 9 (out of T5a scope otherwise) |

Every row of clusters 1–3 is assigned to a mechanism below. Nothing is left
unassigned. The scratch `assign.py` printed `UNASSIGNED` for none of them.

| Mechanism | Rows (in clusters 1+2+3) | Section |
|---|---|---|
| M1 teoz `Doll`/`Dolls` englober layout unported | 74 box rows (65 in C1/C2, 9 lifeline-equal) | M1 |
| M2 vector inline atoms left literal in sequence labels | 55 (44 SVG sprite + 11 OpenIconic/emoji) | M2 |
| M3 label-content families (upstream of x) | 33 | M3 |
| M4 `NotesTile#addConstraints` unported | 5 | M4 |
| M5 note reaches missing from group clearance | 3 | M5 |
| M6 `SequenceMessage` `Padder` unported | 1 (+2 box/order rows) | M6 |
| M7 `putParticipantInLast` unported | 3 | M7 |
| M8 participant `MinimumWidth` (`minClassWidth`) ignored | 1 (+1 box row) | M8 |
| M9 `par2` never parallel | 1 | M9 |
| M10 handwritten mode never applied (cluster 3) | 4 | M10 |
| T5b overlap (note/ref) | 10 | T5b overlap |
| Unexplained: `[[url]]` label width | 4 | Unexplained |

---

## M1 — teoz `Doll`/`Dolls` englober layout is unported (box rows)

**Mechanism.** The port draws a `box` after the fact, as a rectangle 8 px
outside its participants at `y = 0`, the full diagram height. It never
registers the teoz `Doll` constraints:

- the title-width margins;
- `posA(first) >= posAA + 10 + BoxPadding`;
- `next.posA >= posE(last) + 20 + 2·BoxPadding`.

It also never applies the englober vertical offsets (`heightEnglober1/2`) or
`Dolls.getMaxX` (+10) to the width. Every participant of a box diagram
therefore lands 10 px per box boundary (plus any title margin and padding) left
of the jar, and everything is `heightEnglober1 + heightEnglober2` too short.

**Origin.**
- `src/diagrams/sequence/sequence-layout-participants.ts:344-382`
  (`solveParticipantXs`). It has no Doll terms: line 363 is the only
  neighbour rule, `xs[i-1] + widths[i-1] + participantGap`.
- `src/diagrams/sequence/layout.ts:428-458` (`computeBoxGeos`):
  `BOX_PAD = 8` (:434), `y: 0` (:445), `height: totalHeight` (:450).
- No englober Y origin: `TOP_MARGIN` is a constant
  (`sequence-layout-shared.ts:72`).

**Upstream.**
- **Construction order.** `SequenceDiagramFileMakerTeoz.java:102-116` builds
  `new Dolls(tileArguments)`, then calls `dolls.addConstraints`, *then*
  `new PlayingSpace(…)` and `livingSpaces.addConstraints`.
- **Neighbour constraint bakes the margins in.** `LivingSpaces.java:65-67`:
  `point2 = current.getPosA(); point2.ensureBiggerThan(previous.getPosE().addFixed(10))`.
  Because this runs after the dolls, the Doll margins are already in it.
- **Title margins.** `Doll.java:225-235`:
  `marginX = (titleWidth + 10 - actualWidth) / 2;
  if (marginX > 0) { first.ensureMarginBefore(marginX); last.ensureMarginAfter(marginX); }`.
  `x1`/`x2` are read before the compile, so `actualWidth` is the sum of the
  head widths from first to last.
- **Clearance before the box.** `Doll.java:250-253`:
  `getPosALive().ensureBiggerThan(getPosAA().addFixed(10 + padding.getLeft()))`.
  `posAA` is `xorigin` or the previous participant's `posD` (`:170-176`).
- **Clearance after the box.** `Doll.java:261-269`:
  `next.getPosALive().ensureBiggerThan(getPosELive().addFixed(20 + padding.getLeft() + padding.getRight()))`.
- **Padding source.** `Doll.java:271-273` reads
  `getPaddingTOBEREMOVED(PaddingParam.BOX)`. That is
  `SkinParam.java:1153-1164`, `getAsDouble("boxpadding")`, which is
  `same(0)` unless the value is numeric.
- **Width.** `Doll.java:279-281`, `getMaxX = getPosE().addFixed(10)`, enters
  `PlayingSpace.java:81-84` (`max2.add(dolls.getMaxX(...))`).
- **Drawn rectangle.** `Doll.java:203-216`:
  `x1 = getPosA() - 4; x2 = getPosE() + 4; … ug.apply(new UTranslate(x1, 1))`.
- **Vertical offsets.** `SequenceDiagramFileMakerTeoz.java:84-85`:
  `heightEnglober1 = dolls.getOffsetForEnglobers(); heightEnglober2 = heightEnglober1 == 0 ? 0 : 10`.
  - `:144-149`: `drawEnglobers(ug, body.h + heightEnglober1 + heightEnglober2 / 2)`,
    then `ug.apply(dy(heightEnglober1))` before `body.drawU`.
  - `:161-163`: the total height adds both.
- **Title size.** `ComponentRoseEnglober.java:58`: padding
  `topRightBottomLeft(1, 3, 1, 3)`. Height is `getTextHeight + 3` (`:83`) and
  width is `getTextWidth` (`:88`). So a 13 pt bold title is 13 + 2 + 3 = 18 tall.

**Causal chain.** `fugilu-74-jivu585` has one box around A and B.
- Jar: `posA(A) >= 0 + 10` gives `posB(A) = 10`, drawn at 20. Ours draws A at
  10. That is the uniform −10 on the first lifeline.
- Each later box boundary adds `20 − 10 = 10` more. That is the staircase
  −10/−20/−30 in podije, mukebo and pufube.
- The rectangle is jar 16 (`posA − 4 + 10`) against ours 2 (`x − 8`).
- The jar's y = 11 (`1 + 5 + 5`) against ours 0.
- Height is +28 (= 18 + 10).
- Width is +20: `posE + 10` puts 10 more into `max`, and the box sits 10 right.

**Ruled out.**
- *The research M1–M5 alone.* All five have landed (B1–B4), and all 74 box
  rows are still non-zero (`box` rows by cohort: geometry 62, structural 12,
  zero 0).
- *`dx(-min1)` (PlayingSpace min) is the shift.* `min2` holds `xorigin` (0) and
  `posA(first) >= 10`, so the min stays 0. The counterfactual reproduced the
  jar with min untouched.
- *BoxPadding defaults nonzero.* `SkinParam.java:1158-1164` returns `same(0)`
  for a missing value. The counterfactual with padding 0 reaches zero on 42
  rows that set no padding. Rows that set `BoxPadding` (pupini, zukume, kumovo,
  zogane, gijamu) or use the cerulean theme (`BoxPadding 40`) only moved once
  padding was added.
- *Measurement artifact.* The scratch baseline is byte-identical, and
  `cf-base.ws == b4-classify.ws` for all 74 rows.

**Evidence (counterfactual over the 74 box rows).**
- Lifelines exact: 9 → 60 (X terms + `BoxPadding`).
- With Y offsets, the `Doll` rect and width added:
  - **42 rows reach zero.**
  - Σ ws 11028 → 3779.
  - **0 rises.**
- The rect-height term used is `totalHeight_port − 15`
  (`body + heightEnglober1 + heightEnglober2/2`). It matches the golden on
  every single-page box row; fugilu's golden is y = 11, height = 107.

**Sub-mechanisms inside the 32 box rows that did not reach zero.**
- **M1b title trimmed.** `command-grouping.ts:35`
  `(match[1] ?? match[2] ?? '').trim()`. Upstream keeps the title verbatim:
  - `CommandBoxStart.java:74` `NAME2 "([^#]+)"` keeps the space before `#`;
  - `:127` `title = argTitle == null ? "" : argTitle`, with no trim.

  A trailing space widens `titleWidth`, so `marginX` moves by space/2: datetu
  measures 1.79 = 3.575/2. The rect is also drawn with the pure text width.
  Rows: datetu, biruge, cinula, goceku (4). goceku is 1 diff (title text x) and
  cinula 10 after M1.
- **M1c nesting flattened.**
  - The port has a flat `BoxGroup` (`command-grouping.ts:48-55`).
  - `end box` clears every level (`:67`).
  - A participant is pushed only into the innermost open box
    (`sequence-parse-helpers.ts:173,178`).

  Upstream nests:
  - `SequenceDiagram.java:502-514` builds `newChild` and pops with
    `getParent`;
  - `Dolls.java:56-65` adds each participant to every doll in
    `englober.getGenealogy()`;
  - `getOffsetForEnglobers` (`:80-92`) sums the title heights up the parent
    chain;
  - `Doll.drawMe` (`Doll.java:208-212`) shifts by `dy` once per ancestor.

  Measured in the binupo jar: the outer "component" rect is at y = 11,
  h = 117; the children are at y = 29 (= 11 + 18), h = 99 (= 117 − 18). Ours
  draws only the two children and omits the outer rect (an element-count
  diff). Rows: binupo, kuniko, lokole, nekeso, rujimo, vekivu, vinefa (7).
- **M1d tile-driven box margins.** `NoteTile#addConstraints →
  ensureOwnBoxClearsNote` (`NoteTile.java:182-218`) and
  `CommunicationTileSelf#ensureOwnBoxClearsLoop` (`:209-223`). Also the
  `…SelfNoteLeft/Right` wrappers (`CommunicationTileSelfNoteLeft.java:152-160`,
  `…NoteRight.java:145-152`). Each grows `marginBefore`/`marginAfter`, which
  only the Doll reads, live (`getPosALive`/`getPosELive`). Rows: ropame (note
  over A in a box; box width 31.4 against 68.7), taraxa, rujapu. rujapu also
  has M8. All three are unported, with no x consumer in the port.
- **Paint and other, not x.** Seven rows are left with only
  `rect/@fill` + `@fill-opacity` diffs on a *group* background with an alpha
  hex colour (`alt #00ff0020`): ours `fill="#00FF0020"`, jar `fill="#0F0"
  fill-opacity="0.125"`. The rows are nivelo, darupa, meleno, xebixi, koleji,
  nofegi, xeneru. The same signature shows on 14 corpus rows. This was
  observed only, not traced, because it is outside T5a.
- **Other leftovers.**
  - calaja: a page-1 rect height under `newpage`. `drawEnglobers` uses the
    page's `body.calculateDimension`.
  - vijito/vitusu/xalafa (cerulean): after `BoxPadding 40` they sit at a
    uniform −5 px (unscaled). See Unexplained.
  - dugeki, mukebo, teoz-ng-001, tukobo, gijamu, zogane, kumovo: lifelines
    exact or near, residual in other families.

**Rows.** All 74 box rows.
- **Zero in the counterfactual (42):** benugo, bofovo, dalata, demeli, fadibu,
  fugilu, funoti, gozobo, gucare, javiki, jinaxe, jiveji, jomemi, jugami,
  juzagu, kogozi, mizeli, mopidi, murori, nekave, pakado, pexona, poceko,
  podije, poxugi, pufube, pupini, ruxocu, selasi, subaku, sukuno, taxale,
  tekice, tipido, vidibe, vifobo, vosaco, vuniko, vuxaci, xonedu, xuzedu,
  zukume.
- **Also expected zero with M1b:** goceku. cinula is 10 diffs before M1b.

**Proposed fix (F1, one task; the parts share the Doll model).**
- **Write-set:**
  - new `src/diagrams/sequence/sequence-dolls.ts` (`Doll`/`Dolls`: genealogy,
    margins, `getMinX`/`getMaxX`, `getOffsetForEnglobers`, drawn rect);
  - `sequence-layout-participants.ts` (solver: `mB`/`mA` in the neighbour
    edge, the before/after Doll edges);
  - `layout.ts` (`computeBoxGeos` → Doll rect; height + `heightEnglober1/2`;
    width via `getMaxX`);
  - `sequence-layout-shared.ts` (`TOP_MARGIN` becomes a per-diagram y origin
    `10 + heightEnglober1`);
  - `sequence-layout-box.ts`;
  - `command-grouping.ts` (no trim; parent link; `end box` pops one level);
  - `ast.ts` (`BoxGroup.parentId`);
  - `sequence-parse-helpers.ts` (participant joins the innermost box; Dolls
    walk the genealogy);
  - BoxPadding plumbing in `src/core/skinparam-accumulator.ts`, the
    `skinparam-key-handlers-table-*.ts` entry, `skinparam-theme-builder.ts`
    and `theme.ts` (a `boxPadding` raw value read like `footbox`).
- **Approach:** mirror `Doll.java`/`Dolls.java` and the teoz file-maker order.
  Leave M1d (`ensureOwnBox*`) out, as a follow-on F1d on the same files after
  F1.
- **Expected movement:**
  - 42 rows to zero; goceku and probably cinula once M1b is in;
  - the 7 nested rows' structural diffs close (outer rect drawn);
  - Σ on box rows ≈ −7250;
  - 0 rises in the counterfactual.
- **Unit-test anchors:** fugilu golden (`rect x=16 y=11 w=68.725 h=107`,
  lifeline 31.681, svg 101×133); binupo (outer y = 11 h = 117, child
  y = 29 h = 99).

**Confidence.**
- HIGH for X, Y, rect and width (counterfactual, 0 rises).
- HIGH for M1b (numeric: space/2).
- HIGH for M1c (structure read and golden geometry).
- MEDIUM for M1d (code read; no counterfactual).

---

## M2 — vector inline atoms stay literal in sequence labels (55 rows)

**Mechanism.** A label line holding an SVG sprite, an OpenIconic glyph or an
emoji falls back to the WHOLE line as literal source text, e.g.
`ab<$SVG_NO_BEZIER>cd` measured at 159 px. The jar draws the atoms (`<path>`)
at their own size. The label width is wrong, so the message's
`CommunicationTile` span constraint, and with it every later lifeline, is
wrong.

**Origin.** `src/diagrams/sequence/sequence-creole.ts`:
- `:310` `if (atom.atom.kind === 'openiconic') return LITERAL_LINE;`
- `:313` `if (resolved.kind === 'drawable') return LITERAL_LINE;`
- `:336`: emoji atoms are not `'inline'`, so `drawableAtoms` returns
  `undefined`, which also falls back to literal.

The module documents this as a named remainder (`:61-84`).

**Upstream.**
- `AbstractTextualComponent.java:100-108`: `getPureTextWidth` is the text
  block's `calculateDimension().getWidth()`. A sprite atom contributes its own
  dimension (`StripeSimple#addSprite`, `CommandCreoleSprite.java:82`).
- `ComponentRoseArrow.java:347-349`: `getPreferredWidth = getTextWidth + getArrowDeltaX`.

**Causal chain.** The literal string's width replaces the jar's
text-plus-sprite width. `messageConstraint`
(`sequence-layout-participant-constraints.ts:166-196`) feeds that width into
the span, so the receiving lifeline moves by the difference.
- bapifu: the 1200-px sprite is replaced by a 159-px string, which is −1069.
- cizeja-like rows go the other way (ours wider).

**Ruled out.**
- *The sprite is not registered.* `T5A_VEC` swaps only the `'drawable'` branch
  for an atom of the resolver's own `width`/`height`. That makes **44/44 SVG
  sprite rows lifeline-exact**, so registration and dimensions are right.
- *The row solver is at fault.* Those 44 rows move with label width alone.
- *Participant-head path.* makigi (`<$k8s>` in a head) is also fixed by the
  same branch.

**Rows.**
- **SVG sprite (44, lifeline-exact in the counterfactual):** bapifu, bucebo,
  bugafa, cokaci, dedude, deluve, fukaro, gizinu, gofixe, kaluna, kijeka,
  komafa, labite, lokonu, loloke, lukivo, lupomi, makigi, mataga, metaro,
  mifafi, musive, nemeji, nijilu, patute, pimoci, posura, puneli, ralegi,
  ralucu, rolota, ruboxu, ruzapi, saroli, sebafe, sodovo, soxafo, tijeta,
  vekuno, vibaru, vivava, zexaja, zimoci, zolude.
- **OpenIconic/emoji (11, same fallback, not counterfactualled):** dekapo,
  fanoxo, fuvumu, gacemo, giroko, jivati, kojoma, mozege, rapoto, savebe,
  tugonu.

Zero is not claimed: the jar's `<path>` primitives must also be emitted for
any of these rows to reach zero.

**Proposed fix (F2).**
- **Write-set:**
  - `src/diagrams/sequence/sequence-creole.ts`;
  - `src/diagrams/sequence/text-block-geo.ts` (`TextRun` gains a
    drawable-primitives field);
  - `src/diagrams/sequence/sequence-text.ts` (emit the primitives);
  - `src/diagrams/sequence/scale-geo.ts` (scale them).
- **Approach:** carry the resolver's `DrawablePrimitive[]` and its
  width/height as a run, as the raster branch already does. Place it with
  `placeDrawableAtoms`. Route OpenIconic and emoji through the same shared
  resolver.
- **Expected movement:** lifeline x exact on the 44 sprite rows. Full zero
  depends on primitive emission fidelity.
- File-disjoint from F1.

**Confidence.** HIGH for the SVG-sprite rows (counterfactual). MEDIUM for
OpenIconic/emoji (same code path, read only).

---

## M3 — label-content families (33 rows, upstream of lifeline x)

The text-set test shows each row's drawn text differs from the jar's, and the
lifeline delta follows from it. Each family is under 10 rows. None is a row
layout mechanism; they are listed with the origin pointer for routing.

| Family | Rows | Pointer |
|---|---|---|
| `%autonumber%` not substituted in a label | kituzo, kovito, makuzo, zajova | label text pipeline |
| message wrap (`maxMessageSize`, `wrapMessageWidth`, `arrow { MaximumWidth }`) | felasa, fetazo, suneke, tugaju, zicadi, tefunu, nexuxi | `AbstractComponentRoseArrow` `LineBreakStrategy` (`:61-62`) |
| `scale W*H` / `N height` / `1/4` | javedu, kepuxa, nabesa, vikelu, suzumi | scale computation |
| `skinparam dpi` | baketu, tumuke | dpi scale |
| `<img>` that cannot be decoded | fifasu, budevu, vofupo | jar draws the "(Cannot decode)" text block differently |
| creole table/list (`\|…\|`, `\|_`) | duzico, togopo, bejate, jagoni | sequence-creole has no table/list stripe |
| `<text …>` tag | cizeja | creole |
| `[[url Line 3\nLine 4]]` head | ripura | head label |
| `%filename()` builtin | tifube | preprocessor |
| base64 PNG sprite (registration withheld) | liguma | `command-sprite.ts:27-54` |
| `<math>` | mefeke | permanent (KaTeX/no `<math>` command) |
| `{{ }}` embedded | cusete | oracle seam |

---

## M4 — `NotesTile#addConstraints` (parallel `/ note`) is unported (5 rows)

**Mechanism.** In a `note …` / `/ note …` group, upstream pushes each later
note's left edge past every earlier note's right edge whenever their anchor
centres differ. The port's row solver never sees notes.

**Origin.** `src/diagrams/sequence/sequence-layout-participant-constraints.ts:157-163`
(`scanEvents`). It handles only `message`, `messageExo` and `frame`. Notes add
no `SpanConstraint`.

**Upstream.** `NotesTile.java:202-226`:
```java
if (center2 > center1) {
    final Real point1b = getX2(getStringBounder(), all.get(i));
    final Real point2 = getX(getStringBounder(), all.get(j));
    point2.ensureBiggerThan(point1b);
}
```
The mirror case is at `:219-222`. `getX`/`getStackingOffset` are at
`:150-185`.

**Causal chain.** cofuse places `A2 this line throws an error` over A and B1
over B in one group. The jar pushes B's lifeline to 218.919: B1 starts at
200.456, past A2's right edge. Ours puts B where the neighbour rule alone puts
it (136.091), so −82.83.

**Ruled out.**
- *Message spans.* The rows have no message between the two participants, or
  a short one.
- *Note x drawing.* T5b's area. Here the lifelines themselves move, which
  only the row solver can do.

**Rows.** bagexe, butosi, cofuse, nesuva, pomoxu.

**Proposed fix (F3, with M5).**
- **Write-set:** `sequence-layout-participant-constraints.ts`,
  `sequence-layout-group-clearance.ts`, and a note-width helper read before
  the row solve (new `sequence-note-width.ts`; reuse the note component sizing
  `sequence-note-tile.ts` already uses, read-only).
- **Approach:** a centre-to-centre `SpanConstraint` per note pair,
  `(w_i + w_j)/2` plus the stacking offset.
- **Expected movement:** the 5 rows' lifelines.
- File-disjoint from F1 as long as `solveParticipantXs` is untouched; it
  already takes centre spans.

**Confidence.** MEDIUM-HIGH (code read; cofuse geometry consistent).

## M5 — note reaches missing from group clearance (3 rows)

**Mechanism.** `GroupingTile`'s clearance pushes the participant after a group
past every whitelisted right edge, and the participant before it past every
whitelisted left edge. That includes `NoteTile` and the note-wrapper tiles.
The port's clearance omits them; its own comments record this as a hand-back.

**Origin.** `src/diagrams/sequence/sequence-layout-group-clearance.ts`:
`:135-140` (`rightReaches`, "note widths … not reachable here"), `:157-160`
(`leftReaches`), and `:251-256` (title overhang = 0).

**Upstream.**
- `GroupingTile.java:538-555` `stableMaxX`:
  ```java
  if (tile instanceof NoteTile) return ((NoteTile) tile).getStableMaxX();
  if (… tile instanceof CommunicationTileNoteRight || tile instanceof CommunicationTileSelfNoteRight …)
      return Collections.singletonList(tile.getDrawnMaxX());
  ```
- `:577-590` is `stableMinX`, the mirror.
- `:654-661`: the title overhang reads `NoteTile.getLeftOverhang()`.

**Causal chain.** In putici, `Bxxx->Cxxx : message3` with `note right`
(x 324.8 → 433.8) inside the outer `opt` pushes Dxxx's lifeline to 487.269.
Ours omits the note's edge, so −83.5.

**Ruled out.** The T3c2 clearance (title, self loops, life events, refs) is
already in place, and these rows still move only on the note-carrying lifeline.

**Rows.** putici, tuzeli, lirasa. lirasa has the note after `end`; MEDIUM.

**Proposed fix.** In F3 (same write-set).

**Confidence.** MEDIUM. The port's own hand-back plus the Java whitelist; no
counterfactual, because note widths are not available before the row solve.

## M6 — `SequenceMessage` `Padder` is unported (bakire; also suvodo, gijamu)

**Mechanism.**
`skinparam SequenceMessage { Margin / Padding / BorderColor / BackgroundColor }`
wraps every arrow label in a `Padder`. The width grows by 2·(margin + padding),
and a border/background rect is drawn. The port's arrow width is
`label + 2·ARROW_PADDING_X + ARROW_DELTA_X` only.

**Origin.**
- `src/diagrams/sequence/sequence-layout-participant-constraints.ts:183`
  (`span`).
- `text-block-geo.ts:485` (`messageLabelWidth`).
- No padder reader anywhere in `src/diagrams/sequence`.

**Upstream.**
- `AbstractComponentRoseArrow.java:73-76`:
  `final Padder padder = getSkinParam().sequenceDiagramPadder(); return padder.apply(super.getTextBlock());`.
- `SkinParam.java:1216-1229` builds it from `SequenceMessagePadding`/`Margin`/
  `BorderColor`/`BackGroundColor`.
- `Padder` `calculateDimension` is
  `padding.apply(margin.apply(orig.calculateDimension()))`.

**Causal chain.** bakire has `Margin 35`, `Padding 5`, so the label is
+2·(35+5) = +80 wider. The measured lifeline delta is −79.85; the neighbour
rule was binding by 0.15 in ours.

**Ruled out.** A label-content difference: bakire's text set is equal.

**Rows.** bakire. Also suvodo (with M7) and gijamu (a box row; it also has
`MessageBackgroundColor`).

**Proposed fix (F4).**
- **Write-set:**
  - `text-block-geo.ts` (`messageLabelWidth` + `Padder`);
  - `renderer-message.ts` (the padder rect);
  - the skinparam plumbing (`src/core/skinparam-accumulator.ts`,
    `skinparam-key-handlers-table-*.ts`, `skinparam-theme-builder.ts`,
    `theme.ts`).
- **COLLIDES with F1 on the `src/core/skinparam*`/`theme.ts` files.** Either
  sequence F4 after F1, or let F1 carry the four raw keys.

**Confidence.** MEDIUM-HIGH.

## M7 — re-declaring a participant does not move it last (3 rows)

**Mechanism.** Upstream: `participant X` for an existing X calls
`putParticipantInLast`, which moves X to the end of the row and re-assigns its
englober. The port ignores repeat declarations.

**Origin.** `src/diagrams/sequence/sequence-parse-helpers.ts:163`
`if (state.participantIndex.has(id)) return;`. The gap is documented at
`command-participant.ts:111-116`.

**Upstream.**
- `CommandParticipant.java:146-148`:
  `if (diagram.participantsContainsKey(code)) { diagram.putParticipantInLast(code); return ok(); }`.
- `SequenceDiagram.java:548-555`:
  `participantsList.remove(p); addWithOrder(p); participantEnglobers2.put(p, participantEnglober);`.

**Causal chain.** Title order differs:
- duboco: jar A, C, B against ours A, B, C;
- suvodo: jar Bob, Alice;
- lafuzo.

**Ruled out.** Instrument order: the lifeline census compares `<title>`
sequence, and those differ.

**Rows.** duboco, suvodo, lafuzo.

**Proposed fix (F5).**
- **Write-set:** `sequence-parse-helpers.ts`, `command-participant.ts`, the
  single-line participant command.
- **COLLIDES with F1** (`sequence-parse-helpers.ts`; the englober re-assign).
  Run it after F1.

**Confidence.** HIGH.

## M8 — participant `MinimumWidth` (`skinparam minClassWidth`) ignored (rupasa; rujapu)

**Mechanism.** `ComponentRoseParticipant`'s pure text width is
`max(text, MinimumWidth)`. The port sizes heads from the text only.

**Origin.** `src/diagrams/sequence/sequence-layout-participants.ts:107-150`
(`computeParticipantWidths`) and `sequence-layout-participant-sizing.ts`.

**Upstream.**
- `Rose.java:276-278` `getMinClassWidth(style) = style.value(PName.MinimumWidth).asDouble()`;
- passed at `:139/143/147/151`;
- `ComponentRoseParticipant.java:141`
  `return Math.max(super.getPureTextWidth(stringBounder), minWidth);`.

**Causal chain.** rupasa (`minClassWidth 400`): jar heads are 414 wide
(400 + 7 + 7); ours are text-width. rujapu: 164 = 150 + 14.

**Ruled out.** Box layout for rujapu: rujapu stays at −124 per later
participant after the M1 counterfactual.

**Rows.** rupasa (and rujapu, with M1d).

**Proposed fix (F6).**
- **Write-set:** `sequence-layout-participant-sizing.ts`,
  `sequence-layout-participant-label.ts` (label centring), and the sizing
  call in `sequence-layout-participants.ts`.
- **COLLIDES with F1** on `sequence-layout-participants.ts`. Run it after F1.

**Confidence.** HIGH (two goldens).

## M9 — `par2` is never parallel (jexavi)

**Mechanism.** Upstream makes `par2` parallel:
- `GroupingStart.java:105`: `isParallel()` returns `parallel || isPar2GroupStart()`;
- `:112-114`: `isPar2GroupStart` is `getTitle().equals("par2")`;
- `GroupingTile.java:146`: `final boolean parallel = start.isParallel();`.

The port parses `par2` (`command-grouping.ts:130`, `ast-frame.ts:20`) and
lays it out as a sequential group.

**Rows.** jexavi: first lifeline −113.77, height +45.

**Proposed fix.** One small task in the frame layout. Low priority.

**Confidence.** MEDIUM. Code read only; the jar's y is shorter, consistent
with parallel branches.

## M10 — handwritten mode is never applied (cluster 3: all 4 rows)

**Mechanism.** In the jar, `skinparam handwritten true` wraps the whole
drawing in `UGraphicHandwritten`, so every lifeline is a jittered `<path>`.
There are no `<line>` elements: gepuce has 0 lines and 10 paths; jefoke,
menoke and pafene likewise.

The port's sequence renderer emits SVG strings directly. It never routes
through `src/core/klimt/drawing/hand/UGraphicHandwritten.ts`, which exists.

The "lifeline count differs" cluster is this instrument effect. The jar draws
the same participants, but not as `<line>` lifelines.

**Origin.** `src/diagrams/sequence/renderer.ts`: no handwritten branch
anywhere in `src/diagrams/sequence`.

**Upstream.** `TextBlockExporter.java:174-175`:
`if (isHandwritten) ug = new UGraphicHandwritten(ug);`.

**Rows.** gepuce, jefoke, menoke, pafene.

**Proposed fix.** Out of x scope; a renderer-wide task. The planning count
of 37 collapsed to these 4 after B1–B4.

**Confidence.** HIGH.

---

## T5b overlap (10 rows; T5b owns the note/ref x)

| Rows | Observation |
|---|---|
| cejoxe, zizeca | The note line has a trailing space. The jar's width includes it (−3.575 = one 13 pt space; −1.79 = half). Same class as M1b. |
| limajo, pobasa | `note right` on an exo-to-right message (`A ->]`). The jar's first lifeline moves right by 252/310, so the note reaches left of the row. |
| mupugi, rezoma, xojavo | `note right`/`note left` after a `ref over`. Uniform −15.469 on every lifeline (min1 shift). |
| jafufe, xujavu | Note wrapping (the text set differs). |

## Unexplained

- **`[[url]]` label width (4 rows: cikoca, cusiro, losefo, cedeti).**
  - Ours is wider: +13.2 per `ref over …: [[url]] text` (cikoca/cusiro/losefo,
    a staircase 13.2/26.4), and +84.44 on cedeti's `alt [[url]]` group.
  - The drawn text is identical (the text set is equal), so the *measured*
    width differs from the *drawn* runs.
  - Ruled out: the row solver (no other term moves) and label content (equal
    text).
  - Instrument next: log the string `refComponentWidth`
    (`sequence-layout-participant-constraints.ts:230`) and `groupHeaderWidth`
    (group clearance title) measure, against the jar's `Display` after
    `CreoleParser` strips `[[…]]`.
- **Cerulean residual 5 px (vijito, vitusu, xalafa).**
  - After M1 with `BoxPadding 40`, every lifeline is still −5.208
    (= 5 × scale 1.0417).
  - The theme sets `participant { Margin 5 40; Padding 15 20 }`. The port's
    head width is 150 (= 70 + 2·40) and the jar centre implies `posB = 55`
    against the 50 the Doll edge gives.
  - Ruled out: `min1` (divider `getMinX` = `xorigin`; Doll minX ≥ 50).
  - Instrument next: the jar's `LivingSpace.getPreferredWidth` for a head with
    style Margin. Check whether `ComponentRoseParticipant` adds margin
    asymmetrically (`Rose.java:134-135` passes `margin` through).

## Proposed fix tasks (journal-ready)

| Task | Mechanism | Write-set | Expected rows | Collisions |
|---|---|---|---|---|
| F1 | M1 (+M1b, M1c) | new `sequence-dolls.ts`; `sequence-layout-participants.ts`; `layout.ts`; `sequence-layout-shared.ts`; `sequence-layout-box.ts`; `command-grouping.ts`; `ast.ts`; `sequence-parse-helpers.ts`; `src/core/{skinparam-accumulator,skinparam-key-handlers-table-b,skinparam-theme-builder,theme}.ts` | 42 to zero (+goceku, cinula likely); 7 nested lose their structural diff; Σ box ≈ −7250 | F4 (core skinparam), F5/F6 (participants / parse-helpers) |
| F1d | M1d `ensureOwnBoxClears{Loop,Note}` | same files as F1 + the note/self width read | ropame, taraxa, rujapu (part) | after F1 |
| F2 | M2 | `sequence-creole.ts`, `text-block-geo.ts`, `sequence-text.ts`, `scale-geo.ts` | 44 rows lifeline-exact; 11 OpenIconic/emoji | F4 (`text-block-geo.ts`) |
| F3 | M4 + M5 | `sequence-layout-participant-constraints.ts`, `sequence-layout-group-clearance.ts`, new `sequence-note-width.ts` | bagexe, butosi, cofuse, nesuva, pomoxu, putici, tuzeli, lirasa | none |
| F4 | M6 | `text-block-geo.ts`, `renderer-message.ts`, core skinparam files | bakire (+suvodo, gijamu partial) | F1 (core), F2 (`text-block-geo.ts`) — run after both |
| F5 | M7 | `sequence-parse-helpers.ts`, `command-participant.ts`, single-line participant command | duboco, suvodo, lafuzo | after F1 |
| F6 | M8 | `sequence-layout-participant-sizing.ts`, `sequence-layout-participant-label.ts`, `sequence-layout-participants.ts` (sizing call) | rupasa (+rujapu) | after F1 |

Parallel-safe first sub-batch: **F1 ∥ F2 ∥ F3**. Second: F4, F5, F6, F1d.

## Scratch artifacts (not committed)

All under `/private/tmp/claude-501/-Users-scottseely-git-knowvah-plantuml-ts/303eb6e3-f3cf-4737-80a1-e4f9d9cbec55/scratchpad/T5a/`:
`census.mts`, `textset.mts`, `cfdiff.mts`, `assign.py`, `clusters.json`,
`cf-base.json`, `cf-doll2.json`, `census-vec.json`, and the scratch `wt/src`
copy holding the gated counterfactual.

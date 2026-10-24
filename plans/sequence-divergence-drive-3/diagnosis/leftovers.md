# T5b diagnosis: the eight rows still open after batches 1-4

Task T5b, mission sdd3, branch `sdd3/T5b` off `501a162d0`. Diagnosis only: no
`src/` or `tests/` change. Rows are the non-zero rows of
`measurements/b4-classify.json` minus T5a's two canvas-only rows
(`kaluna-08-rubu301`, `gebeki-18-muci858`). Java paths are under
`~/git/plantuml/src/main/java/net/sourceforge/plantuml/` unless written
otherwise; JLaTeXMath 1.0.7 sources (not on disk in this repo) were fetched
from Maven Central (`org/scilab/forge/jlatexmath/1.0.7/…-sources.jar`) and
are cited as `jlatexmath/<File>.java:<line>`. Port paths are repo-relative.

**Result: every row is explained by exactly one mechanism, five mechanisms in
all; nothing is Unexplained.** Four rows (`jefoke`, `gepuce`, `pafene`,
`menoke`) are one mechanism; four rows are one mechanism each. Each mechanism
was confirmed by a counterfactual (a scratch run that supplies the one missing
input and reaches ws 0 or an exact numeric match with the jar), and the two
that move numbers (`jexavi`, handwritten) were also confirmed against the jar
itself with instrumentation. No library forces any of the five.

## Per-row index

| slug | ws (b4) | n | mechanism | ws split |
|---|---:|---:|---|---|
| jefoke-95-jara779 | 280 | 21 | M1 handwritten | 21/21 sites M1 (glyph `<path>` is NOT jiggled by the jar: 0 of 21) |
| gepuce-64-pivu656 | 241 | 21 | M1 handwritten | 21/21 sites M1; nothing else (see M1 "gepuce") |
| pafene-01-tedi758 | 173 | 12 | M1 handwritten | 12/12 |
| menoke-22-luxo044 | 150 | 13 | M1 handwritten | 13/13 (one site needs the shared-stream rule) |
| jexavi-40-degi377 | 121 | 121 | M2 cyclic disjoint force frozen by a `RealMax` first read | 121/121 (all x; zero y) |
| fifasu-62-pipo979 | 57 | 44 | M4 remote image bytes not available to the sync render | 44/44 |
| mefeke-43-xotu192 | 35 | 35 | M3 `array` node unmodelled in latex-metrics | 35/35 |
| tifube-59-tezo313 | 21 | 21 | M5 `%filename()` environment unwired | 21/21 |

## Method (what was instrumented)

- `diff-one.mts` for every row; fresh jar render of `jexavi` is byte-equal to
  its cached `in.svg` (so the cache is current and the jar is deterministic
  for it).
- **Jar instrumentation (jexavi):** shadow copies of the package-private
  `net.sourceforge.plantuml.real.{RealMax,RealMin,RealLine,PositiveForce}`
  with gated tracing, compiled with `javac -cp oracle/dist/plantuml-oracle.jar
  -d <cls>` and put FIRST on the classpath of the same
  `net.sourceforge.plantuml.Run` command `scripts/oracle-render.sh` uses. The
  instrumented render is byte-equal to the golden (tracing changes no value).
  It logs every `PositiveForce` at creation (with its call site), every force
  that fires (fixed value, moving value, push), and every `RealMax` at its
  first `getCurrentValue()` (value, the candidates, the reading frame). A
  second variant counted forces created by `PlayingSpace.ensureDisjoint` that
  fire, over the 63 corpus fixtures that contain `&`/`par2`.
- **Port counterfactuals** (scratch scripts outside the repo, importing the
  worktree's `renderFixtureSequence`/`compareSvg`): feed the port the one
  input it lacks and re-run `compareSvg` (fifasu, mefeke, tifube), or push the
  port's own emitted primitives through the already-ported
  `UGraphicHandwritten` and compare numbers with the jar (the four
  handwritten rows).
- Nothing was written under `src/` or `tests/`; `git status` is clean apart
  from this file.

---

## M1 — handwritten mode is not applied to the sequence document

### Mechanism
`skinparam handwritten true` makes the exporter wrap the page graphic in
`UGraphicHandwritten`, which replaces every `URectangle`/`ULine`/`UPolygon`/
`UEllipse`/`DotPath`/`UPath` by its jiggled hand shape (a rectangle becomes a
`<polygon>`, a line a `<path>`, an ellipse a `<polygon>`). The sequence
renderer emits SVG strings per primitive and never routes a primitive through
`UGraphicHandwritten`, so it emits plain `<rect>`/`<line>`/`<ellipse>` and
straight arrowhead polygons.

### Origin (port file:line)
`src/diagrams/sequence/renderer.ts` (whole file: every primitive is a string
template — `line(...)` from `src/core/svg.ts`, `<rect>`/`<polygon>` literals in
`renderer-lifeline.ts`, `renderer-participant-shapes.ts`, `renderer-message.ts`,
`renderer-message-self.ts`, `renderer-note.ts`, `renderer-frame-header.ts`,
`renderer-arrowhead.ts`, `renderer-participant-symbol.ts`); there is no
`handwritten` reference anywhere under `src/diagrams/sequence/`
(`grep -rIil handwritten src/diagrams/sequence` is empty). The decorator
exists and is exact: `src/core/klimt/drawing/hand/UGraphicHandwritten.ts:1-64`;
`src/core/UgDiagram.ts:141` wraps it for the diagrams that go through
`exportTo`.

### Upstream (Java file:line, quoted)
- `core/TextBlockExporter.java:174-175`:
  `if (isHandwritten)` / `ug = new UGraphicHandwritten(ug);` after the margin
  translate (`:172`) and before `textBlock.drawU(ug)` (`:177`).
- `klimt/drawing/hand/UGraphicHandwritten.java:54`:
  `private final Random rnd = new Random(424242L);` — one stream PER
  DECORATOR INSTANCE; `:114-116`
  `public UGraphic apply(UChange change) { return new UGraphicHandwritten(getUg().apply(change)); }`
  — every `apply` makes a new instance and so restarts the stream at seed
  424242; consecutive `draw`s on ONE instance continue it.
- `:64-82`: the `instanceof` chain (`ULine`, `URectangle`, `UPolygon`,
  `UEllipse`, `DotPath`, `UPath`); `:80` `getUg().draw(shape)` for everything
  else (text, images, `UCenteredCharacter`).
- Hand shapes: `URectangleHand.java:55,61` (`new HandJiggle(…, 1.5, rnd)`),
  `ULineHand.java:50` (`new HandJiggle(0, 0, 2.0, rnd)`), `UPathHand.java:76`.
- The shared-stream site: `skin/rose/ComponentRoseNote.java:121-124`
  `ug = symbolContext.apply(ug);` / `ug.draw(polygon);` / `ug.draw(Opale.getCorner(x2, roundCorner));`
  — the note body and its folded corner are two draws on one instance.
- The banner is already ported (`src/core/annotations/WarningBannerBlock.ts`;
  `CommandSkinParam.java:93` "Please use '!option handwritten true' …") and
  only its shape differs (`<rect>` where the jar has `<polygon>`): it is
  the `rect[1]` in every handwritten diff.

### Causal chain
Diagram has `handwritten true` → jar wraps the export graphic → each shape is
re-emitted as its jiggled polygon/path → the golden has `polygon`/`path` where
ours has `rect`/`line` (the tag swap is what the classifier counts as
`structural`, and `n` is the number of such sites: 21/21/12/13) and the
arrowhead polygon `points` differ. No other attribute differs, so the
`structural` weight (`ws` 280/241/173/150) is entirely this one cause.

### Ruled out (with evidence)
- *Any other mechanism hiding behind the tag swaps.* Counterfactual: push the
  port's own emitted primitives, in document order, through the existing
  `UGraphicHandwritten` (a recording sink, one NEW decorator per primitive =
  fresh `Random(424242)` per draw) and compare every jiggled number with the
  jar's `points`/`d` (1.5e-3 tolerance): **pafene 12/12, gepuce 21/21
  (with the jiggle computed on the unscaled geometry, `scale 0.5`),
  menoke 13/13 (with ONE sharing marker, below), jefoke 21/21** (its 4
  further `<path>`s are the spot-glyph path `(A,#FFFF00)`/`(C,#00FFFF)`, a
  `UCenteredCharacter`, which the jar emits UN-jiggled and ours already
  matches to 1e-3). So fresh-seed-per-apply reproduces the jar to the
  third decimal and there is no residual.
- *"One random stream per diagram"* (the `json/renderer-pen.ts` model). Wrong
  for sequence: every jar shape opens with the identical jiggle offsets
  (e.g. `+0.035,-0.069,+0.032,+0.067` for each rectangle top edge at
  `gepuce`; self-arrow lines `0.14/-0.276/…` and `0.047/-0.092/…` differ by
  the constant length ratio). Model "shared" was the contrast run.
- *Ownership by the exporter margin / canvas.* `svg/@width`, `@height`,
  `viewBox` are not in any of the four diffs; the decorator changes no extents
  here.
- *`menoke`'s embedded `{{ }}` diagram.* It is an `<image>` in both, same size;
  "handwritten is not inherited" holds in ours already (images pass through
  `:80`). Not part of the diff.
- *`betifi-05-nuva576`* (also `handwritten true`) is a usecase/description
  fixture, not in the sequence open set.

### Rows
jefoke-95-jara779, gepuce-64-pivu656, pafene-01-tedi758, menoke-22-luxo044.
All four reach zero together once the jiggle is exact; each needs the
sharing rule only where its Java draws two shapes on one instance (menoke's
note corner is the one the four fixtures expose). **gepuce: 100% of its
remainder is handwritten mode** (21/21 sites exact under the model; the
`scale 0.5` jiggle is computed in the unscaled space and scaled on
emission, i.e. the decorator sits INSIDE the exporter scale, matching
`TextBlockExporter.java:174-175`); `shadowing true` changes nothing for it.

### Proposed fix
Batch 8 stands (T8a enumerates, T8b-e move components onto a `UGraphic`
seam, T8f enables the decorator at the seam). Evidence T8a should consume:
(1) the model above is exact on these four rows; (2) **the sharing sites
must be enumerated per Java component**: `ComponentRoseNote.java:121-124`
(shared), and for the `skin/rose` files with two or more `draw` calls
(`ComponentRoseArrow` 14, `ComponentRoseSelfArrow` 28, `ComponentRoseActiveLine`
6, `ComponentRoseDivider` 4, `ComponentRoseGroupingHeader` 3,
`ComponentRoseEnglober`/`GroupingElse`/`Destroy`/`Reference`/`Line`/
`Participant` 2 each) decide whether consecutive draws share an `apply`
instance — only the note is exposed by the corpus, so unit tests must pin it
from the Java, not from a golden; (3) text, images and `UCenteredCharacter`
pass through un-jiggled. Write-set: as T8a/T8b-T8f journal it (sequence
renderer files; **no `src/core` change expected** — the decorator and hand
shapes are complete). Expected movement: 4 rows to zero (Σ −844).
A post-pass alternative (re-draw the emitted primitive stream through
`UGraphicHandwritten` with explicit instance groups) is MEASURED exact on
these four rows, but it is not upstream's structure; it is the orchestrator's
call whether it is acceptable as a stop-gap — not recommended as the end state
(CLAUDE.md "Upstream architecture is authoritative").

### Confidence
High (mechanism, exact numeric reproduction); Medium on the completeness of
the sharing-site list (only one site is observable in the corpus).

---

## M2 — a cyclic `ensureDisjoint` force is finite in the jar only because a `RealMax` is frozen at its first read; the sweep solver has no such state

### Mechanism
The top-level `par2` after `p->m` is parallel to it, so `PlayingSpace`
registers `groupMinX.ensureBiggerThan(commTileMaxX)`. That demands the
group's leftmost participant (`p`) lie right of the previous tile's right
edge (which is at `m`, to the right of `p`): a cycle with no solution.
`RealLine.compile()` is a Gauss-Seidel loop over forces in creation order;
the force's fixed point is a `RealMax` that caches its value forever at the
first `getCurrentValue()`, and that first read happens in pass 1 with `m`
still unconverged (119.1625 instead of 232.93125). `p.posB` is pushed to that
stale value (+19), everything re-propagates, and the loop terminates. The
port's `solveParticipantXs` is a single left-to-right DAG sweep whose
premise (every constraint is `x[j] >= x[i] + c`, `i < j`) the sdd2 T3c2
disjoint constraints break; `pairConstraint` drops the cyclic pairs, and
keeps the acyclic pairs as LIVE symbolic constraints that the jar holds
frozen.

### Origin (port file:line)
- `src/diagrams/sequence/sequence-layout-participants.ts:384`
  `solveParticipantXs` (doc comment `:355-382`: "A system of difference
  constraints whose edges all point one way along a total order is a DAG
  longest-path … the solver").
- `src/diagrams/sequence/sequence-layout-parallel-disjoint.ts:298-300`
  `pairConstraint`: `if (lower.at === 'D' || upper.at !== 'C' || upper.index >= lower.index) return undefined;`
  (the cyclic pair is dropped here) and `:309-322` `disjoint`.

### Upstream (Java file:line, quoted)
- `teoz/PlayingSpace.java:188-199` `addParallelSiblingDisjointConstraints`
  (cluster `[p->m tile]` + the par2 group, `if (GroupingTile.isParallel(tile)) { for (Tile other : cluster) ensureDisjoint(other, tile); … }`);
  `:232-266` `ensureDisjoint`: `if (aAnchor.getPosB(stringBounder).getCurrentValue() <= bAnchor.getPosB(stringBounder).getCurrentValue()) bMin.ensureBiggerThan(aMax);`
  (`:263-264`). The method's own comment (`:206-231`) says why it avoids
  reading `getCurrentValue()` itself: "RealMin/RealMax cache their resolved
  value the FIRST time getCurrentValue() is read -- permanently, with no
  invalidation".
- `real/RealMax.java:89-94,109-111`: `private double cache = Double.MAX_VALUE;`
  / `if (cache != Double.MAX_VALUE) return cache;` / `cache = result;`
  (`RealMin.java:55-60,69` identical pattern). `RealMax.ensureBiggerThan` throws
  (`:126-127`); `RealMin.java:81-83` forwards `ensureBiggerThan` to every
  candidate; `RealDelta.java:69-70` `delegated.ensureBiggerThan(new RealDelta(other, -diff))`.
- `real/PositiveForce.java:64-71` `apply()`: `movingPoint.getCurrentValue()` /
  `fixedPoint.getCurrentValue()` — the first read of a force's fixed point
  happens INSIDE `compile()`; `real/RealLine.java:77-110`: forces applied in
  list order, repeat until a pass changes nothing.
- Force creation order: `teoz/SequenceDiagramFileMakerTeoz.java:112-116`
  `dolls.addConstraints` → `new PlayingSpace` (tiles; Y forces) →
  `livingSpaces.addConstraints` (`LivingSpaces.java:61-71`) →
  `mainTile.addConstraints()` (each tile, then the disjoint pass at
  `PlayingSpace.java:167`) → `xorigin.compileNow()` (`:116`).
- Operands: `CommunicationTile.java:453-460` `getMaxX` =
  `RealUtils.max(rightPoint, leftPoint.addFixed(width))`;
  `GroupingTile.java:984-986` `getMinX` = `min.addFixed(-EXTERNAL_MARGINX1 - …)`,
  `:211` child candidate `getDrawnMinX().addFixed(-MARGINX)`,
  `EXTERNAL_MARGINX1 = 3` (`:83`), `MARGINX = 16` (`:90`) → 19.

### Causal chain (measured on the jar, `jexavi-40-degi377`)
1. Tiles: `p->m` (cook food), top-level `par2` group (parallel by
   `GroupingStart.isParallel`, fixed in T1a), `p<-m`. Cluster = [`p->m`,
   group]; `ensureDisjoint(p->m, group)`: anchors `p` (index 0) and, via the
   group's first child `m->m`, `m` (index 1), distinct → `posB(p) <= posB(m)`
   → `groupMin.ensureBiggerThan(commMaxX)` (`PlayingSpace.java:264`).
2. `RealMin.ensureBiggerThan` fans out to the group's four child candidates
   (m, p2, p3, p): forces #33-#36 of 37 (trace "NEWFORCE … ensureDisjoint:264").
3. `compile()` pass 1 fires forces #25-#32 (the participant-neighbour and
   message-width forces) and then #33, whose fixed point is
   `RealDelta(…RealMax(m.posC, p.posC + 80.30625))`: first read, trace
   `RealMax FIRST-READ -> 119.1625` with candidates `119.1625` (m.posC, m.posB
   still 78.69375) and `104.7` (p.posC 24.39375 + 80.30625). Converged values
   would be `232.93125` / `218.46875`. The value is cached for the rest of the
   run.
4. Force #36 (candidate `p.posC - 16`, delta 3): `p.posB` is pushed by
   `119.1625 + 19 - 24.39375 = 113.76875` (trace: "FORCE #36 … by 113.76875").
   The participant chain (#1-#4, #25-#32) then re-propagates: p.posC 148.163,
   m 242.931, p2 308.188, p3 362.731 — the golden's lifeline x.
5. Unsatisfiable-by-true-value (`p ≥ m + …` while `m ≥ p + 94.77`): with a live
   `RealMax` the loop would exceed 99999 passes ("Infinite Loop?"); the
   frozen 119.1625 is what makes it finite. The result therefore depends on
   force ORDER and on the pass-1 partial state at the first read.
6. The port's sweep: the cyclic pair (candidate `p`, index 0 vs comm max at
   `m`, index 1) is dropped by `pairConstraint`, so `p` stays at the left
   (34.394). The ACYCLIC pairs (m's candidate against `p.posC + 80.306`) are
   kept symbolic and live: `m.posC >= p.posC + 80.306 + 19 = 99.306`
   binds in ours; in the jar the same force reads the frozen 119.1625 and is
   slack, so the jar's p-m gap is the "cooked food" message width,
   `94.76875` (force #32), 4.5375 smaller. That is the two observed
   differences: p shifted 113.769 vs the others 109.231, frame width
   294.113 vs 298.650, canvas 446 vs 337 — all x, no y.

### Ruled out (with evidence)
- *sdd2's `par2-not-parallel`* (filed lead): T1a/T1a2 fixed it (213 → 121);
  the remaining 121 sites are all x (`diff-one`: zero y, zero count diffs).
- *`pairConstraint` dropping the pair is itself the bug* (T1a hand-back item
  (2)): keeping every pair symbolically cannot give 113.769, because the pair
  is contradictory (`p ≥ m + c` and `m ≥ p + 94.77`); T1a2's conclusion
  ("`pairConstraint` is NOT the fix") is right.
- *T1a2's arithmetic* "`132.163 − 94.768 = 37.395` as p.posC at first read":
  contradicted. What is frozen is not `p.posC` but the previous tile's
  `aMax` = 119.1625 (m.posC at that instant); `p.posB = 119.1625 + 19 − 24.39375`.
  The `RealMax` first-read hypothesis itself is confirmed.
- *Frame/header/message widths and fonts.* Lifeline `rect` widths, all
  `textLength`s and every y match; only x and the summed canvas differ.
- *Oracle variance.* Fresh render byte-equal to the cached golden.
- *The freeze being common and harmless elsewhere.* A coarse stat (caches whose
  value differs from a recomputation at the end of compile) is non-zero in
  hundreds of conformant fixtures: it is NOT the discriminator. The
  discriminator is a force created by `ensureDisjoint` that fires: of 63
  `&`/`par2` fixtures it fires in 6 — `codeti-52`, `dalata-11`, `koneju-77`,
  `vajoke-72`, `zoculi-89` (1 push each; all conformant under the sweep, i.e.
  their pairs are the acyclic left-to-right shape) and `jexavi-40` (2 pushes, one
  cyclic). Blast radius of this mechanism today: `jexavi` only.

### Rows
jexavi-40-degi377 — reaches zero if fixed alone (all 121 sites are x or
width; no y).

### Proposed fix
Port the upstream solver for the participant row and drive the x layout with
it, in upstream's order, so the first-read freeze is reproduced rather than
approximated. Write-set (all sequence-local, **no `src/core`**):
new `src/diagrams/sequence/sequence-real-line.ts` (ports `RealImpl`,
`RealDelta`, `RealMin`, `RealMax` with the first-read cache, `PositiveForce`
with its epsilon `max(1e-6, 1000*ulp)`, `RealLine.compile` pass loop —
`real/*.java`); `sequence-layout-participants.ts` (`solveParticipantXs`
replaced or fronted by the line solver); `sequence-layout-parallel-disjoint.ts`
(emit the footprint candidates as an ordered force instead of dropping
`pairConstraint`'s cyclic pairs); `sequence-layout-participant-constraints.ts`
(`SpanConstraint` carries creation order so the force list is
`LivingSpaces` forces → tile forces in tile order → disjoint forces). The
first-read value depends on the pass-1 partial state, so the force order
`createMainTile:112-116` and the initial values (each `RealImpl` starts at
its `addAtLeast` chain value, 0.0 here) must be mirrored exactly.
Two shapes, orchestrator's choice: (A) full replacement of the sweep — the
upstream structure, but every pin (1143 rows) must stay byte-equal and
float-bit differences between the sweep's `max` and the pass loop's repeated
`move` are a risk; (B) run the line solver only for a diagram where
`ensureDisjoint` produces at least one cyclic pair (today: `jexavi`), sweep
elsewhere — zero risk to the other pins by construction, but a two-solver
structure. Expected movement: jexavi 121 → 0; no other row (verified: no
other fixture has a firing cyclic disjoint force). Unit test: pin
`p.posB = 113.76875` / the 4 lifeline x from the golden and the first-read
value 119.1625 from the Java trace.

### Confidence
High on the mechanism (instrumented in the jar: first read, push values, force
order). Medium on the fix shape (the force-order/initial-value mirroring is
the work; (A) vs (B) is a design call).

---

## M3 — `array` (matrix) nodes are not sized by JLaTeXMath's matrix rules

### Mechanism
`<math>[[a,b],[c,d]]((n),(k))</math>` converts (ASCIIMath) to
`{\left[\begin{array}{cc} {a}&{b}\\{c}&{d}\end{array}\right]}{\left(\begin{array}{c} {n}\\{k}\end{array}\right)}`.
KaTeX parses `\begin{array}` as an `array` node, for which
`latex-metrics/nodes.ts` has no handler; `convertNode` records it in
`unsupported` and sizes it by its (absent) `body`/`base`/`html` children, so
the whole matrix contributes nothing: 38 × 28 where the jar's JLaTeXMath
image is 150 × 56.

### Origin (port file:line)
`src/core/latex-metrics/nodes.ts:103` (`HANDLERS` has no `array`) and
`:141-147` (`convertNode`: `ctx.unsupported.add(n.type)` then size by
`body`/`base`/`html`). Confirmed by running `measureTeXIcon` on the converted
TeX: `{ width: 38, height: 28, unsupported: [ 'array' ] }`.

### Upstream (Java file:line, quoted)
`jlatexmath/MatrixAtom.java:366-526` `createBox` (rows/columns:
`boxarr[i][j] = (at == null) ? nullBox : at.createBox(env);`
`lineDepth[i]`/`lineHeight[i]`/`rowWidth[j] = Math.max(…)`; `:255-263`
`case ARRAY :` `//Array : hsep_col/2 elem hsep_col elem hsep_col ... hsep_col elem hsep_col/2`;
`:505-526` `vb.setHeight(totalHeight / 2 + axis); vb.setDepth(totalHeight / 2 - axis);`);
fenced by `FencedAtom` (`\left[ … \right]`); size rule per image as already
ported: `TeXIconBuilder.java:52-73`, `TeXIcon.java:141-157,195,210`
(`DIVERGENCES.md` LaTeX entry, cdd8 D6).

### Causal chain
`<math>` → `AsciiMath` (ported, `ScientificEquationSafe.fromAsciiMath`) → TeX
with `array` → `measureLatex` → `measureTeXIcon` → image `width`/`height` →
`AtomMath`/image atom size (`AtomMath.java:64-71`). The image is 38 × 28 in
ours, 150 × 56 in the jar; the participant box rows grow by 28 (height) and
the label by 112 (width), which is every one of the 35 differing sites
(canvas, second lifeline x, label x, arrow polygon, the footer y's, the
image's own width/height).

### Ruled out (with evidence)
- *Anything but the image size.* Counterfactual: replace the `<math>` by
  `<img:data:image/svg+xml;base64,…>` carrying the jar's own 150 × 56 payload
  → `compareSvg` **0 diffs** and the emitted `<image …>` tag is byte-equal
  (16110 chars). So position, baseline and the text flow around the image are
  already right.
- *sdd2's lead* ("array has no handler, 38x28 vs 150x56",
  `latex-metrics/nodes.ts:103`): confirmed.
- *Library-forced (KaTeX vs JLaTeXMath).* No: the size follows JLaTeXMath's
  box rules over KaTeX's parse tree, which is how the other 40 latex
  fixtures size exactly; `array` is simply unported. The divergence entry
  concerns glyph bytes, not this size. (Not proposing any accepted entry.)
- *Other fixtures:* a scan of `tests/corpus` for matrix/array math finds only
  `mefeke`.

### Rows
mefeke-43-xotu192 — reaches zero if fixed alone, provided the new box gives
exactly 150 × 56 (the counterfactual proves the rest is already right).

### Proposed fix
Model KaTeX's `array` node as a matrix atom and size it with
`MatrixAtom#createBox` (type `ARRAY`: column separators `hsep`/`semihsep`, row
`vsep`, row height/depth maxima, axis-centred height/depth), inside the
existing `fenced` atom for `\left[ … \right]` (verify `fencedBox` selects the
tall `jlm_cmex10` delimiter variants for a 2-row body — the jar's image shows a
230-unit tall bracket glyph). Write-set: `src/core/latex-metrics/nodes.ts`
(handler), `src/core/latex-metrics/atoms.ts` (matrix atom kind), new
`src/core/latex-metrics/matrix.ts` (box builder, ≤500 lines), the `BUILDERS`
table in `src/core/latex-metrics.ts`, tests citing `MatrixAtom.java` lines and
the golden's 150 × 56. **CORE (`src/core/`) ⇒ all-engine survey**: every
engine that renders `<latex>`/`<math>` (class, state, description, mindmap,
sequence, …); expected non-sequence movement: none (no other corpus fixture
has an array; byte-identical for any formula without one). Expected: mefeke
35 → 0. The fixer must derive 150 × 56 from the rules, not tune to it (stop 11):
JLaTeXMath sources are at the Maven URL in the header.

### Confidence
High on the mechanism; Medium that the full box reproduces 150 × 56
(untested; `fencedBox` with delimiter growth is the risk).

---

## M4 — the remote `<img:http…svg>` bytes are unavailable to the synchronous render

### Mechanism
`AtomImg.create` fetches `http://beta.plantuml.net/foo1.svg` and embeds it as
an `AtomImgSvg` (78 × 79). The port never fetches, so its
`buildSvgFromUrl` analogue lands on the failure fallback text
`(Cannot decode SVG: http://beta.plantuml.net/foo1.svg)`; that long text
makes the note and the diagram much wider (453 vs 187) and shorter (158 vs
223), which is the whole diff.

### Origin (port file:line)
`src/core/creole-atoms-img.ts:49-50` `cannotDecodeText` (the always-taken
fetch-failed branch); consumed in `src/core/creole-atoms.ts:325-328`.

### Upstream (Java file:line, quoted)
`klimt/creole/atom/AtomImg.java:165-168`
`if (src.startsWith("http:") || src.startsWith("https:")) { if (src.endsWith(".svg")) return buildSvgFromUrl(src, fc, SURL.create(src), scale, url);`;
`:226-236` `buildSvgFromUrl`: `final byte[] read = source.getBytes();` /
`return new AtomImgSvg(new TileImageSvg(new String(read, UTF_8), scale));`
(failure: `AtomTextUtils.createLegacy("(Cannot decode SVG: " + text + ")", fc)`).

### Causal chain
Jar (network reachable at capture time and now: `curl` → 200) fetches the
SVG, `TileImageSvg` re-serialises it, the atom is 78 × 79 and drawn as
`<image width="78" height="79" …>` → note box 156 × 79 → canvas 187 × 223.
Ours: no bytes → text atom → 453 × 158.

### Ruled out (with evidence)
- *Any other difference.* Counterfactual: substitute the golden's embedded
  payload as `<img:data:image/svg+xml;base64,…>` → `compareSvg` **0 diffs**,
  `<image>` tag byte-equal (3761 chars). The note layout, lifeline x/height,
  text and polygon are all already right.
- *sdd2's "permanent" (`remote-image-io`).* Contradicted: nothing about the
  geometry is unreachable; the bytes are an input. T6a-T6g are the planned seam
  (prefetch/asset store); `render-fixture-sequence.ts` can serve the bytes.
- *T6g's premise "the embedded text equals the fetched bytes"* — **false**.
  The golden's payload is 2753 bytes, a re-serialisation (no `<?xml …?>`
  prolog, `height="79" width="78"` instead of the source's
  `style="width:78px;height:79px;" viewBox=… zoomAndPan=… preserveAspectRatio=…`
  attributes); today's live file is 2995 bytes and differs. The harness
  store must therefore serve the golden's decoded payload (which the port's
  data-URI path re-emits byte-identically — shown above), and the unit test
  must not assert equality with a live fetch. A live fetch is also mutable:
  a future re-capture can change the golden.

### Rows
fifasu-62-pipo979 — reaches zero if the store serves those bytes.

### Proposed fix
As already planned in batch 6 (T6b prefetch seam + T6g harness store); this
diagnosis only corrects T6g's premise as above. The CLAUDE.md rule "a
divergence exists only where a library forces it" is satisfied: the port can
render the image once given bytes. **CORE** (`src/core/creole-atoms-img.ts`,
`creole-atoms.ts`, the seam) ⇒ all-engine survey; other engines with remote
images in the corpus: `class/nobiza-91-fimo741` (png, `https:` chart URL),
`class/togeke-15-zala124` (`.svg`), `class/pebace-74-cuca176` (`.gif`) — they
will move only if their golden carries fetched bytes the store also serves.
Expected: fifasu 57 → 0.

### Confidence
High.

---

## M5 — `%filename()` has no environment behind it

### Mechanism
The jar's preprocessor environment holds `filename` (the file name the
oracle ran on: `in.puml`); the port's `TContext` is built with the default
environment, whose `getEnvironmentValue('filename')` is `undefined`, so
`%filename()` expands to the empty string: "filename " (49.156 wide) vs
"filename in.puml" (94.656).

### Origin (port file:line)
`src/core/preprocessor.ts:304` `new TContext({ includeStore: options?.includeStore })`
(no environment) → `src/core/tim/builtin/Filename.ts:19`
`this.value = env.getEnvironmentValue('filename')`.

### Upstream (Java file:line, quoted)
`preproc/Defines.java:89-93` `overrideFilename`: `environment.put("filename", filename);`
/ `environment.put("filenameNoExtension", nameNoExtension(filename));`;
`:116,128` `result.overrideFilename(file.getName());`;
`cli/CliOptions.java:255` `result.overrideFilename(flags.getString(CliFlag.FILENAME));`.
`%dirpath()` stays empty in the jar: `Defines.java:118-119,130-131` put it only
`if (SecurityUtils.getSecurityProfile() == SecurityProfile.INSECURE)`.

### Causal chain
`Alice -> Bob : filename %filename()` → `"in.puml"` (jar) vs `""` (ours) →
label 45.5 px wider → second participant, arrow and canvas shift (21 sites,
all x/`textLength`/the one text node).

### Ruled out (with evidence)
- *Anything beyond the literal.* Counterfactual: replace `%filename()` with the
  literal `in.puml` → `compareSvg` **0 diffs**.
- *`%dirpath()`*: the jar prints "path " (empty) and so does ours — correct
  as is.
- *sdd2's lead* (`Defines.overrideFilename` unwired, `preprocessor.ts:294`):
  confirmed (line is now 304).

### Rows
tifube-59-tezo313 — reaches zero if fixed alone (harness must pass `in.puml`,
the name the capture ran on).

### Proposed fix
As already planned (T6f): `src/core/preprocessor.ts` builds an environment
returning `options.filename`/its no-extension form, the harness passes
`filename: 'in.puml'`. **CORE** (`src/core/preprocessor.ts`) ⇒ all-engine
survey; `%filename` appears in one other corpus fixture
(`sequence/sofavo-23-xuxi628`, the legacy `%filename%` footer form, a different
substitution, conformant now). Expected: tifube 21 → 0.

### Confidence
High.

---

## Unexplained

None. Every row of the eight is under one mechanism above. T5a owns
`kaluna-08-rubu301` and `gebeki-18-muci858`.

## Where sdd2's (and sdd3's earlier) leads were wrong or incomplete

| lead | verdict |
|---|---|
| `handwritten-unported` (four rows) | Confirmed. Added: fresh `Random(424242)` per `apply`, continued stream per instance (note polygon + corner share it, `ComponentRoseNote.java:121-124`); glyph paths are not jiggled; gepuce is 100% this mechanism. |
| jexavi `par2-not-parallel` | Right as a first layer (fixed, 213 → 121); the residual is a different mechanism (M2). |
| T1a hand-back "`pairConstraint` drops every pair but one shape" | The drop is a symptom of an unsolvable cycle; keeping the pairs does not help (confirmed by T1a2). |
| T1a2 "`132.163 − 94.768 = 37.395` is `p.posC` at first read" | Wrong value: the frozen quantity is the previous tile's `aMax` = 119.1625 (m.posC then); `p.posB = 119.1625 + 19 − 24.39375`. The `RealMax` first-read hypothesis is correct. |
| fifasu `remote-image-io` "permanent" | Not permanent; bytes are an input, port reproduces the jar with them (0 diffs). |
| T6g "embedded text equals the fetched bytes" | False: the golden's payload (2753 B) is a re-serialisation; the live fetch is 2995 B. |
| mefeke `latex-array-unmodelled` | Confirmed (`unsupported: ['array']`, 38×28 vs 150×56). |
| tifube `filename-env-unwired` | Confirmed; line is `preprocessor.ts:304` now. |

## Open questions for the orchestrator
1. M2 shape (A) full line-solver replacement vs (B) gated to diagrams with a
   cyclic disjoint pair (see M2 "Proposed fix").
2. M1: whether a post-pass over the emitted primitive stream (measured exact
   on four rows) is acceptable as a stop-gap before batch 8's UGraphic seam.
3. M3 is core and needs the matrix box to land at exactly 150 × 56; if
   `fencedBox` cannot grow its delimiter for a two-row body, that is a second
   unit of work inside the same task.

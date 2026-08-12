# Mission: b35-body-width-ink — classifier ink max-X is conditional

**Status:** ready to execute. Diagnosis is COMPLETE and jar-verified; no code
has been written. Start here — this file is self-contained.

**Authorization.** Diagnosed and deferred during mission `direction-close`
(2026-08-11, task T7, commit `e67938b5`). Deferred because the fix touches the
ink rule for *every* class/object/map/json leaf and needs its own full
re-measure — not because anything is unknown.

---

## The mechanism (already established — do NOT re-derive)

A classifier's ink **max-X** is:

```
maxX = max(x + w - 1,  x + bodyWidth)
```

not the fixed `x + w` this port currently uses.

- The **rect** contributes `x + w - 1` — `LimitFinder#drawRectangle`,
  `~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/LimitFinder.java:184-188`
  (`addPoint(x-1, y-1)`, `addPoint(x+w-1, y+h-1)`).
- The **body block** is drawn at the box's left edge with its OWN width, so it
  contributes `x + dimFields.getWidth()`.
- `EntityImageObject#calculateDimensionSlow`
  (`svek/image/EntityImageObject.java:150-153`) sets
  `width = max(dimFields.getWidth(), dimTitle.getWidth() + 2*xMarginCircle)`.

So the body reaches the box's right edge **only when the body is what set the
width**. A *title-driven* box gets no body point out there and falls back to
the rect's own `-1` inset.

### Jar-verified, two authored controls

Rendered through the pinned jar via `scripts/oracle-render.sh`, differing only
in which term wins the `max`:

| control | p2 box | `x+w` predicts | `x+w-1` predicts | jar |
|---|---|---|---|---|
| body-driven | x=74.36, w=180 | **269** | 268 | **269** |
| title-driven | x=74.74, w=201.25 | 290 | **289** | **289** |

Sources (recreate with `scripts/oracle-render.sh <out-dir> <puml>`):

```
@startuml                          @startuml
object "AA" as p1                  object "AA" as p1
object "AAAAAAAAAAAAAAAAAAAA" as p2   object "BB" as p2
p2 : x                             p2 : xxxxxxxxxxxxxxxxxxxxxxxx
@enduml                            @enduml
   (title-driven → x+w-1)             (body-driven → x+w)
```

Canvas arithmetic used above: `raw = maxX - minX`, then `+ INK_DELTA (15)`,
then margins `left 0 / right 5`, then `floor(v + 1)`. `minX` is always 6
(`JAR_INK_MARGIN`), because the ink shift places it there.

### This closes a question open since G2 N5

`class-ink-box.ts#addRectInk`'s doc comment attributed its `+1` to an
invisible full-box `UEmpty` reservation. Mission `object-close` B5 proved
`UEmpty` is drawn **nowhere** on any class/object path but could not say what
the real source was. It is the body block, and the rule is conditional.
`addRectInk`'s comment already carries this correction with the original text
retained beneath it — read it first.

---

## The work

**Thread the measured body width onto the geo and consume it in the ink rule.**

1. `MeasuredClassifier` / `ClassifierGeo` gain a body-width field (name it for
   what it is upstream — `dimFields.getWidth()`). Populate it wherever the box
   width is computed:
   - `src/diagrams/class/class-object-map-sizing.ts` — both object branches
     (`buildFieldBasedObjectGeo`, `buildEnhancedObjectGeo`)
   - `src/diagrams/class/class-map-sizing.ts`, `class-json-sizing.ts`
   - `src/diagrams/class/class-layout-generic-classifier.ts` — the class/
     interface/enum path (`EntityImageClass.java:103-105` has the identical
     `max(dimBody, dimHeader)` shape)
   - thread through `src/diagrams/class/class-geo-builders.ts` (two sites)
2. `src/diagrams/class/class-ink-box.ts#addRectInk` — replace the fixed
   `addPoint(box, x + w, y + h)` with the conditional max-X above.
   **Leave the Y term alone**: B5 established the three-way object body-state
   split empirically and the max-Y question is separate and unsolved.
3. Check whether `addRectInkEmptyBody` / `addRectInkEmptyShownBody` (the two
   empty-body rules, `object-close` B5) collapse into the general rule once
   body width is available — an empty body has width 10 (`TextBlockEmpty(10,
   16)`) or 0, both far short of the box, so they may. **Verify, do not
   assume**; those two rules have their own jar controls in B5's ledger entry.

### Write-set

`src/diagrams/class/{class-ink-box,class-geo-types,class-geo-builders,
class-layout-helpers,class-object-map-sizing,class-map-sizing,class-json-sizing,
class-layout-generic-classifier}.ts` · `tests/unit/class/**` ·
`oracle/goldens/svg-object/**` · `plans/b35-body-width-ink/**` ·
`plans/object-close/ledger.md` (the M40 row).

---

## Acceptance

1. Given a title-driven object box, when the canvas is computed, then max-X is
   `x + w - 1` (`jocamu-71-nuvo330` reaches **0 diffs**; it is at 2 today, both
   `@width`/`viewBox[2]`, 212 vs 211).
2. Given a body-driven box, when the canvas is computed, then max-X is `x + w`
   (both authored controls above still reproduce their jar canvases).
3. The object SVG census does not drop, and every fixture that moves is
   explained.
4. The class SVG goldens and the class DOT count are re-measured and any
   movement is stated with its cause. **Expect class movement** — this rule is
   corpus-wide, and `addRectInk` is what every class leaf uses.

## Verification

```sh
npm test            # unpiped, 574 files. NEVER pipe a gate: tail's rc masks vitest
npm run typecheck
npm run lint
npm run build
npx tsx scripts/svg-conformance-census.ts object
for t in object class component usecase state; do npx tsx scripts/dot-sync-report.ts $t; done
```

Regenerating the object parity survey **must** use:

```sh
SVG_PARITY_CONCURRENCY=2 SVG_PARITY_TIMEOUT_MS=60000 \
  npx jiti scripts/svg-parity-survey.ts --out tests/oracle/svg-conformance/parity-object.json object
```

The default concurrency times out all 80 and writes a file claiming
`{"timeout":80}`.

### Frozen counts at mission start (2026-08-11, after `direction-close`)

| gate | value |
|---|---|
| object DOT structural | 74/80 |
| class DOT | 688/711 |
| component DOT | 262/262 |
| usecase DOT | 93/93 |
| state DOT | 267/267 |
| class SVG goldens | 317 |
| object SVG ratchet | 33 |
| object SVG census | 34/80 |

## Stop conditions

1. A frozen count moves without a stated, fixture-level cause.
2. The change requires behaviour the class SVG goldens pin.
3. The same check fails three times consecutively.
4. Any constant would land without an upstream `file:line`.

---

## Traps this codebase has actually sprung (read before starting)

- **Diff count is a misleading headline.** Removing a `childCount` barrier lets
  the comparator descend, so total diffs can RISE while fidelity improves.
  Judge by non-numeric count and by per-fixture delta bands, not the total.
- **Check frozen counts in BOTH directions.** An unexplained *gain* is as much
  a stop as a loss — it usually means a normalizer went blind. This caught a
  real regression in `direction-close` T1 that a scalar would have hidden.
- **Never fit a constant.** Every number needs an upstream `file:line`. Two
  attributions in this line were falsified precisely because they generalised
  from one coincidence (`object-close` B34, and B5's own "height is
  deliberately unaffected").
- **The ledger's `Ours:` pointers name symptom sites, not origins.** Four items
  in `direction-close` were fixed somewhere other than where the ledger
  pointed. Treat them as a starting point.
- **Always `git -C <abs-path>`**, never bare `git` or `git -C .` — a persisted
  `cd` into the Java reference repo has sent a commit to the wrong repository
  twice. The same `cd` drift breaks relative `sed`/`grep` paths mid-session.

## Prior art to read

- `plans/object-close/ledger.md` — the **M40** row (this mechanism) and the
  **M6** row (B5's three-way object body-state split, with its jar controls).
- `plans/object-close/decision-journal.md` — entries `B5`, `B25`, `T7`.
- `src/diagrams/class/class-ink-box.ts` — `addRectInk`'s corrected doc comment.

---

## OUTCOME — DONE 2026-08-11

Landed. All four gates green (574 test files / 12 764 tests, typecheck, lint,
build). Two things above turned out to be **wrong** and are corrected here;
the arithmetic and the two jar controls were right.

### Correction 1 — the mechanism is a `UEmpty`, sized to the body

T7's "`UEmpty` is drawn nowhere on any class/object path" is false. It is
drawn in exactly one place in the whole upstream tree —
`TextBlockMarged#drawU`'s `ug.draw(UEmpty.create(dim))`
(`klimt/shape/TextBlockMarged.java:83`) — and `LimitFinder#drawEmpty`
(`LimitFinder.java:159-162`) bounds it with no inset, so it reaches 1px past
the rect. `dim` is the marged block's OWN dimension, never the box's, and
`BodyEnhancedAbstract#decorate:106-118` /
`MethodsOrFieldsArea#asBlockMemberImpl:83-86` wrap every body compartment in
one. So G2 N5 had the right shape and the wrong size, and T7 threw out the
right shape. That is why the rule is conditional rather than universal.

### Correction 2 — NOT corpus-wide; the class path was already correct

"Expect class movement — this rule is corpus-wide" is false, and the
strongest available evidence said so before a line was written: 317 class
goldens are byte-exact against the jar *today* under the fixed `x + w`, which
a title-driven class box could not be if it needed `x + w - 1`.

The reason is `HeaderLayout#drawU` (`svek/HeaderLayout.java:89-109`): the
name is centered in `suppWith = width - circleW - widthStereoAndName -
genericW`, which is **exactly 0** when the header drove the width — so the
name block's own `UEmpty` lands on `x + w`, and when the body drove it
instead, the body's does. Either way `x + w`. An object header cannot do
this: `PlacementStrategyY1Y2#getPositions`
(`klimt/geom/PlacementStrategyY1Y2.java:59`) centers it strictly at
`x = (width - blockWidth)/2`, leaving `xMarginCircle` (5px) clear on each
side. The fix is therefore **object-family-scoped**, and
`class-layout-generic-classifier.ts` was correctly left untouched.
`map`/`json` are left unmeasured on purpose — `TextBlockMap`/
`TextBlockCucaJSon` are not marged body blocks and no jar control isolates
them, so they keep the pre-B35 `x + w` via `bodyInkWidth === undefined`.

### Item 3 answered — one of the two empty-body rules collapsed

Verified empirically, not assumed, in both directions:

| rule | disabling it | verdict |
|---|---|---|
| `addRectInkEmptyBody` (`showFields == false`) | census zero-diff **set byte-identical** (35) | strict special case — **DELETED** |
| `addRectInkEmptyShownBody` (empty but shown) | census **35 → 29** | survives, on max-Y alone |

The first is `TextBlockUtils.empty(0, 0)` ⇒ `bodyInkWidth` 0 ⇒ the general
rule already yields its hard-coded `(x+w-1, y+h)` corner, including for its
own two jar fixtures `kexica-21-gega428` and `janoma-30-dovo501`. The second
differs only on max-Y (`y+h-1`), which this mission left alone as instructed.

### Acceptance

1. ✅ Title-driven → `x + w - 1`. `jocamu-71-nuvo330` reached **0 diffs** and
   is now **ratcheted in** (object manifest 33 → 34).
2. ✅ Body-driven → `x + w` (both authored controls unchanged).
3. ✅ Object SVG census **34 → 35**; the +1 is jocamu, nothing else moved.
4. ✅ No class movement, and now positively explained rather than merely
   observed — see Correction 2.

### Frozen counts at close

| gate | start | end |
|---|---|---|
| object DOT structural | 74/80 | 74/80 |
| class DOT | 688/711 | 688/711 |
| component / usecase / state DOT | 262 / 93 / 267 | unchanged |
| class SVG goldens | 317 | 317, all pass |
| object SVG ratchet | 33 | **34** (jocamu added) |
| object SVG census | 34/80 | **35/80** |

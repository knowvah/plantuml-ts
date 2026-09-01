# Sequence engine — what to do next

**Measured 2026-09-01** on a clean tree at `7fd45458`, immediately after
`sequence-coordinate-convergence` closed. Every number here was taken this
session via `scripts/sequence-geometry-distance.ts`, the committed
`test-results/dot-cache/sequence/` corpus, and one reverted probe. Nothing is
carried forward from a previous refresh.

Companion to `planning/next-missions.md` (the whole-project ordered list) and
`plans/sequence-coordinate-convergence/README.md` (the mission this follows).

---

## The headline, decomposed

Remaining geometry distance is **2 578 917**, down 38.2% from 4 175 357. Read
flat it says "the coordinates are still wrong". Decomposed it says something
more useful:

| class | distance | share | what it is |
|---|---:|---:|---|
| real coordinate error | 1 646 905 | 63.9% | what the last mission's kind of work fixes |
| **units mismatch** | **423 064** | **16.4%** | text compared centre-against-left-edge; not error at all |
| **unreachable** | **508 948** | **19.7%** | root attrs of 410 fixtures the comparator abandons |

Cohort: 1124 measurable, **714 descended**, **410 short-circuited**, 17 errored.
The descended cohort carries 2 069 969; the short-circuit cohort's 508 948 is
its root `width`/`height`/`viewBox` and nothing else.

### The descended cohort by axis (2 069 969)

`points` and `d` mix axes; `points` splits exactly on index parity because
points are `x,y` pairs.

| | distance | share |
|---|---:|---:|
| Y positions (`y` 455 072 · `points Y` 287 405 · `y2` 195 029 · `y1` 117 022 · `cy` 9 942) | 1 064 470 | 51.4% |
| Y sizes (`height` 210 967 · `viewBox height` 38 834) | 249 801 | 12.1% |
| X positions (`x` 264 109 · `points X` 90 187 · `x2` 63 109 · `x1` 42 439 · `cx` 2 554) | 462 398 | 22.3% |
| X sizes (`width` 60 023 · `viewBox width` 27 794) | 87 817 | 4.2% |
| `path d` (mixed) | 205 474 | 9.9% |

**After removing the text units mismatch, Y is 63.9% of real remaining error
and X is 23.6%.** Y is the big arithmetic target. It is still not what to do
first — see the ordering argument below.

---

## Finding 1 — a fifth of the number is a units mismatch

This port positions text by `text-anchor`/`dominant-baseline`; the jar
positions it by explicit left edge, explicit baseline `y`, and `textLength`.
The comparator compares a centre against a left edge and charges the
difference.

`jobadi-87-jegi648`, at head:

```
JAR   <text x="17"     y="27.889" font-size="14" textLength="24.938">Bob</text>
OURS  <text x="29.469" y="14"     font-size="14" text-anchor="middle" ...>Bob</text>

jar's centre = 17 + 24.938 / 2 = 29.469
our centre   =                   29.469     <- identical to the thousandth
charged                          12.469
```

Corpus-wide:

| | `<text>` | anchored | with `textLength` |
|---|---:|---:|---:|
| jar | 70 622 | 0 (0%) | 68 746 (97.3%) |
| ours | 44 689 | 38 138 (85.3%) | 227 (0.5%) |

Cost: **423 064** of phantom distance (`text@x` 161 539 + `text@y` 261 525)
plus roughly **46 000** diff RECORDS — every anchor and baseline we emit that
the jar does not, and every `textLength` it emits that we do not.

CLAUDE.md: a structural divergence IS the bug.

---

## Finding 2 — 410 of 1124 are invisible below their own root group

`compareSvg` short-circuits on a child-count mismatch, so nothing inside the
body is compared. **380 of the 410 emit FEWER children than the jar.**

| element | ours | jar | delta |
|---|---:|---:|---:|
| `text` | 44 689 | 70 622 | **−25 933** (37%) |
| `line` | 10 622 | 16 425 | −5 803 |
| `g` | 4 831 | 6 830 | −1 999 |
| `title` | 3 535 | 5 534 | −1 999 |
| `polygon` | 3 712 | 5 707 | −1 995 |
| `rect` | 15 149 | 15 399 | −250 |
| `a` | 0 | 89 | −89 (every hyperlink) |
| `path` | 2 079 | 1 859 | +220 (self loops) |

How far from a matching child count:

| off by | fixtures | cumulative | share |
|---:|---:|---:|---:|
| 1 | 48 | 48 | 11.7% |
| 2 | 121 | 169 | 41.2% |
| ≤ 4 | 81 | 250 | 61.0% |
| ≤ 12 | 101 | 351 | 85.6% |

One outlier is off by **27 944** — find its class, not its slug.

Getting the first two rows across the line lifts the instrument's visible
cohort from 714 to roughly 880, a 23% increase in what any future geometry
mission can see.

---

## Finding 3 — the obvious Y lever backfires alone

Batch 5 derived the document margin as 10 on all four sides and applied it to
X only. Probed the vertical half (top 10, bottom 5 → 10) and reverted:

| | at head | with margin | change |
|---|---:|---:|---:|
| numeric diffs | 51 890 | 45 443 | −6 447 |
| `y` | 455 072 | 440 744 | −14 328 |
| `y1` | 117 022 | 99 191 | −17 831 |
| `y2` | 195 029 | 210 721 | **+15 692** |
| `height` | 283 727 | 306 736 | **+23 009** |
| `viewBox` | 321 102 | 341 807 | **+20 705** |
| **total** | **2 578 917** | **2 614 062** | **+35 145** |

Fewer attributes disagree and the total gets worse: top edges move onto the
jar's (`y` + `y1` fall 32 159) while every bottom edge and extent moves off
it. The document was already 10 short, so +10 top and +5 bottom overshoots.

Same trap the mission hit three times — Batch 3's head row exposed this
margin, Batch 5's origin exposed clipped exo arrows, Batch 7's solve scored
worse until the label font came with it. **The Y axis is a batch structure,
not a constant.**

---

## Recommendation — ordered by dependency, not by size

Batch 8 of the last mission did correct, jar-verified work that moved the
metric by exactly zero, because the comparator could not descend to it.
Starting with more arithmetic repeats that.

### 1. Emit text the way the jar emits it

Left-edge `x`, baseline `y`, `textLength`, no `text-anchor`, no
`dominant-baseline`.

- Removes 423 064 of phantom distance and ~46 000 spurious records.
- **The only item on this list with no risk of fitting a value** — nothing is
  tuned; the port already computes the right position and reports it in the
  wrong units.
- Goes first because it makes both axes honestly measurable. `text@y` alone is
  261 525, a quarter of all Y positional error, and today that number is a
  category error. No Y mission can be gated while a quarter of its target is
  meaningless.
- Cost: every text emitter in the engine, plus a baseline metric from the
  measurer seam.

### 2. Close the element deficit, starting with text

- The missing 25 933 `<text>` almost certainly share a mechanism with (1) —
  the jar splits a styled label into one `<text>` per run, this port emits one
  per label. Cheaper done together.
- Payoff is measurement capacity: what Batch 1 bought for coordinates and
  nothing has yet bought for elements.
- Take the cheap structural wins in the same pass: self loops as three
  `<line>`s rather than one `<path>` (79 fixtures, and it makes self-message
  geometry comparable for the first time — Batch 8's correct fix measured zero
  because of it), and the 89 missing `<a>` hyperlinks.

### 3. The Y axis, as a batch structure

- 1 052 746 of real distance, 63.9% of what is left.
- Two terms already derived and waiting: the 10px vertical document margin
  (`SequenceDiagram#getDefaultMargins:624-628` → `same(5)`, plus
  `getTextBlock`'s own `UTranslate(5, 5)`) and `SELF_LOOP_HEIGHT` 20 against
  `ComponentRoseSelfArrow#getArrowOnlyHeight:321-323`'s 13.
- Read the Java for `messageSpacing` and every other vertical term BEFORE
  touching the margin. Land them as one batch with a per-attribute gate.
  Expect at least one more compensating pair.

### Before mission 3 — a ten-line fix to the instrument

`sequence-geometry-distance.ts` buckets by attribute name, so `points` and `d`
mix axes. Splitting `points` on index parity is exact:

```
points Y   287 405   (76.1%)
points X    90 187   (23.9%)
```

**The per-attribute table this mission gated on understated Y by ~287 000.** A
Y mission gated on that table cannot see three quarters of its own largest
component. Land the split first so the gate can be axis-specific.

---

## What NOT to do

- **Do not start with the Y axis** despite its size. A quarter of its
  positional error is mission 1's units mismatch, the one clean lever
  measurably backfires alone, and 36% of the corpus cannot report either way.
- **Do not port the `Real` constraint system.** D6 settled it and the
  reasoning holds: every constraint upstream produces for the participant row
  points one way along participant order, so the sweep is exact.
- **Do not chase the 27 944-child outlier as a fixture.** Find its class.
- **Do not re-pin per batch.** D5 held: 712 improved, 5 rose, every rise
  accounted for, because the re-pin came once after adjudication.

## Carried forward

- **`LIVE_DELTA_SIZE` family** — spans touching a live participant are 5px
  short each. Blocked on ordering: the span scan runs before the walk that
  computes activation levels, where upstream's `Real` defers the arithmetic.
  Needs a third pass or deferred edges.
- **Per-element fonts** — `arrow` is now 13; `groupHeader` (11) and `box` (13)
  still use the ambient size.
- **Englober and self-overflow margins** in `posA`/`posE` (`Doll.java:220-221`,
  `CommunicationTileSelf.java:208-213`), unmodelled.
- **`ActorBorderColor`** dropped on the actor stickman's stroke.
- **33 fixtures still clip** at negative `x`; label extents are deliberately
  outside the origin walker. Measured both ways; the choice is D6's domain.
- **`planning/mission-guide.md`'s G-1 entry is stale** — still claims sequence
  has no jar-oracle coverage. One-line chore, outstanding since 2026-08-20.

## One process change

Run `npm test` at each batch close, not `npx vitest run tests/unit`. The brief
named the narrower gate and it hid two real failures until close-out — catalog
drift and a rounding-sensitive integration assertion, neither visible from
`tests/unit`.

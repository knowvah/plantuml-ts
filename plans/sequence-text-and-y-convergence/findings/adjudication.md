# C4 — adjudication, the one re-pin, and what survives

Written 2026-09-02 at `3eb50eb8`. **No source file was changed by this
task.** Everything below is measurement.

---

## 0. The base ref, and why it is not the mission's own base

```
npx jiti scripts/sequence-ratchet-adjudicate.ts --base 1f15652f
```

`1f15652f` is *`docs(plan): refresh the batch-5 starting condition`* — the
commit immediately before C1, i.e. the state this batch started from.

It is **not** the mission's original base commit, and that is deliberate.
Between batch 4 and batch 5 an unrelated mission landed on this branch —
`plans/sequence-creole/`, a `CommandCreoleUrl` bracket fix, an ASCIIMath
port, and a Batik oracle regeneration for the eight latex fixtures.
Adjudicating across that work would credit this batch with movement it did
not produce. Batching from `1f15652f` isolates C1+C2+C3 and nothing else.

The cost of that choice is that the *pins* are older than `1f15652f`, so the
pin diff in §3 does not line up with the verdict table in §1. §3 closes that
gap by measurement rather than by assertion.

---

## 1. Verdicts

```
artefact=0  substructure=0  regression=3  inconclusive=22  improved=930
unchanged=186          (1141 rows: 930 + 186 + 3 + 22 = 1141)
```

**930 of 1124 measurable fixtures improved on `weightedScore`.** Eight rows
rose. Seventeen of the 22 `inconclusive` are the fixtures that error at both
refs (`null`/`null` — no rise can be computed, nothing to adjudicate); the
other five are rises the adjudicator's own tests cannot clear, and they are
diagnosed below alongside the three `regression` rows.

| slug | base | live | childDist base→live | verdict |
|---|---:|---:|---|---|
| `covuco-47-sotu151` | 135 | 640 | — → 1 | inconclusive |
| `lifene-24-xaca574` | 135 | 640 | — → 1 | inconclusive |
| `fululo-61-zuro165` | 78 | 260 | — → 1 | inconclusive |
| `meleno-54-zume276` | 159 | 160 | — → — | inconclusive |
| `nivelo-54-caze822` | 153 | 155 | — → — | inconclusive |
| `suneke-72-kexi504` | 285 | 287 | 9 → 9 | regression |
| `tefunu-89-zece967` | 285 | 287 | 9 → 9 | regression |
| `tugaju-41-dovi584` | 285 | 287 | 9 → 9 | regression |

**Zero regressions survive diagnosis.** All eight are the same shape — a
compensating-error pair in which C3 removed the half it proved and left the
half it did not — and each half is a named, cited, unported upstream
feature.

### 1.1 `suneke` / `tefunu` / `tugaju` — message wrapping is unported

All three are one diagram with one skinparam:

```
@startuml
skinparam maxMessageSize -100        (suneke; tugaju uses 100,
A->B:very long long long message name  tefunu uses wrapMessageWidth 100)
@enduml
```

`SkinParam#maxMessageSize:971-978` reads `wrapmessagewidth`, falls back to
`maxmessagesize`, and returns a `LineBreakStrategy`. That strategy reaches
the arrow label's text block through `AbstractComponentRoseArrow:60-63` →
`AbstractTextualComponent:89-92`. The jar therefore wraps the label; this
port does not.

Measured on the golden — the jar emits two label rows, at `y="61.111"` and
`y="74.111"`, exactly 13 apart, which is the font size
(`StringBounderFromWidthTable#calculateDimension:67-71` returns
`height = font size`). We emit one row.

| | base | live | jar |
|---|---:|---:|---:|
| height | 137 | 124 | 137 |
| width | 250 | 251 | 166 |

At the base ref the height was exact **for the wrong reason**: a body 13 too
tall against a label one line short. C3 removed the body excess, so the
missing wrap is now in isolation and the residual is exactly 13 — one label
line. The width delta (+85) is unchanged by C3 and is the same missing wrap
seen on the other axis.

The two new records — `@height` and `@viewBox[3]` — cost 1 each. That is the
whole rise. The child-count distance held at 9 because the structural
mismatch is elsewhere, which is why the adjudicator could not clear it.

### 1.2 `meleno` / `nivelo` — the englober (`box`) band is unported

Both are one diagram: a `box` around two participants, wrapping an
`alt`/`else` with one message per branch (`meleno` colours the `else`,
`nivelo` does not). Nothing else differs between them.

`SequenceDiagramFileMakerTeoz:84-85`:

```java
this.heightEnglober1 = dolls.getOffsetForEnglobers(stringBounder);
this.heightEnglober2 = heightEnglober1 == 0 ? 0 : 10;
```

`Dolls#getOffsetForEnglobers:80-92` maxes `Doll#getTitlePreferredHeight:
128-132` over the dolls, which is `ComponentRoseEnglober#getPreferredHeight:
82-84` = `getTextHeight + 3`. For an **untitled** box the text block is
empty, so `AbstractTextualComponent#getTextHeight:110-114` returns
`0 + padding.top + padding.bottom` = `0 + 1 + 1` = 2 over the padding
`topRightBottomLeft(1, 3, 1, 3)` at `ComponentRoseEnglober:58`. Hence
**`heightEnglober1 = 5`** and **`heightEnglober2 = 10`**, applied as two
translations at `SequenceDiagramFileMakerTeoz:148` and `:151`, and summed
into the document at `:161-163`.

Both numbers show up in the measurement to the unit:

- every element under the head row is exactly **5** above the jar's
  (head-row rect `y` 10 vs 15, lifelines `39` vs `44`, foot row `160` vs
  `165`), which is `heightEnglober1`;
- the document is exactly **15** short (200 vs 215), which is
  `heightEnglober1 + heightEnglober2`.

C2 §0's formula names both terms; C2 §4's apply-set does not contain them,
because box geometry was not one of Groups A/B/C. So this is an exposed
term, not a broken one.

What actually happened to the score is D1's thesis in miniature. Comparing
the diff sets record-by-record, `meleno` **lost six** `@height` records —

| record | ours → jar, at base |
|---|---|
| `svg/g[1]/rect[1]/@height` | 241 vs 189 |
| `svg/g[1]/rect[2]/@height` | 65 vs 53 |
| `svg/g[1]/rect[3]/@height` | 53 vs 32 |
| `svg/g[1]/rect[4]/@height` | 118 vs 85 |
| `svg/g[1]/rect[9]/@height` | 118 vs 85 |
| `svg/g[1]/g[1]/rect[1]/@height` | 178 vs 121 |

— all six now **exact**, 208px of error gone; and **gained seven**, each off
by exactly 5, on the second `else` branch (`polygon[2]/@points[1,3,5,7]`,
`line[3]/@y1`, `@y2`, `text[7]/@y`). Net +1 record, net −173px. `nivelo` is
the same trade: five records lost, seven gained, +2.

### 1.3 `covuco` / `fululo` / `lifene` — the page-2 element gap

These are the corpus's only three `newpage` fixtures carrying an
activate/deactivate pair on page 2 (`covuco` and `lifene` via `++`/`--`,
`fululo` via explicit `activate A` / `deactivate A`). They are also the
whole of the `descended` fall, **891 → 888**.

C3 removed a clamped 1×10 `<rect>` that the jar never draws. That rect had
been accidentally filling a slot: page-1's child count went 5 → 4 against
the jar's 5, and `compare.ts:396-406` short-circuits on a child-count
mismatch and charges `sumUnits(actual) + sumUnits(expected)` for the whole
subtree. Hence 135 → 640 for two of them and 78 → 260 for the third, off a
single record.

The port's content is strictly more correct than it was. What the change
exposed is a **pre-existing element gap**: the jar emits exactly one empty
`<g><title></title></g>` per file in all three goldens (verified by direct
count on the goldens), and this port emits none.

Its upstream mechanism is **not** nailed down and is deliberately not
guessed at. `LiveBoxes#drawBoxes:374-388` — the obvious candidate — opens no
group at all; it calls `drawOneLevel` and `drawDestroys` and returns. So
this is filed as an **element-backlog item against
`renderer-lifeline.ts`**, with the mechanism open, not as a term anyone
should invent a constant for.

---

## 2. `diffCount`, measured fresh before the re-pin

```
npx jiti scripts/sequence-repin-snapshot.ts <snapshot.json>
```

`repin-sequence-baselines.ts` does `f.diffCount = m.diffCount ?? f.diffCount`
and the adjudicator's own snapshot carries no `diffCount`, so re-pinning off
the adjudicator's snapshot writes a fresh score beside a stale count on every
row. Measured first, therefore:

- **976 of 1141 pinned `diffCount`s had drifted.** Largest numeric drift:
  `rujapu-71-bidi404`, 5 → 764. Forty rows carried `null`; one of those,
  `vitevu-99-rali549`, is now 2237.
- Cross-check: the snapshot's `weightedScore` agrees with the adjudicator's
  live score on **all 1124** measurable rows, zero mismatches. Two
  independently-written instruments, same seams, same numbers.

---

## 3. The re-pin — once, after the adjudication

```
REPINNED 1115 entries at 3eb50eb8
```

Only `oracle/goldens/svg-sequence/diff-baseline.json` was written;
`routing-baseline.json` and `refusal-baseline.json` were untouched, and no
row changed `status` (1124 `baseline` / 17 `error`, before and after).

Baseline diffed before and after, per the `.claude` note
`repin-script-raises-preexisting-red-pin`:

```
lowered=1041   unchanged=26   RAISED=74
```

**74 raised pins against 8 adjudicated rises.** That gap is exactly the
hazard the note names: the re-pin script compares each fixture to its
*pin*, not to a base ref, so it green-lights rows that were already red.
The pins are heterogeneous — measured against ten different commits, the
newest `c45b9473` (2026-09-01) — and every one of them predates `1f15652f`.

Attributed by measurement, not by inference:

| | count |
|---|---:|
| rose **inside** batch 5 and crossed its pin | **1** |
| were **already above** their pin at `1f15652f` | **73** |
| unaccounted | **0** |

- The one is **`fululo-61-zuro165`** (pin 86, 78 at `1f15652f`, 260 live) —
  §1.3. It is the only batch-5 rise that crossed its pin; the other seven
  landed *below* their stale pins and so still lowered them.
- For the 73, each was re-rendered at **its own pin commit** against today's
  goldens. **All 73 reproduce their pinned score exactly** — pin integrity
  confirmed, and the Batik oracle regeneration touched none of them — and
  **all 73 already scored higher at `1f15652f`** than at their pin commit.
  Their rise therefore lies wholly in the window between the pin commit and
  the start of this batch: batch 4's B1–B3 plus the `sequence-creole`
  mission, all of which grew our output.
- Of those 73, batch 5 **improved** 17 and left 56 unchanged. **Batch 5
  raised no pin other than `fululo`.**

`zudize-61-vomi445` is in that 73 (pin 841 581 → 1 023 429). The adjudicator
scores it `unchanged` — 1 023 429 at both refs — so its whole pin rise is
pre-batch-5.

---

## 4. The census

```
npx jiti tests/oracle/svg-conformance/sequence-diff-census.ts
censused 1124 fixtures, 17 errors
  missing-element 251   extra-element 26   geometry 44579
  text-metrics 1256     format-units 1     other 22412
```

Byte-identical to the file C3 committed, which is the determinism that
file's own header promises: the census is a pure function of the corpus and
the code, and C4 changed neither.

---

## 5. Method notes worth keeping

- A detached worktree needs **both** `node_modules` **and** `assets/stdlib`
  symlinked from the main checkout. Missing the second does not fail: the
  two stdlib fixtures (`nereka-67-deco609`, `tuzaga-87-gene496`) silently
  become `Fatal parsing error`, `measured` drops 1124 → 1122, and the total
  moves by 3 747.482. The first base run here did exactly that and had to be
  discarded. With both symlinks the run reproduces the README's checkpoint
  figures to the digit.
- Three throwaway probes were used and left in the scratchpad, not the
  repo: a per-fixture diff-record dumper, a score-at-a-ref runner, and a
  root-dimension extractor.

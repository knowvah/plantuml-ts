# aeg-T1 — the gated metric PENALISES a correct port that grows the document

Diagnosis artifact per `~/.claude/rules/diagnosis.md`. Mission
`plans/activity-element-granularity/`, T1. **HALT — stop conditions 2 and 3.**
The change itself is preserved on branch `wip/aeg-T1-measured-halt`
(`f59c26bb`); nothing landed on the mission branch.

## The discrepancy

T1 replaced activity's single `polylineEl(pts, …)` call
(`src/diagrams/activity/renderer.ts:104`) with one `line()` per segment. It
hit its element goal exactly and **raised the gated quantity by 7.0%**.

| instrument | before (T0 pin) | after T1 | |
|---|---|---|---|
| `<polyline>` ours | 1666 | **0** | goal met |
| `<line>` ours (jar 3336) | 289 | **2702** | −3047 → −634 |
| sum \|element delta\|, 11 tags | 7153 | **3074** | **−57.0%** |
| sum \|root-`g` childCountDelta\| | 2676 | **2159** | **−19.3%** |
| **aggregate `weightedScore`** | 108447 | **116083** | **+7.0%** |

`npx vitest run tests/oracle/svg-conformance/activity.diff-baseline.ratchet.test.ts`
→ **207 failed / 177 passed**. Gate 1 red.

## Mechanism

`compareSvg`'s `[childCount]` short-circuit charges
`sumUnits(actualChildren) + sumUnits(expectedChildren)` — **the SUM of both
sides' sizes, not their difference.** On any subtree that still
short-circuits, enlarging OUR side raises the charge, however much closer to
the jar the enlargement made us.

- **Origin:** `tests/oracle/svg-conformance/compare.ts:404`, with
  `units()`/`sumUnits()` at `:167-178`.
- **Causal chain:** T1 turns 1666 `<polyline>` into 2413 additional `<line>`,
  each ~6 units (1 node + `x1`,`y1`,`x2`,`y2`,`stroke`,`stroke-width`). For
  the 203 fixtures whose root `<g>` child count still differs after the swap,
  `sumUnits(actualChildren)` grows and the diff's weight grows with it:
  **97359 → 105062, +7703**. Separately, 10 fixtures whose child counts
  *coincidentally* matched before now differ, converting a descended
  (therefore cheaper, real) comparison into the upper-bound short-circuit:
  **+4501**. Six fixtures gained a match and freed **−1962**. Net over the
  `svg/g[N][childCount]` family: 99321 → 109563, **+10242**; the aggregate
  rose only +7636 because the descended parts genuinely improved by −2606.

- **Isolation experiment (the decisive evidence).** For three fixtures, the
  root-`<g>` child-count weight was decomposed into its two halves before and
  after the change. **The jar half is invariant; the entire rise is our half.**

  | fixture | jarUnits before→after | oursUnits before→after | weight before→after |
  |---|---|---|---|
  | `tobajo-64-mipi810` | 1236 → **1236** | 686 → **902** | 1922 → 2138 (**+216 = 902−686**) |
  | `firibi-00-puki721` | 511 → **511** | 428 → **488** | 939 → 999 (**+60 = 488−428**) |
  | `noxasi-06-nejo322` | 323 → **323** | 243 → **289** | 566 → 612 |

  The rise equals our added units to the unit. `noxasi` nevertheless FELL
  (570 → 445) because its counts went 39 v 43 → 43 v 43: the short-circuit
  vanished entirely. That is the only way a fixture can improve under this
  metric — exact count equality. Getting *closer* is charged, not credited.

- **Ruled out:**
  - *That T1 emits wrong geometry.* `numalo-91-pole243` renders one `<line>`
    where the jar renders one `<line>`, same endpoints, and falls 60 → 53.
  - *That T1 missed its target.* `<polyline>` is 0 corpus-wide; `<line>`
    moved 289 → 2702 against the jar's 3336.
  - *That the output got less faithful.* Every element-level instrument moved
    toward the jar (−57.0% and −19.3%). No tag's delta moved away.
  - *That the rise is the 10 lost matches alone.* They account for +4501 of
    +10242; the 203 still-mismatched fixtures account for +7703 on their own,
    with no change in match status at all.
  - *That the jar oracle moved.* `jarUnits` is byte-identical before and
    after on every fixture measured — the goldens are committed and untouched.

## Impact — the ratchet's monotonicity claim is scoped, and the scope is not stated

`activity.diff-baseline.ratchet.test.ts`'s own failure message asserts:

> "The score is therefore MONOTONE in alignment: it falls or holds when the
> document gets more structurally correct, and it rises only when the output
> genuinely got worse."

**That is false for any change that adds nodes while a short-circuit
persists.** The weighting is monotone under *substitution* (fixed node
count — the class of change every prior mission made) and **anti-monotone
under growth**. `weightedScore` was adopted in `sequence-root-chrome` D5 to
fix `diffCount`'s non-monotonicity; it fixed one failure mode and introduced
another that no mission had yet triggered. This is the FIFTH premise in this
codebase to die on measurement.

`plans/activity-element-granularity/README.md`'s exit bar — "the aggregate
`weightedScore` falls" — is therefore **not reachable by the three planned
swaps**. T2 (`circle`→`ellipse`) is count-neutral but attribute-*increasing*
(`r` → `rx`,`ry`: +1 unit × 518). T3 adds ~522 `<text>`. Neither touches the
unaddressed `polygon` −615 or T1's residual `line` −634, so the 203
still-mismatched fixtures cannot reach count equality inside this mission's
scope, and every node the mission adds is charged against them.

## Confidence

High. Reproduced by re-running the census twice; the mechanism is isolated by
a controlled before/after decomposition holding the jar side fixed; and the
arithmetic closes exactly (+216 = 902−686, +60 = 488−428).

## How to apply

- Do NOT re-pin `diff-baseline.json` to absorb this. The rise has a stated
  mechanism, but re-pinning bakes in an instrument that will penalise T2 and
  T3 the same way, and every future element-granularity mission after them.
- Do NOT delete the change. It is a faithful port with a `Worm.java:134-183`
  citation and upstream has no polyline driver at all.
- The open question is the INSTRUMENT, not the port. See the halt report on
  the mission branch for the three options.

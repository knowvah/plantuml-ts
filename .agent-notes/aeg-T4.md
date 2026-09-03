# aeg-T4 — final re-pin, re-census, mission report

`plans/activity-element-granularity/`, orchestrator-executed per the batch
overview. All measurements below are fresh, direct live renders through
`renderFixtureActivity` + `DeterministicMeasurer` + `fixtureIncludeStore()`
+ `compareSvg(..., 'deterministic')` — the identical seams the ratchet gate
uses — never read from a possibly-stale intermediate pin.

## A process bug caught and fixed during T4 itself

T1/T2/T3's own incremental "exception" re-pin scripts only wrote a
fixture's `weightedScore`/`diffCount` when that specific fixture's score
**rose** relative to its immediately-prior pin. A fixture whose score
**fell** (the vast majority — 258-266 of 268 at each step) kept its OLD,
now-stale pinned value in `diff-baseline.json` between commits. The ratchet
gate was never violated by this (a stale-high pin trivially bounds a lower
live score), but the file's aggregate was **not** an accurate record of
the tree's true state at any of the T1/T2/T3 commit points — the
`76922`/`76936`/`77032` aggregates reported in those commits' messages
were real numbers for `diff-baseline.json`'s *pinned* content but not the
tree's true live score.

T4 fixed this the only way that matters: **every** baselined fixture was
re-measured and re-pinned unconditionally (not just risers), against the
one continuously-enforced ground truth — the mission-start baseline
(commit `804232d4`, before T0). Full re-pin, zero shortcuts.

## Headline result

| | value |
|---|---|
| Aggregate `weightedScore`, T0 pin (804232d4) | **108447** |
| Aggregate `weightedScore`, final (this measurement) | **61677** |
| Change | **−46770 (−43.1%)** |
| Fixtures that rose vs T0, over the whole mission | **0 of 268** |
| `svg/g[][childCount]` weight share | **91.6% → 39.9%** |

Every one of the 268 baselined fixtures finished the mission at or below
its T0 score. Verified by direct per-fixture comparison against the
T0-commit `diff-baseline.json`, not assumed from the aggregate alone.

## The 10 "exception" fixtures — net-improved, not net-regressed

`.agent-notes/aeg-T1-8-exceptions.md` names 10 fixtures whose
`weightedScore` rose at an **intermediate** checkpoint (after T1 alone, or
after T1+T2, or after T1+T2+T3) relative to the *immediately preceding*
step — the trigger for the mid-mission investigation into four unrelated
pre-existing defects (note-after-terminal sizing, unwired diamond/font
skinparams, swimlane rendering architecture, nested-split geometry) plus
two more found during T3 (embedded diagrams in labels, note width/
overscan). Re-measured now against T0 (not the intermediate checkpoint):

| slug | T0 | final | net |
|---|---|---|---|
| `cujoni-21-somi079` | 268 | 202 | −66 |
| `dozaxu-98-xetu961` | 304 | 210 | −94 |
| `jipapo-14-kevu587` | 208 | 171 | −37 |
| `kafevi-44-tesu096` | 301 | 207 | −94 |
| `lukoxa-16-cecu095` | 335 | 284 | −51 |
| `nexitu-74-luga914` | 448 | 368 | −80 |
| `noxasi-06-nejo322` | 570 | 448 | −122 |
| `sikino-19-vuca111` | 194 | 131 | −63 |
| `bozido-07-geze049` | 366 | 273 | −93 |
| `vubolo-48-cubu499` | 469 | 418 | −51 |

All ten fell net. The "exception" framing in D11 was correct procedurally
(each did rise against its immediately-prior checkpoint, and each needed
its own stated mechanism to justify the local re-pin at that step) but the
mission's overall before/after comparison — the number that actually
matters — has no adopted regression anywhere.

## Per-swap attribution (T0 element census vs now)

| tag | T0 ours | now ours | jar | delta | vs T4 spec's projection |
|---|---|---|---|---|---|
| `polyline` | 1666 | **0** | 0 | −1666 | ✓ exact (projected 0) |
| `line` | 289 | 2702 | 3336 | +2413 | **short of** projected +3047 — 634-unit gap; matches the already-diagnosed `line` residual (routing/segment-count differences independent of element vocabulary, `.agent-notes/aeg-T1.md`) |
| `circle` | 518 | **0** | 0 | −518 | ✓ exact (projected 0) |
| `ellipse` | 0 | 518 | 488 | +518 | ✓ exact (projected ~518) |
| `text` | 1393 | 1588 | 1915 | +195 | **short of** projected +522 — see below |
| `tspan` | 249 | **0** | 0 | −249 | **contradicts** T4's own projection ("must NOT go to zero") — see below |

**Two corrected premises, both verified during T3's own implementation, not
newly discovered here:**

1. **`tspan` reaching zero is correct, not a bug.** T4's spec assumed some
   of the pre-T3 249 tspans were genuine creole multi-style-run spans
   (D3's carve-out) that should survive. Verified while implementing T3:
   all 5 multi-line label call sites in `activity-renderer-shapes.ts` take
   plain `\n`-split `string[]`, never creole-parsed content — none of the
   249 tspans were creole; every one was the OLD `multilineText()`'s own
   per-LINE tspan mechanism. Splitting correctly retires all of them.
2. **`text`'s shortfall (+195 of a projected +522) is not investigated
   further here** — per T4's own instruction ("projections... not
   results"). Plausible contributors: labels whose line COUNT itself
   differs from the jar's (missing/extra content, out of this mission's
   scope) and the 6 named pre-existing defects, which change how many
   text draws a given label produces independent of the per-line-split
   mechanism itself.

## Re-census — `oracle/goldens/svg-activity/diff-census.json`

Rewritten. Top residual, ranked by weight (was: `childCount` 91.6%,
`polyline` 2.46%, `circle` 0.77%, ...; now:):

| path | weight | share |
|---|---|---|
| `svg/g[][childCount]` | 24588 | 39.87% |
| `svg/g[]/line[]/@x1` | 2350 | 3.81% |
| `svg/g[]/line[]/@x2` | 2350 | 3.81% |
| `svg/g[]/line[]/@y2` | 2323 | 3.77% |
| `svg/g[]/line[]/@y1` | 2320 | 3.76% |
| `svg/g[]/line[]/@stroke-width` | 2319 | 3.76% |
| `svg/g[]/polygon[]/@stroke-width` | 1769 | 2.87% |
| `svg/g[]/polygon[]/@points` | 1760 | 2.85% |
| `svg/g[]/polygon[]/@stroke` | 1554 | 2.52% |
| `svg/g[]/text[]/@x` | 1320 | 2.14% |

**New finding, filed as a follow-on**
(`planning/next-missions.md#activity-edge-stroke-width`): every activity
edge line now draws `stroke-width="1.5"` where every cached jar golden
draws `stroke-width="1"` — `Worm.java:157,165`'s `withThickness(1.5)` is
for the start/end ARROW DECORATIONS only; the line itself gets its stroke
from `style.getStroke()` at `Worm.java:129`, a different, unexamined
source. Previously invisible (folded into the childCount short-circuit);
now the single largest individual attribute residual, weight ~2319 across
256 fixtures. **Not fixed here** — T4's write-set is census-only, no `src/`
changes ("if the re-measurement suggests a source change, that is a
finding for the census, not an edit").

`namedFamilies` (theme-resolution dark mode, `preserveAspectRatio`,
gradient defs — the three T6-era one-off findings) carried forward
verbatim; verified their fixtures are still in the 268-baselined
population before copying, not re-derived.

`geometryResidual`: width/height still diverge both ways (unchanged
qualitative shape from T6's original finding), now at proportionally
smaller magnitude since `childCount` no longer dominates the weight.

## Verification — nothing outside activity moved

- `src/core/svg-shapes.ts`: `git diff --stat` empty.
- `src/core/creole-svg.ts`: `git diff --stat` empty.
- Ran explicitly: `sequence.golden.ratchet.test.ts`,
  `sequence.diff-baseline.ratchet.test.ts`, `state.golden.ratchet.test.ts`,
  `class.golden.ratchet.test.ts`, `json.golden.ratchet.test.ts` — **5 files,
  1542 passed, 1 skipped, 0 failed.**

## Report (T4's interface contract)

```json
{
  "fell": 268, "rose": [],
  "aggregateBefore": 108447, "aggregateAfter": 61677, "pctChange": -43.1,
  "childCountShareBefore": 91.6, "childCountShareAfter": 39.9,
  "perSwap": {
    "T1": { "polylineOurs": 0, "lineOurs": 2702, "lineJar": 3336, "note": "634 short of full parity, pre-diagnosed" },
    "T2": { "circleOurs": 0, "ellipseOurs": 518, "ellipseJar": 488, "note": "exact match to projection" },
    "T3": { "textOurs": 1588, "textJar": 1915, "tspanOurs": 0, "note": "tspan-to-zero CORRECTS the spec's own projection; verified no creole in scope" }
  },
  "statusTransitions": [],
  "nonActivitySuitesMoved": []
}
```

No status transitions (`error`↔`baseline`↔`jar-error`): population remains
268 baseline / 82 error / 23 jar-error, unchanged from T0.

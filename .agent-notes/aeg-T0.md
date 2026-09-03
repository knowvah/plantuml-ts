# aeg-T0 — the pre-swap activity element census reproduces exactly

Mission `plans/activity-element-granularity/`, decision D6. Pin written to
`oracle/goldens/svg-activity/element-baseline.json`. **No `src/` changed.**

## Observation: every number the mission's premise rests on reproduces
- **Context**: T0 pins the element census before T1–T3 change any call site,
  so each swap's effect is separately attributable (D6).
- **Finding**: measured over the 268 `status:"baseline"` fixtures through the
  gate's own seams (`renderFixtureActivity` + `DeterministicMeasurer` +
  `fixtureIncludeStore()`, then `compareSvg(ours, golden, 'deterministic')`),
  at `804232d4`:

  | | value | T0 acceptance | |
  |---|---|---|---|
  | aggregate `weightedScore` | **108447** | 108447 | exact |
  | `polyline` ours | **1666** | 1666 | exact |
  | `line` jar | **3336** | 3336 | exact |
  | `svg/g[N][childCount]` records | **209** | (README) 209 | exact |
  | that family's weight | **99321 / 108447 = 91.6%** | 91.6% | exact |

  Full element table, ours vs jar, summed over the 268:

  | tag | ours | jar | delta |
  |---|---|---|---|
  | `line` | 289 | 3336 | −3047 |
  | `polyline` | 1666 | 0 | +1666 |
  | `text` | 1393 | 1915 | −522 |
  | `tspan` | 249 | 0 | +249 |
  | `circle` | 518 | 0 | +518 |
  | `ellipse` | 0 | 488 | −488 |
  | `polygon` | 1936 | 2551 | −615 |
  | `rect` | 1056 | 1027 | +29 |
  | `path` | 116 | 112 | +4 |
  | `a` | 0 | 9 | −9 |
  | `image` | 0 | 6 | −6 |

- **Impact**: the corpus has not moved under the plan. T1–T3 may proceed
  against this pin; the mission README's element table is confirmed, not
  assumed.
- **Confidence**: High — reproduced by re-running the generator twice, and
  the aggregate matches the value `main` was merged at.

## Observation: `tspan` was NOT in the README table, and it is not 0 for us
- **Context**: T0's spec lists eleven tags to census; the README's table
  lists seven.
- **Finding**: we emit **249** `<tspan>` across the 268; the jar emits
  **zero**. That is the same divergence as `text` (−522) seen from the other
  side: where the jar splits a multi-line label into N `<text>`, we emit one
  `<text>` with N `<tspan>` children.
- **Impact**: T3's exit condition is testable on TWO counters, not one.
  `text` must rise toward 1915 **and** `tspan` must fall — but NOT to zero:
  D3 keeps creole `<tspan>` **within** a line, and the jar's 0 is a
  population fact about this corpus, not a rule. Do not read `tspan == 0` as
  T3's bar.
- **Confidence**: High — measured.

## Observation: 59 of 268 fixtures have NO root-group child-count diff at all
- **Context**: reading the 91.6% figure as if it were spread evenly.
- **Finding**: the `svg/g[N][childCount]` family has 209 records over 268
  fixtures. The other **59 already agree on root-group child count** and
  carry `childCountWeight: 0`. Their residual is entirely attribute-level.
  The delta histogram over the 209 is overwhelmingly NEGATIVE
  (`-2`×20, `-8`×13, `-6`×12, `-9`×12, `-12`×12, `-7`×12, `-5`×10 …), with
  only a small positive tail (`+2`×9).
- **Impact**: a fixture at delta 0 can still move under T1–T3 — equal counts
  do not mean equal elements. `numalo-91-pole243` is the README's proof of
  exactly that. Do not use `childCountDelta == 0` as a "nothing to do here"
  filter in T4's riser analysis.
- **Confidence**: High — measured.

## How to re-measure
The generator is orchestrator-scratch, not committed: T0's write-set is the
pin plus this note, and `scripts/` is in no task's write-set. The algorithm
is ~60 lines and fully specified by `element-baseline.json`'s own
`$comment`; T4 re-runs the same script to produce the post-swap census.
Essentials, if it must be rebuilt:

1. `JSON.parse(oracle/goldens/svg-activity/diff-baseline.json).fixtures`
   filtered to `status === 'baseline'` (268).
2. Per fixture, read `test-results/dot-cache/activity/<slug>/{in.puml,in.svg}`.
3. `renderFixtureActivity(markup, new DeterministicMeasurer(), { includeStore: fixtureIncludeStore() })`.
4. Count tags by walking `normalizeSvg(...)` — the NORMALIZED tree, so the
   counts are what the comparator sees.
5. `compareSvg(ours, golden, 'deterministic')`; sum `Number(actual) - Number(expected)`
   over diffs whose `path` matches `/^svg\/g\[\d+\]\[childCount\]$/`, and sum
   their `weight ?? 1` for the weight share.

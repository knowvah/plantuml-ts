# component-divergence-drive (codd) — findings (2026-10-15)

## Observation: the census and the description ratchet did not render the way the survey does
- **Context**: T0, the census counted gevaje/kokebo/tusugu at 1-4 diffs while render-diff said 0/0.
- **Finding**: `scripts/svg-conformance-census.ts` (description path) and
  `tests/oracle/svg-conformance/render-fixture.ts` called parse/layout/render directly. They skipped
  renderSync's chrome composition (lgm-T1c), its parse-attempt routing (jar-CLASS rows forced through
  description) and the sprite/emoji/utility asset stores. 22 of 266 component rows measured differently.
  T1a (0b43dcfca) routes both through renderSync with the survey's options.
- **Impact**: a census Σ before 2026-10-15 is a different instrument from one after it; the new
  instrument's b0 is 21319 (old 21058). Compare like with like.
- **Confidence**: High

## Observation: description dropped every self-loop and group auto-link from the DOT
- **Context**: T9, xagonu's 6 px root bb diff.
- **Finding**: `layout-dot-tree.ts` `buildDotEdges` had `if (fromRes.dotNodeId === toRes.dotNodeId)
  continue;`. A leaf self-loop and a group auto-link (both endpoints resolve to `clusterN-anchor`)
  never reached graphviz. Unknown-tree self-loops that conform (lufano, pavuso) route through the
  class builder, which hid this.
- **Impact**: when a fixture's edge count differs from the jar's svek DOT, check for a dropped
  same-node edge before suspecting xlabels or the engine.
- **Confidence**: High

## Observation: layoutParity EQUAL does not prove the end labels reached the DOT
- **Context**: T0b, ledger row 12.
- **Finding**: the description builder set `tailLabelWidth/Height` without the label text, so core
  emitted no taillabel/headlabel. layoutParity read EQUAL on fetefi/nofunu/purevo; only native vs
  builder `tail_lp`/`head_lp` counts showed the gap.
- **Impact**: for port-label rows compare the `tail_lp`/`head_lp` multiset too.
- **Confidence**: High

## Observation: PlantUML style declarations compete by parse order, not selector specificity
- **Context**: T7b, a jar probe while porting T6-B/T6-C.
- **Finding**: `skinparam defaultTextAlignment right|left` (root) beats the skin's `usecase { center }`
  and `composite { title { center } }`, and user `roundCorner` beats the skin's `RoundCorner 5`,
  because the skin loads first and `DarkString#mergeWith` keeps the later declaration.
- **Impact**: a resolver order "element bucket → root → skin default" mirrors the jar; ranking the
  skin's more specific selector above a user root setting is wrong.
- **Confidence**: High (jar probe)

## Observation: a description golden for a dot-cache row outside the visual manifest becomes "authored"
- **Context**: T11 re-pin; `dot-sync-fixtures.test.ts` went red.
- **Finding**: `enumerateFixtures('usecase')` appends every `oracle/goldens/svg-description/usecase/`
  golden whose slug is not in `tests/visual/data/usecase.json`. `exposant-02-usecase` is a dot-cache
  row missing from that manifest, so pinning it added it to the authored list.
- **Impact**: after a description re-pin, expect this test plus the routing/refusal count pins to
  move; update them with derivations.
- **Confidence**: High

## Observation: survey chains starve under foreign load
- **Context**: b1/b5 closes. Load 30-55 came from another repo's Python multiprocessing pool and a
  long wasm benchmark, not from this mission.
- **Finding**: `chain.sh`'s load < 8 gate stalled for over an hour. A scratch copy with the gate at 40
  completed; load-induced `timeout` verdicts (5 usecase rows at b1) were re-run before diffing.
- **Impact**: read `ps -Ao pcpu` before blaming your own agents; re-run any timeout row.
- **Confidence**: High

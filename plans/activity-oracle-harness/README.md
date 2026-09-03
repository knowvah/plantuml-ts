# Mission: `activity-oracle-harness`

**Branch:** `feat/activity-oracle-harness` · **Planned:** 2026-09-02 ·
**Baseline commit:** `63df9918` (clean tree, all four gates green)

## Objective

Stand up an SVG-conformance gate for the activity engine over the ~373
dispatcher-typed activity fixtures in the pdiff corpus, then close the root
chrome gap that pins every one of them to an identical 12-diff floor.
Activity is the **last engine still not routed through the shared klimt
document shell** — class, state, description, json and sequence are all on
it. Sequence was moved by SI34 (`plans/sequence-root-chrome`), whose T3
dropped 803/1010 fixtures from this exact 12-path set to a 5-path set.

## Measured baseline (2026-09-02, pre-mission)

| Quantity | Value | How measured |
|---|---|---|
| `tests/corpus/activity/*.puml` | 452 | `ls` |
| **Activity by OUR dispatcher** | **373** | `registry.resolve` (73 class, 2 sequence, 4 unparseable) |
| Renders clean | 283 | `renderSync` over the 373 |
| Emits a Syntax Error SVG | 90 | our parser gaps — jar renders 9 of a 10-sample |
| Throws | 0 | — |
| Zero-diff vs jar | **0 of 18 sampled** | `compareSvg`, deterministic |
| Diff floor | **exactly 12, every fixture** | `weightedScore` 223–1040, median 544 |
| `svek-*.dot` emitted | **0 of 28** | activity never uses dot |
| Oracle size | 4.3 KB/svg → **~2.4 MB** for 283 | measured, not extrapolated |
| Suite cost | **~1.5 s** | sequence's 1141 fixtures = 5.91 s test time |

**The 12 diffs decompose as** 7 missing root attributes (`background`,
`contentStyleType`, `preserveAspectRatio`, `version`, `xmlns:xlink`,
`zoomAndPan`, `data-diagram-type`) · 1 `defs[1][childCount]` (jar emits an
EMPTY defs element; ours carries 12 `svgRoot`-injected arrowhead markers) ·
1 `g[1][childCount]` (**ours has 2 EXTRA children**, 7 vs 5) · 4 real
geometry diffs (`width`/`height`/`viewBox[2]`/`viewBox[3]`) **that go in
both directions** — numalo 52 vs 64, darote 144 vs 129.

## Exit bar

- The gate exists, is green, and pins every captured fixture
- The 7 root attributes and the defs-childCount diff are **gone from every
  fixture**; `g[1][childCount]` matches the jar
- Every fixture whose `weightedScore` **rose** is named with a mechanism
- Only activity entries moved in `render-manifest-baseline.json`
- All four gates green

## What this mission does NOT do

- **Does not fix the 90 parser gaps.** They are captured and recorded as
  `status:"error"`, becoming a tracked queue for a later mission ([D8]).
- **Does not chase the geometry residual.** The width/height/viewBox delta is
  real layout divergence; T6's census ranks it for the next mission.
- **Does not port arrowheads.** Activity already draws inline polygons
  (`src/diagrams/activity/renderer.ts:44`) — unlike sequence at SI34 ([D6]).
- **Does not add a DOT-parity gate.** Activity emits no DOT ([D9]).

## Quality gates — all four, before any commit lands

```
- command: npm test            # vitest + 90/90/90 coverage
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run typecheck   # both tsconfigs
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run lint
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run build
  pass: exit 0
  on_fail: fix_and_rerun
- command: git diff --name-only HEAD~1
  pass: output matches the task's declared write-set only
  on_fail: stop
```

The `npm test` wall-clock ceiling in this repo is **advisory context, not a
gate**. Report it; do not tune for it.

## Batches

| Batch | Tasks | Parallel | Done |
|---|---|---|---|
| [0](batch-0/overview.md) | T0 capture corpus · T1 render helper · **T0b pin corpus gates** ([D11]) | serialized | [x] |
| [1](batch-1/overview.md) | T2 pre-chrome baseline · T3 freshness sentinel | serialized | [x] |
| [2](batch-2/overview.md) | T4 diagnose the 2 extra g children | — | [ ] |
| [3](batch-3/overview.md) | T5 route through document shell | — | [ ] |
| [4](batch-4/overview.md) | T6 re-pin + census | — | [ ] |
| [5](batch-5/overview.md) | T7 close-out | — | [ ] |

**T4 gates T5.** The diagnosis must state the mechanism before any deletion —
`~/.claude/rules/diagnosis.md`. This is the one place the mission can damage
output while all four gates stay green.

## Stop conditions

1. A task needs to write a file outside its write-set, and no other task owns it
2. Two consecutive gate failures on the same check — the cap bounds **fix
   attempts, not investigation**; keep diagnosing until the mechanism is stated
3. Any of [D1–D10](decisions.md) is contradicted by the code — amend the
   decision and halt; never silently override
4. **T4: either extra `g` child proves layout-bearing rather than chrome**
5. **T6: any NON-activity entry moves in `render-manifest-baseline.json`**
6. A re-pin would raise a pin without a stated mechanism — a risen pin is an
   adopted regression until proven otherwise
7. A stray `svek-*.dot` appears for any activity slug (contradicts [D9])
8. A constant is needed and its upstream `file:line` cannot be located. Never
   fit a value — especially not one that shrinks the error

## Push-forward conditions

1. Jar cannot render a fixture → record slug + reason, no partial entry, continue
2. Our parser rejects a fixture → `status:"error"` + reason, continue
3. Typed population differs from 373 → capture what the dispatcher says, report
   the delta; `tests/corpus/` is gitignored and regenerable, the dispatcher is
   the authority ([D3])
4. Suite wall-clock rises ~1.5 s → expected, not a regression
5. Task simpler than estimated → do it, log why in the journal first
6. Purely stylistic choices with no behavioral effect
7. Self-explanatory error with an obvious fix

## Standing constraints

- **Do not refactor while porting.** T5 removes only what T4 licensed.
- **"Hard" and "out of scope" are triggers to VERIFY** — including a claim
  made by an earlier task in this same mission.
- **Read the Java method**, not a filename or a remembered summary. Grep
  `src/main/java/net/`, never just `net/sourceforge/plantuml/`.
- Render oracles with `scripts/oracle-render.sh`, **never** a hand-typed
  `java -jar` — it sets `-DPLANTUML_DETERMINISTIC_TEXT=true`.

## Index

- [decisions.md](decisions.md) — D1–D10
- [decision-journal.md](decision-journal.md) — appended during execution
- [diagrams/component-map.md](diagrams/component-map.md)
- [diagrams/data-flow.md](diagrams/data-flow.md)

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
  fixture**; `g[1][childCount]` is fixed on the **55** fixtures whose delta is
  exactly +2 ([D13] — the original clause "matches the jar" was measured
  impossible: 168 of 268 fixtures have FEWER children than the jar, a fidelity
  gap no chrome change touches)
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
| [2](batch-2/overview.md) | T4 diagnose the 2 extra g children | — | [x] |
| [3](batch-3/overview.md) | T5 route through document shell | — | [x] |
| [4](batch-4/overview.md) | T6 re-pin + census | — | [x] |
| [5](batch-5/overview.md) | T7 close-out | — | [x] |

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

---

## Close-out — 2026-09-02

Branch `feat/activity-oracle-harness`, 14 commits, all four gates green at
head. Every number below was measured by the orchestrator independently of
the task agent that produced it, per `verify-agent-claims-si31`.

## Headline

**Aggregate `weightedScore` over the 268 numerically-comparable fixtures:
154722 → 108447, −29.9%. 268 fell, 0 rose, 0 held.**

`diffCount` rose on 57 fixtures and fell on 211. That is the [D2] artefact,
predicted in advance: collapsing the 12-marker `defs` short-circuit converts
an unexamined "cost 1" into a real per-attribute comparison, so a risen
`diffCount` beside a fallen `weightedScore` means alignment improved.

## Tasks completed vs planned

**8 of 8 — one more than the 7 planned.** T0b was added mid-mission ([D11]).

| Task | Planned | Outcome |
|---|---|---|
| T0 capture corpus | yes | done — but **halted first** on stop condition 1 |
| **T0b pin corpus gates** | **no — added mid-mission** | done by the orchestrator; [D11] |
| T1 render helper | yes | done |
| T2 pre-chrome baseline | yes | done; produced [D12] and retired a brief premise |
| T3 freshness sentinel | yes | done |
| T4 diagnose the 2 extra `g` children | yes | done; produced [D13] and a binding amendment to T5 |
| T5 route through document shell | yes | done |
| T6 re-pin + census | yes | done; **corrected the orchestrator** and was right |
| T7 close-out | yes | this section |

## What actually happened, where it differed from the plan

**T0b exists because the brief missed a coupling.** Adding
`test-results/dot-cache/activity/` turns `routing-conformance.test.ts` and
`refusal-coverage.test.ts` red — both walk the whole cache tree and fail on
any unpinned fixture — and neither baseline was in any task's write-set
across all six batches. T0 hit this, correctly refused to write a baseline
JSON (`scripts/repin-sequence-baselines.ts:3-8` reserves that to the
orchestrator), and halted. The fix was a new orchestrator-executed task
committed **before** T0, so no commit on the branch is ever red.

**Three of the brief's own premises were measured false and retired.** Each
was caught by the task that would otherwise have been asked to hit an
impossible target:

1. *"The diff floor is exactly 12, every fixture."* T2 measured 238 of 268 at
   `diffCount` 12 with one identical path set; 30 are not — 9 at 10, 1 at 11,
   and a tail to 74.
2. *"Ours has exactly 2 extra `g` children on every fixture."* T4 measured a
   mostly **negative** delta histogram; only 55 fixtures sat at exactly +2.
   The two rects are a constant +2, but they sit on top of a per-fixture
   content deficit.
3. *"`g[1][childCount]` matches the jar"* (an exit-bar clause). [D13] amended
   it to the achievable form after re-measuring: 168 fewer / 20 equal / 80
   more pre-T5.

**T4 converted a deletion into a relocation.** The brief's [D7] said the two
extra background rects get removed. T4 read `SvgGraphics.java:186-192` and
found the jar skips its content rect only for `#00000000`, `#000000` and
`#FFFFFF` — for any other solid colour it *does* draw one, proven by three
cached goldens (`labala-74-juki864` #0B58A8, `poraji-17-goke817` #808080,
`levuma-67-cego489` #1B1B1B). A naive delete would have regressed all three
while every gate stayed green. Extra B moved behind upstream's own
`paintBackcolor` guard instead.

**T6 refused an orchestrator instruction and was right.** Told to re-pin all
350 activity `known-misroute` routing entries to `agree`, T6 measured that
only 268 flip; the other 82 still route `ACTIVITY → NONE` for a *different*
mechanism (our parser refuses the source, so `renderSync` returns a
`PSystemError` page that the activity renderer never draws, which T5's shell
change cannot reach). Following the instruction as written would have turned
the routing gate red.

**[D13]'s predicted riser set did not materialise — 0 risers, not the ~20
forecast.** Recorded as a conservative prediction rather than a miss:
pre-declaring a riser set cost nothing and would have caught a real
regression.

## Exit bar

| Clause | Result |
|---|---|
| The gate exists, is green, pins every captured fixture | **met** — `tests/oracle/svg-conformance/activity.diff-baseline.ratchet.test.ts`; 373 pinned (268 `baseline` + 82 `error` + 23 `jar-error`) |
| 7 root attributes and the `defs`-childCount diff gone from every fixture | **met** — 0 of 268 missing any of the 7; 0 with a non-empty `defs` |
| `g[1][childCount]` fixed on the 55 fixtures at exactly +2 ([D13]) | **met** — the +2 cohort collapsed 55 → 9 and the `more` cohort 80 → 19 |
| Every fixture whose `weightedScore` rose is named with a mechanism | **vacuously met** — 0 rose |
| Only activity entries moved in the render manifest | **met** — non-activity routing pins are exactly 3133/17/8, the pre-mission values |
| All four gates green | **met** |

Three of T2's original 12 chrome paths survive on **one fixture each**, as
*value* diffs rather than missing attributes, all censused as named families:
`setecu-78-cuko533` (`preserveAspectRatio`), `dakesa-98-mano758` (`defs`
gradient), `levuma-67-cego489` (`background`).

## Decisions

**13 total: D1–D10 at decomposition, D11–D13 added during execution.** Five
are flagged for review in the journal:

| Decision | Added | Flagged | What it settles |
|---|---|---|---|
| D11 | mid-mission, T0b | **YES** — expands scope into two prior missions' gates | Pin the activity tree into routing- and refusal-baseline, additively |
| D12 | mid-mission, T2 | **YES** — extends the brief's status vocabulary | A fixture whose *golden* is a jar error page is `status:"jar-error"`, never a number. Carries a correction: the numeric population is **268**, not the 283 the orchestrator first asserted |
| D13 | mid-mission, T4 | **YES** — a brief exit criterion was impossible as written | Amends the `g[1][childCount]` exit clause to the measured reality |

Also flagged in the journal: T2's retirement of the uniform-diff-floor
premise, T4's retirement of the "+2 on every fixture" premise, T4's binding
amendment relocating extra B behind the `paintBackcolor` guard, and **T6's
refusal of an incorrect orchestrator instruction**. The last is the single
most useful row in the file — keep it.

## Gate results (full branch, 2026-09-02)

| Gate | Result |
|---|---|
| `npm test` | **exit 0** — 682 files passed / 1 skipped; **18198** passed / 2 skipped / 1 todo; coverage 95.77 stmts / 91.06 branch / 97.00 funcs / 96.81 lines |
| `npm run typecheck` | exit 0 (both tsconfigs) |
| `npm run lint` | exit 0 |
| `npm run build` | exit 0 |
| `npm run catalog` | **no drift** |

**Wall-clock 70 s** (vitest `Duration` 68.93 s) against a ~60 s pre-mission
baseline at `63df9918` — **+10 s**. Advisory context, not a gate. **Treat the
delta as an upper bound, not a reading**: load average was 21–25 throughout,
with `corespotlightd` at 154% CPU (`confounded-wall-clock-readings`). An
earlier attempt on the same tree completed its 648 coverage shards in ~60 s
and then hung in vitest's worker teardown under that same load.

The test count moved **18466 → 18198, −268**. That is exactly the routing
gate's per-`known-misroute` `it()` blocks (`pinnedMisroutes` 367 → 99) — an
explained reduction, not lost coverage. Against the pre-mission baseline of
~17638 the branch is **+560** tests.

## `DIVERGENCES.md` — no entry added, deliberately

T5 changed activity's SVG root shape, but every part of that change moves
**toward** upstream: the 7 root attributes the jar stamps
(`TextBlockExporter.java:293`), the background in the root `style` rather
than a rect (`SvgGraphics.java:805-806`), an empty `defs` matching the jar's,
and a background rect relocated behind the jar's own `paintBackcolor` guard
(`SvgGraphics.java:186-192`). `DIVERGENCES.md`'s stated purpose is "deliberate
exceptions — places where this port produces different output for a
documented reason." This mission *removed* differences and introduced none,
so it has no entry to make there. The brief's own "Not applicable —
backwards compatibility" clause anticipated exactly this and directed the
output-shape change to the commit message, where `92c92c24` records it in
full with its Java citations.

## `docs/parity-report.md` — no DOT-parity row appeared

Confirmed, and [D9] holds. The file is **byte-identical to `main`** on this
branch. Activity already carried a `0 / 0 / — / 0 / not yet measured` row
before the mission; it did not gain a comparable/equal count and cannot,
because `EXPECTED_TAG` (`scripts/dot-sync-report.ts:68-74`) has no `activity`
key, so `markdownRowForType` returns `NOT_MEASURED` regardless of what the
cache holds. Independently: **0 `svek-*.dot` files exist under all 373
`test-results/dot-cache/activity/` fixtures**, so stop condition 7 never
fired. No `docs/graphviz-issues/` filing is owed — activity uses no dot.

## Follow-ons

Filed in `planning/next-missions.md` with their measured numbers, not left in
this directory. Ordered by measured weight:

1. **`g[][childCount]` — 91.6% of all remaining weight** (99321 of 108447,
   209 fixtures). 190 of 268 fixtures draw **fewer** children than the jar.
   Missing ink, not chrome.
2. **The 82 parser-gap fixtures** ([D8]) — set-identical to the 82 activity
   `known-misroute` routing pins, so fixing them closes two gates at once.
3. **The geometry residual** — width 195 wider / 73 narrower, height 105
   taller / 154 shorter / 9 equal. Both ways; no constant margin explains it.
4. **Three single-fixture families** — `levuma-67-cego489`
   (`skinparam mode dark` theme resolution), `setecu-78-cuko533`
   (`skinparam preserveAspectRatio`), `dakesa-98-mano758` (`red-green`
   gradient in `defs`).

## Known issues

- `plans/activity-oracle-harness/batch-5/overview.md` still shows T7 `[ ]`.
  That file is outside T7's declared write-set; flip it or leave it, but the
  README table above is the canonical record.

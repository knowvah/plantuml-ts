# Mission — SVG output size reduction

Port upstream's "reduce SVG output size" change into **both** of this
port's SVG emitters, then re-baseline the 445 pinned `svg-*` goldens so
every ratchet returns green.

**Branch:** `feature/svg-output-size-reduction` (already created, based on
`main` @ `1d913189`).

## Objective

Two upstream commits inside the current oracle pin range —
`ba68279df92` and `4f3a0dcc63b`, both "⚗️ reduce SVG output size" —
rewrote `klimt/drawing/svg/SvgGraphics.java`'s emission with six rules.
Our goldens were captured before them, so **445 of 445 change**. This is a
port, not a regeneration: the goldens are the jar's output and the
ratchets byte-compare our render against them, so regenerating alone turns
every pinned assertion red.

Measured outcome: emitted SVG shrinks **1,477,458 B → 1,354,859 B (8.3%)**.

## Read these first

1. **`.agent-notes/svg-output-size-reduction-measured.md`** — the six rules
   read directly off the upstream Java diff, plus the measured blast
   radius. **Do not re-derive any of it.**
2. [`decisions.md`](decisions.md) — ADR-1..6, all approved.
3. The batch overview for whichever batch you are starting.

## The six rules (summary — full text in the agent-note)

| # | Rule |
|---|---|
| 1 | Decimal precision 4 → 3, as a **parameter** (upstream: `SvgOption.decimal`, default 3) |
| 2 | `shortenColor` — `#RRGGBB` → `#RGB` when all three pairs repeat |
| 3 | Hoist `font-family="sans-serif"` + `lengthAdjust` to the root `g`; per-text `font-family` only when it differs; per-text `lengthAdjust` dropped |
| 4 | Suppress `stroke-width` + `stroke-dasharray` when `stroke:none` |
| 5 | Skip `textLength` for single-character text |
| 6 | `formatOpacity`/`formatPercent` use `max(decimal, 2)` + trim zeros |

## Two emitters — both in scope

| Emitter | Engines | Goldens |
|---|---|---|
| `src/core/klimt/drawing/svg/` (the `SvgGraphics` port) | description | 51 |
| `src/core/svg.ts` (hand-rolled string builder) | class, state, object | ~394 |

`core/svg.ts` has **no numeric formatting at emission** (`String(value)`);
the class engine's `javaRound4` calls compensate. ADR-1 fixes that
structurally. Porting only the klimt emitter leaves 393 goldens red.

## Batches

| Batch | What | Tasks | Gate | Done |
|---|---|---|---|---|
| [batch-1](batch-1/overview.md) | Foundation — shared rules module, regeneration script | T1, T2 | normal | [x] |
| [batch-2a](batch-2a/overview.md) | Port both emitters | T3, T4, T5 | **deferred** | [x] |
| [batch-2b](batch-2b/overview.md) | Remove class-engine pre-rounding | T6a–T6e | **deferred** | [x] |
| [batch-2c](batch-2c/overview.md) | State cleanup, formatter retirement, regenerate goldens | T7, T8, T9, T9b | **deferred** | [x] |
| [batch-2d](batch-2d/overview.md) | Test repair | T10–T13 | **FULL GATE HERE** | [x] |
| [batch-3](batch-3/overview.md) | No-SVG fixture, docs + version | T14, T15 | normal | [x] |

**ADR-5 — the deferred gate.** Gates *cannot* be green between porting the
rules and regenerating the goldens; the two are only consistent together.
Batches 2a–2d are one gate unit: run the full gates **once**, at the end of
batch-2d. Do not treat a red suite inside 2a–2c as a stop condition.

## Quality gates

```sh
npm run typecheck        # tsc --noEmit, both tsconfigs
npm run lint             # eslint src tests demo
npm run build            # vite library build
rm -rf packages/*/assets && npm test   # COLD tree
```

**Never pipe a gate** — `tail`'s exit code masks vitest's. Redirect to a
file and check `$?` instead. Run the cold-tree test twice; warm gitignored
assets hide a worker race.

Golden-specific gate:

```sh
npx tsx scripts/rebaseline-svg-goldens.ts      # report only, no --write
```

## Stop conditions

- A task needs to modify a file outside its declared write-set
- Two consecutive gate failures on the same check
- An ADR in `decisions.md` is contradicted by what the code requires
- **>20 goldens still failing after the full port lands** — that is a
  missed rule, not churn; diagnose before touching goldens
- The regeneration script reports `FAILED` > 0. **Corrected 2026-08-08
  (T2):** this originally read `> 1`, budgeting for one known failure —
  `class-actor-bare-no-allowmixing`. That fixture does **not** fail: the
  jar emits a valid 2147-byte *error diagram* and exits 200, which the
  script correctly classifies CHANGED. Expect `FAILED=0`. See the decision
  journal and `.agent-notes/svg-rebaseline-error-diagram-fixture.md`.
- **Any last-digit mismatch pattern after T6/T7** — means pre-rounding
  survived somewhere; `rules/diagnosis.md` applies, find the call site

## Push forward without asking

- Updating expected literals in tests to the new emitted form
- Deciding which T6 sub-area a stray `javaRound4` call belongs to
- Comment rewording, import ordering, formatting
- Ordering within a parallel group

## Conventions

- Commit format: `~/.claude/rules/commits.md`. One commit per task, message
  references the task ID (`feat(T3): ...`).
- **Do not `git` from inside an agent** — the orchestrator commits after
  each batch. Parallel agents share this worktree.
- Diagrams are PlantUML, never Mermaid (repo CLAUDE.md).
- Porting discipline: preserve upstream names and structure; do not
  refactor adjacent code while porting.

## Other docs

- [`decisions.md`](decisions.md) — ADR-1..6
- [`diagrams/component-map.md`](diagrams/component-map.md) — what touches what
- [`diagrams/data-flow.md`](diagrams/data-flow.md) — where each rule applies
- [`decision-journal.md`](decision-journal.md) — append during execution


---

# Mission summary — completed 2026-08-08

## Tasks

Planned 15 (T1–T15). Completed 15, plus **four added during execution**
because the decomposition did not cover them:

| added | why it existed |
|---|---|
| T5b | rule 3's root `<g>` attributes landed in the klimt emitter only, breaking `unwrapContentG` and silently disabling two class splice sites; ~394 goldens would have mismatched structurally |
| T7b | hand-built markup in the class engine bypassed the emission choke point entirely, emitting raw floats once the compensating pre-rounding was removed |
| T9b | the 4 `svg-conformance` goldens have no `in.puml`, so T9's script could never reach them, yet they drive the klimt emitter |
| *(fixture)* | maintainer-supplied `class-inheritance-interface-assoc`, added with its jar oracle |

## Result

- **12605 / 12607 tests passing.** Two cold-tree runs agree exactly.
- Oracle suites **1969 / 1970**.
- Emitted SVG **1,477,458 → 1,368,743 bytes (7.4%)** across the 446 pinned
  fixtures. The brief predicted 8.3%; the starting figure matches it
  exactly, so the gap is in the prediction, and four goldens were
  byte-verified against independent fresh jar captures.
- `scripts/rebaseline-svg-goldens.ts`: `SAME=0 CHANGED=446 FAILED=0`,
  `ERROR-DIAGRAM=1`.

## Corrections to the brief, each verified against the jar

1. `formatDecimal(28.4805, 3)` is `28.481`, not the `28.48` two task files
   stated (live JVM).
2. `class-actor-bare-no-allowmixing` does not fail to produce an SVG — it
   produces an error diagram and exits 200. T14's premise was void; the
   `FAILED` stop condition tightened from `>1` to `>0`.
3. The predicted 8.3% size reduction measured 7.4%.

## Defects found that the mission did not anticipate

Seven, all caught by the regenerated goldens rather than by review:
`attrs()` never applied `shortenColor` while `attrsFromRecord` did; two raw
`style=` builders; the monochrome post-pass skipping every 3-digit color (a
wrong picture, not a formatting nit); and four hand-built markup sites in
`src/core/`. One was **self-inflicted and caught by fixtures** — shortening
a color inside `applyMonochromeHex`, which also feeds a value the renderer
*compares*, flipped a background-rect decision.

## Open, and deliberately not decided here

1. **`class/bipudo-23-xavu432`** — a pre-existing 0.0097 edge-spline gap
   that sat inside the 0.01 tolerance and that 3-decimal rounding pushed a
   hair over. Proved pre-existing by rendering at pre-mission `1d913189`.
   Needs a maintainer call: accept in `oracle/accepted-divergences.json`,
   un-pin, or close the underlying gap. Both of the first two require
   sign-off by the repo's own rules.
2. **Realization-edge ranking** — `class-dot-graph.ts:63` treats `..|>` as
   hierarchical; the jar does not. Removing it takes the new fixture from
   427 diffs to 202 and its height error from 122px to 1px, but regresses
   four pinned goldens. `.agent-notes/class-realization-edge-rank-gap.md`.
3. **45 hand-built markup sites** in activity/chart/json/sequence/dot —
   latent, not new, none goldened.
   `.agent-notes/handbuilt-svg-markup-audit.md`.
4. **The two-emitter divergence** behind several of these tasks.
   `.agent-notes/two-svg-emitters-divergence.md`.

## Process notes

- ADR-5's deferred gate worked: the red window stayed bounded and the full
  gate at batch-2d surfaced seven real defects rather than churn.
- One orchestrator error, corrected mid-mission: a "stop if the value feeds
  arithmetic" instruction added to the T6 prompts contradicted ADR-1.
  Upstream rounds decimals in exactly two places, never during layout, so
  the pre-rounding had to go everywhere.
- Interrupted agents twice left partially-applied edits; both times the
  diff was preserved and the files reset to HEAD rather than built upon.

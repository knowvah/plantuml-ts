# Mission: si9-authored-fixture-registration

**Status:** ready to execute · **Branch:** `main` (maintainer practice)
**Created:** 2026-07-31 · **Predecessor:** `svg-sprite-nanoparser` (closed)

## Objective

CLAUDE.md instructs: *"The corpus is a starting point, not a ceiling —
author fixtures to cover gaps."* Authoring works. **Registering the result
does not.** A fixture authored directly under
`oracle/goldens/svg-description/<type>/<slug>/` can never be ratcheted, so it
provides no regression guard. This mission closes that hole.

## Why it matters, concretely

`svg-sprite-nanoparser` proved the cost. When its T9 first emitted the
`drawable` variant, **sprites rendered as nothing** — and `npm test`, all 389
SVG goldens, and the size-delta script all stayed green. Sizing was
unaffected and no ratcheted golden contains a sprite. The regression was
caught only by hand-measuring three diagnostic fixtures that the harness
could not register.

Until this mission lands, **the sprite corpus has no regression guard.**

## The chain (verified 2026-07-31 — do not re-derive)

1. `tests/visual/data/<type>.json` — committed manifest, `{slug, markup}[]`,
   351 entries for `usecase`.
2. `scripts/dot-sync-report.ts#loadFixtures(type)` reads **only** that file,
   then builds `test-results/dot-cache/<type>/<slug>/` (`.done`, `in.puml`,
   `in.svg`, `svek-N.dot`) via the pinned oracle jar. `test-results/` is
   gitignored — local and rebuildable.
3. `scripts/svg-parity-survey.ts` iterates that cache, renders ours through
   `renderSync` + `WidthTableMeasurer`, computes `dotEqual`, and writes
   `tests/oracle/svg-conformance/parity.json` (committed, 355 rows).
4. `description.golden.ratchet.test.ts` **AC3** requires every ratcheted slug
   to have a `parity.json` row with `dotEqual: true`.

Authored fixtures never enter at step 1, so no row can exist, so AC3 blocks
them permanently.

## The acceptance case

Three fixtures already exist and are the proof:
`oracle/goldens/svg-description/usecase/sprite-svg-{bootstrap,archimate,multiline}-0`.

Measured 2026-07-31: all three match the jar with **zero diffs** under
`compareSvg(…, 'deterministic')`, and all three are **`dotEqual: true`**
(verified with the survey's own `computeDotEqual` against freshly generated
jar DOT). The mission succeeds when they are ratcheted in and the suite is
green.

## Quality gates

| Command | Pass | On fail |
|---|---|---|
| `npm test` | exit 0 | fix_and_rerun |
| `npm run typecheck` | exit 0 | fix_and_rerun |
| `npm run lint` | exit 0 | fix_and_rerun |
| `npm run build` | exit 0 | fix_and_rerun |
| `npx tsx scripts/measure-description-size-deltas.ts` | 320/351, widened 0 | stop |
| 389 svg-class/object/state goldens | byte-identical | stop |

## Batches

Strictly sequential — this is a pipeline, each task consumes the previous
task's output. There is no parallelism to exploit and none is manufactured.

| Batch | Task | Theme | Done |
|---|---|---|---|
| [1](batch-1/overview.md) | T1 | `dot-sync-report` sees authored fixtures | [x] |
| [2](batch-2/overview.md) | T2 | Regenerate `usecase` parity; inspect drift | [x] |
| [3](batch-3/overview.md) | T3 | Ratchet in; correct the now-false docs | [x] |

## Documents

- [`decisions.md`](decisions.md) — the five approved ADRs. **Read before any
  task.** ADR-2 is the non-obvious one and the reason this mission is not a
  one-line change.
- [`decision-journal.md`](decision-journal.md) — appended during execution
- [`diagrams/data-flow.md`](diagrams/data-flow.md) — the registration chain
- [`diagrams/component-map.md`](diagrams/component-map.md) — what is touched

## Stop conditions

**Oracle integrity — these protect the measurement itself**

1. Hand-writing or hand-editing any `parity.json` row. It is **generated**,
   always. Its fields come from a measured render path; fabricating them
   inverts the oracle.
2. Editing any `golden.svg`. If our output looks *more* correct than the
   jar's, that is a finding for the maintainer, not an edit.
3. Adding a fixture to `ratchet.json` before measuring that it passes. A
   ratcheted fixture is held forever.
4. Re-pinning `oracle/goldens/description/size-backlog.json`. "The pin looks
   wrong" is a STOP.
5. Unrelated drift in the regenerated `parity.json` — report it with
   before/after rows; never absorb it.

**Scope**

1. A task needs a file outside its write-set AND outside every other task's.
2. Two consecutive gate failures on the same check, or the same location
   changed 3× without resolving it.
3. Any diff in the 389 svg-class/object/state goldens.
4. A task proposes pasting markup into `tests/visual/data/*.json` —
   [ADR-1](decisions.md#adr-1)'s rejected option; six unrelated consumers
   read that file.
5. A task needs `src/diagrams/class/` or `measureUsecase` — that is SI10.

## Push-forward conditions

- Internal structure, naming and helpers inside the new test file.
- Complexity-hook friction: `#lizard forgives` near a large function's END,
  or a ~500-line split. Do NOT edit `complexity-ignore`.
- Extra test cases beyond the stated acceptance criteria.
- **A line or path citation here is off.** Follow the code, note the
  correction in the journal, continue. A wrong line number is not a wrong
  mechanism.
- A task is simpler than scoped — log why in the journal, then proceed.

## Two method rules — spec, not preamble

Both were earned at cost on the predecessor mission line. They appear in
every task file and apply to your own plan, not just to what you read.

1. **Trace dependency cascades TWO levels** before ruling on scope. This
   mission's own blast radius changed at level two: `tests/visual/data/*.json`
   turned out to have **six** consumers (`capture-corpus.ts`,
   `build-pages.ts`, `classify-corpus.ts`, and four integration tests),
   which is now the strongest argument for ADR-1's chosen shape.
2. **Verify any "already fixed / already wired / deferred" claim against the
   CURRENT call graph.** [ADR-2](decisions.md#adr-2) exists *only* because a
   plausible assumption ("canonicals will be generated automatically") was
   checked and found false.

## Corrections to prior context, already verified

- **The ratchet does NOT compare raw bytes.**
  `tests/oracle/svg-conformance/normalize.ts` strips every `data-*` attribute
  and rounds numerics under `compare.ts`'s 0.01 `deterministic` tolerance.
  Measuring with `===` invents blockers that do not exist — this already cost
  time on the predecessor mission. Always use
  `compareSvg(ours, jar, 'deterministic')`.
- `EXPECTED_TAG.usecase === 'DESCRIPTION'`, which is what these fixtures
  render as, so the tag filter will not exclude them **once they have a
  canonical SVG** (see ADR-2).
- `plans/` is **tracked** in this project, not gitignored — the predecessor's
  brief is on `main` and `planning/mission-index.md` links into it. The
  `/plan-mission` template says otherwise; established practice wins.

---

## Mission summary — CLOSED 2026-07-31

**Tasks: 3 of 3 complete.** Four commits on `main`: `d130ca80` (T1),
`2189c4ad` (T2 stop report), `253bfa74` (T2), `5b37df6c` (T3).

### What landed

The doctrine gap is closed. A fixture authored under
`oracle/goldens/svg-description/<type>/<slug>/in.puml` is now enumerated by
`scripts/dot-sync-fixtures.ts#enumerateFixtures`, obtains a `parity.json` row,
and is ratchet-eligible — no manifest edit, no manual step. The three sprite
fixtures are ratcheted in, so **the sprite corpus has a regression guard for
the first time**; before this, a change that rendered sprites as nothing
passed `npm test`, all 389 goldens and the size-delta script.

- **usecase DOT parity 90/90 → 93/93**, still 100% EQUAL.
- Ratchet suite **51 → 54 tests**; full suite 11173 → **11176**, 457 files.
- All three fixtures re-measured at **0 diffs** on the current code, via the
  ratchet's own `renderFixture` + `DeterministicMeasurer` path.

### Decisions worth re-reading

- **ADR-2 earned its place.** "Canonicals will follow automatically" was
  checked and found false, and the first run proved it in the field: the
  canonical cache reported *missing 3 of 354* against a directory already
  holding 359 SVGs. Shipping ADR-1 alone would have produced a green,
  no-op mission.
- **One STOP, raised and resolved.** Regenerating `usecase` parity moved 47
  pre-existing rows — a 2026-07-15 baseline with 137 intervening `src/`
  commits, not this mission's doing. Reported with the full before/after
  table before anything was committed (stop condition 5 / T2 AC4); the
  maintainer chose to take the refresh here. Zero `dotEqual` flips, zero
  verdict transitions.
- **Six "timeout" rows were noise, not drift.** Diagnosed rather than
  reported: each renders in ~1.0 s in isolation against a 10 s cap, and a
  re-run at concurrency 2 gave zero timeouts and zero differences against the
  first pass on the other 87 rows.

### Quality gates

| Gate | Result |
|---|---|
| `npm test` | exit 0 — 457 files, 11176 tests |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm run build` | exit 0 |
| `measure-description-size-deltas.ts` | 320/351, **widened 0** |
| 389 svg-class/object/state goldens | byte-identical — no `golden.svg` touched |

### Known issues / follow-ups

1. ~~**`PARITY-SVG.md` is 3 rows stale.**~~ **CLOSED 2026-07-31** — and it was
   worse than recorded: the file dated from 2026-07-10, never regenerated after
   the 2026-07-15 survey either, and its generator hardcoded a *"pre-cutover
   baseline"* title plus a paragraph claiming the description renderer was
   still pre-cutover. The cutover (`7e303af4`, 05:51) landed **before** that
   file's own last commit (`d0a52d28`, 10:00), so the text was already false
   when written. Generator corrected, file regenerated: dot-EQUAL
   **294/355 (82.8%) → 349/358 (97.5%)**.
2. ~~**The 265 `component` parity rows still date from 2026-07-15.**~~
   **CLOSED 2026-07-31** — re-surveyed, 0 timeouts, 0 errors. 112 of 265 rows
   moved, same benign profile as the usecase drift: **0 `dotEqual` flips, 0
   verdict transitions**, `dotEqual` steady at 262/265 (68 deltas smaller, 23
   larger, 21 path-only). `parity.json` is now uniformly fresh at 358 rows.
3. **SI8** (stdlib package registration — owns reverting these three fixtures
   from inlined sprite declarations to `!include <bootstrap/bootstrap>`) and
   **SI10** (class-engine `measureUsecase` coupling) remain open.
4. No @knowvah/dot-engine finding surfaced during execution, so nothing was filed
   under `docs/graphviz-issues/`.

### Deviations from the brief

- **T1 split a second file.** `scripts/dot-sync-report.ts` was already at 526
  lines and the complexity hook blocks any edit leaving a file over 500, so
  fixture enumeration and canonical freshness moved to
  `scripts/dot-sync-fixtures.ts` — the brief's named push-forward condition,
  and the module name the brief's own test filename already implied.
- **T2 surveyed to a temp `--out`.** `svg-parity-survey.ts` writes the whole
  file from the types it surveyed, so an in-place `usecase` run would have
  deleted the 265 committed `component` rows. The final file is those rows
  verbatim plus the 93 fresh ones.

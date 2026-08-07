# F5-a — G13 deterministic golden regen sweep

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML (Java); the pinned
jar under `oracle/dist/plantuml-oracle.jar` is the numeric oracle for
description-diagram size conformance (`scripts/measure-description-size-
deltas.ts`, currently on track for 346 or 347 of 351 after Batches 1–4).

`kokebo-27-vafi688`'s committed golden (`oracle/goldens/description/
kokebo-27-vafi688/svek-1.dot`) was captured **without**
`-DPLANTUML_DETERMINISTIC_TEXT=true`, so it carries real AWT font metrics
(`b` = 8.8115px wide, 16.4883px line height) instead of the deterministic
width-table metrics (`b` = 7.7875, 14) every other description golden and
our own port use. Regenerating it under the flag reproduces our port's
output bit-for-bit — `plans/s1l-tail-diagnosis/findings/container-cluster.md`
proved this with a controlled single-variable experiment (the flag on vs.
off, same `input.puml`, same jar). **Maintainer-ruled 2026-08-06: not a port
defect** (SYNTHESIS.md §5).

That diagnosis checked only 9 of 351 goldens (8 came back byte-identical
under regen). The maintainer has approved widening the check to all 351 —
this is the **one task in this mission** authorised to regenerate existing
goldens (README stop condition 7 forbids it everywhere else).

## Task

For **every** golden under `oracle/goldens/description/<slug>/`
(351 directories, enumerated by `goldenSlugs()` — read-set below):

1. Regenerate its `svek-*.dot` file(s) by invoking the pinned jar on its
   `input.puml` with `-DPLANTUML_DETERMINISTIC_TEXT=true` and
   `-DPLANTUML_DUMP_DOT=<a fresh per-fixture temp dir>` — the exact
   invocation shape is `runOracle` (read-set below); **copy it, do not
   reinvent it.** One JVM call per fixture, each into its own temp dir —
   do not batch multiple `.puml` files into one `-DPLANTUML_DUMP_DOT` dir,
   because `svek-N.dot` filenames are not slug-qualified and would collide
   across fixtures.
2. Byte-diff the regenerated file(s) against the committed
   `oracle/goldens/description/<slug>/svek-N.dot`. If every pass is
   byte-identical: **leave the golden alone**, move to the next slug. This
   is the expected outcome for the large majority (8/9 in the diagnosed
   sample).
3. If any pass differs, classify before touching anything — **do not
   overwrite on "the diff went away."** Render the fixture through our own
   port (`captureGraphs`, read-set below) and structurally compare
   (`dotInputToStructural` + `compareStructural`, read-set below) against
   **both** the committed golden and the freshly regenerated DOT:
   - **Our port matches the regenerated DOT (structurally equal, size delta
     ≤ `SIZE_CONFORMANCE_TOLERANCE_IN`) but not the committed one** → the
     committed golden was a bad capture. Replace it with the regenerated
     file. Record the slug in the task's completion summary.
   - **Our port matches NEITHER** → **STOP** on that fixture. This is not a
     capture defect — either the pinned jar's `.tgz` moved since the golden
     was captured, or something else changed. Do not touch that golden's
     committed file. Save both diffs (committed-vs-regenerated,
     port-vs-regenerated) to `scripts_scratch/` and flag it by name in the
     completion summary for a human. Continue the sweep on the remaining
     slugs — one unresolved fixture does not block the rest.
4. Report the **total count of goldens replaced** in the completion
   summary, even if it is 1. A count meaningfully larger than 1 is itself a
   finding about how the corpus was captured and must be called out, not
   buried in a file list.

The sweep script itself (the loop, the jar invocation, the diff/classify
logic) is a **temporary tool**, not a deliverable — write it under
`scripts_scratch/` and delete it before finishing, per the
`plans/s1l-tail-diagnosis/batch-1/T1-container-cluster.md` precedent for
this repo. It is not part of the write-set below.

## Write-set — write NOTHING outside these

- `oracle/goldens/description/<slug>/svek-*.dot` for every slug classified
  "bad capture" in step 3 — expected to include at minimum
  `oracle/goldens/description/kokebo-27-vafi688/svek-1.dot`.

**Not in scope:** `src/**` (no port change — G13 is `src/`-disjoint per
SYNTHESIS §1), `oracle/goldens/description/size-backlog.json` (ADR-1),
`tests/oracle/svek-dot.ts` (ADR-8), any `input.puml` (only the oracle
`.dot` output may change, never the fixture source).

## Read-set

- `scripts/oracle-corpus.ts:64-89` (`runOracle`) — the exact jar invocation
  to copy for the per-fixture regen call
- `scripts/measure-description-size-deltas.ts:166-236` (`svekFiles`,
  `captureGraphs`, `comparePasses`, `measureFixture`) — reuse
  `captureGraphs` to get our port's `DotInputGraph[]` and the
  `dotInputToStructural`/`compareStructural` comparison it already wires;
  do not reimplement the render harness (stdlib assets store,
  `WidthTableMeasurer`, `setLayoutInputObserver`)
- `scripts/measure-description-size-deltas.ts:254-260` (`goldenSlugs`) —
  the exact 351-fixture enumeration; iterate this list, not a fresh glob
- `tests/oracle/svek-dot.ts:148` (`parseSvekDot`), `:163`
  (`dotInputToStructural`), `:202` (`SIZE_CONFORMANCE_TOLERANCE_IN = 0.01`),
  `:275` (`compareStructural`)
- `oracle/goldens/description/kokebo-27-vafi688/svek-1.dot` (whole, 6
  lines) and `input.puml` — the one fixture already proven to need
  replacement
- `plans/s1l-tail-diagnosis/findings/container-cluster.md:163-211` — the
  full `kokebo-27-vafi688` record: mechanism, causal chain, ruled-out list
- `plans/s1l-tail-diagnosis/findings/SYNTHESIS.md:32` (G13 table row),
  `:196-199` (§5 ruling: not a divergence, not a port defect)
- `scripts/audit-size-metric-identity.ts:379,402,415` (`falseConformant`
  field) and its header comment (bottleneck-matching method) — needed to
  read the post-sweep quality-gate output correctly

## Architecture decisions binding this task

- **ADR-1** — do not write `oracle/goldens/description/size-backlog.json`.
  Report closed pins in the completion summary; the orchestrator deletes
  them after this batch's gates pass.
- **ADR-8** — the bottleneck metric (`audit-size-metric-identity.ts`) stays
  **audit-only**. Run it as a post-sweep check (below); do not change
  `tests/oracle/svek-dot.ts`'s gate and do not re-base any
  `size-backlog.json` pin as a side effect of this task, even though the
  sweep will show some deltas shrinking to 0.

## Interface contracts

Completion summary (read by the orchestrator, not machine-parsed) must
report, per fixture touched:

```
{ slug: string,
  passes: number,               // svek-N.dot count
  classification: 'unchanged' | 'bad-capture-replaced' | 'unresolved-STOP',
  portMatchesRegenerated: boolean,
  portMatchesCommitted: boolean }
```

plus a summary line: `swept 351, replaced <N>, unresolved <M>`.

## Acceptance criteria

1. **Given** the sweep completes, **when** `git diff --name-only` runs,
   **then** every changed path is under `oracle/goldens/description/` and
   ends in `svek-\d+\.dot`, and `oracle/goldens/description/
   kokebo-27-vafi688/svek-1.dot` is one of them.
2. **Given** a slug whose regenerated DOT is byte-identical to the
   committed one, **when** it is processed, **then** the committed file is
   untouched (verify via `git diff` showing no entry for that slug).
3. **Given** a slug whose regenerated DOT differs from committed **and**
   our port structurally matches the regenerated DOT, **when** it is
   processed, **then** the committed file is replaced with the regenerated
   DOT and the slug appears in the completion summary's `bad-capture-
   replaced` list.
4. **Given** a slug whose regenerated DOT differs from committed **and**
   our port matches neither, **when** it is processed, **then** the
   committed file is left untouched, the slug is reported as
   `unresolved-STOP` with both diffs saved under `scripts_scratch/`, and
   the sweep continues to the remaining slugs rather than aborting.
5. **Given** the full gate set runs after the sweep, **when** compared to
   the pre-sweep baseline, **then** `measure-description-size-deltas.ts`
   reports `widened 0` and the conformant count risen by at least 1 (the
   `kokebo-27-vafi688` closure), and `audit-size-metric-identity.ts`
   reports `falseConformant: 0`.

## Quality bar

```sh
npm test
npm run typecheck
npm run lint
npm run build
npx tsx scripts/measure-description-size-deltas.ts   # widened 0; count RISES
npx tsx scripts/audit-size-metric-identity.ts        # falseConformant: 0
git diff --name-only    # only oracle/goldens/description/**/svek-*.dot
```

Never pipe a gate — capture `$?` directly.

## Observability

N/A — this task changes committed test fixtures, not a runtime code path.
The completion summary IS the observability artifact: a swept-351 count
that does not match 351, or an unresolved list that is silently dropped,
is exactly the failure mode `~/.claude/rules/diagnosis.md`'s "no fix before
a stated mechanism" guards against here in fixture form.

## Rollback

**Reversible-with-migration.** Every replaced golden is committed, so a
`git revert` of this task's commit restores the prior file byte-for-byte —
in that sense it is a plain revert. But the revert also re-opens whatever
pins the orchestrator deleted from `size-backlog.json` in the batch commit
(ADR-1), so reverting this task requires re-adding those pins in the same
revert, not just restoring the `.dot` files. Note this explicitly in the
completion summary so the orchestrator's batch commit does both halves
atomically.

## Boundaries

**Always:** run the three-way classification (committed / regenerated /
our port) before touching any file — never overwrite on "the diff went
away" alone. Use the pinned jar at `oracle/dist/plantuml-oracle.jar`
exactly as `runOracle` invokes it. Use Serena MCP tools for any code
navigation, not the LSP tool.

**Ask first:** any fixture where the regenerated DOT differs from BOTH the
committed golden and our port's output but the difference looks small
enough to "probably just tolerance" — that judgment belongs to a human,
not to this task (see the `unresolved-STOP` branch).

**Never:** overwrite a golden whose regenerated DOT matches the committed
one; touch `size-backlog.json` or `tests/oracle/svek-dot.ts`; touch any
`input.puml`; touch any file under `src/`; run a state-mutating git
command (the orchestrator commits after gates pass); leave the temporary
sweep script under `scripts_scratch/` uncommitted-but-present at task end —
delete it.

## Required rules

Read before relying on: `~/.claude/rules/diagnosis.md` (the `unresolved-
STOP` branch is diagnosis-mode discipline — an empty ruled-out list on a
non-trivial mismatch means you guessed) and `~/.claude/rules/research-
sources.md` (verify the jar's pin — `oracle/dist/plantuml-oracle.jar` —
has not moved since `container-cluster.md`'s regen before trusting a
byte-identical result as proof of nothing having changed).

## Commit

`test(F5-a): regen-sweep description goldens under determinism flag`

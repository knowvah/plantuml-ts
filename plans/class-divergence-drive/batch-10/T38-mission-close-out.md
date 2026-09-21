# T38 — mission close-out

**Agent:** orchestrator · **Depends on:** T35, T36, T37 (and, by chain,
every prior batch). This task PERFORMS batch 10's close procedure and
EXTENDS it with the mission-wide close-out — `batch-10/close.md` is
superseded by this file; do not run it separately. **Do NOT merge**
`feat/class-divergence-drive` — the merge is the maintainer's decision.

## Context

Verify, line by line, the exit bar stated in `../README.md`: `parity-
class.json` `diverged` = 0 except the 7 ELK slugs declared in
`oracle/accepted-divergences.json`; every remaining `structural-match`
row names its mechanism in `fixtures.md`; every survey-conformant AND
census-0-diff fixture pinned in `ratchet.json`; `class-dot-parity.test
.ts` still 710/711; description/state/sequence/activity/json/yaml/hcl
suites unmoved OR every mover journaled; zero unexplained rises at this
final re-pin (D11); all four gates green with JSON-reporter count =
on-disk count. This is a verification-and-recording task — it does not
introduce new fixes; any exit-bar gap it finds is journaled, not
silently patched.

## Task

1. Batch 10's own close procedure first (`batch-9/close.md` is the
   template — mirror its 13 steps against `measurements/b9.json` ->
   `measurements/b10.json`, `oracle/goldens/svg-class/ratchet.json`,
   `tests/oracle/svg-conformance/parity-class.json`, `fixtures.md`'s
   `after B10` column, and the batch-10 checkbox in `README.md`). Do
   not skip this step because T38 "is" the close-out — it produces
   `measurements/b10.json`, which `measurements/final.json` below
   depends on.
2. Verify the exit bar clause by clause against the CURRENT tree (not
   from memory of what earlier batches claimed): re-run `npm run
   svg:survey class`, `npx jiti scripts/svg-conformance-census.ts
   class`, `npx jiti scripts/dot-sync-report.ts class`, and the other
   five engines' DOT-parity/survey commands. Journal any exit-bar
   clause NOT met — do not mark the mission done if one fails.
3. Copy `measurements/b10.json` to `measurements/final.json` (the
   mission's final measurement snapshot; do not regenerate a separate
   run — reuse the one the close procedure already produced, so both
   files agree byte-for-byte on this run).
4. Verify `oracle/accepted-divergences.json` carries BOTH: the 7 ELK
   entries (written by T0, batch 0 — confirm they still exist and
   `match.id` still resolves) and the D9 nested-diagram payload entry
   (batch 7, T27's embedded-`{{ }}` byte divergence). Add whichever is
   missing — per decisions.md's push-forward list, these two are the
   ONLY entries this file may ever carry; anything else found here is
   stop 3, halt and journal, do not add it.
5. `DIVERGENCES.md`: confirm every divergence named across all ten
   batches has an entry (T32's error-page version-identity string, D9's
   embedded-diagram payload, the 7 ELK slugs, any T37 filing that
   resolved to "permanent divergence" rather than "follow-on mission").
   Add any missing line; do not restate ones already present.
6. `planning/next-missions.md`: file, under one new `class-divergence-
   drive` section (mirror the house style — see `unknown-bucket-
   routing-repair`'s entry for the format): the `oracle/dist/
   plantuml-oracle.jar` symlink repoint (D12, flagged since T0), every
   T37 singleton FILED rather than fixed, any T36 corpus-reach residue
   left after its 53-fixture measurement, T31's `Namespace.tags`
   follow-up if T31 deferred it, and any `groupInheritance`/E11/E12/E13/
   E9-phantom-leaf items still open from `diagnosis/A2b-entity-
   groups.md` that no batch in this brief's D2 order actually covered
   (cross-check the diagnosis reports against `fixtures.md`'s
   `mechanisms` column — anything with zero batch coverage is this
   mission's own gap, name it honestly).
7. `planning/mission-index.md`: append one new row. Determine the next
   free `SI<N>` id by scanning the file for the highest existing `| SIn
   |` row AT EXECUTION TIME (do not trust a number cited in an older
   document — this file accretes between missions) — `status: done`,
   `blocked-by: —`, exit bar = this mission's own (quoted above), one
   line summarizing the before/after survey counts and branch name.
8. `npm run parity:dashboard` (regenerates `docs/parity-report.md`);
   confirm the class row reflects the final counts.
9. Write the close-out section into `README.md`: before/after counts
   per batch (source each from `measurements/b0.json` through
   `b10.json` — do not hand-compute a batch's delta if its own file has
   it), the final exit-bar verdict (met / met-with-named-exceptions),
   and a short pointer to `decision-journal.md` for every stop/halt this
   mission hit. Tick every remaining batch checkbox in the batches
   table.
10. JSON-reporter collected test count = on-disk test-file count (stop
    7) — check this LAST, after every other file write, since new test
    files may have landed in steps 1-9's own fixes (there should be
    none; T38 is verification, not implementation).
11. Commit `docs(cdd-T38): close class-divergence-drive — <counts>`
    (one commit for this task; batch 10's own close commit from step 1
    is separate and precedes it). Do not push, do not merge, do not
    open a PR — report the branch name and final counts to the
    maintainer instead.

## Read-set

`../README.md` (exit bar, stop conditions, whole); `../decisions.md`
(whole, especially D9-D12 and push-forward); `../fixtures.md` (whole —
this is the final pass over every row); `../diagnosis/*.md` (cross-
check coverage in step 6, do not re-read line-by-line, use it as an
index); `../measurements/b0.json` through `b9.json`;
`../decision-journal.md` (whole — every stop/halt this mission hit);
`planning/next-missions.md`'s existing entries (for the filing format);
`planning/mission-index.md`'s header + the highest `SIn` row (for the
row format).

## Write-set

`plans/class-divergence-drive/README.md`, `plans/class-divergence-
drive/fixtures.md` (`after B10` column + any remaining blank column),
`plans/class-divergence-drive/measurements/b10.json`,
`plans/class-divergence-drive/measurements/final.json`,
`oracle/goldens/svg-class/ratchet.json` + new `<slug>/golden.svg`
files, `tests/oracle/svg-conformance/parity-class.json`,
`DIVERGENCES.md`, `oracle/accepted-divergences.json` (only if a D10/D9
entry is missing), `planning/next-missions.md`, `planning/
mission-index.md`, `docs/parity-report.md`.

## Acceptance criteria

- Given `parity-class.json`, then `diverged` = 0 minus the 7 declared
  ELK slugs, and every `structural-match` row has a named mechanism in
  `fixtures.md`, OR the close-out documents exactly which clause is
  unmet and why (this task does not fabricate a passing bar)
- Given `oracle/accepted-divergences.json`, then it has EXACTLY the 7
  ELK entries plus the one D9 payload entry — nothing else
- Given `class-dot-parity.test.ts`, then it reads 710/711
- Given every other engine's suite, then it is unmoved from `measurements
  /b9.json`'s snapshot, or every mover has a `decision-journal.md` row
- Given `planning/mission-index.md`, then exactly one new row exists,
  with an `SIn` id higher than every pre-existing row
- Given the final commit, then `git log` shows no merge into `main` and
  no push occurred

## Observability

N/A — no new observable operations; this is a measurement/recording
task.

## Rollback

Reversible — revert the close-out commit(s); the ratchet and pins are
committed with the code, so reverting restores the prior pin state
exactly. The mission branch itself is untouched (not merged).

## Quality bar

Same four gates as every task (full suite), plus every close-specific
command in step 1/2/8 exiting 0 before either commit.

## Boundaries

Always: verify the exit bar against a FRESH run, never against a prior
batch's cached claim. Ask first: any stop condition in `../README.md`;
anything that would touch the pinned oracle (jar symlink, `pin.json`,
cache `--rebuild` — D12/stop 9, repoint is a FILING, not an action, per
step 6). Never: merge, push, or open a PR; add an `accepted-
divergences.json` entry beyond the two named in step 4 (stop 3); mark
the exit bar met when a clause is not.

## Commit

`docs(cdd-T38): close class-divergence-drive — <before>/<after> counts`

Body: before/after survey counts for the WHOLE mission (not just batch
10), the final DOT-parity fraction, the ratchet pin count, and a
one-line pointer to any exit-bar clause left unmet with its
`decision-journal.md` row.

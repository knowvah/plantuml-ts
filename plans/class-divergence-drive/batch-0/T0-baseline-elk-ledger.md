# T0 — baseline ledger + ELK divergence entries

**Agent:** debugger · **Depends on:** T0b

## Context

`diagnosis/A6-oracle.md` §1 traced 7 of the 261 diverged class fixtures to
`!pragma layout elk` — `DIVERGENCES.md`'s existing "not supported" ruling
(2026-08-09) — and found no `svek-N.dot` cache entry for any of them,
confirming the jar never shelled out to graphviz for these. §6 found the
oracle jar symlink (`oracle/dist/plantuml-oracle.jar` →
`plantuml-1.2026.8beta1.jar`) is newer than `oracle/pin.json`'s pinned
`1.2026.7beta11` — a drift risk this task records, per D12, but does not
fix (repointing is T38's job). The report is a lead: re-open
`oracle/accepted-divergences.json`'s schema and `scripts/
svg-parity-dashboard.ts:24`'s ledger join yourself before writing entries —
don't copy the report's JSON shape blind.

## Task

1. `npm run svg:survey class` (fresh baseline at commit `ac40492c`); record
   the printed conformant/structural-match/diverged counts — must read
   412/50/261 (README's stated baseline) or the mission's premise is stale;
   a mismatch is stop 3, halt and journal.
2. `npx jiti scripts/svg-conformance-census.ts class`; record the 0-diff
   count (expect 414, per `docs/parity-report.md`'s current row).
3. Count `oracle/goldens/svg-class/ratchet.json`'s `fixtures` array length
   (expect 314) and its golden directory count under
   `oracle/goldens/svg-class/` (expect 318 — 4 more dirs than pins is
   expected drift; name which 4 if this task has time, else journal as an
   open question for T38, don't fix here).
4. `npx jiti scripts/dot-sync-report.ts class`; record the DOT-equal
   fraction (expect 710/711).
5. `readlink oracle/dist/plantuml-oracle.jar` and `cat oracle/pin.json |
   grep plantumlVersion`; journal both verbatim (D12 fact, no action).
6. Write 7 entries to `oracle/accepted-divergences.json`'s `entries` array
   (currently `[]`) — `match.id: "svg-class/<slug>"` for each of
   `cadutu-02-lazu601, cirojo-62-dubo306, gokoru-18-daba136,
   lagudi-03-rucu383, rutefe-49-xeju709, tegefa-14-koxo759,
   temofi-63-vega763`; `scope`: `"svg-conformance class ledger (ELK layout —
   unsupported engine, DIVERGENCES.md)"`; `acceptedAt: "2026-09-21"`;
   `acceptedBy: "maintainer"`; `reason` citing the DIVERGENCES.md ruling and
   "no svek-N.dot dump for this slug" (verify the dump is in fact absent for
   all 7 before writing the reason — `ls test-results/dot-cache/class/
   <slug>/svek-*.dot` for each).
7. `DIVERGENCES.md`: under the existing "`!pragma layout elk` — not
   supported" entry, add one line cross-referencing
   `oracle/accepted-divergences.json`'s 7 new entries (don't restate the
   ruling — link to it).
8. `npm run parity:dashboard`; confirm `docs/parity-report.md`'s class row
   is otherwise unchanged (same corpus/oracle/DOT-equal/survey/census/
   ratchet numbers as before this task) — a dashboard consumer joining the
   ledger should not change any OTHER column.
9. `npx tsx ../tools/render-all.mts measurements/base.json` (T0b's tool);
   confirm the row count is 723 and every row's `verdict` matches
   `tests/oracle/svg-conformance/parity-class.json`'s verdict for that slug
   (a mismatch here means T0b's `renderSync` call diverged from the
   survey's — stop and fix T0b, don't paper over it in this task).
10. Journal all six measurements (survey counts, census count, ratchet pin
    count + dir count, DOT fraction, jar symlink target, pin.json version)
    as one dated row in `decision-journal.md`.

## Read-set

`diagnosis/A6-oracle.md` §1 (whole), §6 (whole); `oracle/
accepted-divergences.json` (whole, for the schema — `entries` vs the
legacy `retired` array); `scripts/svg-parity-dashboard.ts:1-40`
(`LedgerEntry`/`LedgerFile` types, the join); `DIVERGENCES.md:95-115` (the
existing ELK entry, exact wording); `oracle/pin.json` (whole, small);
`decisions.md` D10, D12.

## Write-set

`oracle/accepted-divergences.json`, `DIVERGENCES.md`, `docs/
parity-report.md` (regenerated, not hand-edited),
`plans/class-divergence-drive/measurements/base.json`,
`plans/class-divergence-drive/decision-journal.md`, `.agent-notes/cdd-T0.md`.

## Interface out (consumed by every later batch's close.md)

`measurements/base.json`: `RenderAllRow[]` (T0b's shape) — the `b0`
reference every `pin-diff.mts a.json base.json` call in `close.md` diffs
against.

## Acceptance criteria

- Given `docs/parity-report.md` after this task, then the class row's
  "Divergence ledger" section lists exactly 7 entries and every other class
  column is byte-identical to before the task
- Given `oracle/accepted-divergences.json`, then `entries.length === 7` and
  every `match.id` is `svg-class/<slug>` for the 7 named slugs, none
  touching the pre-existing `retired` array
- Given `measurements/base.json`, then it has 723 rows and every row's
  `verdict` equals `parity-class.json`'s verdict for that slug
- Given the journal, then it names all six baseline facts (survey, census,
  ratchet pins+dirs, DOT fraction, jar symlink, pin.json version) in one row

## Observability

N/A — no new observable operation; this is a documentation/ledger task.

## Rollback

Reversible — revert the task's commit; `oracle/accepted-divergences.json`
and `DIVERGENCES.md` return to their prior state, no data migration.

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build` all green.
`npm run svg:survey class` and `npx jiti scripts/svg-conformance-census.ts
class` re-run clean after the ledger write (verdicts unaffected — the
ledger is read-only accounting, not a gate). `git diff --name-only
HEAD~1` = write-set only.

## Boundaries

Always: verify the `svek-N.dot` absence for each of the 7 slugs before
writing its `reason` (don't copy A6's claim uninspected). Ask first: fixing
the 4 extra ratchet golden dirs found in step 3 (out of this task's
write-set — journal it, let T38 own it). Never: add an
`accepted-divergences.json` entry for anything other than these 7 slugs
(D-push-5); rebuild the DOT cache or repoint the oracle symlink (D12).

## Commit

`docs(cdd-T0): declare the 7 ELK divergences and record the baseline`

Body: why the ledger only (D10 — declared, not special-cased in
survey/census code); the baseline numbers this batch's close and every
later batch's close diff against.

# T4 — Close-out

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/state-anchor-clip-retire`. Read this brief's `README.md`, `decisions.md`
and `decision-journal.md` in full — the journal is the authoritative record and
outranks any task file it postdates. Mirror SI31's close-out shape
(`plans/state-residual-fix-batch/README.md`, "Close-out" section) and its
`planning/mission-index.md` row.

## Task
1. **Byte-diff against `tests/fixtures/si32-harness-baseline.jsonl`** — T0's
   TRACKED copy. This is the whole reason it exists: SI31 could not do this,
   because both its baselines were gitignored and re-pinned every batch, so its
   mission-wide delta had to be reconstructed from a journal chain. Report rows
   that went exact, confirm `0 appeared or grew` across the mission, and give
   the final summary against T0's `273/2660/2576/47/37/0/39`.
2. Run `render-manifest` + `manifest-diff.py`; confirm every mover is on
   `expected-moves.txt` and list any that is not.
3. Append a "Close-out (2026-08-XX)" section to this brief's `README.md`:
   whether the divergence is gone; `fovafu-44`'s rows before/after; the full
   mover list with directions against the jar; any away-from-jar mover and its
   ruling; parity counts; coverage; `npm test` wall-clock vs the 60.3 s
   ceiling; flags; follow-ups.
4. `planning/mission-index.md`: an SI32 row after SI31, mirroring its columns,
   with per-task commit ids from `git log`.
5. `planning/next-missions.md` §4: mark the divergence-retirement item DONE
   with a pointer, and carry forward T3's two filings.
6. Tick every batch in `README.md`.
7. **State plainly that this mission changed emitted SVG**, and how widely — a
   downstream consumer pinning golden SVGs will see diffs. Name the fixture
   count.

Read-only git only; no commits.

## Write-set
As in the batch overview.

## Read-set
- This brief's `README.md`, `decisions.md`, `decision-journal.md`
- `tests/fixtures/si32-harness-baseline.jsonl` — T0's tracked pin
- `plans/state-residual-fix-batch/README.md` — close-out precedent
- `planning/mission-index.md` rows SI30, SI31 — column shape

## Acceptance
- Given T0's tracked baseline, when byte-diffed against a fresh run, then the
  mission-wide delta is reported directly — not reconstructed from the journal.
- Given the register files, then SI32 is recorded with per-task commit ids.
- Given the close-out, then every claim about a fixture moving carries its
  direction against the jar.
- Given a mover that went away from the jar, then its ruling is restated.

## Observability
N/A — docs and register rows.

## Rollback
Reversible. Docs only.

## Quality bar
The four gates run by the orchestrator on a docs-only tree. Do not restate a
number from a task report without re-measuring it — SI31's close-out caught an
orchestrator miscount that way.

## Report (<=400 tokens)
Rows exact vs remaining; whether the divergence is gone; any unaccounted mover;
anything the orchestrator must fix before merge.

# T2 — Golden regeneration script

**Agent:** tooling-engineer · **Depends on:** — · **Commit:** `feat(T2): add svg golden rebaseline script`

## Context

The 450 committed `oracle/goldens/svg-*/**/golden.svg` files are the
**jar's** SVG output, byte-compared against ours by five ratchet suites.
When the oracle pin advances they must be re-captured. Today that exists
only as an ad-hoc scratch script; ADR-4 makes it a committed, repeatable
tool so the next pin advance gets the same measurement for free.

This script reads the **jar**, not our renderer — it is completely
independent of `src/` and of every other task except as T9's prerequisite.

## Read-set

- `oracle/capture.sh` — the canonical single-fixture invocation
  (`java -DPLANTUML_DETERMINISTIC_TEXT=true -jar <jar> -tsvg -o <out> <puml>`)
- `oracle/build-oracle.sh` — the drift guard (reads `oracle/pin.json`,
  uses `seamCommitCount`, FAILS on drift; override is `ORACLE_ALLOW_DRIFT=1`)
- `scripts/measure-description-size-deltas.ts` — house style for a
  reporting script: one JSON line per fixture, a summary line, meaningful
  exit code
- `oracle/goldens/svg-description/README.md` — the golden layout
  (`<type>/<slug>/in.puml` + `golden.svg`)

## Write-set

- `scripts/rebaseline-svg-goldens.ts` (create)
- `tests/unit/scripts/rebaseline-svg-goldens.test.ts` (create)

## Task

A `tsx`-run Node script (this is `scripts/`, so Node APIs are fine — the
browser-safe rule applies to `src/` only) that:

1. Walks every `oracle/goldens/svg-*/**/in.puml`.
2. Captures each with the pinned jar into a scratch directory, using the
   exact deterministic-text invocation `oracle/capture.sh` uses.
3. Byte-compares the capture against the sibling `golden.svg`.
4. Reports one line per changed fixture plus a summary:
   `SAME=<n> CHANGED=<n> FAILED=<n>`.
5. Writes **only** when `--write` is passed. Default is report-only.
6. Exits non-zero if any fixture FAILED to produce an SVG, so it cannot
   silently under-capture.

**Refuse to write if the oracle drift guard fails.** A golden captured
from a drifted jar is a silently wrong oracle — this is the exact defect
class that produced the mission this one follows. Shell out to the guard
or replicate its `pin.json` check; do not skip it.

Known state at authoring time (use to sanity-check your run, not to
hardcode): `SAME=0 CHANGED=445 FAILED=1`. The one failure is
`svg-class/class-actor-bare-no-allowmixing`, which emits no SVG from the
jar at all — T14 diagnoses it. Report it, do not special-case it.

Extract the comparison and summary logic into pure functions so the unit
test does not need a JVM.

## Interface contract (consumed by T9)

CLI: `npx tsx scripts/rebaseline-svg-goldens.ts [--write]`.
Exit 0 = all fixtures captured; non-zero = at least one FAILED or the
drift guard refused. Summary line format: `SAME=<n> CHANGED=<n> FAILED=<n>`.

## Acceptance criteria

1. Given no `--write`, when run, then it prints the summary and
   `git status` reports no modified `golden.svg`.
2. Given `--write`, when run, then each `golden.svg` equals the jar's
   capture for its `in.puml`.
3. Given the drift guard fails, when run with `--write`, then it writes
   nothing and exits non-zero.
4. Given a fixture whose jar run emits no SVG, when run, then it is
   counted in `FAILED` and named in the output, not skipped silently.

## Observability

The script **is** the observability for this mission's SLI (golden
conformance). Its `SAME/CHANGED/FAILED` summary is the measurement the
next pin advance will read. No telemetry beyond stdout.

## Rollback

**Reversible** — a new script with no callers until T9.

## Quality bar

- All four gates pass; never pipe a gate.
- The unit test must not require a JVM: test the pure comparison/summary
  functions, not the capture.
- ~5–15 min of work. If the drift-guard integration balloons, shell out to
  `oracle/build-oracle.sh`'s check rather than reimplementing it.

## Boundaries

- **Always:** default to report-only; honor the drift guard.
- **Never:** modify any `golden.svg` in this task (T9 does the write); run
  any `git` command; touch `src/`.

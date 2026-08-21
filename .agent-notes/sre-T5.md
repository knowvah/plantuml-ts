# SRE T5 — stdlib-build-race close-out

## Observation: repro 5/5 is proof of the skip, not the lock

- **Context**: task file called the guarded repro's before/after contrast
  the mission's "central evidence." The decision journal (2026-08-21,
  "T4's acceptance clause ... is ALREADY SATISFIED") already corrected
  this before T5 began.
- **Finding**: the repro's writer loops `buildStdlibPackages()` against
  unchanged inputs. From the second iteration on, T2's content-hash skip
  alone makes every call a no-op — confirmed again this session: every
  one of the 5 runs logged `skip -- generated/ content hash already
  matches` / `skip -- sprites already match` for all 5 targets, zero
  `rmSync` lines. The repro went GREEN after T2 landed, before any lock
  existed. It cannot discriminate "lock present" from "lock absent."
- **Impact**: close-out cites T4's three-concurrent-real-builder test
  (one rebuild, two wait+re-check+skip, zero `rmSync`, no lock left) and
  the stale-recovery timings (dead-PID 421ms, corrupt-lock 2473ms) as the
  lock's actual evidence, per the corrected framing. Re-running those
  wasn't required by the task and re-running them would not add new
  information beyond confirming the same mechanism twice — cited instead
  of re-derived.
- **Confidence**: High — directly observed in this session's 5 raw run
  logs and cross-checked against the journal's own correction.

## Observation: Spotlight reindex confound reproduced live during close-out

- **Context**: measuring `npm test` wall-clock immediately after the 5
  repro runs.
- **Finding**: `corespotlightd` spiked to 175.8% within ~1 minute of the
  repro runs finishing (their `rmSync`/rewrite churn on
  `packages/*/generated/` and `.tmp` sprite dirs triggers a Spotlight
  reindex, matching the pattern already documented by T0–T4). Took ~32
  polling iterations (~160s) at 5s intervals to settle back to 0.0%
  before the `npm test` number could be trusted.
- **Impact**: any future close-out or measurement immediately following a
  run of this repro test should expect the same delay and poll before
  measuring, not just check load1 once.
- **Confidence**: High — directly observed (`ps` snapshots quoted in the
  close-out).

## No `src/` change

Confirmed via `git diff --name-only main..HEAD -- src/` (empty) and
`git status --short` (empty) at the end of this task. No lock file or
stray process left behind (`/var/folders` scan, `ps aux` scan, both
empty).

# Decision journal — A5 json family

Appended during execution. Every non-trivial judgment call gets a row: if a
reasonable developer might have chosen differently, log it.

Also log, per `~/.claude/rules/autonomous-execution.md`:
- quality-gate results per batch
- any task that turned out simpler or larger than scoped, with why
- any brief-authored premise that execution **falsified** — this repo has a
  standing convention of amending rather than rewriting, so record the
  correction next to the original claim rather than editing the claim away

| # | Batch/Task | Decision or finding | Why | Follow-up |
|---|-----------|--------------------|-----|-----------|
| | | | | |

## Premises this brief asserts that execution should test

Listed up front so a falsification is recognised as a finding rather than
absorbed as noise. Each was measured or read this session, but none is beyond
question.

1. **ADR-1: upstream lays json out TB-with-swapped-dims and transposes.** Read
   from `SmetanaForJson.java:236-244` + `Mirror.java`. T5 tests whether
   re-mirroring it actually moves geometry. A NO-GO is a stop condition, not a
   failure of the mission.
2. **json bypasses the G1d document shell.** Measured through production
   `renderSync`, which is NOT the census path — the true baseline (T3) may
   differ. The six missing root attributes and the 13-child `<defs>` are the
   specific claims.
3. **The corpus is 50 + 39 + 3.** From `grep -rl` over both pdiff corpora. T2
   should report the counts it actually captures.
4. **yaml and hcl have no layout of their own.** From their `index.ts` routing
   to `layoutJson`. If either turns out to diverge, Batch 3's blast radius
   changes.
5. **`src/core/graph-layout.ts` cannot be edited.** Its three pre-existing
   complexity violations block the hook. Verified this session when a one-line
   import change was rejected.

## Standing hazards (from prior missions — do not rediscover)

- **`compare.ts` stops recursing on a `childCount` mismatch.** A diff count on a
  structurally-divergent fixture is a floor, not a total. This misled D14.
- **Never pipe a gate.** `tail`'s exit code masks vitest's. Capture rc directly.
- **Cold tree ×2 before merge.** Warm gitignored assets hide worker races.
- **A grep used to SIZE work must cover the whole tree.** Two prior briefs
  carried falsified premises because planning greps were scoped too narrowly.
- **"Field unread" ≠ "feature unimplemented."** Another channel may carry the
  value.
- **An identical delta across fixtures = ONE shared cause.** This has held every
  time it has been tested in this repo.
- **Verify a subagent's load-bearing claim before acting on it.** Three had to
  be corrected against the code in a single prior mission.

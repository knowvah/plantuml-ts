# T0a — branch, brief, b0 measurement

Agent: orchestrator (no worktree). Commit:
`chore(gep-T0a): branch, brief, tools and the b0 reference`.

## Steps
1. `git checkout -b feat/gantt-engine-port 1be33f054` (main must be at
   `1be33f054`; if main moved, stop and ask).
2. Copy `plans/gantt-engine-port/settings.autonomous.json` to
   `.claude/settings.autonomous.json` (gitignored). Verify each tool in `$M`
   and `$T` parses (`bash -n`, `node --check`).
3. `uptime` < 8, then `LOAD_MAX=8 SVG_PARITY_TIMEOUT_MS=900000
   SVG_PARITY_CONCURRENCY=3 bash $M/chain.sh b0-eng` (28 engines). `node
   $T/verdict-diff.mjs $M/b0-eng $M/b0-eng` → 0 movers; gantt b0 must read 1 /
   0 / 254 / 0 errored (10 jar error pages) — else journal the difference.
4. `bash $M/gates.sh b0`: collected = on-disk, 0 failed, three `exit 0`.
5. Commit the brief, b0 measurement and gate logs with explicit paths, plus
   the carried-over `.agent-notes/lad-execution.md` edit (PR #92 CodeQL note,
   uncommitted on main because main needs signed PR merges).
   Journal row 1: base sha, chain window and load, gate counts.

## Acceptance
- Given `b0-eng`, when diffed against itself, then 28 engines and 0 movers.
- Given `gates.sh b0`, then collected = on-disk and 0 failed.

Observability: N/A. Rollback: Reversible (delete the branch).

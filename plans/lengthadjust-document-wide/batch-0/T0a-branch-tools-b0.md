# T0a — branch, brief, tools, b0 measurement

Agent: orchestrator (no worktree). Commit:
`chore(lad-T0a): branch, brief, tools and the b0 reference`.

## Steps
1. `git checkout -b feat/lengthadjust-document-wide bf18ede54` (main must be
   at `bf18ede54`; if main moved, stop and ask — D7 base).
2. Copy `plans/lengthadjust-document-wide/settings.autonomous.json` to
   `.claude/settings.autonomous.json` (gitignored). The tools are already in
   place from planning: `$M/{chain.sh,gates.sh,mkwt.sh,merge-one.sh}`,
   `$T/verdict-diff.mjs`. Verify each runs its usage line.
3. `uptime` < 8, then `LOAD_MAX=8 SVG_PARITY_TIMEOUT_MS=900000
   SVG_PARITY_CONCURRENCY=3 bash $M/chain.sh b0-eng` (28 engines, ~12 min).
   `node $T/verdict-diff.mjs $M/b0-eng $M/b0-eng` must print 0 movers.
4. `bash $M/gates.sh b0`: collected = on-disk, 0 failed, three `exit 0`.
5. Commit the brief, the b0 measurement and the gate logs with explicit paths
   (never `git add plans/` while a chain writes). Journal row 1: base sha,
   chain window and load, gate counts.

## Write-set
`plans/lengthadjust-document-wide/**` (brief, `measurements/b0-*`,
`measurements/b0-eng/`), `.claude/settings.autonomous.json`.

## Acceptance
- Given `b0-eng`, when diffed against itself, then 28 engines and 0 movers.
- Given `gates.sh b0`, then collected = on-disk and 0 failed.
- Given `git log`, then the branch's first commit is the brief on `bf18ede54`.

Observability: N/A. Rollback: Reversible (delete the branch).

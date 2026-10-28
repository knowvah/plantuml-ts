# T2a — fix the hidden footer loss under top chrome (D2)

Agent: `typescript-pro` (sonnet), worktree `gdd-T2a`. Commit: `fix(core): …`
or `fix(gantt): …` per the origin, `(T2a)`. Read
[../task-contract.md](../task-contract.md), then
`plans/gantt-divergence-drive/diagnosis/xikovo.md` (T1b) in full.

## Task
Apply the artifact's fix at its origin and nowhere else. Mirror the Java the
artifact cites (`DiagramChromeFactory.java:363-420` stacks chrome on
`original.calculateDimension`; `TextBlockExporter.java:159-209`); no
gantt-only branch in a core file (D2); no change to the body geometry.

## Tests (first)
A unit test beside the origin's existing test file: a fragment whose declared
height exceeds its ink extent keeps its declared height under a title and
under a header (cite the Java line the artifact names); a caption case stays
unchanged. If the origin is gantt `index.ts`, the test lives in
`tests/unit/gantt/`.

## Write-set
The artifact's proposed write-set, as journaled by the orchestrator before
this task started (listed in the task prompt), plus its tests.

## Acceptance
- Given `npx tsx $T/diff-one.mts xikovo-87-rosu902`, then 0 diffs and the canvas is 472×90.
- Given `title-hide-footbox`, `header-hide-footbox`, `caption-hide-footbox`, then 0 diffs each (report before/after for all three).
- Given `npx vitest run tests/oracle/svg-conformance --maxWorkers=2 --coverage.enabled=false`, then green (every engine's golden ratchet); report any mover by slug.
- Given typecheck, eslint, prettier, then clean.

Observability: N/A. Rollback: Reversible.

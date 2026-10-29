# T2a — json/yaml title chrome offset fix (D6; only if T1c says PORT-CONTROLLED)

Agent: `typescript-pro` (sonnet, effort high), worktree `ddc-T2a`. Commit:
`fix(json): <mechanism from diagnosis/title-chrome.md> (T2a)` (scope `core`
if the origin is core). Read [../task-contract.md](../task-contract.md) and
`diagnosis/title-chrome.md` first — the artifact IS the spec: fix the
mechanism at its origin, nothing downstream.

## Rules specific to this task
- Write-set = the artifact's write-set (≤ 3 files) + their tests, copied
  into the journal by the orchestrator before you start. Anything else is
  stop 1.
- A `src/core/` edit must mirror the Java for EVERY engine (no json-only
  branch, stop 14) and keeps the d.ts byte-identical (stop 6, plugin seam
  exempt). Run `npx vitest run tests/oracle/svg-conformance --maxWorkers=2
  --coverage.enabled=false` (every golden ratchet) and list any mover by
  slug — the orchestrator's chain decides.
- Tests first, cited to the jar lines the artifact names.

## Acceptance
- Given the artifact's reproduction fixture(s) (T1e authored `title`/`caption`/`header-footer-legend` rows), when `diff-one.mts --structural` runs, then the chrome diffs the artifact lists are gone and no new diff appears.
- Given every pinned json/yaml/hcl golden, then byte-equal; given every other engine's ratchet, then green or the mover is named with its mechanism.

Observability: N/A. Rollback: Reversible.

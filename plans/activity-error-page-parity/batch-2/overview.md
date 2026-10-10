# Batch 2 — verdict + docs (parallel, after T1a and T1b merged)

Both agents in their own worktrees, prompt = `common-rules.md` + task file.
T2a consumes T1a's record and T1b's observer (both merged at the batch-1 close).
Close: `close-procedure.md`; the orchestrator then re-surveys every engine —
this is the batch where error rows flip (stop 6 applies per bucket).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T2a | Survey error verdict + dashboard column (D7) | typescript-pro (sonnet) | `scripts/svg-parity-survey.ts`, `scripts/parity-dashboard-inputs.ts`, `scripts/parity-dashboard-matrix.ts`, `tests/unit/scripts/aepp-T2a-error-verdict.test.ts`, `tests/unit/scripts/parity-dashboard.test.ts` | T1a, T1b | [ ] |
| T2b | Write the rule into the docs (D7) | technical-writer (sonnet) | `CLAUDE.md`, `docs/svg-conformance.md`, `DIVERGENCES.md` | T1a | [ ] |

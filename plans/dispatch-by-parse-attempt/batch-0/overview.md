# Batch 0 — build the instrument

One task, alone, before any behaviour changes. SLI 2 (refusal coverage) has no
instrument today, and it is the metric [D7](../decisions.md#d7) gates on. Built
after refusal lands, it would report a number with nothing to compare it to.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T0 | refusal-coverage gate + baseline | test-automator | `tests/oracle/svg-conformance/refusal-coverage.test.ts`, its baseline JSON | — | [x] |

**Gate at close:** all four quality gates, plus the new gate reporting a
baseline of 0 our-error/jar-rendered fixtures.

**Closed 2026-08-24** (`1aec6731` -> this branch). All four quality gates
green. The gate reports **1** our-error/jar-rendered fixture, not 0:
`dot-cache sequence/nuvoja-46-dezu541` (`!includedef`, stopped in the
preprocessor at `IncludeExecutor.ts:127`, out of scope by stop condition 10).
Pinned as an honest `weErrored: true, status: "ok"` reading rather than a
`known-gap` — nothing has gapped yet, because no engine can refuse anything at
this commit. See `decision-journal.md` for the full finding.

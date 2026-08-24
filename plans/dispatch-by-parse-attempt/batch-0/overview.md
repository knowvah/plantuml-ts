# Batch 0 — build the instrument

One task, alone, before any behaviour changes. SLI 2 (refusal coverage) has no
instrument today, and it is the metric [D7](../decisions.md#d7) gates on. Built
after refusal lands, it would report a number with nothing to compare it to.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T0 | refusal-coverage gate + baseline | test-automator | `tests/oracle/svg-conformance/refusal-coverage.test.ts`, its baseline JSON | — | [ ] |

**Gate at close:** all four quality gates, plus the new gate reporting a
baseline of 0 our-error/jar-rendered fixtures.

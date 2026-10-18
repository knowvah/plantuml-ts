# T3b — xenusu: edge label TextBlockMarged UEmpty in SvekEdge.ts (item 33)

Prepend [../task-preamble.md](../task-preamble.md). Mission checkout. Depends on T3. Authorized by D5
amendment 2 (user ruling 2026-10-18).

## Context
xenusu is 0/2 after T3: `svg/@width` and `@viewBox[2]` are 354 in the jar, 353 in ours. T3's report
(`measurements/T3-report.md`, "The width") carries the diagnosis: the jar's edge label is
`TextBlockUtils.withMargin(block, marginLabel, marginLabel)` (`SvekEdge.java:372-373`), a `TextBlockMarged`
whose `drawU` first draws `UEmpty.create(dim)` over text + 2×margin (`TextBlockMarged.java:81-87`), which
`LimitFinder#drawEmpty` folds. `src/core/svek/SvekEdge.ts#drawLabelBlock` (:330-336) draws no UEmpty. A
verified patch is at `/private/tmp/claude-501/gtc-T3/svekedge-uempty.patch` (read it; do not apply blindly:
check self-loop margin and multi-line labels against the Java).

## Task
Failing test first (expected widths from jar oracles, e.g. T3's probes under `/private/tmp/claude-501/gtc-T3/`
or new ones via `scripts/oracle-render.sh`), then port the UEmpty at its origin, citing the Java.

## Write-set
`src/core/svek/SvekEdge.ts`, `tests/unit/core/svek/**` or `tests/unit/description/**`.

## Acceptance
- Given xenusu, when rendered, then render-diff is 0/0.
- Given the description surveys (component, usecase, unknown) before and after, then there are no losses
  and every mover is reported (expect movers: vertical links with labels wider than their nodes).
- Given the description golden ratchet, then it is green.

**Observability:** N/A. **Rollback:** reversible.

# T5a2 — edge label line alignment in SvekEdge.ts (item 29)

Prepend [../task-preamble.md](../task-preamble.md). Mission checkout. Depends on T5a. Covered by D5
amendment 2 (orchestrator reading, journal row 41, flagged for review): same `SvekEdge.ts#drawLabelBlock`
and the same Java label construction (`SvekEdge.java:372-381`) the user allowed for T3b.

## Context
T5a's residual 1 (`measurements/T5a-report.md`): `src/core/svek/SvekEdge.ts:336` hard-codes
`HorizontalAlignment.CENTER` for the edge label block. The jar takes the label alignment from
`skinparam defaultTextAlignment` (`SvekEdge.java:376-381`), and a `\l`/`\r` line marker's natural alignment
overrides it (`Display.java:648-649`; port `splitDisplayLines(...).align`, `DisplayNewlines.ts:361`). xagonu's
four blank first lines sit at x 64.959 where the jar has 116.919. T5a's test masks that x; unmask it.

## Task
Quote the Java (`SvekEdge.java:370-385`, `Display.java:640-660`) before the edit. Failing test first from a
jar probe (`/private/tmp/claude-501/gtc-T5a/o2/t1.svg` or new ones via `scripts/oracle-render.sh`): centre
default, `defaultTextAlignment right|left`, `\r`/`\l` marker with and without the skinparam.

## Write-set
`src/core/svek/SvekEdge.ts`, `src/diagrams/description/{renderer-edge.ts,link-edge-attrs.ts}` (to pass the
alignment in), `tests/unit/core/svek/**`, `tests/unit/description/**`.

## Acceptance
- Given xagonu, then the four g[26..29] blank-line `text/@x` diffs clear (report the remaining count).
- Given the description surveys before and after, then there are no losses and every mover has a mechanism.
- Given the description golden ratchet, then it is green.

**Observability:** N/A. **Rollback:** reversible.

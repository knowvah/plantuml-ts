# Batch 1 — foundation + both diagnoses

Four tasks, **all parallel**, no shared write targets. Two add code that
nothing consumes yet (so they move zero fixtures); two are read-only
investigations that write a note and no source.

The diagnoses run first on purpose. They block nothing downstream, and M4 is
the mission's one unknown floor — the exit bar is set at ≤ 12 slugs precisely
because nobody knows M4's size yet. Learn it in batch 1, not at close-out.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | Cardinality style cascade (D3) | `typescript-pro` | `src/core/style-cascade-class.ts`, `src/core/theme.ts`, `tests/unit/core/style-cascade-class.test.ts` | — | [x] |
| T2 | Backlog triage instrument | `typescript-pro` | `scripts/label-box-triage.ts`, `tests/unit/scripts/label-box-triage.test.ts` | — | [x] |
| T3 | M3 diagnosis: tail/head swap | `debugger` | `.agent-notes/m3-tail-head-swap.md` | — | [x] |
| T4 | M4 diagnosis: single-line width deltas | `debugger` | `.agent-notes/m4-single-line-width.md` | — | [x] |

**Write-set conflicts:** none. T3 and T4 write to distinct `.agent-notes/`
files and must not touch `src/`, `tests/`, or the journal.

**Batch exit:** all four gates green; `shape-match-report` shows **zero**
fixtures moved (T1 and T2 add no consumer); both `.agent-notes/` files exist
and each either states a mechanism or explicitly records it as unestablished.

## Watch-out

T1 is geometry-neutral **only** if nothing consumes the new cascade field. If
you find yourself wiring a consumer to "make the test meaningful", stop — that
is T5/T6's job, and doing it here breaks the batch's zero-movement bar.

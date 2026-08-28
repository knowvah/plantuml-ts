# Batch 4 — adjudicate

One task, and it is the one that decides whether the mission lands.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T7 | Adjudicate every rise | `debugger` | `plans/sequence-frame-background-pass/findings/adjudication.md`, `plans/sequence-frame-background-pass/decision-journal.md` | T6 | [x] |

No source changes unless a `regression` is found and diagnosed. If one is,
fixing it is a `fix(T7): …` commit against the owning task's file, and the
2-attempt cap in `rules/autonomous-execution.md` applies to the FIX, not to
the investigation.

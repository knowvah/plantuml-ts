# Batch 5 — the unexplained remainder (D7)

Diagnose first, then fix. T5a ∥ T5b are **read-only on `src/`**: each
writes only its artifact under `diagnosis/`. Measure the remainder at the
B4 close first: many planning-time rows will already have moved (research
C saw ~116 of 235 XY rows fall to an X-only residual once V landed). The
artifacts propose fix tasks; the orchestrator spawns T5c… (push-forward),
journaling each fix task's write-set before it starts and keeping fix tasks
in one sub-batch file-disjoint.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T5a](T5a-diagnose-lifeline-x.md) | first-lifeline x (160), later lifelines (104), lifeline count (37), nested boxes (7) | debugger (opus) | `diagnosis/x-offset.md` | B4 | [ ] |
| [T5b](T5b-diagnose-note-x-delay.md) | note x (28), create / divider / ref misses (21), delay/space Y (3) | debugger (opus) | `diagnosis/note-x.md` | B4 | [ ] |
| T5c… | fix tasks from the artifacts | per artifact | per journal row | T5a / T5b | [ ] |
| close | standard close, pin round 5 | orchestrator | per close-procedure | all T5 | [ ] |

## Artifact format (both tasks)
One section per mechanism:
- **Mechanism** (1–2 sentences) · **Origin** (port `file:line`) · **Upstream**
  (Java `file:line`, quoted) · **Causal chain** (why the diff follows) ·
  **Ruled out** (what, and the evidence) · **Rows** (slugs it explains,
  and which would reach zero) · **Proposed fix** (write-set, approach,
  expected movement) · **Confidence**.
A row cluster with no complete section is listed under "Unexplained" with
what was instrumented and what to instrument next. An artifact that cannot
name a mechanism for a cluster of > 10 rows is stop 18.

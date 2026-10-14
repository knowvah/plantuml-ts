# T8 — deroxu diagnosis

Prepend [../task-preamble.md](../task-preamble.md). **Diagnosis mode** (`~/.claude/rules/diagnosis.md`):
no fix is proposed before a stated mechanism. **No code changes in this task.** Temporary
instrumentation lives in a scratch copy under `plans/description-svek-wrappers/measurements/T8/` and is
not committed to `src/`.

## Context
`unknown/deroxu-29-gude369` (DESCRIPTION; `skinparam linetype polyline`; 38 clusters; component ports).
Measured 2026-10-14 before this mission:
- 38 clusters on both sides
- bb width 4958 (ours) vs 3757 (jar)
- 7/246 edge `pos` match
- render-diff 879/2500

The bump notes attribute this to port-table node sizes differing from the jar's `plaintext` TABLE
nodes (TRACKER 28). Batches 2–3 changed the cluster wrappers, so re-measure first.

## Task
1. Run `layoutParity` on deroxu. Record `firstDiff`.
2. If `firstDiff.component` is `nodeSizes`:
   - Pair our node `(w,h)` multiset against the jar's to find the differing node kind(s).
   - Read the jar's DOT for those nodes (`shape=plaintext,label=<TABLE…>` and its WIDTH/HEIGHT/PORT cells).
   - Trace the jar's sizing: `SvekNode`, `EntityImageDescription`/`EntityImagePort`/whatever builds
     that label. Grep `~/git/plantuml/src/main/java/net/`.
3. Produce the **diagnosis artifact**:
   - **Mechanism** (1–2 sentences)
   - **Origin** (port `file:line`)
   - **Causal chain** (symptom ← cause)
   - **Ruled out** (with evidence)
   - **Java** `file:line` for the correct behaviour
4. State whether the fix lies inside `src/diagrams/description/` (→ T9) or outside it (→ stop 11, file).

## Acceptance
- Given the report, then the artifact has all five parts, and "Ruled out" is non-empty.
- Given a native cross-check (`dot -Tdot` on the jar DOT vs our builder dumped as DOT), then the
  attribution agrees ([[dot-engine-blame-needs-real-dot]]).

**Observability:** N/A. **Rollback:** N/A (no committed code).

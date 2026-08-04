# Batch 1 — Diagnose the identical-delta clusters

Four parallel diagnosis tasks. READ-ONLY on `src/` — deliverables are
mechanism reports + fix specs; jar probes write only under the session
scratchpad. No write-set conflicts by construction. Slug lists per cluster:
[clusters.md](clusters.md).

Every task follows `~/.claude/rules/diagnosis.md`: the deliverable is the
MECHANISM (cause, our file:line, Java file:line, causal chain, ruled-out
list), never a candidate fix without one. A fitted constant is a STOP.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|------------|------|
| D1 | Bare/minimal-class width residuals: clusters 0.018191 (×31), 0.018913 (×9), plus ≤0.033 small clusters | general-purpose | scratchpad probes + report only | — | [ ] |
| D2 | Stereotype/font: 0.064182 (×11, all stereotyped), 0.040579 (×11), element-font bucket (32) | general-purpose | scratchpad probes + report only | — | [ ] |
| D3 | Package/cluster geometry: 0.085696 (×6), container-cluster bucket (81) | general-purpose | scratchpad probes + report only | — | [ ] |
| D4 | Heterogeneous/heavy tail: 0.055371 (×20), interface-shield bucket (31), 0.499348 (×7) | general-purpose | scratchpad probes + report only | — | [ ] |

## Interface contract (output of every D task, consumed by Batch 2)

One JSON block per mechanism found:

```json
{
  "mechanism": "one-to-two-sentence cause statement",
  "ourFileLine": "src/diagrams/class/<file>.ts:<line>",
  "javaFileLine": "<path under ~/git/plantuml/src/main/java/net/>:<line>",
  "upstreamExpression": "the exact Java expression the fix must reproduce",
  "probeEvidence": "probe .puml + jar width/height vs ours, numbers",
  "affectedSlugs": ["predicted closure set from the ratchet"],
  "ruledOut": ["what was eliminated and the evidence"],
  "testPlan": "colocated test + fixture to pin the mechanism"
}
```

Target payload ≤2k tokens per task. Fewer/more mechanisms than the cluster
menu predicts is fine — journal it.

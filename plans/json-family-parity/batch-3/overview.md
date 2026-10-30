# Batch 3 — port `getPosition` + `Mirror` (M1 + M2)

One task: json consumes T2a's `engineNodes`/`engineEdges` and places nodes and
edges with the jar's own arithmetic. Every json/yaml/hcl row moves; the close
measures each against the B1 ledger's prediction (stop 11 at > 25% misses).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T3a](T3a-port-get-position.md) | jar node placement + edge mirror from the engine frame | typescript-pro (opus, effort high), jfp-T3a | `src/diagrams/json/{layout.ts,json-node-position.ts,JsonCurve.ts,document-dimensions.ts}`, `tests/unit/json/{json-node-position.test.ts,layout.test.ts,layout-mirrored-graph.test.ts}` | b2 close | [ ] |
| close | merge; gates `b3`; chain vs b2; D5 check (movers journaled with "M1+M2"); per-row residue vs `diagnosis/ledger.md` prediction; re-pins; misses → B4 (push-forward) or stop 11 | orchestrator | per close-procedure | T3a | [ ] |

## Close specifics
- For every ledger row predicted closed (probe residue 0): byte-conformant? Count misses; > 25% is stop 11.
- For every other row: residue must not rise (stop 4) and should match the probe residue; a mismatch is a journal row with its mechanism.
- The 22 rows conformant at main must still be byte-identical (stop 4).

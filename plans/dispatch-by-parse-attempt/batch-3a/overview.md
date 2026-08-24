# Batch 3a — strict refusal in eight engines

**Batches 3a and 3b are one atomic unit. Do not run the quality gates between
them, and do not merge 3a alone.** With refusal live and `accepts()` still
routing, the corpus errors wide by construction; 3b is what makes it coherent.
See [D3'](../decisions.md#d3--the-order-freeze-lifts-only-together-with-refusal).

Eight tasks, fully parallel — each writes exactly one engine's parser and
nothing else.

| ID | Engine | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T4 | sequence | typescript-pro | `src/diagrams/sequence/parser.ts` | T3 | [ ] |
| T5 | class | typescript-pro | `src/diagrams/class/parser.ts` | T3 | [ ] |
| T6 | activity | typescript-pro | `src/diagrams/activity/parser.ts` | T3 | [ ] |
| T7 | description | typescript-pro | `src/diagrams/description/parser.ts` | T3 | [ ] |
| T8 | state | typescript-pro | `src/diagrams/state/parser.ts` | T3 | [ ] |
| T9 | board | typescript-pro | `src/diagrams/board/parser.ts` | T3 | [ ] |
| T10 | chart | typescript-pro | `src/diagrams/chart/parser.ts` | T3 | [ ] |
| T11 | packetdiag | typescript-pro | `src/diagrams/packetdiag/parser.ts` | T3 | [ ] |

All eight share one task specification: [T4-T11-engine-refusal.md](T4-T11-engine-refusal.md).
Pass it with the engine name substituted; the per-engine differences are its
read-set and its upstream factory, both tabulated inside.

**Scope.** Eight is not a chosen number — it is exactly the set of ported
engines whose upstream factory extends `PSystemCommandFactory`
([D6](../decisions.md#d6)). json, yaml, hcl and files extend
`PSystemAbstractFactory` and keep their own document-parser error semantics;
dot is passthrough. None of those four is in scope.

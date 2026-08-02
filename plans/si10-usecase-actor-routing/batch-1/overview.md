# Batch 1 — The description engine gains an entry point and loses a dead guard

One task, alone. T2 cannot start until the entry point exists.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | Export the faithful usecase/actor entry point; drop the inert `<$sprite>` guard branch | typescript-pro | `src/diagrams/description/leaf-sizing.ts`, `tests/unit/description/leaf-sizing-widen-routing.test.ts` | — | [ ] |

## Interface contract (consumed by T2)

```ts
// src/diagrams/description/leaf-sizing.ts
export function measureUsecaseOrActorLeaf(
  display: string,
  symbol: 'usecase' | 'actor',
  fontSpec: FontSpec,
  measurer: StringMeasurer,
  sprites?: SpriteDimsLookup,
): Dim;              // { width: number; height: number }
```

Exact name and parameter order are T1's to choose — but it MUST take
`sprites` (ADR-2 + approved scope item 3), return the plain `Dim` the class
engine can wrap, and NOT expose `applyMinWidthFloor` or a `DescriptiveNode`.
Whatever T1 ships, it records the final signature in the decision journal so
T2 codes against fact rather than this sketch.

## Batch exit criteria

- All quality gates green, **`widened` still 0**, conformant still 320/351
- `hasUnroutedUsecaseMarkup` still returns true for `<latex>` (stop condition 8)
- The rewritten routing test asserts real numbers and would fail if geometry
  moved (ADR-3)
- 395 svg goldens byte-identical; the 54-fixture ratchet zero-diff

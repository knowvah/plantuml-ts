# Batch 0 — branch, tooling, positional guard

Serial: T0a (branch + tooling + b0 baseline), then T0b in a worktree. The close
seeds the D4 positional ceilings from T0b's measure and records the b0 row.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T0a](T0a-branch-and-tooling.md) | branch, brief commit, tooling copied from jse, b0 gates + chain + d.ts snapshot + D5 extended baseline | orchestrator | `plans/json-family-parity/{measurements,tools}/*` (copies), `.claude/settings.autonomous.json` | — | [x] |
| [T0b](T0b-positional-guard.md) | positional-residue measure + shrink-only ratchet (D4) | typescript-pro (sonnet, effort high), jfp-T0b | `tests/oracle/svg-conformance/json-family-positional{.ts,.test.ts}`, `tests/unit/oracle/json-family-positional.test.ts`, `plans/json-family-parity/tools/residue.mts` | T0a | [x] |
| close | merge T0b; seed `oracle/goldens/json-family-positional.json` (`residue.mts --all`); add the positional gate to `merge-one.sh`; gates `b0close`; `fixtures.md` b0 row | orchestrator | per close-procedure | T0b | [x] |

## Interface (T0b → B1, closes, exit)
```ts
// tests/oracle/svg-conformance/json-family-positional.ts
export type JsonFamilyType = 'json' | 'yaml' | 'hcl';
export interface PositionalResidue {
  aligned: boolean;            // false ⇒ structural diffs present; magnitudes not comparable
  nodeMax: number;             // max |Δ| over non-path element coordinates (x, y, cx, cy, x1..y2, width, height)
  pathMax: number;             // max |Δ| over path/@d (and polygon points) coordinates, token-aligned
  canvas: { dw: number; dh: number };   // svg width/height (and viewBox) |Δ|
  byAttr: Record<string, number>;       // max |Δ| per `<tag>/@<attr>` key
}
export function measureResidue(type: JsonFamilyType, slug: string): PositionalResidue;
```

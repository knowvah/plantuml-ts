# Batch 2 — Description AtomOps · core seams through Sea (parallel, after T1)

Disjoint write-sets. Both consume T1's `getFont`/`getSpace`/`fontPosition`.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T2 | Description/component/usecase `AtomOps`: text-atom `getStartingAltitude = getSpace`; measure/draw via `getFont` (both impls) | typescript-pro | `src/core/svek/image/EntityImageDescriptionDelegates.ts`, `src/core/svek/image/leaf-sizing-folder-title.ts`, description/core unit tests, ratchet/golden entries for the usecase fixture | T1 | [ ] |
| T3 | Core seams: `creole-text-lines.ts` + `leaf-sizing-text.ts` lay lines through `Sea`; runs gain `size`/`dy`; line height from `Sea` | general-purpose (Opus, effort high) | `src/core/svek/image/creole-text-lines.ts`, `src/core/svek/image/leaf-sizing-text.ts`, their tests | T1 | [ ] |

**Interface contract (T3 → T4, T5)** — locked shape:
```ts
export interface CreoleTextRun { text: string; style: FontStyleFlags; color?: string; url?: string;
  /** effective (muted) font size — getFont(atom.font).size */ size: number;
  /** baseline offset from the line's NORMAL baseline (Sea placement); 0 for NORMAL runs */ dy: number; }
export interface CreoleTextLine { runs: readonly CreoleTextRun[]; width: number; height: number /* from Sea */; kind: 'text'|'hr'|'table-row'; }
```
`leaf-sizing-text.ts` exposes the same per-atom `{size, dy}` + line height for
class (name it in T3's report — T4 consumes it).

**Expected manifest moves.** T2 → the usecase fixture (+ any description
fixture with `<sup>`/`<sub>` — T0's grep says none). T3 → `juvagu-33` and the
class/state authored slugs may move again (sizing only; renderers follow in
Batch 3 — sizer/renderer drift inside Batch 2 is expected and MUST be closed
by T4/T5 before the mission ends; journal it).

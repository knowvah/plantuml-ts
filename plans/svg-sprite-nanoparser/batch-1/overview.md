# Batch 1 — Foundations

Four tasks, all parallel: no interdependencies, no shared write targets.
Nothing in this batch changes rendered output — T1–T3 add new files, T4 is
additive-only. All existing behavior must be byte-identical after this batch.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | Port `openiconic/SvgPath.java` — `d` → `UPath` | typescript-pro | `src/core/klimt/sprite/SvgPath.ts` (+ `.test.ts`) | — | [ ] |
| T2 | Port `emoji/ColorResolver.java` | typescript-pro | `src/core/klimt/sprite/ColorResolver.ts` (+ `.test.ts`) | — | [ ] |
| T3 | Port `emoji/UGraphicWithScale.java` | typescript-pro | `src/core/klimt/UGraphicWithScale.ts` (+ `.test.ts`) | — | [ ] |
| T4 | `AtomImageResolver` discriminated union (ADR-2) | typescript-pro | `src/core/creole-atoms.ts` | — | [ ] |

## Batch exit criteria

- All four quality gates green
- `npx tsx scripts/measure-description-size-deltas.ts` exits 0
- SVG goldens 310 / 22 / 57 byte-identical
- **No rendered output changed** — this batch is purely additive

## Note on T4

T4 must be additive: nothing emits the `drawable` variant until T9, so every
existing consumer keeps compiling. Verify specifically that
`EntityImageDescriptionDelegates.ts#dimensionOf` (`:127-133`), which
destructures `{width, height}` off the resolver result, compiles unchanged —
both variants carry the declared box, which is the point of ADR-2's shape.

# Batch 1 — workstream A: ready fixes

Every mechanism here was diagnosed (most probe-verified) by cdd2 and was
blocked only by that mission's write-sets. Runs right after T0, alongside
batch 0's diagnosis. Wave 1 (T7 ∥ T9 ∥ T11) in worktrees with disjoint
primaries; wave 2 serial on the merged tree.

| ID | Description | Agent | Primaries | Depends On | Done |
|---|---|---|---|---|---|
| [T7](T7-vertical-1px.md) | R-VP vertical 1 px (7) | typescript-pro (sonnet) | `class-layout-helpers.ts`, `class-geo-builders.ts`, `class-scale-geo.ts`, `class-ink-shapes.ts`, `class-classifier-ink-reservation.ts`, `class-geo-types.ts`, `class-layout-generic-classifier.ts` | T0 | [x] |
| [T9](T9-namespace-identity.md) | S-1 packed groups, S-1b resolve order, S-12 empty-package colour (4) | typescript-pro (opus) | `class-namespace-resolve.ts`, `class-dot-clusters.ts`, `ast.ts`, `class-ensure-classifier.ts`, `class-command-relationships.ts`, `class-namespace.ts`, `renderer.ts`, `renderer-uid.ts` | T0 | [x] |
| [T11](T11-generic-tag-cardinality-style.md) | Q-4 generic-tag style, Q-5 cardinality font (2) | typescript-pro (sonnet) | `core/theme-graph-colors-a.ts`, `core/theme.ts`, `core/style-cascade-class*.ts`, `renderer-classifier-badge-tag.ts`, `renderer-edge-extras.ts` | T0 | [x] |
| [T8](T8-leaf-ink.md) | R-LEAF description-leaf ink + daxeno title (2) | typescript-pro (sonnet) | `core/svek/image/leaf-sizing-entity.ts`, `class-layout-generic-classifier.ts`, `class-ink-box.ts` | T7 | [ ] |
| [T10](T10-link-note-paint.md) | S-4t, S-11, S-6, note ink walk, gradient stop (6) | typescript-pro (opus) | `class-relationship-ast.ts`, `class-relationship-parser.ts`, `class-command-containers.ts`, `class-namespace-folder-outline.ts`, `class-ink-box.ts`, `renderer-edge.ts`, `core/paint.ts` | T7, T11, T8 | [ ] |
| [T12](T12-rectangle-usymbol-icon.md) | sijisi `rectangle` USymbol leaf (1) | typescript-pro (sonnet) | `core/usymbol-shapes.ts` + its class dispatch | T10 | [ ] |
| [T13](T13-close.md) | Residual round + close | orchestrator | close-procedure | T7–T12 | [ ] |

Wave 1 disjointness: T7 and T8 both own `class-layout-generic-classifier.ts`
— hence T8 follows T7; T8 and T10 both own `class-ink-box.ts` — hence T10
follows T8. Wave 2 is serial in the main checkout.

# Batch 1 — Family A parse core; Family B core wrap; Family C edge ids

Starts once T0's gates are green and T0b is in.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1a | Entity URL capture in the parser (inline `[[url]]` on declarations and containers) | typescript-pro | `parse-helpers-strings.ts`, `parse-helpers.ts`, `ast.ts`, `command-table-containers.ts`, `command-table-helpers.ts` | T0 | [ ] |
| T2 | Per-run URL wrap in the description text drawers (core, D7) | typescript-pro | `core/klimt/creole/atom/Atom.ts`, `core/klimt/creole/legacy/StripeSimple.ts`, `core/svek/image/EntityImageDescriptionDelegates.ts`, `core/svek/image/EntityImageDescriptionTextBlock.ts`, `core/annotations/blocks-creole-atoms.ts` (export) | T0, T0b | [ ] |
| T3 | Edge leaf names for `path/@id` and link comments | typescript-pro | `layout-geo-post.ts`, `layout.ts`, `renderer-edge.ts`, `layout-helpers-types.ts` (edge part) | T0 | [ ] |

Write-sets are disjoint (`description/` unless marked core). All three run in parallel, each in its own
worktree off the mission branch. Close: [../close-procedure.md](../close-procedure.md).

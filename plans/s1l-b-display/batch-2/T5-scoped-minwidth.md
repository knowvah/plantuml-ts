# T5 — Scoped `<style> MinimumWidth` per-element

## Context
`zotiru-33-legi180` sets `<style> package { MinimumWidth 300 }`. The oracle
floors package boxes' content width at 300 (`not_nested` → 4.583in = 300 + 30
package margin) but leaves the sibling `card c` unfloored. S1L-g already wired
the GLOBAL `skinparam minClassWidth` → `theme.minimumWidth` →
`BoxSizingOpts.minimumWidth` → `measureBox`'s `max(minimumWidth, contentW)`. This
task adds the **scoped** (`<style> <element> { MinimumWidth }`) form, resolved
per element type — NOT a global floor (ADR-3).

## Task
Parse `MinimumWidth` from `<style>` blocks (scoped by selector) and thread a
per-element minimum-width to `measureLeafNode`/`degenerateSingleLeaf` so a
`package`'s floor applies only to packages. Reuse the scoped-style-block path
that pass-13 added for scoped skinparam blocks (`skinparam <selector> { … }`
keyed `<selector><name>`).

## Read-set
- `src/core/skinparam-style-block.ts` — how `<style> <selector> { … }`
  declarations are parsed/keyed.
- `src/core/style-map-theme.ts`, `style-map-simple-fields.ts`,
  `style-map-element.ts` — how a `<style>` property maps to a per-element
  override; find where element-scoped values are surfaced to the layout.
- `src/diagrams/description/layout.ts` — `ClassifyCtx` (has `minimumWidth`);
  where per-node context is assembled before `measureLeafNode`.
- `src/diagrams/description/leaf-sizing.ts` — `BoxSizingOpts.minimumWidth`.
- `src/core/theme.ts` — `minimumWidth` field + `ThemeOverride` + merge list.

## Write-set
- `src/core/style-map-*.ts` (the scoped-property resolution)
- `src/diagrams/description/layout.ts` (thread per-element minimum width)
- a unit test under `tests/unit/` (`core/style-map-*` or `description/`)

## Architecture (locked)
ADR-3: per-element, not a global `theme.minimumWidth`.

## Acceptance criteria
- Given `<style> package { MinimumWidth 300 }`, when a `package` is sized, then
  its content width floors at 300 (not_nested → 4.583in); when a sibling `card`
  is sized, then it is NOT floored.
- Given `zotiru-33-legi180` via the harness, then `maxSizeDeltaIn ≤ 0.01`
  (conformant) OR its backlog pin shrinks; `measure` exit 0.
- Structure stays EQUAL.

## Commit
`feat(style): scoped <style> MinimumWidth floors leaf boxes per element (S1L-b T5)`.

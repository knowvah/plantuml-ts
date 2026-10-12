# T4a: salt plugin and wiring (D2, D3, D5, D7)

Prepend [../batch-1/task-preamble.md](../batch-1/task-preamble.md).

## Task (TDD)
1. Port `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/PSystemSalt.java`, `PSystemSaltFactory.java`, `CommandAnything.java`:
   - `manageSprite` (drops `hide stereotype` / `skinparam …`, applies `scale N`, runs
     `sprite $…` blocks through the sprite-command port, D4)
   - `createElement`: the factory list and the shared `ElementFactoryTree`, first `ready()`
     factory wins; none ready ⇒ refusal (D5)
   - `getTextBlock`: element drawn at z-index 0 then 1 at its preferred dimension, black ink
   - `getDefaultMargins()` = `same(5)`; title/scale commands via the shared command set (D2)
   - `CommandAnything`: a first line `salt` inside `@startuml` (`CommandAnything.java:70`)
2. `src/diagrams/salt/index.ts`: the `SyncPlugin` (parse → layout → render) mirroring the
   mindmap plugin's shape (`src/diagrams/mindmap/index.ts`); register it in `src/index.ts`
   next to `mindmapPlugin`. Detection already exists (`src/core/diagram-type-set.ts:124`).
3. Measure every salt row and the 5 embed rows with render-diff; fix what shares a
   mechanism inside your write-set; report the rest with mechanisms.

## Write-set
`src/diagrams/salt/{PSystemSalt,PSystemSaltFactory,CommandAnything,index}.ts`, the one
registration line in `src/index.ts`, tests under `tests/unit/salt/`, `docs/catalog.md`.

## Acceptance
- Given each of the 51 salt fixtures, then it routes SALT and renders (no unknown-diagram
  sentinel); per-row render-diff reported.
- Given `class/bixogo-47-xulu385`, `class/roxosu-00-pini153`, `unknown/lubicu-73-fule059`,
  then the nested slot draws salt at the jar's size (render-diff reported).
- Given a salt source no factory accepts, then our error page renders (D5).
- Given every non-salt, non-embed fixture, then its bytes are unchanged (hash comparison
  before/after over `test-results/dot-cache/*/*`).

**Observability:** N/A. **Rollback:** Reversible.

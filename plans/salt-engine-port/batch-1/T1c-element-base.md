# T1c: element base

Prepend [task-preamble.md](task-preamble.md).

## Task (TDD)
Port 1:1, reading each Java file whole first:
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/Element.java` → `src/diagrams/salt/element/Element.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/AbstractElement.java` → `src/diagrams/salt/element/AbstractElement.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/AbstractElementText.java` → `src/diagrams/salt/element/AbstractElementText.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ElementEmpty.java` → `src/diagrams/salt/element/ElementEmpty.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ElementText.java` → `src/diagrams/salt/element/ElementText.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/WrappedElement.java` → `src/diagrams/salt/element/WrappedElement.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/SaltDictionary.java` → `src/diagrams/salt/SaltDictionary.ts`

Sprites: `SaltDictionary#addSprite`/lookups reuse the existing sprite port (`src/core/sprite-commands.ts`, `src/core/klimt/sprite/`) — D4.

## Write-set
The TS files above and their tests under `tests/unit/salt/` (same sub-directory), plus
`docs/catalog.md`.

## Interface contracts
`Element` interface: `getPreferredDimension(stringBounder, x, y)`, `drawU(ug, zIndex, dimToUse)` (names as in the Java); `AbstractElement`, `AbstractElementText` (font, text block, `getTextDimensionAt`), `SaltDictionary` (`put`, `get`, `addSprite`) — consumed by every batch-2/3 task.

## Acceptance
- Given text "Login", when `ElementText` is measured, then its preferred dimension equals the jar's (from a corpus `in.svg` or an `oracle-render.sh` probe).
- Given `AbstractElementText` with creole markup, then its text block draws the jar's `<text>` attributes.
- Given `SaltDictionary`, then put/get/sprite lookups behave as the Java.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible.

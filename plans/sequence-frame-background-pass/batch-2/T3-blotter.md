# T3 — Port `Blotter.java`

## Context

`plantuml-ts` is a faithful port; the Java at `~/git/plantuml` is the spec.
**Open the method body.** Sequence pixels come from `sequencediagram/teoz/`.

The Blotter is the coloured band a grouping frame paints behind its body in the
BACKGROUND pass. It is why `kejoke-76-curu931`'s golden opens with 12 `<rect>`
before any lifeline: 6 groups × (band + outline).

Read `../README.md` and `../decisions.md` first. **D5** governs this task.

## Task

Port `~/git/plantuml/.../sequencediagram/teoz/Blotter.java` — the whole file,
137 lines — into `src/diagrams/sequence/renderer-frame-blotter.ts` as a pure
function over a `FrameGeo`.

The band split comes from `GroupingTile#drawCompBackground:311-340`, which is
the Blotter's only caller: one `addChange` per `ElseTile` at
`elseTile.getYGauge().getMin() - getFrameY()`, **+1** (`:334`), coloured by
`elseTile.getBackColorGeneral()` falling back to the group colour when null
(`:328-331` — an else without its own colour inherits the group's, which may
come from the style and not only from an inline `#color`).

Port ALL of it, including branches no corpus fixture reaches:
- `drawU`'s `if (current.isTransparent() == false)` skip — this is why an
  uncoloured group emits **nothing** (`group BackGroundColor` is `transparent`
  at `plantuml.skin:103`).
- `addChange`'s `if (color.equals(last)) return` de-duplication and its
  null → transparent coercion.
- `closeChanges`.
- All three `getRectangleBackground` variants: `round == 0`, `changes.size()
  == 1`, `i == 0` (arc at top), `i == size - 1` (arc at bottom), middle.

## Read-set

- `~/git/plantuml/.../teoz/Blotter.java` — the whole file
- `~/git/plantuml/.../teoz/GroupingTile.java:301-340` (`drawBackground` and
  `drawCompBackground`, the only caller)
- `~/git/plantuml/src/main/resources/skin/plantuml.skin:102-103`
- `src/core/svg-shapes.ts:18` (`rect`), `:214` (`path`),
  `src/core/svg-path-builder.ts` for the arc variants
- `src/diagrams/sequence/frame-style.ts` (from T1)

## Interface contract

```ts
/** `Blotter#drawU`. Returns '' when every band is transparent. */
export function renderFrameBlotter(frame: FrameGeo, roundCorner: number): string;
```

T6 calls this in the background pass. Nothing calls it until then; its unit
tests are what cover it.

## Architecture decisions (locked)

- **D5** — port the whole file, corner variants included.
- Colours arrive as RAW tokens; resolve at emission through
  `core/klimt/color/HColorSet.ts#resolveColorToSvgHex`, and let
  `svg-format.ts#shortenColor` produce the golden's `#FFA` from `#FFFFAA`.
- **Preserve upstream names**, ugly included.

## Acceptance criteria

- Given a frame with no colour anywhere, then `renderFrameBlotter` returns
  `''` — no element at all.
- Given `backColorGeneral: '#ffa'` and no `else`, then exactly one `<rect>`
  with **both** `fill="#FFA"` and `stroke:#FFA` (`Blotter.java:82` applies
  `current` and `current.bg()`), spanning the full frame.
- Given two `else` branches with distinct colours, then three bands, split at
  each separator's `y + 1`.
- Given an `else` with no colour of its own, then it inherits the group's
  (`GroupingTile.java:328-331`).
- Given `roundCorner > 0` and more than one band, then the first band's path
  arcs at the top and the last arcs at the bottom, middles are plain rects.

## Observability

N/A — no new observable operations. Nothing calls this until T6.

## Rollback

Reversible. New file plus its test; reverting removes both.

## Quality bar

The four gates exit 0. 90/90/90 — the corner variants need explicit tests
since no fixture reaches them. Complexity limits are hook-enforced: 500 lines
per file, 30 NLOC per function, CCN 10, 5 params. `getRectangleBackground`'s
branching will approach CCN 10; split it if the hook blocks. No Prettier.

## Commit

`feat(T3): port the grouping-frame Blotter`

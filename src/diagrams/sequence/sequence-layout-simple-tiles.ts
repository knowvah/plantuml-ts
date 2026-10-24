/**
 * The three tiles of `sequence-layout-events.ts#dispatchEvent` that need no
 * participant geometry beyond the running cursor: `DelayTile`, `NewpageTile`
 * and `HSpaceTile`. A pure move out of that file (500-line cap); no logic
 * changed.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/DelayTile.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/NewpageTile.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/HSpaceTile.java
 */
import type { DelayEvent, NewpageEvent, NewpageGeo, SpaceEvent, SpaceGeo } from './ast.js';
import { HColorSet } from '../../core/klimt/color/HColorSet.js';
import { NEWPAGE_TILE_HEIGHT } from './newpage-style.js';
import { layoutDelay } from './sequence-delay.js';
import type { EventCursor, EventProcessingContext } from './sequence-layout-events.js';
import { newpageStyle, paintOf } from './sequence-skin-param.js';

/**
 * `DelayTile` (`teoz/DelayTile.java`): the tile reserves its `DELAY_TEXT`
 * component's height -- a bare `...` included, whose `Display.empty()` makes
 * it `0 + 4 + 4 + 20` -- and is laid out, drawn and allowed to cut the
 * lifelines and activation bars by `sequence-delay.ts`.
 */
export function handleDelayEvent(event: DelayEvent, cursor: EventCursor, ctx: EventProcessingContext): void {
  const geo = layoutDelay(event, cursor.y, [...ctx.participantMap.values()], ctx.measurer, ctx.sprites);
  ctx.eventGeos.push(geo);
  cursor.y += geo.height;
}

/**
 * `NewpageTile` (`teoz/NewpageTile.java:63-67`): a tile whose `YGauge` starts
 * at the running cursor and whose height is a CONSTANT
 * `getPreferredHeight()` — no measurement, no participant lookup. The cursor
 * advances by that height like it does past any other tile, which is what
 * makes `newpage` occupy 21px of the diagram rather than nothing.
 *
 * The tile draws nothing in the background pass (`drawU` returns early on
 * `isBackground`) and one `ULine.hline` in the foreground; the band it spans
 * is back-filled in Step 3. Its paint is `ComponentType.NEWPAGE`'s style,
 * merged in the constructor from the builder current at the command
 * (`Newpage.java:55-57`, `SequenceDiagram.java:248`), read by
 * `ComponentRoseNewpage` (`:54-64`: `getColorLine()`, `getStroke()`).
 */
export function handleNewpageEvent(event: NewpageEvent, cursor: EventCursor, ctx: EventProcessingContext): void {
  const newpageGeo: NewpageGeo = {
    paint: paintOf(newpageStyle(event.styleBuilder), HColorSet.instance()),
    kind: 'newpage',
    y: cursor.y,
    height: NEWPAGE_TILE_HEIGHT,
    bandX: 0, // both back-filled once totalWidth is known (Step 3)
    bandWidth: 0,
  };
  ctx.eventGeos.push(newpageGeo);
  ctx.newpageGeos.push(newpageGeo);
  cursor.y += newpageGeo.height;
}

export function handleSpaceEvent(event: SpaceEvent, cursor: EventCursor, ctx: EventProcessingContext): void {
  const spaceGeo: SpaceGeo = {
    kind: 'space',
    y: cursor.y,
    height: event.pixels,
  };
  ctx.eventGeos.push(spaceGeo);
  // Exactly the requested pixels, and nothing beside them. `HSpaceTile:72-75`
  // returns the `HSpace`'s own pixel count as its preferred height, and
  // `ComponentRoseGroupingSpace#getPreferredHeight:66-69` returns the `space
  // N` argument -- neither adds a gap, because tiles chain flush.
  cursor.y += event.pixels;
}

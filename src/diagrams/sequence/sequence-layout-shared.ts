/**
 * Small shared leaf utilities for sequence diagram layout.
 * No dependencies on sibling layout modules — keeps the module graph a DAG.
 */

import type { FontSpec } from '../../core/measurer.js';
import type { Theme } from '../../core/theme.js';

/** Derive the font spec used for all sequence-diagram text measurement. */
export function fontSpecOf(theme: Theme): FontSpec {
  return { family: theme.fontFamily, size: theme.fontSize };
}

/**
 * `CommunicationTile.LIVE_DELTA_SIZE` — half an activation bar's width, and
 * the step by which a live participant pushes the things anchored on its
 * lifeline sideways.
 *
 * It is read by every tile that has to dodge a bar: `CommunicationTile`
 * moves a message's two endpoints by it (`:333-350`),
 * `CommunicationExoTile` its one endpoint (`:122-129`), `NoteTile` its box
 * (`:153`), and `CommunicationTileSelf` its loop (`:133-135`). Shared here
 * for the same reason upstream keeps one `public static final`: those four
 * must agree.
 *
 * `renderer-lifeline.ts` deliberately does NOT use it for the bars'
 * own per-level indent -- `LiveBoxes#drawOneLevel` derives that from the
 * box's own `getWidth() / 2` (`:365-368`), and the two coincide at 5 only
 * because the box is 10 wide.
 *
 * @see ~/git/plantuml/.../sequencediagram/teoz/CommunicationTile.java:172
 */
export const LIVE_DELTA_SIZE = 5;

/**
 * The `<:name:>` emoji draw branch of `descAtomOps`, split out of
 * `EntityImageDescriptionDelegates.ts` at the 500-line cap.
 *
 * Two paths, and which one runs is load-bearing for LAYOUT, not just looks:
 * a use-case ellipse is fitted by `Footprint` collecting the points actually
 * DRAWN (`TextBlockInEllipse` → `ContainingEllipse`), so drawing the real
 * Twemoji artwork versus a placeholder glyph changes the node's measured
 * size. `murava-69-tago286` is the fixture that proves it.
 */

import type { UGraphic } from '../../klimt/UGraphic.js';
import { UTranslate } from '../../klimt/UTranslate.js';
import { UText } from '../../klimt/shape/UText.js';
import { SvgNanoParser } from '../../klimt/sprite/SvgNanoParser.js';
import { emojiRenderRun } from '../../klimt/creole/atom/AtomEmoji.js';
import { measureLine } from './EntityImageDescriptionSupport.js';

/** The emoji atom fields this draw path needs. */
export interface EmojiAtomLike {
  readonly unicode: string;
  readonly factor: number;
}

/** Raw artwork source by codepoint — `core/internal-emoji-store.ts`. */
export type EmojiArtworkResolver = (unicode: string) => string | undefined;

/**
 * Draw one emoji atom.
 *
 * With artwork: replays the SVG's own primitives, matching upstream's
 * `Emoji#drawU` (`Emoji.java:175-181`). The scale is the atom's `factor`
 * because the artwork's coordinate space IS the 36-unit grid
 * `calculateDimensionSlow` reports (`EMOJI_BOX_FACTOR`), so the drawn box is
 * `36 * factor` — the dimension the atom already advertises.
 *
 * Without artwork: the A2s R2i platform-glyph text run, unchanged. This is
 * the default path — no emoji asset store is wired unless the caller supplies
 * one (`@knowvah/plantuml-emoji`, CC-BY 4.0, ships separately from the MIT
 * core precisely so it is opt-in).
 */
export function drawEmojiAtom(
  ug: UGraphic,
  atom: EmojiAtomLike,
  resolveArtwork: EmojiArtworkResolver | undefined,
): void {
  const artwork = resolveArtwork?.(atom.unicode);
  if (artwork !== undefined) {
    new SvgNanoParser(artwork).drawU(ug, atom.factor, undefined, undefined);
    return;
  }
  const run = emojiRenderRun(atom as Parameters<typeof emojiRenderRun>[0]);
  const m = measureLine(ug.getStringBounder(), run.text, run.font);
  ug.apply(new UTranslate(0, m.height - m.descent)).draw(UText.build(run.text, run.font));
}

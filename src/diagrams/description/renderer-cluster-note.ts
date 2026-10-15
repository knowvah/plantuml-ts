/**
 * renderer-cluster-note.ts -- the `!pragma kermor on` group note `Cluster#drawU` draws before the cluster's own
 * symbol: `getCucaNote(Position.TOP|BOTTOM).drawU(ug.apply(UTranslate.point(xyNote...)))`
 * (`Cluster.java:302-307`). `getCucaNote` (`Cluster.java:393-399`) builds an `EntityImageNoteLink`, whose
 * `drawU` is `comp.drawU(ug, new Area(calculateDimension), ...)` over a `ComponentRoseNote`
 * (`EntityImageNoteLink.java:61-76`) -- NOT the `EntityImageNote` the `note` leaf draws (`renderer-note.ts`):
 * no entity group, and the fold is stroked like the outline.
 *
 * @see ~/git/plantuml/.../skin/AbstractComponent.java:121-129 (drawU: translate by getPaddingX/Y)
 * @see ~/git/plantuml/.../skin/rose/ComponentRoseNote.java:81-133 (preferred size, drawInternalU)
 */
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import type { Theme } from '../../core/theme.js';
import { Back } from '../../core/klimt/Back.js';
import { Fore } from '../../core/klimt/Fore.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { UGraphicStencil } from '../../core/klimt/drawing/UGraphicStencil.js';
import { parseSvgPath } from '../../core/klimt/sprite/SvgPath.js';
import { opaleCorner } from '../../core/svek/image/Opale.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import type { DescriptionNodeGeo, KermorNoteGeo } from './layout-helpers.js';
import { opalePolygonNormal } from './renderer-note-opale.js';
import { buildNoteBlock, resolveNotePaints } from './renderer-note.js';

/** `Rose.java:65-66`: the `paddingX`/`paddingY` every `ComponentRoseNote` is built with. */
const ROSE_NOTE_PADDING = 5;
/** `ComponentRoseNote.java:66-70` for the default (non-CENTER) text alignment: `topRightBottomLeft(5, 15, 5, 6)`. */
const PAD_TOP = 5;
const PAD_RIGHT = 15;
const PAD_BOTTOM = 5;
const PAD_LEFT = 6;

/** A note carries no node of its own here: `resolveNotePaints` reads only `color`/`stereotype`, and
 *  `EntityImageNoteLink` passes the group note's own `Colors` and no stereotype (`Cluster.java:393-399`). */
const PAINT_PROBE: DescriptionNodeGeo = {
  id: 'kermor-group-note',
  symbol: 'note',
  display: '',
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  children: [],
};

/** `ComponentRoseNote#drawU` at `note.x/y`: outline + fold on the stroked graphic, then the body text. */
export function drawKermorGroupNote(
  ug: UGraphic,
  note: KermorNoteGeo,
  theme: Theme,
  sprites: SpriteRegistry | undefined,
): void {
  const paints = resolveNotePaints(PAINT_PROBE, theme);
  const block = buildNoteBlock(note.text, theme, sprites);
  const pure = block.calculateDimension(ug.getStringBounder());
  // `getTextWidth`/`getTextHeight` (`AbstractTextualComponent.java:106-114`); `drawInternalU` truncates both
  // (`:104-107`: `(int) getTextHeight`, `(int) getTextWidth`) and the Area equals the preferred size, so
  // `diffX` is 0.
  const textWidth = pure.getWidth() + PAD_LEFT + PAD_RIGHT;
  const textHeight = Math.trunc(pure.getHeight() + PAD_TOP + PAD_BOTTOM);
  const x2 = Math.trunc(textWidth);
  const stroked = ug
    .apply(new UTranslate(note.x + ROSE_NOTE_PADDING, note.y + ROSE_NOTE_PADDING))
    .apply(new Back(paints.back))
    .apply(new Fore(paints.border))
    .apply(paints.stroke);
  stroked.draw(parseSvgPath(opalePolygonNormal(x2, textHeight), UTranslate.none()));
  stroked.draw(parseSvgPath(opaleCorner({ x: 0, y: 0 }, x2), UTranslate.none()));
  const stencil = { getStartingX: (): number => 0, getEndingX: (): number => textWidth };
  const textUg = UGraphicStencil.create(stroked, stencil, UStroke.simple());
  block.drawU(textUg.apply(new UTranslate(PAD_LEFT, PAD_TOP)));
}

import type { UGraphic } from '../UGraphic.js';
import { Back } from '../Back.js';
import { Fore } from '../Fore.js';
import { UTranslate } from '../UTranslate.js';
import type { StringBounder } from '../font/StringBounder.js';
import type { UFont } from '../font/UFont.js';
import { XDimension2D } from '../geom/XDimension2D.js';
import type { HColorOrPaint } from '../color/ColorMapper.js';
import { HColorAutomagic } from '../color/HColorAutomagic.js';
import { HColorGradient } from '../color/HColorGradient.js';
import { HColorSimple } from '../color/HColorSimple.js';
import { parseSimpleColor } from '../color/HColorSet.js';
import type { TextBlock } from './TextBlock.js';
import { UCenteredCharacter } from './UCenteredCharacter.js';
import { UEllipse } from './UEllipse.js';

/** `HColorAutomagic#getAppropriateColor(back)` wants an `HColor`; a `Paint`
 *  string is the port's spelling of one (`HColorOrPaint`), so it is parsed. */
function asHColor(back: HColorOrPaint): HColorSimple | HColorGradient {
  if (back instanceof HColorSimple || back instanceof HColorGradient) return back;
  if (typeof back !== 'string')
    throw new Error('CircledCharacter: a gradient Paint cannot be an automatic-colour backdrop');
  const parsed = parseSimpleColor(back);
  if (parsed === undefined) throw new Error(`CircledCharacter: "${back}" is not a colour`);
  return HColorSimple.create(parsed);
}

/**
 * CircledCharacter — the stereotype / participant "spot": a filled circle
 * with one centred letter. `drawU` fills the ellipse (back = spot colour,
 * fore = border), then draws the glyph with the font colour at the circle's
 * centre.
 *
 * Colours are {@link HColorOrPaint} (what `Fore`/`Back` carry here); the font
 * colour may also be `HColorAutomagic`, resolved against the back colour in the
 * constructor (CircledCharacter.java:62). Every other `HColor` answers
 * `getAppropriateColor` with itself (HColor.java:121-123).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/CircledCharacter.java:46-88
 */
export class CircledCharacter implements TextBlock {
  /** `this.c = "" + c` (java:57). */
  private readonly c: string;
  private readonly fontColor: HColorOrPaint;

  /** `spotBorder` is nullable upstream (java:51, the `!= null` test at :66).
   *  @see CircledCharacter.java:55-63 */
  constructor(
    c: string,
    private readonly radius: number,
    private readonly font: UFont,
    private readonly spotBackColor: HColorOrPaint,
    private readonly spotBorder: HColorOrPaint | null | undefined,
    fontColor: HColorOrPaint | HColorAutomagic,
  ) {
    this.c = c;
    this.fontColor =
      fontColor instanceof HColorAutomagic ? fontColor.getAppropriateColor(asHColor(spotBackColor)) : fontColor;
  }

  /** java:65-74: border, then back and the ellipse, then font colour and the
   *  glyph at `translate(radius, radius)`. `c.charAt(0)` is the first char. */
  drawU(ug: UGraphic): void {
    let g = ug;
    if (this.spotBorder !== null && this.spotBorder !== undefined) g = g.apply(new Fore(this.spotBorder));
    g = g.apply(new Back(this.spotBackColor));
    g.draw(UEllipse.build(this.radius * 2, this.radius * 2));
    g = g.apply(new Fore(this.fontColor));
    g = g.apply(new UTranslate(this.radius, this.radius));
    g.draw(new UCenteredCharacter(this.c.charAt(0), this.font));
  }

  /** @see CircledCharacter.java:76-78 */
  getPreferredWidth(_stringBounder: StringBounder): number {
    return 2 * this.radius;
  }

  /** @see CircledCharacter.java:80-82 */
  getPreferredHeight(_stringBounder: StringBounder): number {
    return 2 * this.radius;
  }

  /** @see CircledCharacter.java:84-86 */
  calculateDimension(stringBounder: StringBounder): XDimension2D {
    return new XDimension2D(this.getPreferredWidth(stringBounder), this.getPreferredHeight(stringBounder));
  }
}

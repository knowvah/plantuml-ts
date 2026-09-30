/**
 * `AtomOpenIconic` — an OpenIconic `<&name>` glyph inside a creole line
 * (`StripeSimple#addOpenIcon`, StripeSimple.java:239-243), as the polymorphic
 * `Atom` `Sea`/`SheetBlock1` lay out: `calculateDimensionSlow`
 * (`openIconic.asTextBlock` padded `withMargin(1, 0)`), `getStartingAltitude`
 * (`-3 * factor`) and `drawU` (the glyph's `UPath`, filled in the atom colour,
 * stroke thickness 0 — `OpenIconic#asTextBlock`, OpenIconic.java:196-209).
 *
 * The port's `StripeSimple` emits the plain-data `'inline'` openiconic token
 * (`creole-atoms.ts#OpenIconicAtomToken`); {@link asAtomOpenIconic} turns that
 * token into this class for an `AtomOps` bundle that dispatches composite
 * atoms polymorphically (`blocks-creole.ts#chromeAtomOps`). An unknown glyph
 * name yields `undefined`, upstream's `OpenIconic.retrieve == null` → no atom.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/atom/AtomOpenIconic.java:48-86
 */
import { AbstractAtom } from './AbstractAtom.js';
import type { CreoleAtom } from './Atom.js';
import { XDimension2D } from '../../geom/XDimension2D.js';
import { UPath } from '../../shape/UPath.js';
import { UTranslate } from '../../UTranslate.js';
import { UStroke } from '../../UStroke.js';
import { Fore } from '../../Fore.js';
import { Back } from '../../Back.js';
import type { UGraphic } from '../../UGraphic.js';
import type { StringBounder } from '../../font/StringBounder.js';
import type { FontConfiguration } from '../../shape/UText.js';
import { resolveColorToSvgHex } from '../../color/HColorSet.js';
import {
  isKnownOpenIconicGlyph,
  openIconicDims,
  openIconicFactor,
  openIconicStartingAltitude,
  parsedOpsFor,
  type OpenIconicOp,
} from '../../../openiconic-glyphs.js';
import { RAW_GLYPHS } from '../../../openiconic-glyphs-data.js';

/** `TextBlockUtils.withMargin(…, 1, 0)`'s left margin (AtomOpenIconic.java:66). */
const MARGIN_X = 1;

/** Upstream's `HColor` for a `null` font colour has no port; black is the
 *  jar's `FontColor` default (the class-member precedent,
 *  `class-member-atom-resolve.ts`). */
const DEFAULT_COLOR = '#000000';

/** One op of `SvgPath#toUPath(factorx, factory)` (SvgPath.java:146-186). */
function addOp(path: UPath, op: OpenIconicOp, f: number): void {
  switch (op.op) {
    case 'M':
      return path.moveTo(op.x * f, op.y * f);
    case 'L':
      return path.lineTo(op.x * f, op.y * f);
    case 'C':
      return path.cubicTo(op.c1x * f, op.c1y * f, op.c2x * f, op.c2y * f, op.x * f, op.y * f);
    case 'A':
      return path.arcTo(op.rx * f, op.ry * f, op.rot, op.laf, op.sf, op.x * f, op.y * f);
  }
}

/**
 * `SvgPath#toUPath(factor, factor)`: every coordinate scaled, then the
 * source SVG's own `translate(...)` scaled and applied last. `Z` is not in
 * the op list — upstream's `UPath#closePath` records nothing.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/SvgPath.java:146-190
 */
function openIconicUPath(name: string, factor: number): UPath {
  const path = UPath.none();
  for (const op of parsedOpsFor(name) ?? []) addOp(path, op, factor);
  const raw = RAW_GLYPHS[name];
  return path.translate((raw?.translateX ?? 0) * factor, (raw?.translateY ?? 0) * factor);
}

export class AtomOpenIconic extends AbstractAtom {
  private readonly openIconic: string;
  private readonly factor: number;
  private readonly color: string;

  /** @see AtomOpenIconic.java:55-61 — `factor = scale * size2D / 12`,
   *  `color = newColor == null ? fontConfiguration.getColor() : newColor`. */
  constructor(newColor: string | undefined, scale: number, openIconic: string, fontConfiguration: FontConfiguration) {
    super();
    this.openIconic = openIconic;
    this.factor = openIconicFactor(scale, fontConfiguration.size);
    this.color = newColor ?? fontConfiguration.color ?? DEFAULT_COLOR;
  }

  /** `openIconic.getDimension(factor)` + the `withMargin(1, 0)` (java:63-70). */
  protected calculateDimensionSlow(_stringBounder: StringBounder): XDimension2D {
    const { width, height } = openIconicDims(this.factor);
    return new XDimension2D(width, height);
  }

  /** @see AtomOpenIconic.java:72-74 */
  getStartingAltitude(_stringBounder: StringBounder): number {
    return openIconicStartingAltitude(this.factor);
  }

  /** `asTextBlock().drawU(ug)` (java:76-84; `url` is always `null` from
   *  `addOpenIcon`) → OpenIconic.java:198-202. */
  drawU(ug: UGraphic): void {
    ug.apply(new UTranslate(MARGIN_X, 0))
      .apply(new Fore(this.color))
      .apply(new Back(this.color))
      .apply(UStroke.withThickness(0))
      .draw(openIconicUPath(this.openIconic, this.factor));
  }
}

/**
 * The `AtomOpenIconic` an `'inline'` openiconic token stands for, or
 * `undefined` for any other atom (and for an unknown glyph). The token's
 * `ambientFont` is `StripeSimple`'s `fontConfiguration` at the scan position
 * (StripeSimple.java:242); `forcedColor` goes through `getColorOrWhite`
 * (CommandCreoleOpenIcon.java:86-89).
 */
export function asAtomOpenIconic(atom: CreoleAtom, baseFont: FontConfiguration): AtomOpenIconic | undefined {
  if (atom.kind !== 'inline' || atom.atom.kind !== 'openiconic') return undefined;
  const token = atom.atom;
  if (!isKnownOpenIconicGlyph(token.name)) return undefined;
  const forced = token.forcedColor === undefined ? undefined : resolveColorToSvgHex(token.forcedColor);
  return new AtomOpenIconic(forced, token.scale, token.name, atom.ambientFont ?? baseFont);
}

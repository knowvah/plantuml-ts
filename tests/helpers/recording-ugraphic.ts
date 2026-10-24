/**
 * A `UGraphic` that records instead of drawing (sdd3 batch 8). Each draw is
 * logged with the chain of `apply`s on the instance that drew -- the jar's
 * `ug.apply(...).apply(...).draw(shape)` -- so a `draw<X>` is pinned against
 * the Java lines it mirrors; the apply ORDER is what `UGraphicHandwritten`
 * depends on (a draw is jiggled by the RNG its instance's last `apply`
 * restarted). `startUrl`/`closeUrl` and `startGroup`/`closeGroup` are logged
 * in order beside the draws.
 */
import type { UChange } from '../../src/core/klimt/UChange.js';
import type { UGraphic } from '../../src/core/klimt/UGraphic.js';
import type { UParam } from '../../src/core/klimt/UParam.js';
import type { UShape } from '../../src/core/klimt/UShape.js';
import type { StringBounder } from '../../src/core/klimt/font/StringBounder.js';
import type { StringMeasurer } from '../../src/core/measurer.js';
import { MeasurerStringBounder } from '../../src/core/measurer-bounder.js';
import { Back } from '../../src/core/klimt/Back.js';
import { Fore } from '../../src/core/klimt/Fore.js';
import { UStroke } from '../../src/core/klimt/UStroke.js';
import { UTranslate } from '../../src/core/klimt/UTranslate.js';
import { HColorSimple } from '../../src/core/klimt/color/HColorSimple.js';
import { UCenteredCharacter } from '../../src/core/klimt/shape/UCenteredCharacter.js';
import { UEllipse } from '../../src/core/klimt/shape/UEllipse.js';
import { UImage } from '../../src/core/klimt/shape/UImage.js';
import { ULine } from '../../src/core/klimt/shape/ULine.js';
import { UPath } from '../../src/core/klimt/shape/UPath.js';
import { URectangle } from '../../src/core/klimt/shape/URectangle.js';
import { UText } from '../../src/core/klimt/shape/UText.js';

/** What the recorder logs. */
export type RecordedEvent =
  | { readonly draw: string; readonly chain: readonly string[] }
  | { readonly startUrl: string }
  | { readonly closeUrl: true };

function paintLabel(paint: unknown): string {
  if (typeof paint === 'string') return paint;
  if (paint instanceof HColorSimple) return paintLabel(paint.asPaint());
  return String(paint);
}

/** A change as one `kind(args)` token. */
export function changeLabel(change: UChange): string {
  if (change instanceof UTranslate) return `translate(${String(change.getDx())},${String(change.getDy())})`;
  if (change instanceof UStroke) {
    return `stroke(${String(change.getDashVisible())},${String(change.getDashSpace())},${String(change.getThickness())})`;
  }
  if (change instanceof Fore) return `fore(${paintLabel(change.getColor())})`;
  if (change instanceof Back) return `back(${paintLabel(change.getBackColor())})`;
  throw new Error('unexpected change');
}

/** A shape as one `Kind(args)` token. */
export function shapeLabel(shape: UShape): string {
  if (shape instanceof URectangle) return `URectangle(${String(shape.getWidth())},${String(shape.getHeight())})`;
  if (shape instanceof UEllipse) return `UEllipse(${String(shape.getWidth())},${String(shape.getHeight())})`;
  if (shape instanceof ULine) return `ULine(${String(shape.getDX())},${String(shape.getDY())})`;
  if (shape instanceof UPath) return 'UPath';
  if (shape instanceof UText) return `UText(${shape.getText()})`;
  if (shape instanceof UImage) return `UImage(${String(shape.getWidth())},${String(shape.getHeight())})`;
  if (shape instanceof UCenteredCharacter) {
    return `UCenteredCharacter(${shape.getChar()},${String(shape.getFont().getSize())})`;
  }
  return shape.constructor.name;
}

/** The recorder; `log` is shared by every instance an `apply` derives. */
export class RecordingUGraphic implements UGraphic {
  constructor(
    private readonly measurer: StringMeasurer,
    readonly log: RecordedEvent[] = [],
    private readonly chain: readonly string[] = [],
  ) {}

  apply(change: UChange): UGraphic {
    return new RecordingUGraphic(this.measurer, this.log, [...this.chain, changeLabel(change)]);
  }

  draw(shape: UShape): void {
    this.log.push({ draw: shapeLabel(shape), chain: this.chain });
  }

  startUrl(url: { readonly url: string }): void {
    this.log.push({ startUrl: url.url });
  }

  closeUrl(): void {
    this.log.push({ closeUrl: true });
  }

  getParam(): UParam {
    throw new Error('the draw functions never read the param');
  }

  getTranslate(): UTranslate {
    return UTranslate.none();
  }

  getStringBounder(): StringBounder {
    return new MeasurerStringBounder(this.measurer);
  }
}

/** Run `draw` on a fresh recorder and return its log. */
export function record(measurer: StringMeasurer, draw: (ug: UGraphic) => void): RecordedEvent[] {
  const ug = new RecordingUGraphic(measurer);
  draw(ug);
  return ug.log;
}

import { Back } from '../../../core/klimt/Back.js';
import { Fore } from '../../../core/klimt/Fore.js';
import type { UGraphic } from '../../../core/klimt/UGraphic.js';
import { UStroke } from '../../../core/klimt/UStroke.js';
import { UTranslate } from '../../../core/klimt/UTranslate.js';
import type { HColorOrPaint } from '../../../core/klimt/color/ColorMapper.js';
import { HColors } from '../../../core/klimt/color/HColors.js';
import { ULine } from '../../../core/klimt/shape/ULine.js';
import { URectangle } from '../../../core/klimt/shape/URectangle.js';
import { Segment } from '../../../core/sequencediagram/graphic/Segment.js';
import { PathUtils } from './PathUtils.js';

/**
 * RectangleTask -- the bar of one task, cut into segments by the paused spans.
 *
 * `documentBackground` is the `HColor` of the Java signatures; `HColor#bg()`
 * is `new Back(...)` and `ug.apply(HColor)` is `new Fore(...)` here.
 * The `TeaVM.a()` assertion guards (RectangleTask.java:86-89,150-151) are
 * dropped (T1f precedent).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/RectangleTask.java:54-232
 */
export class RectangleTask {
  readonly #segments: Segment[];
  readonly #round: number;
  readonly #completion: number;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/RectangleTask.java:59-67 */
  public constructor(startPos: number, endPos: number, round: number, completion: number, paused: Iterable<Segment>) {
    this.#round = round;
    this.#completion = completion;
    if (startPos < endPos) this.#segments = [...new Segment(startPos, endPos).cutSegmentIfNeed(paused)];
    else this.#segments = [new Segment(startPos, startPos + 1)];
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/RectangleTask.java:69-72 */
  #draw2hlines(ug: UGraphic, height: number, hline: ULine): void {
    ug.draw(hline);
    ug.apply(UTranslate.dy(height)).draw(hline);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/RectangleTask.java:74-111 */
  public draw(
    ug: UGraphic,
    height: number,
    documentBackground: HColorOrPaint,
    oddStart: boolean,
    oddEnd: boolean,
  ): void {
    if (this.#round === 0) {
      this.#drawWithoutRound(ug, height, documentBackground, oddStart, oddEnd);
      return;
    }

    if (this.#segments.length !== 1) {
      this.#drawWithRound(ug, height, documentBackground);
      return;
    }

    // RectangleTask.java:86-89: TeaVM.a() asserts (segments.size() == 1, round > 0) dropped.
    const segment = this.#segments[0]!;
    const round = this.#round;
    const completion = this.#completion;

    const width = segment.getLength();
    const partial = URectangle.build(width, height).rounded(round);
    if (completion === 100 || completion === 0) {
      if (completion === 0) ug = ug.apply(new Back(documentBackground));
      if (oddStart && !oddEnd)
        ug.apply(UTranslate.dx(segment.getPos1())).draw(PathUtils.UtoRight(width, height, round));
      else if (!oddStart && oddEnd)
        ug.apply(UTranslate.dx(segment.getPos1())).draw(PathUtils.UtoLeft(width, height, round));
      else ug.apply(UTranslate.dx(segment.getPos1())).draw(partial);
    } else {
      const x1 = (width * completion) / 100;
      ug.apply(new Fore(HColors.none()))
        .apply(UTranslate.dx(segment.getPos1()))
        .draw(PathUtils.UtoLeft(x1, height, round));
      ug.apply(new Back(documentBackground))
        .apply(new Fore(HColors.none()))
        .apply(UTranslate.dx(segment.getPos1() + x1))
        .draw(PathUtils.UtoRight((width * (100 - completion)) / 100, height, round));
      ug.apply(new Back(HColors.none())).apply(UTranslate.dx(segment.getPos1())).draw(partial);
    }
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/RectangleTask.java:113-128 */
  #drawWithRound(ug: UGraphic, height: number, documentBackground: HColorOrPaint): void {
    const first = this.#segments[0]!;
    ug.apply(UTranslate.dx(first.getPos1())).draw(PathUtils.UtoLeft(first.getLength(), height, this.#round));

    for (let i = 1; i < this.#segments.length - 1; i++) {
      const segment = this.#segments[i]!;
      this.#drawPartly(
        (segment.getLength() * this.#completion) / 100,
        ug,
        segment,
        height,
        documentBackground,
        i,
        false,
        false,
      );
    }

    const last = this.#segments[this.#segments.length - 1]!;
    ug.apply(UTranslate.dx(last.getPos1())).draw(PathUtils.UtoRight(last.getLength(), height, this.#round));

    this.#drawIntermediateDotted(ug, height);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/RectangleTask.java:130-161 */
  #drawWithoutRound(
    ug: UGraphic,
    height: number,
    documentBackground: HColorOrPaint,
    oddStart: boolean,
    oddEnd: boolean,
  ): void {
    const sumWidth = this.#getFullSegmentsLength();
    const lim = this.#completion === 100 ? sumWidth : (sumWidth * this.#completion) / 100;
    if (this.#segments.length === 1 && !oddStart && !oddEnd) {
      this.#drawFull(this.#completion === 100 ? -1 : lim, ug, this.#segments[0]!, height, documentBackground);
      return;
    }
    let current = 0;

    for (let i = 0; i < this.#segments.length; i++) {
      const segment = this.#segments[i]!;
      const next = current + segment.getLength();
      let widthCompletion: number;
      if (lim >= next) widthCompletion = -1;
      else if (current >= lim) widthCompletion = 0;
      // RectangleTask.java:150-151: TeaVM.a() assert (current < lim && lim < next) dropped.
      else widthCompletion = lim - current;

      this.#drawPartly(
        widthCompletion,
        ug,
        segment,
        height,
        documentBackground,
        i,
        !oddStart && i === 0,
        !oddEnd && i === this.#segments.length - 1,
      );

      current = next;
    }
    this.#drawIntermediateDotted(ug, height);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/RectangleTask.java:163-168 */
  #getFullSegmentsLength(): number {
    let result = 0;
    for (const seg of this.#segments) result += seg.getLength();
    return result;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/RectangleTask.java:170-179 */
  #drawIntermediateDotted(ug: UGraphic, height: number): void {
    ug = ug.apply(new UStroke(2, 3, 1));
    for (let i = 0; i < this.#segments.length - 1; i++) {
      const v1 = this.#segments[i]!.getPos2() + 3;
      const v2 = this.#segments[i + 1]!.getPos1() - 3;
      if (v2 > v1) this.#draw2hlines(ug.apply(UTranslate.dx(v1)), height, ULine.hline(v2 - v1));
    }
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/RectangleTask.java:181-188 */
  #drawFull(
    widthCompletion: number,
    ug: UGraphic,
    segment: Segment,
    height: number,
    documentBackground: HColorOrPaint,
  ): void {
    const width = segment.getLength();
    ug = ug.apply(UTranslate.dx(segment.getPos1()));
    this.#drawBackgroundRect(widthCompletion, ug.apply(new Fore(HColors.none())), documentBackground, width, height);
    const rect = URectangle.build(width, height);
    ug.apply(new Back(HColors.none())).draw(rect);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/RectangleTask.java:190-215 */
  #drawPartly(
    widthCompletion: number,
    ug: UGraphic,
    segment: Segment,
    height: number,
    documentBackground: HColorOrPaint,
    i: number,
    withStartVline: boolean,
    withEndVline: boolean,
  ): void {
    if (withStartVline && withEndVline) throw new Error('IllegalArgumentException');

    let widthBack = segment.getLength();
    if (i !== this.#segments.length - 1) widthBack++;

    ug = ug.apply(UTranslate.dx(segment.getPos1()));

    if (widthBack > 0)
      this.#drawBackgroundRect(
        widthCompletion,
        ug.apply(new Fore(HColors.none())),
        documentBackground,
        widthBack,
        height,
      );

    ug = ug.apply(new Back(HColors.none()));

    if (withStartVline) ug.draw(PathUtils.UtoLeft(segment.getLength(), height, 0));
    else if (withEndVline)
      // Upstream's own `x - x` (RectangleTask.java:209-211): kept verbatim, never "fixed" to dx(0).
      ug.apply(UTranslate.dx(segment.getLength() - segment.getLength())).draw(
        PathUtils.UtoRight(segment.getLength(), height, 0),
      );
    else this.#draw2hlines(ug, height, ULine.hline(segment.getLength()));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/RectangleTask.java:217-231 */
  #drawBackgroundRect(
    widthCompletion: number,
    ug: UGraphic,
    documentBackground: HColorOrPaint,
    width: number,
    height: number,
  ): void {
    if (widthCompletion === -1 || widthCompletion === 0) {
      if (widthCompletion === 0) ug = ug.apply(new Back(documentBackground));
      const rect = URectangle.build(width, height);
      ug.draw(rect);
    } else {
      const rect1 = URectangle.build(widthCompletion, height);
      ug.draw(rect1);
      const rect2 = URectangle.build(width - widthCompletion, height);
      ug.apply(new Back(documentBackground)).apply(UTranslate.dx(widthCompletion)).draw(rect2);
    }
  }
}

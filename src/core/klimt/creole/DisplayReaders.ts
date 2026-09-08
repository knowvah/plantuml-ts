/**
 * `Display`'s read-only derived-value methods (`getStereotypeIfAny`,
 * `isWhite`, `toString`, `contentWidth`, `cacheKey`, the `Iterable`
 * protocol), plus `equalsLike` and the `createFoo` factory -- split out
 * of `Display.ts` purely to keep that file under this project's
 * 500-line cap (mirrors the existing `DisplayText.ts`/
 * `DisplayEquality.ts`/`DisplayNewlines.ts` split precedent -- a pure
 * logic split, re-exported from the file whose public API this
 * augments, zero behavior change).
 *
 * Every function here reads/builds a `Display` through its PUBLIC
 * surface only (`isNull`, `asList()`, `size()`, `get(i)`, `equals()`,
 * `Display.create()`) -- no private-field access across the file split,
 * matching `DisplayText.ts#withData`'s own documented convention.
 * `asList()` already returns `this.f.displayData ?? []`, so substituting
 * it for a direct `this.f.displayData ?? []` read is behavior-identical
 * for every function below.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/Display.java
 */
import { Display } from './Display.js';
import type { DisplayElement } from './Display.js';
import { isStereotype } from '../../stereo/Stereotype.js';
import type { Stereotype } from '../../stereo/Stereotype.js';
import type { DisplayLine } from './SheetBuilder.js';
import type { StringLocated } from '../../tim/StringLocated.js';
import { EmbeddedDiagram } from '../../EmbeddedDiagram.js';

const ONLY_WHITESPACE = /^\s*$/;

/** java:139-146. */
export function getStereotypeIfAny(display: Display): Stereotype | undefined {
  for (const cs of display.asList()) {
    if (isStereotype(cs)) return cs;
  }
  return undefined;
}

/** java:172-175. */
export function isWhite(display: Display): boolean {
  if (display.isNull || display.size() === 0) return true;
  return display.size() === 1 && ONLY_WHITESPACE.test(String(display.get(0)));
}

/** java:497-503. */
export function toStringOf(display: Display): string {
  if (display.isNull) return 'NULL';
  return `[${display
    .asList()
    .map((e) => String(e))
    .join(', ')}]`;
}

/** java:769-777. */
export function contentWidth(display: Display): number {
  let width = 0;
  for (let i = 0; i < display.size(); i++) {
    const len = String(display.get(i)).length;
    if (len > width) width = len;
  }
  return width;
}

/** `cacheKey()` -- not an upstream member, see `Display.ts`'s own module
 *  doc comment / `SheetBuilder.ts`'s documented contract. */
export function cacheKeyOf(display: Display): string {
  if (display.isNull) return ' NULL';
  return display
    .asList()
    .map((e) => (isStereotype(e) ? `S:${e.toString()}` : `s:${String(e)}`))
    .join(' ');
}

/** `DisplayLike`'s `Iterable<DisplayLine>` surface -- see `Display.ts`'s
 *  own module doc comment for why a `MessageNumber` element is coerced
 *  to a plain string here rather than yielded verbatim. */
export function iteratorOf(display: Display): Iterator<DisplayLine> {
  const data = display.asList();
  let i = 0;
  return {
    next: (): IteratorResult<DisplayLine> => {
      if (i >= data.length) return { done: true, value: undefined };
      const element = data[i] as DisplayElement;
      i++;
      return { done: false, value: isStereotype(element) ? element : String(element) };
    },
  };
}

/** java:117-121. */
export function equalsLike(display: Display, other: Display): boolean {
  if (display.isNull) return other.isNull;
  return display.equals(other);
}

/** java:185-198 -- `NoSuchColorException` not propagated (this port's
 *  color resolvers never throw, `HColorSet.ts`'s own established
 *  convention); `CreoleParser.checkColor(result)` is commented out
 *  upstream too (dead code, not a drop). */
export function createFooOf(data: readonly StringLocated[]): Display {
  const tmp: string[] = data.map((s) => s.getString());
  if (tmp.length > 2) {
    const last = tmp[tmp.length - 1];
    const secondLast = tmp[tmp.length - 2];
    if (last === '' && secondLast === EmbeddedDiagram.EMBEDDED_END) tmp.pop();
  }
  return Display.create(tmp);
}

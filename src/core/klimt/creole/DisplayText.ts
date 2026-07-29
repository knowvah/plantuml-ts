/**
 * DisplayText — `Display`'s "same metadata, new content" list-manipulation
 * family (`add*`/`with*`/`replace*`/`underlined*`/`splitMultiline`/...)
 * plus its two subsystem-blocked seams (`withoutStereotypeIfNeeded`,
 * `hasUrl`). Split out of `Display.ts` to stay under this project's
 * per-file size cap (`Display.ts`'s own module doc comment). Every
 * function here is called by exactly one thin one-line delegator method
 * on the `Display` class itself, so `display.replace(...)`, `display
 * .add(...)`, etc. still read like ordinary instance methods to callers —
 * only the substantive logic (and its Java citation) lives here, built
 * entirely on `Display`'s already-public surface (`asList`/`get`/`size`/
 * `showStereotype`/`withData`/`withMetadataOnly`), with no private-field
 * access across the file split.
 *
 * ## Disclosed simplification: `asList()`-based reads, not raw-field NPEs
 *
 * Several of these methods (`replace`/`manageGuillemet`/`underlined*`/
 * `addAll`/`addFirst`/`add`/`addGeneric`/`appendFirstLine`/
 * `removeEndingStereotype`/`getEndingStereotype`/`splitMultiline`/
 * `hasSeveralGuideLines`) read upstream's raw `displayData` field directly
 * with NO null guard (java iterates/indexes it unconditionally), so
 * calling one of them on a NULL `Display` throws a `NullPointerException`
 * upstream. This file's only public read surface across the class split
 * is `asList()` — which upstream ITSELF explicitly null-guards
 * (java:560-564, `displayData == null -> Collections.emptyList()`,
 * unlike its NPE-throwing siblings) — so every function here that reads
 * via `asList()` treats a NULL `Display` as an EMPTY one instead of
 * throwing. Zero callers reach any of these methods on a NULL `Display`
 * today (ADR-8: nothing calls `Display` at all yet); replicating each
 * method's individual raw-field NPE would mean manufacturing a SEPARATE,
 * non-null-safe accessor whose only purpose is reproducing a crash — not
 * done. `withPage` is the one upstream method in this family that
 * ALREADY guards null explicitly (java:428-429, `displayData == null ->
 * return this`), so its behavior here matches upstream exactly, not just
 * incidentally.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/Display.java
 */
import type { Display, DisplayElement } from './Display.js';
import { Stereotype } from '../../stereo/Stereotype.js';
import { manageGuillemet as guillemetManage, GUILLEMET_DEFAULT } from '../../text/Guillemet.js';
import { hasSeveralGuideLinesOfAll } from './DisplayNewlines.js';

const STEREOTYPE_PATTERN = /^(.*?)(<<\s*(.*)\s*>>)\s*$/;
const NAME_COLON_REST_PATTERN = /^([^:]+?)(\s*:.+)$/;

/**
 * `skin/VisibilityModifier.java#isVisibilityCharacter` (java:211-234) --
 * ported as a local, self-contained predicate (matching this batch's own
 * `klimt.creole.Parser#getScale` precedent, `.agent-notes/
 * T9b-stereotype.md`): the full 355-line `VisibilityModifier` enum needs
 * `HColor`/`ColorParam`/`UEllipse`/`UPolygon` (an icon-drawing subsystem
 * out of scope), but this ONE static predicate reads none of the enum's
 * own fields.
 */
function isVisibilityCharacter(s: string): boolean {
  if (s.length <= 2) return false;
  const c = s.charAt(0);
  if (s.charAt(1) === c) return false;
  return c === '-' || c === '#' || c === '+' || c === '~' || c === '*';
}

/** java:148-157 (`@JawsStrange`). */
export function replaceBackslashT(display: Display): Display {
  const data = display.asList().map((e) => {
    const s = String(e);
    return s.includes('\\t') ? s.replaceAll('\\t', '\t') : e;
  });
  return display.withData(data);
}

/** java:159-168. */
export function replace(display: Display, src: string, dest: string): Display {
  const data = display.asList().map((e) => {
    const s = String(e);
    return s.includes(src) ? s.replaceAll(src, dest) : e;
  });
  return display.withData(data);
}

/** java:410-425. */
export function manageGuillemet(display: Display, manageVisibilityModifier: boolean): Display {
  const result: DisplayElement[] = [];
  let first = true;
  for (const line of display.asList()) {
    let lineString = String(line);
    if (manageVisibilityModifier && first && isVisibilityCharacter(lineString)) {
      lineString = lineString.slice(1).trim();
    }
    result.push(guillemetManage(lineString, GUILLEMET_DEFAULT));
    first = false;
  }
  return display.withData(result);
}

/** java:427-439. */
export function withPage(display: Display, page: number, lastpage: number): Display {
  // java:428-429 -- the ONE upstream method in this family that already
  // guards null explicitly; `display.isNull` (public getter) matches it
  // exactly, unlike this file's other `asList()`-based reads (see module
  // doc comment).
  if (display.isNull) return display;
  const data = display.asList().map((line) => String(line).replaceAll('%page%', String(page)).replaceAll('%lastpage%', String(lastpage)));
  return display.withData(data);
}

/** java:441-450. */
export function removeEndingStereotype(display: Display): Display {
  const data = display.asList();
  const m = STEREOTYPE_PATTERN.exec(String(data[data.length - 1]));
  if (m === null) return display;
  const result = [...data];
  result[result.length - 1] = m[1] as string;
  return display.withData(result);
}

/** java:454-460. */
export function getEndingStereotype(display: Display): Stereotype | undefined {
  const data = display.asList();
  const m = STEREOTYPE_PATTERN.exec(String(data[data.length - 1]));
  return m === null ? undefined : Stereotype.build(m[2]);
}

/** java:462-469. */
export function underlined(display: Display): Display {
  return display.withData(display.asList().map((line) => `<u>${String(line)}`));
}

/** java:473-488. */
export function underlinedName(display: Display): Display {
  const result: string[] = [];
  for (const line of display.asList()) {
    const s = String(line);
    if (result.length === 0) {
      const m = NAME_COLON_REST_PATTERN.exec(s);
      result.push(m !== null ? `<u>${m[1]}</u>${m[2]}` : `<u>${s}`);
    } else {
      result.push(`<u>${s}`);
    }
  }
  return display.withData(result);
}

/** java:505-509. */
export function addAll(display: Display, other: Display): Display {
  return display.withData([...display.asList(), ...other.asList()]);
}

/** java:511-515. */
export function addFirst(display: Display, s: DisplayElement): Display {
  return display.withData([s, ...display.asList()]);
}

/** java:517-521. */
export function appendFirstLine(display: Display, appended: string): Display {
  const data = [...display.asList()];
  data[0] = appended + String(data[0]);
  return display.withData(data);
}

/** java:523-527. */
export function add(display: Display, s: DisplayElement): Display {
  return display.withData([...display.asList(), s]);
}

/** java:529-538. */
export function addGeneric(display: Display, s: DisplayElement): Display {
  const data = [...display.asList()];
  if (data.length === 0) {
    data.push(`<${String(s)}>`);
  } else {
    data[data.length - 1] = `${String(data[data.length - 1])}<${String(s)}>`;
  }
  return display.withData(data);
}

/** java:579-599. `separator` is a `RegExp` (matches upstream's
 *  `Matcher#find`, first occurrence per line) -- always re-anchored
 *  without the `g` flag internally, so a caller-supplied global regex's
 *  `lastIndex` state cannot leak between lines. */
export function splitMultiline(display: Display, separator: RegExp): readonly Display[] {
  const result: Display[] = [];
  let pending = display.withMetadataOnly();
  result.push(pending);
  const nonGlobal = new RegExp(separator.source, separator.flags.replace('g', ''));
  for (const line of display.asList()) {
    const s = String(line);
    const m = nonGlobal.exec(s);
    if (m === null) {
      pending = pending.withData([...pending.asList(), line]);
      result[result.length - 1] = pending;
      continue;
    }
    pending = pending.withData([...pending.asList(), s.slice(0, m.index)]);
    result[result.length - 1] = pending;
    pending = display.withMetadataOnly().withData([s.slice(m.index + m[0].length)]);
    result.push(pending);
  }
  return result;
}

/** java:601-605. */
export function toTooltipText(display: Display): string {
  if (display.size() === 0) return '';
  return String(display.get(0));
}

/** java:715-717. */
export function hasSeveralGuideLines(display: Display): boolean {
  return hasSeveralGuideLinesOfAll(display.asList());
}

/**
 * Line wrapping, as upstream does it — by splitting a line into ATOMS and
 * breaking between them, not by re-joining words into strings.
 *
 * @see ~/git/plantuml/.../klimt/creole/Fission.java
 * @see ~/git/plantuml/.../klimt/creole/legacy/AtomText.java#getNeutrons
 *
 * The observable consequence, and the reason this is a port rather than a
 * tidy-up: **each atom is drawn as its OWN `<text>` element.** With wrap
 * active the jar emits one `<text>` per word AND one per inter-word space —
 * `'This'`, `' '`, `'is'`, `' '`, `'a'`, … — where this port emitted
 * one per wrapped line. On `json/noleta-28-nutu456` that is 134 elements
 * against 22.
 *
 * Wrapping is the ONLY thing that splits a line this way: `Fission#getSplitted`
 * returns the stripe untouched when `maxWidth` is 0 (`Fission.java:64-66`), so
 * an unwrapped cell stays a single atom and a single `<text>`. That is why the
 * fixtures already byte-conformant are unaffected by any of this.
 */


/** @see .../klimt/creole/NeutronType.java */
export type NeutronType = 'UNBREAKABLE' | 'WHITESPACE' | 'CJK_IDEOGRAPH' | 'ZWSP_SEPARATOR';

/** One indivisible run of text, or a zero-width break opportunity. */
export interface Neutron {
  readonly type: NeutronType;
  /** Empty for a `ZWSP_SEPARATOR`, which carries no text and no width. */
  readonly text: string;
}

const ZWSP: Neutron = { type: 'ZWSP_SEPARATOR', text: '' };

/**
 * `Character.isWhitespace` — Java's definition, which this approximates with
 * the Unicode space property plus the ASCII control whitespace Java includes.
 * Deliberately NOT `/\s/`, which also matches U+00A0; Java's
 * `isWhitespace` excludes NBSP precisely because it is non-breaking, and this
 * port relies on that: json's nested cell is three NBSPs and must stay ONE
 * unbreakable atom.
 */
const JAVA_WHITESPACE_RE = new RegExp('[\\t\\n\\u000B\\f\\r \\u001C-\\u001F\\u1680\\u2000-\\u2006\\u2008-\\u200A\\u2028\\u2029\\u205F\\u3000]');

/** @see .../klimt/creole/Neutron.java#isCjkOrJapanese */
const CJK_RE = new RegExp('[\\u2E80-\\u9FFF\\uF900-\\uFAFF\\uFF00-\\uFFEF]');

function neutronTypeFromChar(ch: string): NeutronType {
  if (JAVA_WHITESPACE_RE.test(ch)) return 'WHITESPACE';
  if (CJK_RE.test(ch)) return 'CJK_IDEOGRAPH';
  return 'UNBREAKABLE';
}

/**
 * `AtomText#getNeutrons` (`AtomText.java:278-306`) — accumulate characters
 * while their type is unchanged, flushing on a type change. `CJK_IDEOGRAPH`
 * additionally flushes on EVERY character, because each ideograph is its own
 * break opportunity.
 *
 * `addPending` (`:308-315`) then surrounds a WHITESPACE or CJK run with
 * `ZWSP_SEPARATOR`s on BOTH sides — those are where {@link splitStripe} is
 * allowed to break.
 */
export function getNeutrons(text: string): Neutron[] {
  const result: Neutron[] = [];
  let pending = '';

  const addPending = (): void => {
    if (pending === '') return;
    const type = neutronTypeFromChar(pending.charAt(0));
    const breakable = type === 'WHITESPACE' || type === 'CJK_IDEOGRAPH';
    if (breakable) result.push(ZWSP);
    result.push({ type, text: pending });
    if (breakable) result.push(ZWSP);
    pending = '';
  };

  for (const ch of text) {
    if (pending === '') {
      pending = ch;
      continue;
    }
    const pendingType = neutronTypeFromChar(pending.charAt(0));
    if (pendingType !== neutronTypeFromChar(ch) || pendingType === 'CJK_IDEOGRAPH') addPending();
    pending += ch;
  }
  addPending();
  return result;
}

/** One line's worth of neutrons, mid-build. */
interface WorkingLine {
  readonly removeInitialSpaces: boolean;
  readonly neutrons: Neutron[];
  width: number;
}

/** `StripeSimpleInternal#addNeutron` (`Fission.java:202-216`). */
function addNeutron(line: WorkingLine, n: Neutron, widthOf: (n: Neutron) => number): void {
  const last = line.neutrons[line.neutrons.length - 1];
  if (n.type === 'ZWSP_SEPARATOR' && line.neutrons.length === 0) return;
  if (n.type === 'ZWSP_SEPARATOR' && last?.type === 'ZWSP_SEPARATOR') return;
  if (line.removeInitialSpaces && line.neutrons.length === 0 && n.type === 'WHITESPACE') return;
  line.neutrons.push(n);
  line.width += widthOf(n);
}

/** `#lastZwsp` + `#slightyShorten` (`:145-159`, `:181-187`) — give back
 *  everything from the last break opportunity onward, so it starts the next
 *  line. Returns empty when the line has no break in it at all, which is how
 *  an unbreakable run longer than `maxWidth` stays on one line. */
function slightlyShorten(line: WorkingLine): Neutron[] {
  const lastZwsp = line.neutrons.map((n) => n.type).lastIndexOf('ZWSP_SEPARATOR');
  if (lastZwsp === -1) return [];
  return line.neutrons.splice(lastZwsp);
}

/** `#removeFinalSpaces` (`:168-174`) — drop leading separators, then trailing
 *  whitespace and separators, but never the last remaining neutron. */
function removeFinalSpaces(line: WorkingLine): void {
  while (line.neutrons.length > 0 && line.neutrons[0]!.type === 'ZWSP_SEPARATOR') line.neutrons.shift();
  while (
    line.neutrons.length > 1 &&
    (line.neutrons[line.neutrons.length - 1]!.type === 'WHITESPACE' ||
      line.neutrons[line.neutrons.length - 1]!.type === 'ZWSP_SEPARATOR')
  ) {
    line.neutrons.pop();
  }
}

function isWhite(line: WorkingLine): boolean {
  return line.neutrons.every((n) => n.type === 'ZWSP_SEPARATOR' || n.type === 'WHITESPACE');
}

/**
 * `Fission#getSplitted` (`Fission.java:63-101`).
 *
 * Walks the neutrons once. At a break opportunity, if the line is ALREADY over
 * `maxWidth`, everything back to that break is returned to the queue and a new
 * line starts — so the overflowing word moves down whole rather than being cut.
 *
 * Returns the drawable atoms per line: separators carry no text and are
 * dropped, and a continuation line drops any whitespace it would start with.
 *
 * `maxWidth <= 0` returns the input as a single unsplit line, which is the
 * no-wrap case and must stay one atom.
 */
export function splitStripe(
  text: string,
  maxWidth: number,
  measure: (s: string) => number,
): string[][] {
  if (!(Math.abs(maxWidth) > 0)) return [[text]];

  const widthOf = (n: Neutron): number => (n.type === 'ZWSP_SEPARATOR' ? 0 : measure(n.text));
  const queue = getNeutrons(text);
  if (queue.length > 0 && queue[queue.length - 1]!.type !== 'ZWSP_SEPARATOR') queue.push(ZWSP);

  const lines: WorkingLine[] = [{ removeInitialSpaces: false, neutrons: [], width: 0 }];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const line = lines[lines.length - 1]!;
    if (current.type === 'ZWSP_SEPARATOR' && line.width > Math.abs(maxWidth)) {
      queue.unshift(current, ...slightlyShorten(line));
      line.width = line.neutrons.reduce((a, n) => a + widthOf(n), 0);
      lines.push({ removeInitialSpaces: true, neutrons: [], width: 0 });
    } else {
      addNeutron(line, current, widthOf);
    }
  }

  for (const l of lines) removeFinalSpaces(l);
  while (lines.length > 1 && isWhite(lines[lines.length - 1]!)) lines.pop();

  return lines.map((l) => {
    const atoms: string[] = [];
    for (const n of l.neutrons) {
      if (n.type === 'ZWSP_SEPARATOR') continue;
      if (l.removeInitialSpaces && atoms.length === 0 && n.type === 'WHITESPACE') continue;
      atoms.push(n.text);
    }
    return atoms;
  });
}

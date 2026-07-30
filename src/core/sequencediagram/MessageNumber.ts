/**
 * `MessageNumber` — the auto-numbered `autonumber`/explicit sequence
 * message index (`1)`, `<b>2)`), and one of the `CharSequence`-typed
 * element kinds a `Display`'s element list can hold
 * (`Display.create0`'s `get(0) instanceof MessageNumber` dispatch, T9c's
 * own consumer).
 *
 * Faithful port of `sequencediagram/MessageNumber.java` (67 ln). No
 * dependencies beyond `String`; no pre-existing equivalent anywhere in
 * this port (grepped `src/` for `MessageNumber` before writing this file
 * — zero hits).
 *
 * `CharSequence` has no TypeScript equivalent; `charAt`/`length`/
 * `subSequence` are ported as ordinary methods, matching `Stereotype.ts`'s
 * own translation of the identical upstream contract. `instanceof
 * MessageNumber` already works in TypeScript (a real class, unlike Java's
 * shared `CharSequence` interface) — this class also carries an explicit
 * `readonly kind = 'MessageNumber'` discriminant plus an {@link
 * isMessageNumber} type guard, for a `Display` element union that also
 * includes plain `string` (which has no `instanceof`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/MessageNumber.java
 */

/** `<\/?b>` — a bold-markup tag, stripped by {@link MessageNumber#getNumberRaw}. */
const BOLD_TAG_RE = /<\/?b>/g;

export class MessageNumber {
  /** Discriminant for a `Display` element-list union (see file doc). */
  readonly kind = 'MessageNumber' as const;

  private readonly representation: string;

  /** java:47-49. */
  constructor(s: string) {
    this.representation = s;
  }

  /** java:42-45. */
  toString(): string {
    return this.representation;
  }

  /** `MessageNumber#getNumberRaw` (java:51-53): strips `<b>`/`</b>` tags. */
  getNumberRaw(): string {
    BOLD_TAG_RE.lastIndex = 0;
    return this.representation.replace(BOLD_TAG_RE, '');
  }

  /** `CharSequence#charAt` (java:55-57). */
  charAt(index: number): string {
    return this.representation.charAt(index);
  }

  /** `CharSequence#length` (java:59-61). */
  length(): number {
    return this.representation.length;
  }

  /** `CharSequence#subSequence` (java:63-65). */
  subSequence(start: number, end: number): string {
    return this.representation.substring(start, end);
  }
}

/** Discriminate a `Display` element (see file doc) as a `MessageNumber`. */
export function isMessageNumber(value: unknown): value is MessageNumber {
  return value instanceof MessageNumber;
}

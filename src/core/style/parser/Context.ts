import { PNAMES, type PName } from '../PName.js';
import { retrieve } from '../SName.js';
import { Style } from '../Style.js';
import { addPriorityForStereotype } from '../StyleLoader.js';
import { StyleSignatureBasic } from '../StyleSignatureBasic.js';
import type { Value } from '../Value.js';

/**
 * `EnumMap.put`: set `key`, keeping `map` (the SAME object) in PName
 * ordinal order, which is how an `EnumMap` iterates.
 */
function enumMapPut(map: Map<PName, Value>, key: PName, value: Value): void {
  if (map.has(key)) {
    map.set(key, value);
    return;
  }
  map.set(key, value);
  const ordered = PNAMES.filter((p) => map.has(p)).map((p) => [p, map.get(p)!] as const);
  map.clear();
  for (const [p, v] of ordered) map.set(p, v);
}

/**
 * `String.split(",")`: Java drops trailing empty strings, and a string
 * with no match is itself the only element.
 */
function splitComma(s: string): string[] {
  const parts = s.split(',');
  if (parts.length === 1) return parts;
  while (parts.length > 0 && parts[parts.length - 1] === '') parts.pop();
  return parts;
}

/** `Integer.parseInt(s.replaceAll("\\D", ""))`. @see Context.java:81 */
function parseLevel(s: string): number {
  const digits = s.replace(/\D/g, '');
  const n = Number(digits);
  if (digits.length === 0 || n > 2147483647) throw new Error(`NumberFormatException: For input string: "${digits}"`);
  return n;
}

/**
 * Context — one open selector block of a style text: the signatures it
 * declares (each parent signature extended by each comma-separated
 * selector) and the values set inside it.
 *
 * Mutation contract, as upstream: `putInContext` mutates this context's
 * map in place, and `toStyles` hands that SAME map to every non-stereotype
 * `Style` it builds (Context.java:128-131 — no copy), so a value put after
 * `toStyles` is visible through those styles.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/parser/Context.java:52-144
 */
export class Context {
  /** @see Context.java:54 */
  private readonly signatures: StyleSignatureBasic[] = [];
  /** An `EnumMap<PName, Value>`. @see Context.java:56 */
  private readonly map = new Map<PName, Value>();
  /** @see Context.java:57 */
  private parent: Context | undefined;

  private constructor() {}

  /** One empty signature, no parent. @see Context.java:62-66 */
  static empty(): Context {
    const result = new Context();
    result.signatures.push(StyleSignatureBasic.empty());
    return result;
  }

  /**
   * A child context: a leading `:` and a trailing `*` (the star flag) are
   * stripped, then every `,` part extends every signature of this one — a
   * `.x` part as a stereotype, `depth(n)` as a level, an `SName` as a name,
   * anything else as a stereotype.
   * @see Context.java:68-98
   */
  push(newString: string): Context {
    if (newString.startsWith(':')) newString = newString.substring(1);
    const result = new Context();
    result.parent = this;

    let star = false;
    if (newString.endsWith(StyleSignatureBasic.STAR)) {
      newString = newString.substring(0, newString.length - 1).trim();
      star = true;
    }

    for (const s of splitComma(newString))
      for (let ssb of this.signatures) {
        ssb = Context.extend(ssb, s);
        if (star) ssb = ssb.addStar();
        result.signatures.push(ssb);
      }

    return result;
  }

  /** The loop body of `push` for one part. @see Context.java:80-87 */
  private static extend(ssb: StyleSignatureBasic, s: string): StyleSignatureBasic {
    if (s.startsWith('.')) return ssb.addStereotype(s);
    if (s.startsWith('depth(')) return ssb.addLevel(parseLevel(s));
    const sname = retrieve(s);
    if (sname === undefined) return ssb.addStereotype(s);
    return ssb.addSName(sname);
  }

  /** @see Context.java:100-104 */
  pop(): Context {
    if (this.isEmpty()) throw new Error('IllegalStateException');
    return this.parent!;
  }

  /** `signatures.toString()`. @see Context.java:106-109 */
  toString(): string {
    return `[${this.signatures.map((s) => s.toString()).join(', ')}]`;
  }

  /** @see Context.java:111-113 */
  isEmpty(): boolean {
    return this.signatures[0]!.isEmpty();
  }

  /** @see Context.java:115-117 */
  toSignatures(): readonly StyleSignatureBasic[] {
    return this.signatures;
  }

  /** @see Context.java:119-121 */
  putInContext(key: PName, value: Value): void {
    enumMapPut(this.map, key, value);
  }

  /**
   * One style per signature with at least one value; a stereotype
   * signature's values are lifted by `DELTA_PRIORITY_FOR_STEREOTYPE`.
   * @see Context.java:123-135
   */
  toStyles(): Style[] {
    const result: Style[] = [];
    for (const signature of this.toSignatures()) {
      let tmp: ReadonlyMap<PName, Value> = this.map;
      if (signature.isWithDot()) tmp = addPriorityForStereotype(tmp);
      if (tmp.size > 0) result.push(new Style(signature, tmp));
    }
    return result;
  }

  /** @see Context.java:137-139 */
  getInternalMap(): ReadonlyMap<PName, Value> {
    return this.map;
  }
}

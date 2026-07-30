/**
 * Warning — an immutable, possibly multi-line diagnostic message with
 * value equality (two `Warning`s built from the same lines are equal),
 * matching upstream's `equals`/`hashCode` override.
 *
 * Upstream: warning/Warning.java. Ported in full: the constructor
 * (varargs -> readonly array here), `getMessage`, `asSingleLine`,
 * `equals`.
 *
 * `hashCode` (java:66-69) is NOT ported: it exists upstream only to keep
 * `equals` consistent with Java's `HashSet`/`HashMap` contract. This
 * port's `Pragma.ts` (the sole consumer, a `LinkedHashSet<Warning>`
 * upstream) dedups via a linear {@link Warning#equals} scan instead of a
 * hash bucket — see that file's own doc comment — so no hash function is
 * needed here.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/warning/Warning.java
 */
export class Warning {
  private readonly message: readonly string[];

  constructor(...lines: readonly string[]) {
    this.message = lines;
  }

  getMessage(): readonly string[] {
    return this.message;
  }

  asSingleLine(): string {
    return this.message.join('\n');
  }

  equals(other: Warning): boolean {
    if (this.message.length !== other.message.length) return false;
    return this.message.every((line, i) => line === other.message[i]);
  }
}

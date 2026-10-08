/**
 * minimal-json's `JsonObject` -- the object value every json-family diagram
 * draws. Members keep insertion order and a repeated name is a SECOND member,
 * never an overwrite: `add` appends without looking the name up
 * (`JsonObject.java:337-348`). A plain JS object cannot carry that: it
 * collapses a duplicate and moves integer-like keys to the front.
 *
 * Who adds what (each parser's own dedup is upstream's, not this class's):
 *  - json: `Json.java:377-378` (`DefaultHandler#endObjectValue`) adds every
 *    parsed member, duplicates included (jar: `unwind2-S2b/json-dup-key`).
 *  - yaml: `MonomorphToJson.java:69-86` adds the keys of a `LinkedHashMap`
 *    (`Monomorph.java:103-111`), so a repeated yaml key was already
 *    collapsed -- last value, first position (`yaml-dup-key`).
 *  - hcl: `HclParser.java:123-148` adds every field; its top-level modules go
 *    through a `LinkedHashMap` first (`:61-75`) (`hcl-dup-key`,
 *    `hcl-dup-module`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/json/JsonObject.java
 */
export class JsonObject {
  /** `JsonObject#names`, parallel to {@link values}. Public so test equality
   *  sees the members. */
  readonly names: string[] = [];
  readonly values: unknown[] = [];

  /** `JsonObject.java:337-348`. */
  add(name: string, value: unknown): this {
    this.names.push(name);
    this.values.push(value);
    return this;
  }

  /** `JsonObject#size`. */
  get size(): number {
    return this.names.length;
  }

  /** `JsonObject#iterator` -- every member, in order, duplicates included. */
  members(): Array<[string, unknown]> {
    return this.names.map((name, i) => [name, this.values[i]]);
  }
}

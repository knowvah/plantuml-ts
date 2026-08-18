/**
 * Parsed value of a `json Name { ... }` / `json Name value` leaf (upstream
 * `JsonValue` — `net.sourceforge.plantuml.json.JsonValue`). A tagged union
 * rather than a plain JS object/array so:
 *  - key insertion order is preserved exactly regardless of key shape (a
 *    plain JS object silently reorders purely-numeric string keys ahead of
 *    non-numeric ones, which JSON object keys are not guaranteed to avoid);
 *  - the value's kind can be discriminated the same way upstream's
 *    `JsonValue#isString`/`isNumber`/`isTrue`/`isFalse`/`isNull`/`isArray`/
 *    `isObject` does (`TextBlockCucaJSon#getTextBlockValue`,
 *    class-json-sizing.ts's recursive measurement).
 *
 * ONE definition shared by the class and state engines (formerly
 * byte-identical `class-json-ast.ts` / `state-json-ast.ts` copies — mission
 * shared-seam-extraction D7).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/json/JsonValue.java
 */
export type JsonNode =
  | { kind: 'scalar'; value: string | number | boolean | null }
  | { kind: 'array'; items: JsonNode[] }
  | { kind: 'object'; entries: { key: string; value: JsonNode }[] };

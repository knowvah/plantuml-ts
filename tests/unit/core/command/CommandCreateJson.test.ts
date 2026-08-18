/**
 * Unit tests for the shared `json` declaration port
 * (`core/command/CommandCreateJson.ts`) — merged from the formerly
 * 74%-line-identical `class/class-json-commands.ts` and
 * `state/state-json-commands.ts` copies (mission shared-seam-extraction T9,
 * D7). Covers the hand-rolled order-preserving JSON parser
 * ({@link parseJsonNode}), body finalization ({@link finalizeJsonBody}), and
 * the {@link jsonCommands} factory's open/single-line apply logic against a
 * minimal mock {@link JsonCommandHost}.
 *
 * Full-parser integration coverage (multiline body accumulation, header
 * grammar against real source text, sizing) stays in each engine's own
 * test — `tests/unit/class/class-json.test.ts`,
 * `tests/unit/state/state-json-commands.test.ts` (multiline/single-line
 * declaration + `isJsonCloser` describe blocks) — those are this merge's
 * "engine adapter smoke test" per T9's quality bar.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/objectdiagram/command/CommandCreateJson.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/objectdiagram/command/CommandCreateJsonSingleLine.java
 */
import { describe, it, expect } from 'vitest';
import {
  JSON_MULTILINE_DECL_RE,
  JSON_SINGLE_LINE_RE,
  parseJsonNode,
  finalizeJsonBody,
  jsonCommands,
  type JsonCommandHost,
} from '../../../../src/core/command/CommandCreateJson.js';
import type { JsonNode } from '../../../../src/core/command/JsonNode.js';

// ---------------------------------------------------------------------------
// parseJsonNode (hand-rolled order-preserving parser) — moved verbatim from
// state-json-commands.test.ts (formerly the only copy under test; the class
// engine's byte-identical parser had no dedicated unit test of its own).
// ---------------------------------------------------------------------------

describe('parseJsonNode (hand-rolled order-preserving parser)', () => {
  it('returns null for empty/malformed input', () => {
    expect(parseJsonNode('')).toBeNull();
    expect(parseJsonNode('{')).toBeNull();
    expect(parseJsonNode('{"a": }')).toBeNull();
    expect(parseJsonNode('[1, 2')).toBeNull();
    expect(parseJsonNode('{"a" 1}')).toBeNull();
    expect(parseJsonNode('true extra')).toBeNull();
  });

  it('parses every named escape sequence inside a string', () => {
    const parsed = parseJsonNode(String.raw`"a\\b\/c\bd\fe\nf\rg\thA"`);
    expect(parsed).toEqual({ kind: 'scalar', value: 'a\\b/c\bd\fe\nf\rg\th' + 'A' });
  });

  it('parses an escaped double-quote inside a string', () => {
    const parsed = parseJsonNode(String.raw`"say \"hi\""`);
    expect(parsed).toEqual({ kind: 'scalar', value: 'say "hi"' });
  });

  it('passes an unrecognized escape sequence through literally', () => {
    const parsed = parseJsonNode(String.raw`"a\qb"`);
    expect(parsed).toEqual({ kind: 'scalar', value: 'a\\qb' });
  });

  it('parses a \\u unicode escape sequence', () => {
    const parsed = parseJsonNode(String.raw`"\u0041\u0042"`);
    expect(parsed).toEqual({ kind: 'scalar', value: 'AB' });
  });

  it('rejects an object body missing a comma or closing brace between members', () => {
    expect(parseJsonNode('{"a":1 "b":2}')).toBeNull();
  });

  it('parses decimal and exponent numeric forms', () => {
    expect(parseJsonNode('3.14')).toEqual({ kind: 'scalar', value: 3.14 });
    expect(parseJsonNode('1e3')).toEqual({ kind: 'scalar', value: 1000 });
    expect(parseJsonNode('-2.5e-1')).toEqual({ kind: 'scalar', value: -0.25 });
  });

  it('parses an empty array and an empty object', () => {
    expect(parseJsonNode('[]')).toEqual({ kind: 'array', items: [] });
    expect(parseJsonNode('{}')).toEqual({ kind: 'object', entries: [] });
  });

  it('rejects trailing data after a complete value', () => {
    expect(parseJsonNode('1 2')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// finalizeJsonBody — moved from state-json-commands.test.ts, generalized to
// the shared `{ jsonValue?: JsonNode }` shape (both `Classifier` and `State`
// satisfy it without change).
// ---------------------------------------------------------------------------

describe('finalizeJsonBody', () => {
  interface Entity {
    jsonValue?: JsonNode;
  }

  it('leaves jsonValue unset on total parse failure (both wrapped and unwrapped attempts fail)', () => {
    const entity: Entity = {};
    finalizeJsonBody(entity, ['not json at all }{']);
    expect(entity.jsonValue).toBeUndefined();
  });

  it('wraps a bare member list in braces (CommandCreateJson.java:187-195)', () => {
    const entity: Entity = {};
    finalizeJsonBody(entity, ['"a": 1']);
    expect(entity.jsonValue).toEqual({ kind: 'object', entries: [{ key: 'a', value: { kind: 'scalar', value: 1 } }] });
  });

  it('falls back to the unwrapped parse when the body already supplies its own outer braces (CommandCreateJson.java:172-182)', () => {
    const entity: Entity = {};
    finalizeJsonBody(entity, ['[1,2,3]']);
    expect(entity.jsonValue).toEqual({
      kind: 'array',
      items: [{ kind: 'scalar', value: 1 }, { kind: 'scalar', value: 2 }, { kind: 'scalar', value: 3 }],
    });
  });
});

// ---------------------------------------------------------------------------
// jsonCommands factory + JsonCommandHost contract, via a minimal mock host —
// exercises every Java-settled merge-table difference between the former
// class/state copies directly, independent of either engine's own AST.
// ---------------------------------------------------------------------------

interface MockEntity {
  id: string;
  stereotype?: string;
  color?: string;
  jsonValue?: JsonNode;
}

function makeMockHost() {
  const entities = new Map<string, MockEntity>();
  const beginBodyCalls: (string | undefined)[] = [];
  const resolveCalls: boolean[] = []; // records each call's `reuseExisting`
  const host: JsonCommandHost<MockEntity> = {
    resolve(rawId, _rawDisplay, stereotype, color, reuseExisting) {
      resolveCalls.push(reuseExisting);
      if (entities.has(rawId)) return undefined; // mirrors class's duplicate rejection
      const entity: MockEntity = { id: rawId, ...(stereotype !== undefined ? { stereotype } : {}), ...(color !== undefined ? { color } : {}) };
      entities.set(rawId, entity);
      return entity;
    },
    beginBody(entity) {
      beginBodyCalls.push(entity?.id);
    },
    setJsonValue(entity, value) {
      entity.jsonValue = value;
    },
  };
  return { host, entities, beginBodyCalls, resolveCalls };
}

describe('jsonCommands — regex dispatch', () => {
  const [multiline, singleLine] = jsonCommands<unknown, MockEntity>(() => makeMockHost().host);

  it('multiline pattern requires a trailing "{" (CommandCreateJson.java:83-94)', () => {
    expect(multiline!.pattern.test('json Foo {')).toBe(true);
    expect(multiline!.pattern.test('json Foo')).toBe(false);
  });

  it('single-line pattern requires a DATA_ value, never a trailing "{" (CommandCreateJsonSingleLine.java:72-91)', () => {
    expect(singleLine!.pattern.test('json Foo 1')).toBe(true);
    expect(singleLine!.pattern.test('json Foo {')).toBe(false);
  });

  it('exports the same compiled regexes the factory dispatches on', () => {
    expect(multiline!.pattern).toBe(JSON_MULTILINE_DECL_RE);
    expect(singleLine!.pattern).toBe(JSON_SINGLE_LINE_RE);
  });
});

describe('jsonCommands — multiline open (CommandCreateJson#executeArg0, java:197-222)', () => {
  it('resolves with reuseExisting=true (quarkInContext(true, idShort), java:201)', () => {
    const { host, entities, resolveCalls } = makeMockHost();
    const [multiline] = jsonCommands<unknown, MockEntity>(() => host);
    const match = JSON_MULTILINE_DECL_RE.exec('json Foo <<s>> #red {')!;
    multiline!.execute(undefined, match);
    expect(resolveCalls).toEqual([true]);
    expect(entities.get('Foo')).toEqual({ id: 'Foo', stereotype: 's', color: '#red' });
  });

  it('begins the body for the resolved entity', () => {
    const { host, beginBodyCalls } = makeMockHost();
    const [multiline] = jsonCommands<unknown, MockEntity>(() => host);
    const match = JSON_MULTILINE_DECL_RE.exec('json Foo {')!;
    multiline!.execute(undefined, match);
    expect(beginBodyCalls).toEqual(['Foo']);
  });

  it('a duplicate id still opens (and discards) the body — no leaked lines to the dispatcher (java:199-203, "JSON already exists")', () => {
    const { host, beginBodyCalls } = makeMockHost();
    const [multiline] = jsonCommands<unknown, MockEntity>(() => host);
    const match = JSON_MULTILINE_DECL_RE.exec('json Foo {')!;
    multiline!.execute(undefined, match); // first: creates 'Foo'
    multiline!.execute(undefined, match); // second: duplicate
    expect(beginBodyCalls).toEqual(['Foo', undefined]);
  });
});

describe('jsonCommands — single-line (CommandCreateJsonSingleLine#executeArg0, java:158-182)', () => {
  it('resolves with reuseExisting=false, a DELIBERATE asymmetry from the multiline opener (java:161 vs java:201)', () => {
    const { host, entities, resolveCalls } = makeMockHost();
    const [, singleLine] = jsonCommands<unknown, MockEntity>(() => host);
    const match = JSON_SINGLE_LINE_RE.exec('json Foo <<s>> #red 42')!;
    singleLine!.execute(undefined, match);
    expect(resolveCalls).toEqual([false]);
    expect(entities.get('Foo')).toEqual({ id: 'Foo', stereotype: 's', color: '#red', jsonValue: { kind: 'scalar', value: 42 } });
  });

  it('a duplicate id is a silent no-op — setJsonValue is never called (java:131-135, "JSON already exists")', () => {
    const { host } = makeMockHost();
    const [, singleLine] = jsonCommands<unknown, MockEntity>(() => host);
    const match = JSON_SINGLE_LINE_RE.exec('json Foo 1')!;
    singleLine!.execute(undefined, match); // first: creates 'Foo' with jsonValue 1
    singleLine!.execute(undefined, match); // second: duplicate, no-op
    const entity = host.resolve('Foo', undefined, undefined, undefined, false);
    expect(entity).toBeUndefined(); // 'Foo' already exists; no second entity created
  });

  it('DATA_OBJECT-shaped but invalid JSON leaves jsonValue unset, entity still created (java:137-140, "Bad data")', () => {
    // The DATA_OBJECT regex alternative only requires a quoted key + ':',
    // then '.*' up to the closing brace (CommandCreateJsonSingleLine.java:88)
    // — it is not a JSON-validity check, so `{"a": ,}` matches the pattern
    // but fails parseJsonNode's re-parse, mirroring executeArg's own
    // defensive getJsonValue() call after the regex already matched.
    const { host, entities } = makeMockHost();
    const [, singleLine] = jsonCommands<unknown, MockEntity>(() => host);
    const match = JSON_SINGLE_LINE_RE.exec('json Foo {"a": ,}')!;
    expect(match).not.toBeNull();
    singleLine!.execute(undefined, match);
    expect(entities.get('Foo')).toEqual({ id: 'Foo' }); // created, jsonValue unset
  });
});

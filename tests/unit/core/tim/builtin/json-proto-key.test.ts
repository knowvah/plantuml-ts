/**
 * `__proto__` is an ORDINARY key in upstream's JSON model: minimal-json's
 * `JsonObject` stores name/value pairs in lists (`names`/`values`), so no key
 * name has special meaning there. A plain-JS-object port must not let the
 * `__proto__` setter swallow the assignment (it would re-prototype the object
 * and drop the key).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/json/JsonObject.java
 */
import { describe, expect, it } from 'vitest';
import { TValue } from '../../../../../src/core/tim/expression/TValue.js';
import { JsonSet } from '../../../../../src/core/tim/builtin/JsonSet.js';
import { JsonMerge } from '../../../../../src/core/tim/builtin/JsonMerge.js';
import { JsonKeyExists } from '../../../../../src/core/tim/builtin/JsonKeyExists.js';
import { GetJsonKey } from '../../../../../src/core/tim/builtin/GetJsonKey.js';
import { deepCloneJson } from '../../../../../src/core/tim/builtin/json-utils.js';
import { LOC, NO_NAMED, fakeContext } from '../../../../helpers/tim-builtin.js';

const PROTO = '__proto__';

function call(fn: JsonSet | JsonMerge | JsonKeyExists | GetJsonKey, values: TValue[]): TValue {
  return fn.executeReturnFunction(fakeContext(), undefined, LOC, values, NO_NAMED);
}

/** An object whose OWN `__proto__` key carries `value` (as JSON.parse builds it). */
function withOwnProto(value: unknown): Record<string, unknown> {
  return JSON.parse(`{"a":1,"${PROTO}":${JSON.stringify(value)}}`) as Record<string, unknown>;
}

describe('__proto__ as an ordinary JSON key', () => {
  it('%json_set(x, "__proto__", v) adds an own key and leaves the prototype alone', () => {
    const result = call(new JsonSet(), [TValue.fromJson({ a: 1 }), TValue.fromString(PROTO), TValue.fromString('v')]);
    const json = result.toJson() as Record<string, unknown>;
    expect(Object.keys(json)).toEqual(['a', PROTO]);
    expect(Object.getOwnPropertyDescriptor(json, PROTO)?.value).toBe('v');
    expect(Object.getPrototypeOf(json)).toBe(Object.prototype);
    expect(JSON.stringify(json)).toBe('{"a":1,"__proto__":"v"}');
  });

  it('the key round-trips through %json_key_exists and %get_json_keys', () => {
    const set = call(new JsonSet(), [TValue.fromJson({}), TValue.fromString(PROTO), TValue.fromInt(7)]);
    expect(call(new JsonKeyExists(), [set, TValue.fromString(PROTO)]).toString()).toBe('1');
    expect(call(new GetJsonKey(), [set]).toJson()).toEqual([PROTO]);
  });

  it('an object value under __proto__ does not become the prototype', () => {
    const result = call(new JsonSet(), [TValue.fromJson({}), TValue.fromString(PROTO), TValue.fromJson({ polluted: true })]);
    const json = result.toJson() as Record<string, unknown>;
    expect(json['polluted']).toBeUndefined();
    expect(Object.getOwnPropertyDescriptor(json, PROTO)?.value).toEqual({ polluted: true });
  });

  it('deepCloneJson keeps an own __proto__ key as an own key', () => {
    const clone = deepCloneJson(withOwnProto({ b: 2 }) as never) as Record<string, unknown>;
    expect(Object.keys(clone)).toEqual(['a', PROTO]);
    expect(Object.getOwnPropertyDescriptor(clone, PROTO)?.value).toEqual({ b: 2 });
    expect(clone['b']).toBeUndefined();
  });

  it('%json_set 2-arg deep merge carries an own __proto__ key across', () => {
    const src = TValue.fromJson(withOwnProto({ b: 2 }) as never);
    const json = call(new JsonSet(), [TValue.fromJson({ z: 0 }), src]).toJson() as Record<string, unknown>;
    expect(Object.keys(json)).toEqual(['z', 'a', PROTO]);
    expect(Object.getOwnPropertyDescriptor(json, PROTO)?.value).toEqual({ b: 2 });
  });

  it('%json_merge (shallow) carries an own __proto__ key across', () => {
    const src = TValue.fromJson(withOwnProto('s') as never);
    const json = call(new JsonMerge(), [TValue.fromJson({ z: 0 }), src]).toJson() as Record<string, unknown>;
    expect(Object.keys(json)).toEqual(['z', 'a', PROTO]);
    expect(Object.getOwnPropertyDescriptor(json, PROTO)?.value).toBe('s');
  });
});

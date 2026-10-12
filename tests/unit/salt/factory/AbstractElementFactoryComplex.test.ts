/**
 * `AbstractElementFactoryComplex` / `ElementFactory` semantics, read from
 * AbstractElementFactoryComplex.java:49-58: the first registered factory whose
 * `ready()` is true builds the element; with none ready the Java throws
 * `IllegalStateException(dataSource.peek(0).getElement())`.
 */
import { describe, expect, it } from 'vitest';
import { DataSourceImpl } from '../../../../src/diagrams/salt/DataSourceImpl.js';
import { AbstractElementFactoryComplex } from '../../../../src/diagrams/salt/factory/AbstractElementFactoryComplex.js';
import type { ElementFactory } from '../../../../src/diagrams/salt/factory/ElementFactory.js';
import { ElementEmpty } from '../../../../src/diagrams/salt/element/ElementEmpty.js';
import type { Element } from '../../../../src/diagrams/salt/element/Element.js';
import { SaltDictionary } from '../../../../src/diagrams/salt/SaltDictionary.js';
import { Terminated } from '../../../../src/diagrams/salt/Terminated.js';
import { Terminator } from '../../../../src/diagrams/salt/Terminator.js';

class Probe extends AbstractElementFactoryComplex {
  create(): Terminated<Element> {
    return this.getNextElement();
  }
  ready(): boolean {
    return true;
  }
  next(): Terminated<Element> {
    return this.getNextElement();
  }
  source(): unknown {
    return this.getDataSource();
  }
  dict(): unknown {
    return this.getDictionary();
  }
}

function factory(isReady: boolean, out: Element, calls: string[], name: string): ElementFactory {
  return {
    ready: () => {
      calls.push(`ready:${name}`);
      return isReady;
    },
    create: () => {
      calls.push(`create:${name}`);
      return new Terminated(out, Terminator.NEWLINE);
    },
  };
}

describe('AbstractElementFactoryComplex', () => {
  it('uses the first ready factory and stops probing there', () => {
    const calls: string[] = [];
    const a = new ElementEmpty();
    const b = new ElementEmpty();
    const c = new ElementEmpty();
    const probe = new Probe(new DataSourceImpl(['x']), new SaltDictionary());
    probe.addFactory(factory(false, a, calls, 'a'));
    probe.addFactory(factory(true, b, calls, 'b'));
    probe.addFactory(factory(true, c, calls, 'c'));
    const result = probe.next();
    expect(result.getElement()).toBe(b);
    expect(result.getTerminator()).toBe(Terminator.NEWLINE);
    expect(calls).toEqual(['ready:a', 'ready:b', 'create:b']);
  });

  it('throws IllegalStateException carrying the unread token when none is ready', () => {
    const probe = new Probe(new DataSourceImpl(['junk | y']), new SaltDictionary());
    probe.addFactory(factory(false, new ElementEmpty(), [], 'a'));
    expect(() => probe.next()).toThrow('junk');
  });

  it('throws with no factories at all', () => {
    const probe = new Probe(new DataSourceImpl(['solo']), new SaltDictionary());
    expect(() => probe.next()).toThrow('solo');
  });

  it('exposes the constructor arguments', () => {
    const ds = new DataSourceImpl(['x']);
    const dict = new SaltDictionary();
    const probe = new Probe(ds, dict);
    expect(probe.source()).toBe(ds);
    expect(probe.dict()).toBe(dict);
  });
});

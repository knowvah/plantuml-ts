/**
 * The seven simple salt factories (T3a) — `ready()` / `create()` against the
 * Java in `salt/factory/ElementFactory{Button,Droplist,Image,Line,Text,
 * TextField,RetrieveFromDictonnary}.java`. Dimensions are the jar-pinned ones
 * of the element tests (`tests/unit/salt/element/*.test.ts`).
 */
import { describe, expect, it } from 'vitest';
import { ElementButton } from '../../../../src/diagrams/salt/element/ElementButton.js';
import { ElementDroplist } from '../../../../src/diagrams/salt/element/ElementDroplist.js';
import { ElementImage } from '../../../../src/diagrams/salt/element/ElementImage.js';
import { ElementLine } from '../../../../src/diagrams/salt/element/ElementLine.js';
import { ElementText } from '../../../../src/diagrams/salt/element/ElementText.js';
import { ElementTextField } from '../../../../src/diagrams/salt/element/ElementTextField.js';
import { WrappedElement } from '../../../../src/diagrams/salt/element/WrappedElement.js';
import { ElementFactoryButton } from '../../../../src/diagrams/salt/factory/ElementFactoryButton.js';
import { ElementFactoryDroplist } from '../../../../src/diagrams/salt/factory/ElementFactoryDroplist.js';
import { ElementFactoryImage } from '../../../../src/diagrams/salt/factory/ElementFactoryImage.js';
import { ElementFactoryLine } from '../../../../src/diagrams/salt/factory/ElementFactoryLine.js';
import { ElementFactoryRetrieveFromDictonnary } from '../../../../src/diagrams/salt/factory/ElementFactoryRetrieveFromDictonnary.js';
import { ElementFactoryText } from '../../../../src/diagrams/salt/factory/ElementFactoryText.js';
import { ElementFactoryTextField } from '../../../../src/diagrams/salt/factory/ElementFactoryTextField.js';
import { SaltDictionary } from '../../../../src/diagrams/salt/SaltDictionary.js';
import { Terminated } from '../../../../src/diagrams/salt/Terminated.js';
import type { DataSource } from '../../../../src/diagrams/salt/DataSource.js';
import { Terminator } from '../../../../src/diagrams/salt/Terminator.js';
import { dimensionOf, source } from './factory-test-support.js';

const ILLEGAL_STATE = /IllegalStateException/;

describe('ElementFactoryButton (java:67-81)', () => {
  const ready = (t: string) => new ElementFactoryButton(source(t), new SaltDictionary()).ready();

  it('claims [text] and nothing else', () => {
    expect(ready('[This is my button]')).toBe(true);
    expect(ready('[open')).toBe(false);
    expect(ready('close]')).toBe(false);
    expect(ready('plain')).toBe(false);
  });

  it('refuses a leading "[[" creole link (issue #2732, java:77-78)', () => {
    expect(ready('[[http://x.org{tip} label]]')).toBe(false);
  });

  it('creates an ElementButton of the inner text, keeping the terminator (145 x 21)', () => {
    const built = new ElementFactoryButton(source('[This is my button] | x'), new SaltDictionary()).create();
    expect(built.getElement()).toBeInstanceOf(ElementButton);
    expect(dimensionOf(built)).toEqual([145, 21]);
    expect(built.getTerminator()).toBe(Terminator.NEWCOL);
  });

  it('consumes exactly one token and throws when not ready', () => {
    const ds = source('[a]', 'b');
    new ElementFactoryButton(ds, new SaltDictionary()).create();
    expect(ds.peek(0).getElement()).toBe('b');
    expect(() => new ElementFactoryButton(ds, new SaltDictionary()).create()).toThrow(ILLEGAL_STATE);
  });
});

describe('ElementFactoryDroplist (java:67-70)', () => {
  it('claims ^text^ only', () => {
    const ready = (t: string) => new ElementFactoryDroplist(source(t), new SaltDictionary()).ready();
    expect(ready('^This is a droplist^')).toBe(true);
    expect(ready('^open')).toBe(false);
    expect(ready('close^')).toBe(false);
  });

  it('creates an ElementDroplist of the inner text (160 x 16)', () => {
    const built = new ElementFactoryDroplist(source('^This is a droplist^'), new SaltDictionary()).create();
    expect(built.getElement()).toBeInstanceOf(ElementDroplist);
    expect(dimensionOf(built)).toEqual([160, 16]);
    expect(built.getTerminator()).toBe(Terminator.NEWLINE);
  });

  it('throws when not ready', () => {
    expect(() => new ElementFactoryDroplist(source('x'), new SaltDictionary()).create()).toThrow(ILLEGAL_STATE);
  });
});

describe('ElementFactoryTextField (java:68-71)', () => {
  it('claims a double-quoted token only', () => {
    const ready = (t: string) => new ElementFactoryTextField(source(t), new SaltDictionary()).ready();
    expect(ready('"Enter text here "')).toBe(true);
    expect(ready('"open')).toBe(false);
    expect(ready("'single'")).toBe(false);
  });

  it('creates an ElementTextField of the unquoted text (134 x 14)', () => {
    const built = new ElementFactoryTextField(source('"Enter text here "'), new SaltDictionary()).create();
    expect(built.getElement()).toBeInstanceOf(ElementTextField);
    expect(dimensionOf(built)).toEqual([134, 14]);
  });

  it('throws when not ready', () => {
    expect(() => new ElementFactoryTextField(source('x'), new SaltDictionary()).create()).toThrow(ILLEGAL_STATE);
  });
});

describe('ElementFactoryText (java:70-77)', () => {
  const ready = (t: string) => new ElementFactoryText(source(t), new SaltDictionary()).ready();

  it('claims any non-blank token not starting with { or }', () => {
    expect(ready('hello')).toBe(true);
    expect(ready('{#')).toBe(false);
    expect(ready('}')).toBe(false);
  });

  it('rejects a token that trin() reduces to nothing (the tokeniser never emits one, so a stub stream)', () => {
    const blank = new Terminated('  \t', Terminator.NEWLINE);
    const stub = { peek: () => blank } as unknown as DataSource;
    expect(new ElementFactoryText(stub, new SaltDictionary()).ready()).toBe(false);
  });

  it('creates an ElementText holding the whole token, terminator kept', () => {
    const built = new ElementFactoryText(source('Some text | y'), new SaltDictionary()).create();
    const element = built.getElement();
    expect(element).toBeInstanceOf(ElementText);
    expect((element as ElementText).getText()).toBe('Some text');
    expect(built.getTerminator()).toBe(Terminator.NEWCOL);
  });

  it('throws when not ready', () => {
    expect(() => new ElementFactoryText(source('}'), new SaltDictionary()).create()).toThrow(ILLEGAL_STATE);
  });
});

describe('ElementFactoryLine (java:60-80)', () => {
  const ready = (t: string) => new ElementFactoryLine(source(t)).ready();

  it.each(['--', '==', '~~', '..', '-----', '==x==', '..~..'])('claims %s', (t) => {
    expect(ready(t)).toBe(true);
  });

  it.each(['-', '--a', 'a--', '-=', 'plain'])('refuses %s', (t) => {
    expect(ready(t)).toBe(false);
  });

  it('creates an ElementLine of 10 x 6, keeping the terminator', () => {
    const built = new ElementFactoryLine(source('== | z')).create();
    expect(built.getElement()).toBeInstanceOf(ElementLine);
    expect(dimensionOf(built)).toEqual([10, 6]);
    expect(built.getTerminator()).toBe(Terminator.NEWCOL);
  });

  it('throws when not ready', () => {
    expect(() => new ElementFactoryLine(source('x')).create()).toThrow(ILLEGAL_STATE);
  });
});

describe('ElementFactoryImage (java:57-78)', () => {
  const IMAGE_LINES = ['<<', '.X.', '...', 'X.X', '.X.', '>>'];

  it('claims "<<" and "<<name" only', () => {
    const ready = (t: string) => new ElementFactoryImage(source(t), new SaltDictionary()).ready();
    expect(ready('<<')).toBe(true);
    expect(ready('<<icon')).toBe(true);
    expect(ready('<<ic-on')).toBe(false);
    expect(ready('<<icon>>')).toBe(false);
    expect(ready('<')).toBe(false);
  });

  it('builds an anonymous image from the lines up to ">>" (3 x 4) and registers nothing', () => {
    const ds = source(...IMAGE_LINES, 'after');
    const dictionary = new SaltDictionary();
    const built = new ElementFactoryImage(ds, dictionary).create();
    expect(built.getElement()).toBeInstanceOf(ElementImage);
    expect(dimensionOf(built)).toEqual([3, 4]);
    expect(built.getTerminator()).toBe(Terminator.NEWLINE);
    expect(ds.peek(0).getElement()).toBe('after');
    expect(() => dictionary.get('')).toThrow();
  });

  it('registers a named image in the dictionary (name = header minus "<<")', () => {
    const dictionary = new SaltDictionary();
    const built = new ElementFactoryImage(source('<<icon', ...IMAGE_LINES.slice(1)), dictionary).create();
    const stored = dictionary.get('icon');
    expect(stored).toBeInstanceOf(WrappedElement);
    expect(dimensionOf({ getElement: () => stored } as never)).toEqual([3, 4]);
    expect(dimensionOf(built)).toEqual([3, 4]);
  });

  it('throws when not ready', () => {
    expect(() => new ElementFactoryImage(source('x'), new SaltDictionary()).create()).toThrow(ILLEGAL_STATE);
  });
});

describe('ElementFactoryRetrieveFromDictonnary (java:55-71)', () => {
  it('claims <<name>> only', () => {
    const ready = (t: string) => new ElementFactoryRetrieveFromDictonnary(source(t), new SaltDictionary()).ready();
    expect(ready('<<icon>>')).toBe(true);
    expect(ready('<<icon')).toBe(false);
    expect(ready('<<>>')).toBe(false);
    expect(ready('<<a-b>>')).toBe(false);
  });

  it('retrieves the registered element, wrapped, keeping the terminator', () => {
    const dictionary = new SaltDictionary();
    dictionary.put('icon', new ElementImage(['X.', '.X']));
    const built = new ElementFactoryRetrieveFromDictonnary(source('<<icon>> | q'), dictionary).create();
    expect(built.getElement()).toBeInstanceOf(WrappedElement);
    expect(dimensionOf(built)).toEqual([2, 2]);
    expect(built.getTerminator()).toBe(Terminator.NEWCOL);
  });

  it('throws NullPointerException for an unregistered name, IllegalStateException when not ready', () => {
    expect(() => new ElementFactoryRetrieveFromDictonnary(source('<<nope>>'), new SaltDictionary()).create()).toThrow(
      /NullPointerException/,
    );
    expect(() => new ElementFactoryRetrieveFromDictonnary(source('x'), new SaltDictionary()).create()).toThrow(
      ILLEGAL_STATE,
    );
  });
});

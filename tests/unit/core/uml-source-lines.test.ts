/**
 * cdd3-T27 (C-9) — the line list upstream's `UmlSource#seed()` walks.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/UmlSource.java
 */
import { describe, expect, test } from 'vitest';
import { preprocess } from '../../../src/core/preprocessor.js';
import {
  loadInternal,
  mutateExpandsBreakline,
  patchBase64Line,
  umlSourceSeedLines,
} from '../../../src/core/uml-source-lines.js';
import { BLOCK_E1_BREAKLINE } from '../../../src/core/tim/builtin/jaws-constants.js';
import { SignatureUtils } from '../../../src/core/utils/SignatureUtils.js';

const BL = BLOCK_E1_BREAKLINE;

describe('mutateExpandsBreakline — Jaws.java:65-120', () => {
  test('splits at every breakline outside {{...}}, keeping an empty tail', () => {
    expect(mutateExpandsBreakline(['a', `b${BL}c${BL}`])).toEqual(['a', 'b', 'c', '']);
  });

  test('a breakline inside {{...}} is content, not a split', () => {
    expect(mutateExpandsBreakline([`x{{a${BL}b}}y${BL}z`])).toEqual([`x{{a${BL}b}}y`, 'z']);
  });
});

describe('loadInternal — UmlSource.java:140-156', () => {
  test('without checkEndingBackslash the list is copied as is', () => {
    expect(loadInternal(['a\\', 'b'], false)).toEqual(['a\\', 'b']);
  });

  test('joins a single trailing backslash to the next line and drops a dangling run', () => {
    expect(loadInternal(['a\\', 'b', 'c\\\\', 'd\\'], true)).toEqual(['ab', 'c\\\\']);
  });
});

describe('patchBase64Line — UmlSource.java:332-368', () => {
  test('replaces each base64 run with its md5 hex, text around it untouched', () => {
    const md5 = SignatureUtils.getMD5Hex('QUJD+/==');
    expect(patchBase64Line('<img data:image/png;base64,QUJD+/=={scale=2}> x')).toBe(
      `<img data:image/png;md5,${md5}{scale=2}> x`,
    );
  });

  test('a line with no tag is returned unchanged', () => {
    expect(patchBase64Line('class A')).toBe('class A');
  });
});

describe('umlSourceSeedLines — PSystemBuilder.java:232-240', () => {
  test('@startuml includes SEQUENCE, so a trailing backslash joins (DiagramType.java:199)', () => {
    expect(umlSourceSeedLines(['@startuml', 'a\\', 'b', '@enduml'])).toEqual(['@startuml', 'ab', '@enduml']);
  });

  test('@startmindmap does not include SEQUENCE, so the backslash stays', () => {
    expect(umlSourceSeedLines(['@startmindmap', 'a\\', 'b', '@endmindmap'])).toEqual([
      '@startmindmap',
      'a\\',
      'b',
      '@endmindmap',
    ]);
  });
});

describe('dataLines — TContext.java:455-472, the collected lines kept', () => {
  test('skinparam and <style> lines stay in place, substituted, !define dropped', () => {
    const source = ['@startuml', '!define MyBlue #6192d1', 'skinparam class {', '  BackgroundColor white\\MyBlue', '}']
      .concat(['<style>', 'root { }', '</style>', 'class A', '@enduml'])
      .join('\n');
    expect(preprocess(source).dataLines).toEqual([
      '@startuml',
      'skinparam class {',
      '  BackgroundColor white\\#6192d1',
      '}',
      '<style>',
      'root { }',
      '</style>',
      'class A',
      '@enduml',
    ]);
  });
});

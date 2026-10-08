/**
 * Directive lines in `@startyaml`, as upstream handles them (unwind-U1):
 * `StyleExtractor.java:63-103` makes only a leading `title ` chrome.
 */

import { describe, it, expect } from 'vitest';
import { parseYaml } from '../../../src/diagrams/yaml/parser.js';
import { isEmpty } from '../../../src/core/annotations/index.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { plainOf } from '../../helpers/json-object.js';

function makeSource(lines: string[]): UmlSource {
  return { lines, type: 'yaml' };
}

describe('parseYaml — directive lines (unwind-U1)', () => {
  it('single-line `title X` populates annotations.title, not the YAML body', () => {
    const ast = parseYaml(makeSource(['title My YAML', 'fruit: Apple']));
    expect(ast.annotations?.title.display).toEqual(['My YAML']);
    expect(plainOf(ast.root)).toEqual({ fruit: 'Apple' });
  });

  // Payload, not chrome: a bare line is NO_KEY_ONLY_TEXT, which
  // YamlParser.java:53-54 rejects (jar: unwind-U1/yaml-caption).
  it.each([
    ['caption', ['caption a caption']],
    ['legend', ['legend', 'a legend line', 'end legend']],
  ])('%s is payload: parse error, no chrome', (_name, lines) => {
    const ast = parseYaml(makeSource([...lines, 'fruit: Apple']));
    expect(ast.parseError).toBe(true);
    expect(isEmpty(ast.annotations!)).toBe(true);
  });

  it('annotation-free fixture parses identically (no chrome, empty annotations)', () => {
    const ast = parseYaml(makeSource(['fruit: Apple']));
    expect(isEmpty(ast.annotations!)).toBe(true);
    expect(plainOf(ast.root)).toEqual({ fruit: 'Apple' });
  });
});

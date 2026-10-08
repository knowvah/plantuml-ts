/**
 * `jsonFamilyStyleInput` -- the json family's `styleInput`: of every
 * `skinparam` only `handwritten true` reaches the theme
 * (`StyleExtractor.java:88-97`, `JsonDiagram.java:79`).
 */
import { describe, it, expect } from 'vitest';
import { preprocess } from '../../../src/core/preprocessor.js';
import { jsonFamilyStyleInput } from '../../../src/diagrams/json/json-family-style-input.js';
import { jsonPlugin } from '../../../src/diagrams/json/index.js';
import { yamlPlugin } from '../../../src/diagrams/yaml/index.js';
import { hclPlugin } from '../../../src/diagrams/hcl/index.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';

function inputOf(lines: readonly string[]) {
  const source = ['@startjson', ...lines, '@endjson'];
  const pre = preprocess(source.join('\n'));
  const block: UmlSource = { lines: [...pre.lines], type: 'json', seedSourceLines: source };
  return { pre, out: jsonFamilyStyleInput(pre, block) };
}

describe('jsonFamilyStyleInput', () => {
  it('drops every skinparam the preprocessor collected', () => {
    const { pre, out } = inputOf(['skinparam backgroundColor red', 'skinparam defaultFontSize 20', '{}']);
    expect([...pre.skinparam.keys()]).toEqual(['backgroundcolor', 'defaultfontsize']);
    expect([...out.skinparam]).toEqual([]);
    expect([...(out.declarationOrder?.skinparam.keys() ?? [])]).toEqual([]);
  });

  it('keeps `handwritten true` from a leading skinparam line', () => {
    const { out } = inputOf(['skinparam handwritten true', 'skinparam backgroundColor red', '{}']);
    expect([...out.skinparam]).toEqual([['handwritten', 'true']]);
    expect([...(out.declarationOrder?.skinparam.keys() ?? [])]).toEqual(['handwritten']);
  });

  it('ignores handwritten inside a skinparam block (StyleExtractor.java:91-97)', () => {
    const { out } = inputOf(['skinparam {', '  handwritten true', '}', '{}']);
    expect([...out.skinparam]).toEqual([]);
  });

  it('keeps <style> blocks and the theme name untouched', () => {
    const { pre, out } = inputOf(['<style>', 'document { BackGroundColor red }', '</style>', '{}']);
    expect(out.styles).toEqual(pre.styles);
    expect(out.styles.length).toBe(1);
    expect(out.theme).toBe(pre.theme);
  });

  it('is the styleInput of all three json-family plugins', () => {
    expect(jsonPlugin).toHaveProperty('styleInput', jsonFamilyStyleInput);
    expect(yamlPlugin).toHaveProperty('styleInput', jsonFamilyStyleInput);
    expect(hclPlugin).toHaveProperty('styleInput', jsonFamilyStyleInput);
  });
});

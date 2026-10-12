/**
 * cdd8 T1b: the class plugin's `requiresElk` hook and `layoutSync` guard.
 * Upstream: `CucaDiagram.java:478-479` (maker swap), `:950-952`
 * (`ELK_LIBRARY_REQUIRED`).
 */
import { describe, it, expect } from 'vitest';
import { classPlugin } from '../../../src/diagrams/class/index.js';
import { ELK_RENDER_SYNC_UNSUPPORTED } from '../../../src/core/elk/layout-services.js';
import { renderSync } from '../../../src/index.js';
import { parseClass } from './parse-helper.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

function parse(source: string) {
  const block: UmlSource = { lines: source.split('\n'), type: 'class' };
  return parseClass(block);
}

describe('classPlugin.requiresElk', () => {
  it('is true only for !pragma layout elk', () => {
    expect(classPlugin.requiresElk?.(parse('!pragma layout elk\nclass A'))).toBe(true);
    expect(classPlugin.requiresElk?.(parse('!pragma layout smetana\nclass A'))).toBe(false);
    expect(classPlugin.requiresElk?.(parse('class A'))).toBe(false);
  });

  it('layoutSync throws the renderSync message when no backend is supplied', () => {
    const ast = parse('!pragma layout elk\nclass A');
    expect(() => classPlugin.layoutSync(ast, defaultTheme, new DeterministicMeasurer())).toThrow(
      ELK_RENDER_SYNC_UNSUPPORTED,
    );
  });

  it('renderSync of an elk diagram without options.elk renders the error page', () => {
    const svg = renderSync('@startuml\n!pragma layout elk\nclass A\n@enduml');
    expect(svg).toContain('options.elk');
  });
});

/**
 * gtc-T6c -- `skinparam <<Public>> {` (empty element name): CommandSkinParamMultilines.java:50 accepts
 * it, SkinLoader.java:78-80,101 push/key it, SkinParam.java:292-297 moves the stereotype to the end.
 * Expected colours: jar oracle of the reduced fixture (block spelling renders identically to the flat
 * `ArrowColor<<Public>>` spelling): fill #FF0, stroke #0A0.
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const BODY = ['component A <<Public>>', 'component B <<Public>>', 'A --> B <<Public>>', '@enduml'];
const BLOCK = [
  '@startuml',
  'skinparam <<Public>> {',
  '  ArrowColor #0a0',
  '  ComponentBorderColor #0a0',
  '  ComponentBackgroundColor #ff0',
  '}',
  ...BODY,
].join('\n');
const FLAT = [
  '@startuml',
  'skinparam ArrowColor<<Public>> #0a0',
  'skinparam ComponentBorderColor<<Public>> #0a0',
  'skinparam ComponentBackgroundColor<<Public>> #ff0',
  ...BODY,
].join('\n');

const render = (src: string): string => renderSync(src, { measurer: new DeterministicMeasurer() });
const strip = (svg: string): string =>
  svg.replace(/<\?plantuml-src[^>]*\?>/, '').replace(/ data-source-line="\d+"/g, '');

describe('stereotype-only skinparam block', () => {
  const svg = render(BLOCK);

  it('applies the block entries to the stereotyped elements', () => {
    expect(svg).toContain(
      '<rect x="7" y="7" width="95.813" height="58" fill="#FF0" style="stroke:#0A0;stroke-width:0.5;"',
    );
    expect(svg).toContain(
      '<path d="M54.91,65.38 C54.91,83.35 54.91,101.52 54.91,119.51" style="stroke:#0A0;stroke-width:1;"',
    );
    expect(svg).toContain(
      '<polygon points="54.91,124.51,58.91,115.51,54.91,119.51,50.91,115.51,54.91,124.51" fill="#0A0"',
    );
  });

  it('renders like the flat spelling', () => {
    expect(strip(svg)).toBe(strip(render(FLAT)));
  });

  it('does not leak the block body into the diagram', () => {
    expect(svg).not.toContain('ArrowColor');
  });
});

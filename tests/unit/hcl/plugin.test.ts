import { describe, it, expect } from 'vitest';
import { hclPlugin } from '../../../src/diagrams/hcl/index.js';
import { renderSync } from '../../../src/index.js';

describe('hclPlugin', () => {
  it('has type hcl', () => {
    expect(hclPlugin.type).toBe('hcl');
  });

  it('renders a flat key-value HCL block to SVG', () => {
    const svg = renderSync('@starthcl\nregion = "us-east-1"\n@endhcl');
    expect(svg).toMatch(/^<svg/);
    expect(svg).toContain('us-east-1');
  });

  it('renders a nested resource block to SVG', () => {
    const svg = renderSync('@starthcl\nresource "aws_s3_bucket" "b" {\n  bucket = "test"\n}\n@endhcl');
    expect(svg).toMatch(/^<svg/);
  });

  it('renders an empty body without throwing', () => {
    const svg = renderSync('@starthcl\n@endhcl');
    expect(typeof svg).toBe('string');
  });

  it('drops a leading title, as the jar does (HclDiagramFactory.java:86-92)', () => {
    const svg = renderSync('@starthcl\ntitle My Title\nkey = "value"\n@endhcl');
    expect(svg).not.toContain('My Title');
    expect(svg).toContain('value');
  });

  it('handles ternary expression without throwing', () => {
    const svg = renderSync('@starthcl\nfoo = cond ? "a" : "b"\n@endhcl');
    expect(typeof svg).toBe('string');
  });

  // unwind2-S2: `HclDiagramFactory.java:86-92` never calls
  // `styleExtractor.applyStyles`, so an hcl `<style>` is stripped and ignored.
  // Jar: tests/fixtures/unwind2-S2/hcl-style-node.svg, hcl-style-document.svg.
  it('ignores hcldiagram.node and document styles, as the jar does', () => {
    const src = [
      '@starthcl',
      '<style>',
      'hclDiagram {',
      '  document { BackgroundColor "#abc" }',
      '  node { BackgroundColor "#ffcc00" }',
      '}',
      '</style>',
      'resource "r" {',
      '  region = "us-east-1"',
      '}',
      '@endhcl',
    ].join('\n');
    const svg = renderSync(src);
    expect(svg).toContain('us-east-1');
    expect(svg).not.toContain('#FC0');
    expect(svg).not.toContain('#AABBCC');
    expect(svg).toContain('fill="#F1F1F1"');
  });
});

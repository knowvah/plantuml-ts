import { describe, it, expect } from 'vitest';
import { preprocess } from '../../src/core/preprocessor.js';
import { renderSync } from '../../src/index.js';
import { DeterministicMeasurer } from '../../src/core/measurer-deterministic.js';

/**
 * mmp-T6g: a `<style>` block INSIDE an embedded `{{ ... }}` diagram belongs
 * to the inner source, not the outer document. Upstream never dispatches it
 * as the outer diagram's `CommandStyleMultilinesCSS`: a multi-line command
 * accumulating its lines swallows everything from a `{{…` line to the
 * matching `}}` verbatim, nesting counted
 * (`PSystemCommandFactory.java:288-306`, `addOneSingleLineManageEmbedded2`),
 * and `EmbeddedDiagram.createAndSkip` (`EmbeddedDiagram.java:97-115`) hands
 * those lines to the inner diagram.
 */
const STYLE_LINES = [
  '<style>',
  'mindmapDiagram {',
  '  node {',
  '    FontColor #2FA4E7',
  '    LineColor #2FA4E7',
  '    BackGroundColor transparent',
  '  }',
  '}',
  '</style>',
];
/** `tests/corpus/class/semutu-45-zeno907.puml`, verbatim. */
const SEMUTU = [
  '@startuml',
  'title',
  '{{mindmap',
  ...STYLE_LINES,
  '',
  '* a',
  '** b',
  '*** c',
  '}}',
  'end title',
  '@enduml',
].join('\n');

function embeddedImageSvg(svg: string): string {
  const m = /xlink:href="data:image\/svg\+xml;base64,([^"]+)"/.exec(svg);
  if (m === null) throw new Error('no embedded svg image');
  return Buffer.from(m[1]!, 'base64').toString('utf8');
}

describe('preprocessor: <style> inside an embedded {{ }} block', () => {
  it('leaves the nested <style> lines to the embedded source', () => {
    const { styles, lines } = preprocess(['title', '{{mindmap', ...STYLE_LINES, '* a', '}}', 'end title'].join('\n'));
    expect(styles).toEqual([]);
    expect(lines).toEqual(['title', '{{mindmap', ...STYLE_LINES, '* a', '}}', 'end title']);
  });

  it('still collects a <style> after the embedded block closes', () => {
    const { styles, lines } = preprocess(
      ['title', '{{', '{{mindmap', '* a', '}}', '}}', 'end title', '<style>', 'x', '</style>'].join('\n'),
    );
    expect(styles).toEqual(['x']);
    expect(lines).toEqual(['title', '{{', '{{mindmap', '* a', '}}', '}}', 'end title']);
  });

  it('styles the embedded mindmap of semutu-45-zeno907 like the jar', () => {
    const inner = embeddedImageSvg(renderSync(SEMUTU, { measurer: new DeterministicMeasurer() }));
    // Jar golden (test-results/dot-cache/unknown/semutu-45-zeno907/in.svg,
    // decoded image): node "a" box and label.
    expect(inner).toContain(
      '<rect x="10" y="20" width="27.787" height="34" fill="none" style="stroke:#2FA4E7;stroke-width:1.5;" rx="12.5" ry="12.5"/>',
    );
    expect(inner).toContain('<text x="20" y="40.889" fill="#2FA4E7" font-size="14">a</text>');
  });
});

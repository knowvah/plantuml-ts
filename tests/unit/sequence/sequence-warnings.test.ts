import { describe, it, expect } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderSync } from '../../../src/index.js';

const measurer = new DeterministicMeasurer();
const PADDING_DRAWN = 'Please use CSS style instead of skinparam ParticipantPadding'.replaceAll(' ', ' ');
const IGNORED_DRAWN = 'This position is ignored: BOTTOM'.replaceAll(' ', ' ');

const PLAIN = ['@startuml', 'A -> B : hi', '@enduml'].join('\n');
const PADDED = ['@startuml', 'skinparam ParticipantPadding 10', 'A -> B : hi', '@enduml'].join('\n');
const REF_BOTTOM = ['@startuml', 'A -> B : hi', 'ref over A, B : init', 'note bottom : x', '@enduml'].join('\n');
const REF_RIGHT = REF_BOTTOM.replace('note bottom', 'note right');

function heightOf(svg: string): number {
  return Number(/<svg[^>]*height:(\d+)px/.exec(svg)?.[1] ?? Number.NaN);
}

describe('sequence warning banner (CommandSkinParam.java:92-99, DiagramChromeFactory.java:176-200)', () => {
  it('draws the deprecation banner for skinparam ParticipantPadding', () => {
    const svg = renderSync(PADDED, { measurer });
    expect(svg).toContain(`>${PADDING_DRAWN}</text>`);
    expect(svg).toContain('fill="#FFC" style="stroke:#FD8;stroke-width:3;"');
  });

  it('draws no banner without a deprecated skinparam', () => {
    expect(renderSync(PLAIN, { measurer })).not.toContain('Please');
  });

  it('stacks the banner above the body, growing the canvas by its 20px (java:265)', () => {
    expect(heightOf(renderSync(PADDED, { measurer })) - heightOf(renderSync(PLAIN, { measurer }))).toBe(20);
  });
});

describe('ignored ref note (Reference.java:166-171)', () => {
  it('prints "This position is ignored: BOTTOM" for a bottom note on a ref', () => {
    expect(renderSync(REF_BOTTOM, { measurer })).toContain(`>${IGNORED_DRAWN}</text>`);
  });

  it('prints nothing for a right note on a ref (accepted)', () => {
    expect(renderSync(REF_RIGHT, { measurer })).not.toContain('ignored');
  });
});

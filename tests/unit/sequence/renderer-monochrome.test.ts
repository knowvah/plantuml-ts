/**
 * `skinparam monochrome true|reverse` on the sequence engine (sdd3-T1h).
 *
 * `TitledDiagram#muteColorMapper` (`TitledDiagram.java:292-299`) picks
 * `ColorMapper.MONOCHROME` / `MONOCHROME_REVERSE`; `UgDiagram.java:134-135`
 * installs it on the exporter, so every colour the body draws is mapped
 * (`ColorMapper.java:80-91` -> `ColorUtils.getGrayScaleColor[Reverse]`,
 * `ColorUtils.java:45-75`): `gray = (299 r + 587 g + 114 b) / 1000`
 * (integer division, `:51,57`), reverse is `255 - gray`.
 *
 * Default sequence paints (Rose skin): participant fill `#E2E2F0`, note fill
 * `#FEFFDD`, line `#181818`.
 *   #E2E2F0: (226*299 + 226*587 + 240*114) / 1000 = 227596 / 1000 = 227 = 0xE3
 *            (golden xezipe-17-tima059 in.svg: `#E3E3E3`); reverse 28 = 0x1C.
 *   #FEFFDD: (254*299 + 255*587 + 221*114) / 1000 = 250825 / 1000 = 250 = 0xFA
 *            (golden: `#FAFAFA`); reverse 5 = 0x05.
 *   #181818: 24 * 1000 / 1000 = 24 = 0x18; reverse 231 = 0xE7.
 */
import { describe, it, expect } from 'vitest';

import { renderFixture } from '../../helpers/render.js';

const BODY = 'Alice -> Bob: hi\nnote right of Bob: n\n';

function render(skinparam: string): string {
  return renderFixture(`@startuml\n${skinparam}${BODY}@enduml\n`);
}

/** Every `fill`/`stroke` colour value, in document order. */
function paints(svg: string): string[] {
  return [...svg.matchAll(/(?:fill|stroke)(?:="|:)(#[0-9A-Fa-f]{3,8})/g)].map((m) => m[1]!);
}

describe('sequence renderer -- skinparam monochrome (sdd3-T1h)', () => {
  const plain = render('');

  it('maps the participant fill, note fill and message stroke to grey', () => {
    const svg = render('skinparam monochrome true\n');
    const colours = new Set(paints(svg));
    expect(colours.has('#E3E3E3')).toBe(true); // participant: ColorUtils.java:51
    expect(colours.has('#FAFAFA')).toBe(true); // note
    expect(colours.has('#181818')).toBe(true); // line stays 24
    expect(colours.has('#E2E2F0')).toBe(false);
    expect(colours.has('#FEFFDD')).toBe(false);
  });

  it('reverse maps each colour to 255 - gray (ColorUtils.java:72-75)', () => {
    const svg = render('skinparam monochrome reverse\n');
    const colours = new Set(paints(svg));
    expect(colours.has('#1C1C1C')).toBe(true); // participant
    expect(colours.has('#050505')).toBe(true); // note
    expect(colours.has('#E7E7E7')).toBe(true); // line
    expect(colours.has('#E2E2F0')).toBe(false);
  });

  it('leaves the structure untouched: only paint values change', () => {
    const svg = render('skinparam monochrome true\n');
    const strip = (s: string): string => s.replace(/#[0-9A-Fa-f]{3,8}/g, '#');
    expect(strip(svg)).toBe(strip(plain));
  });

  it('without the skinparam the default paints are unmapped', () => {
    const colours = new Set(paints(plain));
    expect(colours.has('#E2E2F0')).toBe(true);
    expect(colours.has('#FEFFDD')).toBe(true);
    expect(colours.has('#E3E3E3')).toBe(false);
  });
});

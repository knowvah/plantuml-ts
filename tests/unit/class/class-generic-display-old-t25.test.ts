/**
 * cdd3-T25 (E3-3) -- `skinparam genericDisplay old`.
 *
 * `SkinParam#displayGenericWithOldFashion` (`skin/SkinParam.java:1180-
 * 1181`, `valueIs("genericDisplay", "old")`) flips `EntityImageClassHeader`
 * (`svek/image/EntityImageClassHeader.java:90-105`) into a different
 * branch: no separate `<T>` tag box; the raw generic clause is appended
 * `<>`-wrapped onto the LAST line of the classifier's own display
 * (`Display#addGeneric`, `klimt/creole/Display.java:529-538`), rendered in
 * the header NAME's own font (14pt, non-italic here), not the 12pt-italic
 * `FontParam.CLASS_STEREOTYPE` the tag box uses.
 *
 * Expected values are the pinned jar's own output for
 * `bijevi-38-duza931` (`test-results/dot-cache/class/bijevi-38-duza931/in.svg`).
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { resolveSkinparam } from '../../../src/core/skinparam.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { computeHeaderInfo } from '../../../src/diagrams/class/class-stereotype.js';
import type { Classifier } from '../../../src/diagrams/class/ast.js';

function render(src: string): string {
  return renderSync(src, { measurer: new DeterministicMeasurer() });
}

/** Every `<text ...>...</text>` element's attributes + content, order- and
 *  serialization-independent (this port's own attribute ORDER is a
 *  pre-existing, unrelated divergence from the jar's -- only the VALUES
 *  are a target here). */
function texts(svg: string): Array<{
  x: string | undefined;
  y: string | undefined;
  fontSize: string | undefined;
  fontStyle: string | undefined;
  textLength: string | undefined;
  content: string;
}> {
  return [...svg.matchAll(/<text ([^>]*)>([^<]*)<\/text>/g)].map((m) => {
    const attrs = m[1] ?? '';
    const attr = (name: string): string | undefined => new RegExp(`${name}="([^"]*)"`).exec(attrs)?.[1];
    return {
      x: attr('x'),
      y: attr('y'),
      fontSize: attr('font-size'),
      fontStyle: attr('font-style'),
      textLength: attr('textLength'),
      content: m[2] ?? '',
    };
  });
}

const BIJEVI = `@startuml
skinparam style strictuml
skinparam genericDisplay old
hide empty members
class "coursGroupe:\\nArrayList<CoursGroupe>" as g
@enduml`;

describe('cdd3-T25: skinparam genericDisplay old (E3-3)', () => {
  it('maps "skinparam genericDisplay old" to theme.genericDisplayOld', () => {
    const { theme, unknown } = resolveSkinparam(new Map([['genericdisplay', 'old']]), defaultTheme);
    expect(theme.genericDisplayOld).toBe(true);
    expect(unknown).toEqual([]);
  });

  it('leaves theme.genericDisplayOld unset for an unrecognized value', () => {
    const { theme } = resolveSkinparam(new Map([['genericdisplay', 'new']]), defaultTheme);
    expect(theme.genericDisplayOld).toBeUndefined();
  });

  it('appends the generic clause onto the last display line (computeHeaderInfo)', () => {
    const classifier: Classifier = {
      id: 'g',
      display: 'coursGroupe:\\nArrayList',
      kind: 'class',
      typeParams: ['CoursGroupe'],
      typeParamsRawText: 'CoursGroupe',
      members: [],
    };
    const old = computeHeaderInfo(classifier, true);
    expect(old.headerText).toBe('coursGroupe:\\nArrayList<CoursGroupe>');
    const notOld = computeHeaderInfo(classifier, false);
    expect(notOld.headerText).toBe('coursGroupe:\\nArrayList');
  });

  it('renders bijevi-38-duza931 jar-exact values (EntityImageClassHeader.java:90-105)', () => {
    const svg = render(BIJEVI);
    // No separate generic-tag <rect> -- just the classifier body box.
    expect(svg).toContain('width="161.663" height="38"');
    expect(svg).not.toContain('stroke-dasharray="2,2"'); // the tag-box rect
    const [line1, line2] = texts(svg);
    // Line 1: the unchanged "coursGroupe:" run, 14pt, non-italic.
    expect(line1).toMatchObject({
      x: '45.481',
      y: '22.889',
      fontSize: '14',
      textLength: '84.7',
      content: 'coursGroupe:',
    });
    // Line 2: the generic clause folded INTO the name run, same 14pt font,
    // not the 12pt-italic tag-box font.
    expect(line2).toMatchObject({
      x: '10',
      y: '36.889',
      fontSize: '14',
      textLength: '155.663',
      content: 'ArrayList&lt;CoursGroupe>',
    });
    expect(line2?.fontStyle).toBeUndefined();
    expect(svg).toContain('width="181px"');
    expect(svg).toContain('height="58px"');
  });
});

import { describe, it, expect } from 'vitest';
import { renderFixture } from '../../helpers/render.js';

// C-6 / E3-8 (cdd3-T24): the class box, the block0 body divider and the
// class note all read their stroke from the style cascade
// (`EntityImageClass.java:215` `getStyle().getStroke(...)`,
// `BodyEnhancedAbstract.java:121-122` `style.value(PName.LineThickness)`,
// `EntityImageNote.java:108,283-286`). Expected values are the jar's own
// output for the same source (`scripts/oracle-render.sh`, cdd3-T24 probes).

function strokeWidths(svg: string, tag: 'rect' | 'line' | 'path'): string[] {
  const re = new RegExp(`<${tag} [^>]*stroke-width="([^"]+)"`, 'g');
  return [...svg.matchAll(re)].map((m) => m[1]!);
}

describe('class LineThickness style cascade (C-6)', () => {
  it('skin rose: box and block0 divider draw 1 (rose.skin:11 root LineThickness 1.0; jar rose-min)', () => {
    const svg = renderFixture('@startuml\nskin rose\nclass A {\n--\n+ x\n}\n@enduml\n');
    expect(strokeWidths(svg, 'rect')[0]).toBe('1');
    expect(strokeWidths(svg, 'line').slice(0, 2)).toEqual(['1', '1']);
  });

  it('<style> class { LineThickness 2 }: box and block0 divider 2, the -- separator keeps 1 (UHorizontalLine#getStroke)', () => {
    const svg = renderFixture(
      '@startuml\n<style>\nclass { LineThickness 2 }\n</style>\nclass A {\n--\n+ x\n}\n@enduml\n',
    );
    expect(strokeWidths(svg, 'rect')[0]).toBe('2');
    expect(strokeWidths(svg, 'line').slice(0, 2)).toEqual(['2', '1']);
  });

  it('<style> root { LineThickness 2 }: an empty class draws both dividers 2 (jar lt-root)', () => {
    const svg = renderFixture('@startuml\n<style>\nroot { LineThickness 2 }\n</style>\nclass A\n@enduml\n');
    expect(strokeWidths(svg, 'rect')[0]).toBe('2');
    expect(strokeWidths(svg, 'line').slice(0, 2)).toEqual(['2', '2']);
  });

  it('with no style the plantuml.skin element default 0.5 stands (plantuml.skin:93)', () => {
    const svg = renderFixture('@startuml\nclass A {\n--\n+ x\n}\n@enduml\n');
    expect(strokeWidths(svg, 'rect')[0]).toBe('0.5');
    expect(strokeWidths(svg, 'line').slice(0, 2)).toEqual(['0.5', '1']);
  });
});

describe('class note LineColor/LineThickness (E3-8, EntityImageNote.java:108,283-286)', () => {
  it('skinparam NoteBorderThickness 3 / NoteBorderColor green: body 3, normal fold keeps 1, both green (xoteci)', () => {
    const svg = renderFixture(
      '@startuml\nskinparam NoteBorderThickness 3\nskinparam NoteBorderColor green\nnote as N\n  hi\nend note\n@enduml\n',
    );
    expect(svg).toMatch(/<path d="M[^"]*" fill="#FEFFDD" stroke="#008000" stroke-width="3"\/>/);
    expect(svg).toMatch(/<path d="M[^"]*" fill="#FEFFDD" stroke="#008000" stroke-width="1"\/>/);
  });

  it('skin rose: the note body draws 1 (root LineThickness, no rose note override)', () => {
    const svg = renderFixture('@startuml\nskin rose\nnote as N\n  hello\nend note\n@enduml\n');
    expect(strokeWidths(svg, 'path')[0]).toBe('1');
  });

  it('<style> classDiagram { LineColor red } reaches the note border (jar note-cd-linecolor)', () => {
    const svg = renderFixture(
      '@startuml\n<style>\nclassDiagram { LineColor red }\n</style>\nnote as N\n  hi\nend note\n@enduml\n',
    );
    expect(svg).toMatch(/<path d="M[^"]*" fill="#FEFFDD" stroke="#F00" stroke-width="0.5"\/>/);
  });

  it('<style> note { LineThickness 2 }: a member-tip note draws outline and fold at 2 (Opale#drawU on the stroked ug)', () => {
    const svg = renderFixture(
      '@startuml\n<style>\nnote { LineThickness 2 }\n</style>\nclass A {\n  +x\n}\nnote right of A::x\n  tipnote\nend note\n@enduml\n',
    );
    expect(strokeWidths(svg, 'path').filter((w) => w === '2')).toHaveLength(2);
  });
});

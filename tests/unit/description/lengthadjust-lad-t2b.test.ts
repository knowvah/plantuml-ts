/**
 * lad-T2b: `skinparam lengthAdjust` reaches the description engine on both
 * document paths (un-chromed `completeSvg`, chromed `RenderFragment`).
 * @see net/sourceforge/plantuml/core/TextBlockExporter.java:306-307
 * @see net/sourceforge/plantuml/style/SkinParam.java:1258-1269
 * @see net/sourceforge/plantuml/klimt/drawing/svg/SvgGraphics.java:155-158,699-705
 */
import { describe, it, expect } from 'vitest';
import { renderFixture } from '../../helpers/render.js';

// Captured from the tree before the lad-T2b edit.
const PRE_CHANGE: Record<string, string> = {
  unchromed:
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" data-diagram-type="DESCRIPTION" style="width:101px;height:173px;background:#FFFFFF;" width="101px" height="173px" viewBox="0 0 101 173" zoomAndPan="magnify" preserveAspectRatio="none" contentStyleType="text/css"><?plantuml $version$?><defs/><g font-family="sans-serif" lengthAdjust="spacing"><!--entity Alpha--><g class="entity" data-qualified-name="Alpha" id="ent0001"><rect x="7" y="7" width="80" height="46" fill="#F1F1F1" style="stroke:#181818;stroke-width:0.5;" rx="2.5" ry="2.5"/><rect x="67" y="12" width="15" height="10" fill="#F1F1F1" style="stroke:#181818;stroke-width:0.5;"/><rect x="65" y="14" width="4" height="2" fill="#F1F1F1" style="stroke:#181818;stroke-width:0.5;"/><rect x="65" y="18" width="4" height="2" fill="#F1F1F1" style="stroke:#181818;stroke-width:0.5;"/><text x="22" y="39.444" fill="#000" font-size="14" textLength="40">Alpha</text></g><!--entity Beta--><g class="entity" data-qualified-name="Beta" id="ent0002"><rect x="11" y="113" width="72" height="46" fill="#F1F1F1" style="stroke:#181818;stroke-width:0.5;" rx="2.5" ry="2.5"/><rect x="63" y="118" width="15" height="10" fill="#F1F1F1" style="stroke:#181818;stroke-width:0.5;"/><rect x="61" y="120" width="4" height="2" fill="#F1F1F1" style="stroke:#181818;stroke-width:0.5;"/><rect x="61" y="124" width="4" height="2" fill="#F1F1F1" style="stroke:#181818;stroke-width:0.5;"/><text x="26" y="145.444" fill="#000" font-size="14" textLength="32">Beta</text></g><!--link Alpha to Beta--><g class="link" data-entity-1="ent0001" data-entity-2="ent0002" id="lnk3" data-link-type="dependency"><path d="M47,53.31 C47,70.86 47,90.19 47,107.73" style="stroke:#181818;stroke-width:1;" fill="none" id="Alpha-to-Beta"/><polygon points="47,112.73,51,103.73,47,107.73,43,103.73,47,112.73" fill="#181818" style="stroke:#181818;stroke-width:1;stroke-linejoin:miter;stroke-miterlimit:10;"/></g></g></svg>',
  chromed:
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" data-diagram-type="DESCRIPTION" style="width:101px;height:210px;background:#FFFFFF;" width="101px" height="210px" viewBox="0 0 101 210" zoomAndPan="magnify" preserveAspectRatio="none" contentStyleType="text/css"><?plantuml $version$?><defs/><g font-family="sans-serif" lengthAdjust="spacing"><g class="title"><text x="39" y="22.444" fill="#000" font-size="14" textLength="16" font-weight="700">Tt</text></g><!--entity Alpha--><g class="entity" data-qualified-name="Alpha" id="ent0001"><rect x="7" y="44" width="80" height="46" fill="#F1F1F1" style="stroke:#181818;stroke-width:0.5;" rx="2.5" ry="2.5"/><rect x="67" y="49" width="15" height="10" fill="#F1F1F1" style="stroke:#181818;stroke-width:0.5;"/><rect x="65" y="51" width="4" height="2" fill="#F1F1F1" style="stroke:#181818;stroke-width:0.5;"/><rect x="65" y="55" width="4" height="2" fill="#F1F1F1" style="stroke:#181818;stroke-width:0.5;"/><text x="22" y="76.444" fill="#000" font-size="14" textLength="40">Alpha</text></g><!--entity Beta--><g class="entity" data-qualified-name="Beta" id="ent0002"><rect x="11" y="150" width="72" height="46" fill="#F1F1F1" style="stroke:#181818;stroke-width:0.5;" rx="2.5" ry="2.5"/><rect x="63" y="155" width="15" height="10" fill="#F1F1F1" style="stroke:#181818;stroke-width:0.5;"/><rect x="61" y="157" width="4" height="2" fill="#F1F1F1" style="stroke:#181818;stroke-width:0.5;"/><rect x="61" y="161" width="4" height="2" fill="#F1F1F1" style="stroke:#181818;stroke-width:0.5;"/><text x="26" y="182.444" fill="#000" font-size="14" textLength="32">Beta</text></g><!--link Alpha to Beta--><g class="link" data-entity-1="ent0001" data-entity-2="ent0002" id="lnk3" data-link-type="dependency"><path d="M47,90.31 C47,107.86 47,127.19 47,144.73" style="stroke:#181818;stroke-width:1;" fill="none" id="Alpha-to-Beta"/><polygon points="47,149.73,51,140.73,47,144.73,43,140.73,47,149.73" fill="#181818" style="stroke:#181818;stroke-width:1;stroke-linejoin:miter;stroke-miterlimit:10;"/></g></g></svg>',
};

const BODY = '[Alpha] --> [Beta]\n';
const KINDS: Record<string, string> = {
  component: BODY,
  usecase: '(Alpha) --> (Beta)\n',
  c4: BODY,
};
const PATHS: Record<string, string> = { unchromed: '', chromed: 'title Tt\n' };

function svg(body: string, path: string, lengthAdjust?: string): string {
  const param = lengthAdjust === undefined ? '' : `skinparam lengthAdjust ${lengthAdjust}\n`;
  return renderFixture(`@startuml\n${param}${PATHS[path]}${body}@enduml`);
}

describe.each(Object.keys(KINDS))('description (%s) skinparam lengthAdjust', (kind) => {
  describe.each(Object.keys(PATHS))('%s path', (path) => {
    const body = KINDS[kind] ?? '';
    it('unset: root spacing and textLength present', () => {
      const out = svg(body, path);
      expect(out).toContain('lengthAdjust="spacing"');
      expect(out).toMatch(/textLength="[\d.]+"/);
    });
    it('explicit spacing is byte-identical to unset (D4)', () => {
      expect(svg(body, path, 'spacing')).toBe(svg(body, path));
    });
    it('spacingAndGlyphs: named on the root, textLength kept', () => {
      const out = svg(body, path, 'spacingAndGlyphs');
      expect(out).toContain('<g font-family="sans-serif" lengthAdjust="spacingAndGlyphs">');
      expect(out).not.toContain('lengthAdjust="spacing"');
      expect(out).toMatch(/textLength="[\d.]+"/);
    });
    it('none: no lengthAdjust and no textLength', () => {
      const out = svg(body, path, 'none');
      expect(out).not.toContain('lengthAdjust');
      expect(out).not.toContain('textLength');
      expect(out).toContain('>Alpha</text>');
    });
  });
});

describe('description unset output', () => {
  it.each(Object.keys(PATHS))('%s: byte-identical to the pre-change render (D4)', (path) => {
    expect(svg(BODY, path)).toBe(PRE_CHANGE[path]);
  });
});

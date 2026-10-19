/**
 * gtc-T2b (zosuje): two `<style>` mechanisms that never reached a description diagram.
 *
 * A. `<style> component { FontStyle italic }`: the text style of an entity is the merged style of
 *    `root, element, componentDiagram, <uSymbol SNames>, title` (`EntityImageDescription.java:142-172`,
 *    `styleTitle.getFontConfiguration`), so a bucket's FontStyle replaces the skin's default face.
 * B. `<style> arrow { LineColor }`: a link's line colour is the merged style of
 *    `root, element, <diagram>, arrow` (`SvekEdge.java:816-821,874-876`), and a description diagram's style name is
 *    `componentDiagram` (`DiagramType.java:250-251`), NOT `classDiagram`.
 * Expected values: `test-results/dot-cache/component/zosuje-43-zebi775/in.svg` (c2 `font-style="italic"`, links
 * `stroke:#00BFFF`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageDescription.java:142-172
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:816-821,874-876
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';

const LINK = 'a -> b';

function render(style: string, body: string): string {
  return renderSync(`@startuml\n<style>\n${style}\n</style>\n${body}\n@enduml`);
}

function linkBody(svg: string): string {
  const start = svg.indexOf('<g class="link"');
  return svg.slice(start, svg.indexOf('</g>', start));
}

describe('component FontStyle from <style>', () => {
  it('italicises the entity title', () => {
    const svg = render('component {\n FontStyle italic\n}', 'component c2');
    expect(svg).toMatch(/<text [^>]*font-style="italic"[^>]*>c2<\/text>/);
  });

  it('leaves the title plain when no style sets one', () => {
    expect(render('root {\n FontSize 14\n}', 'component c2')).not.toMatch(/<text [^>]*font-style[^>]*>c2<\/text>/);
  });

  it('does not italicise another symbol', () => {
    const svg = render('component {\n FontStyle italic\n}', 'node n1');
    expect(svg).not.toMatch(/<text [^>]*font-style="italic"[^>]*>n1<\/text>/);
  });
});

describe('description arrow LineColor cascade', () => {
  it('colours the link path and head from <style> arrow', () => {
    const body = linkBody(render('arrow {\n LineColor DeepSkyBlue\n}', `component a\ncomponent b\n${LINK}`));
    expect(body).toContain('stroke:#00BFFF;');
    expect(body).toMatch(/<polygon [^>]*fill="#00BFFF"/);
  });

  it('colours the link from a root LineColor', () => {
    const body = linkBody(render('root {\n LineColor DeepSkyBlue\n}', `component a\ncomponent b\n${LINK}`));
    expect(body).toContain('stroke:#00BFFF;');
  });

  it('ignores a classDiagram arrow selector in a component diagram', () => {
    const body = linkBody(
      render('classDiagram {\n arrow {\n LineColor red\n }\n}', `component a\ncomponent b\n${LINK}`),
    );
    expect(body).toContain('stroke:#181818;');
  });

  it('applies a componentDiagram arrow selector', () => {
    const body = linkBody(
      render('componentDiagram {\n arrow {\n LineColor red\n }\n}', `component a\ncomponent b\n${LINK}`),
    );
    expect(body).toContain('stroke:#F00;');
  });

  it('lets an inline link colour win over the style', () => {
    const body = linkBody(render('arrow {\n LineColor red\n}', 'component a\ncomponent b\na -[#blue]> b'));
    expect(body).toContain('stroke:#00F;');
  });
});

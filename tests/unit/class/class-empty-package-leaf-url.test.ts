/**
 * cdd5-T4e (`empty-package-leaf-url-dropped`, `unknown/rukate-37-jabu394`):
 * a collapsed-empty `package`/`namespace` leaf's `[[url]]` reaches its
 * `ClassifierGeo.url` (`class-namespace.ts:113`: "if (ns.url !== undefined)
 * classifier.url = ns.url;"), but `renderEmptyPackageLeaf` never read it, so
 * the leaf never drew the `<a>` wrapper `EntityImageEmptyPackage` does.
 *
 * Upstream: `svek/image/EntityImageEmptyPackage.java:148-149` — "if (url !=
 * null) ug.startUrl(url);" … `:168-169` — "if (url != null)
 * ug.closeUrl();" (`:102` — "this.url = entity.getUrl99();"). The `<a>`
 * wraps the drawn shapes directly (no `<g>`, matching this leaf's existing
 * unwrapped-sibling draw structure — `class-empty-package-leaf-n33.test.ts`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageEmptyPackage.java:102,148-149,168-169
 */
import { describe, it, expect } from 'vitest';
import { renderFixture } from '../../helpers/render.js';

describe('a collapsed-empty package leaf with [[url]] (rukate-37-jabu394)', () => {
  it('wraps its drawn shapes in <a xlink:href>, unwrapped by any <g>', () => {
    const svg = renderFixture(`@startuml
package core [[org/jgrapes/core/package-summary.html]] {
}
@enduml`);
    const hrefIdx = svg.indexOf('xlink:href="org/jgrapes/core/package-summary.html"');
    expect(hrefIdx).toBeGreaterThan(-1);
    const aOpen = svg.lastIndexOf('<a ', hrefIdx);
    expect(aOpen).toBeGreaterThan(-1);
    const pathIdx = svg.indexOf('<path', hrefIdx);
    expect(pathIdx).toBeGreaterThan(hrefIdx);
  });

  it('draws no <a> wrapper when the package has no url', () => {
    const svg = renderFixture(`@startuml
package core {
}
@enduml`);
    expect(svg).not.toContain('<a ');
  });
});

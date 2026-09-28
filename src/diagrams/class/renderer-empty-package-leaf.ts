/**
 * The collapsed-empty package leaf's draw -- moved out of `renderer.ts`
 * (cdd3-T9, 500-line cap) when S-12 added its BACK colour carry.
 */
import type { ClassifierGeo, NamespaceGeo } from './layout.js';
import type { ScaledTheme } from './class-scale-geo.js';
import type { StringMeasurer } from '../../core/measurer.js';
import { renderEmptyPackageIcon } from './class-namespace-shape.js';
import { resolveBareOrBackColor } from '../../core/color-override.js';
import { linkWrap } from '../../core/svg.js';

/**
 * G2 N33: a collapsed-empty `package`/`namespace` leaf (`ClassifierGeo
 * .folderTab` present, `class-magma.ts#isCollapsedGroup`'s doc comment)
 * draws its OWN small `EntityImageEmptyPackage` folder-tab icon -- the
 * SAME `renderNamespaceFolder`/`USymbolFolder#asBig` shape a non-empty
 * package's CLUSTER wrapper uses, just sized by
 * `measureEmptyPackageLeafDim`'s smaller formula instead of the cluster's
 * own content-driven dimension. Reuses `renderNamespaceFolder` by
 * constructing a `NamespaceGeo`-shaped view over the classifier's own
 * (DOT-driven) `x`/`y`/`width`/`height` plus the pre-computed `folderTab`
 * fields -- `id`/`creationIndex` are irrelevant to rendering (unused by
 * `renderNamespaceFolder`) so are filled with placeholders.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageEmptyPackage.java
 */
export function renderEmptyPackageLeaf(
  geo: ClassifierGeo,
  theme: ScaledTheme,
  measurer: StringMeasurer | undefined,
): string {
  const folderTab = geo.folderTab;
  if (folderTab === undefined) return '';
  const label = geo.rows[0]?.text ?? geo.id;
  const nsGeo: NamespaceGeo = {
    id: geo.id,
    x: geo.x,
    y: geo.y,
    width: geo.width,
    height: geo.height,
    label,
    wtitle: folderTab.wtitle,
    htitle: folderTab.htitle,
    baselineOffset: folderTab.baselineOffset,
  };
  // cdd3-T9 S-12: the entity's own BACK colour (EntityImageEmptyPackage.java:97).
  const back = resolveBareOrBackColor(geo.color);
  if (back !== undefined) nsGeo.color = back;
  // cdd3-T21 (E3-6): the measured stereo block + packageStyle symbol, and
  // the entity's style tags (`EntityImageEmptyPackage#getStyle`'s
  // `withTOBECHANGED(stereotype)`, `EntityImageEmptyPackage.java:88-91`).
  const icon = renderEmptyPackageIcon(nsGeo, theme, measurer, { tab: folderTab, tags: geo.stereotypeLabels ?? [] });
  // cdd5-T4e (empty-package-leaf-url-dropped): `EntityImageEmptyPackage
  // .java:148-149,168-169` brackets the drawn shapes in `ug.startUrl(url)`/
  // `closeUrl()` -- a raw `<a>`, no `<g>`, matching this leaf's existing
  // unwrapped-sibling draw structure (`geo.url` already carries the
  // `[[url]]`, copied from `Namespace.url` at collapse time,
  // `class-namespace.ts:113`).
  return geo.url !== undefined ? linkWrap(icon, geo.url) : icon;
}

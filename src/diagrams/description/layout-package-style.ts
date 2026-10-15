/**
 * `skinparam packagestyle` -> the `package` keyword's group symbol.
 *
 * `CommandPackageWithUSymbol.executeArg` resolves the group's `USymbol` once, at parse time:
 * `USymbols.fromString(symbol, actorStyle, componentStyle, packageStyle())` (`CommandPackageWithUSymbol.java:194`),
 * and for the keyword `package` that is `packageStyle.toUSymbol()` (`USymbols.java:103-104`; node -> NODE,
 * rect -> RECTANGLE, ... `PackageStyle.java:69-92`). Everything downstream -- the cluster-label supplements
 * (`ClusterHeader.java:88-93`), the style signature (`ClusterHeader.java:155-163`), the SName-keyed fonts and
 * colours, `ClusterDotString.java:308` -- reads that symbol, not the keyword. The port keeps skinparams in the
 * `Theme`, so the rewrite happens once at the layout entry (the same place `componentStyle` takes effect).
 *
 * Styles whose `toUSymbol()` is null (AGENT, STORAGE, COMPONENT1/2, ARTIFACT) keep the `package` keyword: the
 * group's symbol is null upstream, its style signature is `package_` (`ClusterHeader.java:160-161`), and
 * `usymbol-resolve.ts#resolveSymbol` answers null for it.
 */
import type { Theme } from '../../core/theme.js';
import type { USymbol } from '../../core/descriptive-keywords.js';
import { PackageStyle } from '../../core/decoration/symbol/USymbols.js';
import { resolvePackageStyle } from '../../core/decoration/symbol/usymbol-resolve.js';
import type { DescriptiveNode } from './ast.js';

/** The keyword whose `USymbol` is `PackageStyle#toUSymbol()` for the styles that have one (`PackageStyle.java:69-92`). */
const KEYWORD_BY_PACKAGE_STYLE: Readonly<Partial<Record<PackageStyle, USymbol>>> = {
  [PackageStyle.NODE]: 'node',
  [PackageStyle.CARD]: 'card',
  [PackageStyle.DATABASE]: 'database',
  [PackageStyle.CLOUD]: 'cloud',
  [PackageStyle.FRAME]: 'frame',
  [PackageStyle.RECTANGLE]: 'rectangle',
};

function restyle(nodes: readonly DescriptiveNode[], keyword: USymbol): DescriptiveNode[] {
  return nodes.map((n) => {
    if (n.children.length === 0) return n;
    const children = restyle(n.children, keyword);
    return n.symbol === 'package' ? { ...n, symbol: keyword, children } : { ...n, children };
  });
}

/**
 * Rewrites every non-empty `package` group to the skin's package-style keyword. An empty `package` is an
 * `EMPTY_PACKAGE` leaf (`GraphvizImageBuilder.java:415-418`), drawn by `EntityImageEmptyPackage`, not a cluster, so
 * it is left as written. Returns `nodes` itself when the style rewrites nothing.
 */
export function applyPackageStyle(nodes: DescriptiveNode[], theme: Theme): DescriptiveNode[] {
  const keyword = KEYWORD_BY_PACKAGE_STYLE[resolvePackageStyle(theme)];
  return keyword === undefined ? nodes : restyle(nodes, keyword);
}

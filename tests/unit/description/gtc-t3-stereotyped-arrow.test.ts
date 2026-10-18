/**
 * gtc-T3 (xenusu): a stereotyped description link takes its colour and width from the stereotype-signed arrow style.
 * `SvekEdge.java:816-821` resolves `root, element, componentDiagram, arrow` `.withTOBECHANGED(stereotype)`; the
 * skinparam spelling `arrow<<x>> { Color blue;line.Bold() }` reaches it through `FromSkinparamToStyle.convertNow`
 * (`:317-352`): the first `;` token is the LineColor (a leading `;` leaves a blank one, which is skipped), and a later
 * token containing `bold` is `LineThickness 2` (`readValue`, `:357-376`), both re-signed with the stereotype
 * (`addStyle`, `:396-410`).
 * Expected values: `test-results/dot-cache/component/xenusu-76-sabi405/in.svg`:
 *   `<<bold>>` link `stroke:#008000;stroke-width:2;`, `<<bluebold>>` link `stroke:#00F;stroke-width:2;`,
 *   inline `[#blue,bold]` link `stroke:#00F;stroke-width:2;`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/FromSkinparamToStyle.java:317-376,396-410
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';

const SKIN = `skinparam arrow {
  Color green
}
skinparam arrow<<bluebold>> {
  Color blue;line.Bold()
}
skinparam arrow<<bold>> {
  Color ;line.Bold()
}
`;

function linkStyles(source: string): string[] {
  const svg = renderSync(`@startuml\n${source}\n@enduml`);
  return [...svg.matchAll(/<g class="link"[^>]*>\s*<path [^>]*style="([^"]*)"/g)].map((m) => m[1] ?? '');
}

describe('stereotyped description arrow (skinparam spelling)', () => {
  it('draws <<bold>> in the base colour at width 2, <<bluebold>> blue at width 2, plain links unchanged', () => {
    const styles = linkStyles(`${SKIN}[a]\n[b]\na -> b <<bold>> : x\na -> b <<bluebold>> : y\na -> b : z`);
    expect(styles).toEqual([
      'stroke:#008000;stroke-width:2;',
      'stroke:#00F;stroke-width:2;',
      'stroke:#008000;stroke-width:1;',
    ]);
  });

  it('lets an inline link colour and thickness win over the stereotype', () => {
    const styles = linkStyles(`${SKIN}[a]\n[b]\na -[#red]> b <<bluebold>> : y`);
    expect(styles).toEqual(['stroke:#F00;stroke-width:2;']);
  });
});

describe('stereotyped description arrow (<style> spelling)', () => {
  it('applies arrow { .tag { LineColor } } to a tagged link only', () => {
    const style = '<style>\narrow {\n LineColor green\n .red {\n LineColor red\n }\n}\n</style>\n';
    const styles = linkStyles(`${style}[a]\n[b]\na -> b <<red>> : x\na -> b : y`);
    expect(styles).toEqual(['stroke:#F00;stroke-width:1;', 'stroke:#008000;stroke-width:1;']);
  });
});

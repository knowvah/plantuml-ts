/**
 * cdd8-T1c (dezobu-62-vuzu421): `CommandArchimate` REPLACES the leaf's
 * stereotype with the sprite stereotype `<<$archimate/<icon>>>`
 * (`descdiagram/command/CommandArchimate.java:146-154`), so a resolvable icon
 * draws the `archimate/<icon>` sprite (`EntityImageDescription.java:194-195`,
 * the sprite beats the label block) instead of a «icon» text row.
 */
import { describe, it, expect } from 'vitest';
import { parseDescription } from '../../../src/diagrams/description/parser.js';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { DescriptiveNode } from '../../../src/diagrams/description/ast.js';
import { descriptionAst } from './parse-description-ast.js';
import { buildSpriteAssetsStore } from '../../helpers/sprite-assets-store.js';

function firstNode(line: string): DescriptiveNode {
  const block: UmlSource = { lines: [line], type: 'description' };
  const node = descriptionAst(parseDescription(block)).nodes[0];
  if (node === undefined) throw new Error('Expected at least one node');
  return node;
}

const PROBE = '@startuml\narchimate #MOTIVATION "Transparency" <<motivation-principle>> as T\n@enduml\n';

function renderProbe(): string {
  return renderSync(PROBE, { measurer: new DeterministicMeasurer(), assetStore: buildSpriteAssetsStore() });
}

describe('archimate <<icon>> becomes the $archimate/<icon> sprite stereotype', () => {
  it('rewrites the stereotype to the archimate sprite (CommandArchimate.java:150-154)', () => {
    const node = firstNode('archimate #X "a" <<motivation-principle>> as A');
    expect(node.stereotypeSprite?.name).toBe('archimate/motivation-principle');
    expect(node.stereotypeSprite?.scale).toBe(1);
  });

  it("keeps getLabel()'s archimate label for the unresolved-sprite fallback (Stereotype.java:171-172)", () => {
    const node = firstNode('archimate #X "a" <<motivation-principle>> as A');
    expect(node.stereotype).toEqual(['motivation-principle']);
  });

  it('leaves an icon-less archimate leaf without a stereotype (java:150 `icon != null`)', () => {
    const node = firstNode('archimate #X "a" as A');
    expect(node.stereotypeSprite).toBeUndefined();
    expect(node.stereotype).toBeUndefined();
  });

  it('draws the 105.575x54 box the jar draws, with no «motivation-principle» text', () => {
    // scripts/oracle-render.sh on PROBE (1.2026.8beta1):
    // <rect x="7" y="7" width="105.575" height="54" .../>, one sprite <path>,
    // and `Transparency` as the only <text>.
    const svg = renderProbe();
    expect(svg).toContain('<rect x="7" y="7" width="105.575" height="54"');
    expect(svg).not.toContain('motivation-principle');
    expect(svg.match(/<text /g)?.length).toBe(1);
  });
});

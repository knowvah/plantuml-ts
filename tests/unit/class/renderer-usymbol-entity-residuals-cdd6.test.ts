/**
 * renderer-usymbol-entity-residuals-cdd6.test.ts — cdd6 batch-2 residual
 * round (journal rows 39, 40, 46): three producer gaps in the CLASS engine's
 * `EntityImageDescription` params builder (`renderer-usymbol-entity.ts`) that
 * T2a, T2f and T2b each diagnosed but could not reach from their write-sets.
 *
 * 1. The leaf's stereotype labels were hard-coded `[]`, so a USymbol
 *    EMPTY_PACKAGE / allowmixing `rectangle X <<s>>` leaf never drew its
 *    `«s»` row (`EntityImageDescription.java:193-202`,
 *    `portionShower.getVisibleStereotypeLabels(entity)`).
 * 2. The body's default separator thickness fell back to root's 1.0 where
 *    `BodyEnhancedAbstract.java:121-123` reads the entity's own resolved
 *    `LineThickness` (`plantuml.skin:91-93` `element { LineThickness 0.5 }`).
 * 3. A sprite path with no `stroke-width` of its own inherits the caller's
 *    ambient stroke (`SvgNanoParser.java:187-215`); the class constructor
 *    seeded `UStroke.simple()` (1.0) instead of the entity's own stroke.
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';

const measurer = new WidthTableMeasurer();

describe('collapsed USymbol leaf stereotype row (EntityImageDescription.java:193-202)', () => {
  it('unknown/catana-32: the inner rectangle<<boundary>> leaf draws its «boundary» row', () => {
    const svg = renderSync(
      [
        '@startuml',
        'rectangle "R1" as r1 <<boundary>> {',
        '  rectangle "R2" as r2 <<boundary>> {',
        '  }',
        '}',
        '@enduml',
      ].join('\n'),
      { measurer },
    );
    // one for the r1 cluster header (ClusterHeader.java:207), one for the r2 leaf
    expect(svg.match(/«boundary»/g)?.length).toBe(2);
  });

  it('`hide stereotype` leaves the leaf row out (getVisibleStereotypeLabels is hide/show-filtered)', () => {
    const svg = renderSync(
      [
        '@startuml',
        'hide stereotype',
        'rectangle "R1" as r1 <<boundary>> {',
        '  rectangle "R2" as r2 <<boundary>> {',
        '  }',
        '}',
        '@enduml',
      ].join('\n'),
      { measurer },
    );
    expect(svg).not.toContain('«boundary»');
  });
});

describe('description-body separator default thickness (BodyEnhancedAbstract.java:121-123)', () => {
  it('unknown/nuveji-19: a database body `____` separator draws the element 0.5, not root 1.0', () => {
    const svg = renderSync(['@startuml', 'database DB1 as "', 'A', '____', 'B', '"', '@enduml'].join('\n'), {
      measurer,
    });
    expect(svg).toContain('stroke-width:0.5;');
    expect(svg).not.toContain('stroke-width:1;');
  });
});

describe('sprite ambient stroke in a CLASS-engine card (SvgNanoParser.java:187-215)', () => {
  it("unknown/jefidu-98: an unset sprite path's stroke-width is the card's own 0.5", () => {
    const svg = renderSync(
      [
        '@startuml',
        'sprite ng <svg width="10" height="10">',
        '  <path d="M0 5L10 5" stroke="green" />',
        '</svg>',
        'card C [',
        '|= Sprite |',
        '| <$ng> |',
        ']',
        '@enduml',
      ].join('\n'),
      { measurer },
    );
    expect(svg).toContain('data-diagram-type="CLASS"');
    // `green` resolves to `#008000` (HColorSet), so match the emitted hex.
    const spritePath = /<path[^>]*stroke:#008000[^>]*>/.exec(svg)?.[0];
    expect(spritePath, 'the sprite path is drawn').toBeDefined();
    expect(spritePath).toContain('stroke-width:0.5;');
  });
});

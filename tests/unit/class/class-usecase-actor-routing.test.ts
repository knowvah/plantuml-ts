/**
 * SI10/ADR-2 -- pins `class-layout-leaf-shapes.ts#measureUsecaseOrActor`'s
 * routing onto the description engine's faithful
 * `EntityImageDescription.calculateDimensionSlow` path
 * (`measureUsecaseOrActorLeaf`, T1) instead of the class engine's own
 * `measureUsecase`/`measureActor` analytic substitute.
 *
 * Reachability (mission README's instrumented table): a bare `class C` +
 * `usecase` (no `allowmixing`) does NOT reach `measureUsecaseOrActor` at
 * all -- it routes to the description engine directly, byte-identical to a
 * pure usecase diagram. Only `actor` (any class diagram) and `allowmixing`
 * (both usecase and actor) reach this function, so every case below models
 * one of those two reachable inputs -- via a hand-built `Classifier`
 * literal, the established pattern for this file's sibling unit tests
 * (`class-geo-builders.test.ts`), not the full parse+layout pipeline, since
 * `measureUsecaseOrActor` is the exact unit under test.
 */
import { describe, it, expect } from 'vitest';
import { measureUsecaseOrActor } from '../../../src/diagrams/class/class-layout-leaf-shapes.js';
import { measureClassifier } from '../../../src/diagrams/class/class-layout-helpers.js';
import { measureUsecaseOrActorLeaf, measureLeafNode } from '../../../src/core/svek/image/leaf-sizing.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { createSpriteRegistry, addSprite, spriteDimsLookupFor } from '../../../src/core/sprite-commands.js';
import { SpriteSvg } from '../../../src/core/klimt/sprite/SpriteSvg.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { Classifier } from '../../../src/diagrams/class/ast.js';
import type { DescriptiveNode } from '../../../src/diagrams/description/ast.js';

const fontSpec = { family: 'Helvetica', size: 14 };
const measurer = new WidthTableMeasurer();

/** Declared 16x16, ink rectangle [1,11]x[1,9] (10x8 at offset 1,1) -- the
 *  same fixture `leaf-sizing-widen-routing.test.ts` (T1) uses for its own
 *  sprite-routing proof. */
const SHRUNK_INK_SVG = '<svg width="16" height="16"><path d="M1,1 L11,1 L11,9 L1,9 Z"/></svg>';

function spriteRegistryWithIcon() {
  const registry = createSpriteRegistry();
  const sprite = SpriteSvg.from(SHRUNK_INK_SVG);
  if (sprite === undefined) throw new Error('test fixture SVG failed to parse dimensions');
  addSprite(registry, 'icon', sprite);
  return registry;
}

describe('measureUsecaseOrActor routes through the description engine\'s faithful path (SI10/ADR-2)', () => {
  it('a class-diagram usecase (reachable via allowmixing) sizes exactly like the description engine\'s own usecase', () => {
    const classifier: Classifier = {
      id: 'u', display: 'Hello World', kind: 'usecase', typeParams: [], members: [],
    };
    const measured = measureUsecaseOrActor(classifier, fontSpec, measurer);

    // Literal numbers captured from a real run (jiti probe, 2026-08-02) --
    // these are the SAME numbers leaf-sizing-widen-routing.test.ts (T1)
    // pins for the identical display/font via measureUsecaseOrActorLeaf,
    // confirming the class engine now derives the identical figure.
    expect(measured.width).toBe(103.01505037879433);
    expect(measured.height).toBe(25.79898987322333);

    // Equals the description engine's own entry point for the same input --
    // proves the ROUTE, not just a coincidentally-matching literal.
    const viaEntryPoint = measureUsecaseOrActorLeaf('Hello World', 'usecase', fontSpec, measurer);
    expect({ width: measured.width, height: measured.height }).toEqual(viaEntryPoint);

    // Equals measureLeafNode -- the description DIAGRAM engine's own leaf
    // dispatch (a bare usecase display, not the class engine's synthesized
    // node), i.e. the SAME dimension a `usecase` in a description diagram
    // produces for this exact display.
    const node: DescriptiveNode = { id: '', display: 'Hello World', symbol: 'usecase', children: [] };
    const viaDescriptionDiagram = measureLeafNode(node, fontSpec, measurer);
    expect({ width: measured.width, height: measured.height }).toEqual(viaDescriptionDiagram);

    // The class-specific MeasuredClassifier composition is unchanged --
    // one row at y = height/2, no dividers (task item 2).
    expect(measured.rows).toEqual([
      { text: 'Hello World', y: measured.height / 2, indent: 0, italic: false },
    ]);
    expect(measured.dividerYs).toEqual([]);
  });

  it('a bare actor sizes exactly like the description engine\'s own actor (stickman + label)', () => {
    const classifier: Classifier = {
      id: 'a', display: 'Bob', kind: 'descriptive', usymbol: 'actor', typeParams: [], members: [],
    };
    const measured = measureUsecaseOrActor(classifier, fontSpec, measurer);

    // Literal numbers -- the same "Bob" 27x74 leaf-sizing-widen-routing.test.ts (T1) pins.
    expect(measured.width).toBe(27);
    expect(measured.height).toBe(74);

    const viaEntryPoint = measureUsecaseOrActorLeaf('Bob', 'actor', fontSpec, measurer);
    expect({ width: measured.width, height: measured.height }).toEqual(viaEntryPoint);

    const node: DescriptiveNode = { id: '', display: 'Bob', symbol: 'actor', children: [] };
    const viaDescriptionDiagram = measureLeafNode(node, fontSpec, measurer);
    expect({ width: measured.width, height: measured.height }).toEqual(viaDescriptionDiagram);

    expect(measured.rows).toEqual([{ text: 'Bob', y: 37, indent: 0, italic: false }]);
    expect(measured.dividerYs).toEqual([]);
  });

  it('threads sprites through to the faithful path -- a registered <$sprite> lookup changes the measured dimension (task item 3)', () => {
    const classifier: Classifier = {
      id: 'u2', display: '<$icon>', kind: 'usecase', typeParams: [], members: [],
    };
    const registry = spriteRegistryWithIcon();

    const withoutSprites = measureUsecaseOrActor(classifier, fontSpec, measurer);
    const withSprites = measureUsecaseOrActor(classifier, fontSpec, measurer, registry);

    // Literal numbers captured from a real run (jiti probe, 2026-08-02).
    // Un-resolvable `<$icon>` (no lookup passed) collapses to the bare 6x6
    // margin-only ellipse; a REGISTERED sprite widens/heightens it via the
    // real ink decomposition. If the sprites parameter were dropped from
    // the call site (the exact regression this test guards), `withSprites`
    // would equal `withoutSprites` and this assertion would fail.
    expect(withoutSprites).toEqual({
      width: 6, height: 6,
      rows: [{ text: '<$icon>', y: 3, indent: 0, italic: false }],
      dividerYs: [],
    });
    expect(withSprites.width).toBeCloseTo(21.22999221017179, 6);
    expect(withSprites.height).toBeCloseTo(18.183993768137434, 6);
    expect(withSprites.width).not.toBe(withoutSprites.width);
    expect(withSprites.height).not.toBe(withoutSprites.height);

    // Cross-checked against the description engine's own entry point fed
    // the SAME `spriteDimsLookupFor(registry)` conversion the class engine
    // performs internally -- proves the threaded value reaches the
    // identical faithful measurement, not just a coincidentally-matching
    // literal.
    const viaEntryPoint = measureUsecaseOrActorLeaf('<$icon>', 'usecase', fontSpec, measurer, spriteDimsLookupFor(registry));
    expect({ width: withSprites.width, height: withSprites.height }).toEqual(viaEntryPoint);
  });

  it('the sprite threading survives the REAL call site -- class-layout-helpers.ts#measureClassifier -> tryMeasureNonGenericClassifier -> measureUsecaseOrActor (task item 3, method rule: verify against the current call graph, not just the leaf function in isolation)', () => {
    const classifier: Classifier = {
      id: 'u3', display: '<$icon>', kind: 'usecase', typeParams: [], members: [],
    };
    const suppress = { fields: false, methods: false };
    const registry = spriteRegistryWithIcon();

    const withoutSprites = measureClassifier(classifier, defaultTheme, measurer, suppress);
    const withSprites = measureClassifier(classifier, defaultTheme, measurer, suppress, registry);

    // Literal numbers captured from a real run (jiti probe, 2026-08-02) --
    // font-independent for this display (matches the direct
    // measureUsecaseOrActor probe above, since defaultTheme's font differs
    // from this file's own fontSpec but the bare `<$icon>` display has no
    // text ink to size against).
    expect(withoutSprites).toEqual({
      width: 6, height: 6,
      rows: [{ text: '<$icon>', y: 3, indent: 0, italic: false }],
      dividerYs: [],
    });
    expect(withSprites.width).toBeCloseTo(21.22999221017179, 6);
    expect(withSprites.height).toBeCloseTo(18.183993768137434, 6);
    // If `class-layout-helpers.ts:286` stopped forwarding `sprites` to
    // `measureUsecaseOrActor`, this call would collapse to the
    // `withoutSprites` figure and these two assertions would fail.
    expect(withSprites.width).not.toBe(withoutSprites.width);
    expect(withSprites.height).not.toBe(withoutSprites.height);
  });
});

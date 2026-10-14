/**
 * `UgDiagram` (UgDiagram.java) — the non-`TitledDiagram` export path:
 * `getTextBlock -> addChrome -> (calculateBackColor) -> TextBlockExporter`
 * with `margin(getDefaultMargins())` (java:123-150).
 *
 * Jar probe (`scripts/oracle-render.sh`, 1.2026.8beta1, authored
 * `@startuml\nlicense\n@enduml`, a `UgSimpleDiagram`): the root is
 * `width="518px" height="834px"`, `background:#FFFFFF`, no
 * `data-diagram-type`, and the first text sits at `x="5"`. The widest line's
 * `textLength` is 507.6 and `GraphicStrings` adds its own 5px margin per side
 * (GraphicStrings.java:63, :176), so the block is 517.6 wide and the export
 * adds NOTHING: `(int) (517.6 + 0 + 0 + 1) = 518` (`SvgGraphics#ensureVisible`)
 * — `AbstractDiagram#getDefaultMargins()` is `same(0)` (AbstractDiagram.java:231-233).
 */
import { describe, expect, it } from 'vitest';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { ColorMapper } from '../../../src/core/klimt/color/ColorMapper.js';
import { HColorSet } from '../../../src/core/klimt/color/HColorSet.js';
import type { HColorSimple } from '../../../src/core/klimt/color/HColorSimple.js';
import { HColors } from '../../../src/core/klimt/color/HColors.js';
import type { HColorOrPaint } from '../../../src/core/klimt/color/ColorMapper.js';
import type { StringBounder } from '../../../src/core/klimt/font/StringBounder.js';
import { ClockwiseTopRightBottomLeft } from '../../../src/core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import { XDimension2D } from '../../../src/core/klimt/geom/XDimension2D.js';
import type { TextBlock } from '../../../src/core/klimt/shape/TextBlock.js';
import { URectangle } from '../../../src/core/klimt/shape/URectangle.js';
import { UText } from '../../../src/core/klimt/shape/UText.js';
import type { FontStyle } from '../../../src/core/klimt/shape/UText.js';
import type { UGraphic } from '../../../src/core/klimt/UGraphic.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import type { ScaleSpec } from '../../../src/core/scale-command.js';
import { DEFAULT_SVG_DECIMALS, formatDecimal } from '../../../src/core/svg-format.js';
import { OptionKey } from '../../../src/core/tim/EaterOption.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import { UgDiagram } from '../../../src/core/UgDiagram.js';

/** The jar license page's block: widest `textLength` 507.6 + 2 * 5. */
const LICENSE_BLOCK_WIDTH = 517.6;
/** A height whose `ensureVisible` truncation lands on the jar's 834. */
const LICENSE_BLOCK_HEIGHT = 833;
const SOURCE: UmlSource = { lines: ['license'], type: 'sequence' };

/** A fixed block: declared size, one 10x10 rect at its origin. */
class FixedBlock implements TextBlock {
  constructor(
    private readonly width: number,
    private readonly height: number,
    private readonly backcolor?: HColorOrPaint,
  ) {}
  calculateDimension(_stringBounder: StringBounder): XDimension2D {
    return new XDimension2D(this.width, this.height);
  }
  drawU(ug: UGraphic): void {
    ug.draw(URectangle.build(10, 10));
  }
  getBackcolor(): HColorOrPaint | undefined {
    return this.backcolor;
  }
}

/** The smallest concrete `UgDiagram`: hands back one fixed block. */
class FixedDiagram extends UgDiagram {
  readonly calls: number[] = [];
  constructor(
    private readonly block: TextBlock,
    preprocessing = new PreprocessingArtifact(),
  ) {
    super(SOURCE, preprocessing);
  }
  getTextBlock(num: number, _stringBounder: StringBounder): TextBlock {
    this.calls.push(num);
    return this.block;
  }
}

class MarginedDiagram extends FixedDiagram {
  override getDefaultMargins(): ClockwiseTopRightBottomLeft {
    return ClockwiseTopRightBottomLeft.margin1margin2(5, 7);
  }
}

class ChromedDiagram extends FixedDiagram {
  override addChrome(index: number, result: TextBlock): TextBlock {
    return index === 0 ? new FixedBlock(50, 20) : result;
  }
}

class BackColoredDiagram extends FixedDiagram {
  override calculateBackColor(): HColorOrPaint | undefined {
    return HColors.BLACK;
  }
}

class MutedDiagram extends FixedDiagram {
  protected override muteColorMapper(_init: ColorMapper): ColorMapper {
    return ColorMapper.MONOCHROME;
  }
}

const measurer = new DeterministicMeasurer();

function rootAttr(svg: string, name: string): string | undefined {
  const root = /^<svg[^>]*>/.exec(svg)?.[0] ?? '';
  return new RegExp(` ${name}="([^"]*)"`).exec(root)?.[1];
}

describe('UgDiagram defaults (AbstractDiagram.java)', () => {
  const diagram = new FixedDiagram(new FixedBlock(1, 1));

  it('getDefaultMargins() is same(0) (AbstractDiagram.java:231-233)', () => {
    const m = diagram.getDefaultMargins();
    expect([m.getTop(), m.getRight(), m.getBottom(), m.getLeft()]).toEqual([0, 0, 0, 0]);
  });

  it('calculateBackColor() is null (AbstractDiagram.java:191-193)', () => {
    expect(diagram.calculateBackColor()).toBeUndefined();
  });

  it('getScale() is unset until setScale (AbstractDiagram.java:195-201)', () => {
    const scaled = new FixedDiagram(new FixedBlock(1, 1));
    expect(scaled.getScale()).toBeUndefined();
    const spec: ScaleSpec = { kind: 'simple', factor: 2 };
    scaled.setScale(spec);
    expect(scaled.getScale()).toBe(spec);
  });

  it('addChrome returns its input (UgDiagram.java:70-72)', () => {
    const block = new FixedBlock(3, 4);
    expect(diagram.addChrome(0, block)).toBe(block);
  });

  it('keeps its source and preprocessing artifact (AbstractDiagram ctor)', () => {
    const artifact = new PreprocessingArtifact();
    const d = new FixedDiagram(new FixedBlock(1, 1), artifact);
    expect(d.getSource()).toBe(SOURCE);
    expect(d.getPreprocessingArtifact()).toBe(artifact);
  });
});

describe('UgDiagram#isHandwritten (UgDiagram.java:117-121)', () => {
  it('is false with no `!option handwritten`', () => {
    expect(new FixedDiagram(new FixedBlock(1, 1)).isHandwritten()).toBe(false);
  });

  it('is true when the HANDWRITTEN option is "true", any case (ConfigurationStore#isTrue)', () => {
    const artifact = new PreprocessingArtifact();
    artifact.getOption().define(OptionKey.HANDWRITTEN, 'TRUE');
    expect(new FixedDiagram(new FixedBlock(1, 1), artifact).isHandwritten()).toBe(true);
  });

  it('is false for any other value', () => {
    const artifact = new PreprocessingArtifact();
    artifact.getOption().define(OptionKey.HANDWRITTEN, 'yes');
    expect(new FixedDiagram(new FixedBlock(1, 1), artifact).isHandwritten()).toBe(false);
  });
});

describe('UgDiagram#exportDiagram — the jar license probe', () => {
  const svg = new FixedDiagram(new FixedBlock(LICENSE_BLOCK_WIDTH, LICENSE_BLOCK_HEIGHT)).exportDiagram(0, measurer);

  it('adds no margin: the canvas is the block plus ensureVisible, 518 x 834 as in the jar', () => {
    expect(rootAttr(svg, 'width')).toBe('518px');
    expect(rootAttr(svg, 'height')).toBe('834px');
    expect(rootAttr(svg, 'viewBox')).toBe('0 0 518 834');
  });

  it('paints the builder default background, HColors.WHITE (TextBlockExporter.java:407)', () => {
    expect(rootAttr(svg, 'style')).toBe('width:518px;height:834px;background:#FFFFFF;');
  });

  it('carries no data-diagram-type: the non-titled builder never sets one (UgDiagram.java:141-145)', () => {
    expect(rootAttr(svg, 'data-diagram-type')).toBeUndefined();
  });

  it('draws the block at the origin', () => {
    expect(svg).toContain('<rect x="0" y="0" width="10" height="10"');
  });
});

describe('UgDiagram#exportDiagram — getExporter steps (UgDiagram.java:123-150)', () => {
  it('asks for the requested page index', () => {
    const d = new FixedDiagram(new FixedBlock(10, 10));
    d.exportDiagram(3, measurer);
    expect(d.calls).toEqual([3]);
  });

  it('translates by an overridden margin and widens the canvas by it (TextBlockExporter.java:173, :198-202)', () => {
    const svg = new MarginedDiagram(new FixedBlock(100.5, 40.25)).exportDiagram(0, measurer);
    // margin1margin2(5, 7): top/bottom 5, left/right 7 -> (int)(100.5 + 14 + 1), (int)(40.25 + 10 + 1)
    expect(rootAttr(svg, 'width')).toBe('115px');
    expect(rootAttr(svg, 'height')).toBe('51px');
    expect(svg).toContain('x="7" y="5"');
  });

  it('exports the addChrome result, not the raw block', () => {
    const svg = new ChromedDiagram(new FixedBlock(200, 200)).exportDiagram(0, measurer);
    expect(rootAttr(svg, 'width')).toBe('51px');
    expect(rootAttr(svg, 'height')).toBe('21px');
  });

  it("takes the block's own getBackcolor() over the white default (TextBlockExporter.java:421-423)", () => {
    const svg = new FixedDiagram(new FixedBlock(20, 20, HColors.BLACK)).exportDiagram(0, measurer);
    expect(rootAttr(svg, 'style')).toBe('width:21px;height:21px;background:#000000;');
  });

  it('a non-null calculateBackColor() reaches TextBlockUtils.addBackcolor, unported here (java:130-132)', () => {
    expect(() => new BackColoredDiagram(new FixedBlock(10, 10)).exportDiagram(0, measurer)).toThrow(
      /TextBlockUtils\.addBackcolor: not ported/,
    );
  });

  it('applies a scale against the final dimension (TextBlockExporter.java:205-209)', () => {
    const d = new FixedDiagram(new FixedBlock(100, 50));
    d.setScale({ kind: 'simple', factor: 2 });
    const svg = d.exportDiagram(0, measurer);
    expect(rootAttr(svg, 'viewBox')).toBe('0 0 202 102');
    expect(svg).toContain('height="20"');
  });

  it('maps colours through muteColorMapper (UgDiagram.java:134-135)', () => {
    const red = HColorSet.instance().getColorOrWhite('#FF0000') as HColorSimple; // a plain hex is an HColorSimple
    expect(rootAttr(new FixedDiagram(new FixedBlock(20, 20, red)).exportDiagram(0, measurer), 'style')).toBe(
      'width:21px;height:21px;background:#FF0000;',
    );
    const svg = new MutedDiagram(new FixedBlock(20, 20, red)).exportDiagram(0, measurer);
    // MONOCHROME: a grey, R = G = B.
    expect(rootAttr(svg, 'style')).toMatch(/^width:21px;height:21px;background:#([0-9A-F]{2})\1\1;$/);
  });

  it('draws through UGraphicHandwritten when handwritten (TextBlockExporter.java:174-175)', () => {
    const artifact = new PreprocessingArtifact();
    artifact.getOption().define(OptionKey.HANDWRITTEN, 'true');
    const svg = new FixedDiagram(new FixedBlock(10, 10), artifact).exportDiagram(0, measurer);
    // URectangleHand turns the rect into a jiggled polygon (UGraphicHandwritten.java:64-82).
    expect(svg).not.toContain('<rect');
    expect(svg).toContain('<polygon points="0,0,0,0.07,');
  });

  it("measures drawn text with the export's measurer (DriverTextSvg's width bounder)", () => {
    const text: TextBlock = {
      calculateDimension: () => new XDimension2D(40, 20),
      drawU: (ug: UGraphic) =>
        ug.draw(UText.build('Hi', { family: 'sans-serif', size: 14, color: '#000000', styles: new Set<FontStyle>() })),
    };
    const svg = new FixedDiagram(text).exportDiagram(0, measurer);
    const width = measurer.measure('Hi', { family: 'sans-serif', size: 14, weight: 'normal', style: 'normal' }).width;
    expect(svg).toContain(`textLength="${formatDecimal(width, DEFAULT_SVG_DECIMALS)}"`);
  });

  it('is deterministic: three exports are byte-identical', () => {
    const d = new FixedDiagram(new FixedBlock(LICENSE_BLOCK_WIDTH, LICENSE_BLOCK_HEIGHT));
    const runs = [0, 1, 2].map(() => d.exportDiagram(0, measurer));
    expect(new Set(runs).size).toBe(1);
  });
});

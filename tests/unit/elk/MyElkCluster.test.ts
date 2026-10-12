/**
 * `MyElkCluster` port (cdd8 T2c): the decoration call against the Java's
 * values, and the drawn folder path against the jar's cirojo-62-dubo306 cluster.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { ColorType } from '../../../src/core/abel/ColorType.js';
import { USymbol } from '../../../src/core/decoration/symbol/USymbol.js';
import type { SymbolContext } from '../../../src/core/decoration/symbol/SymbolContext.js';
import { PACKAGE } from '../../../src/core/decoration/symbol/USymbols.js';
import type { ElkClusterDiagram } from '../../../src/core/elk/MyElkCluster.js';
import { MyElkCluster } from '../../../src/core/elk/MyElkCluster.js';
import type { ElkClusterStyle, ElkColors } from '../../../src/core/elk/ElkDiagramAdapter.js';
import type { ElkNode } from '../../../src/core/elk/proxy/graph/ElkNode.js';
import { UGraphicSvg } from '../../../src/core/klimt/drawing/svg/u-graphic-svg.js';
import { basicSvgOption } from '../../../src/core/klimt/drawing/svg/svg-graphics.js';
import type { StringBounder as DriverStringBounder } from '../../../src/core/klimt/drawing/svg/driver-text-svg.js';
import { HorizontalAlignment } from '../../../src/core/klimt/geom/HorizontalAlignment.js';
import { XDimension2D } from '../../../src/core/klimt/geom/XDimension2D.js';
import type { TextBlock } from '../../../src/core/klimt/shape/TextBlock.js';
import { UStroke } from '../../../src/core/klimt/UStroke.js';
import { UTranslate } from '../../../src/core/klimt/UTranslate.js';
import { PackageStyle } from '../../../src/core/svek/PackageStyle.js';

const GROUP = 'color';
const stubStringBounder: DriverStringBounder = {
  calculateDimension: (font, text) => ({ width: text.length * font.size * 0.5 }),
};

function block(width: number, height: number): TextBlock {
  return { calculateDimension: () => new XDimension2D(width, height), drawU: () => undefined };
}

function node(x: number, y: number, width: number, height: number): ElkNode {
  const parent = { getParent: () => null, getLabels: () => [] };
  return {
    getParent: () => parent,
    getX: () => x,
    getY: () => y,
    getLabels: () => [],
    getWidth: () => width,
    getHeight: () => height,
  } as unknown as ElkNode;
}

/** A USymbol whose `asBig` records the arguments `ClusterDecoration#getTextBlock` hands it. */
class RecordingSymbol extends USymbol {
  readonly calls: { width: number; height: number; ctx: SymbolContext; align: string; stereoAlign: string }[] = [];
  readonly origins: UTranslate[] = [];
  getSNames(): readonly string[] {
    return [];
  }
  asSmall(): TextBlock {
    throw new Error('unused');
  }
  asBig(
    _label: TextBlock,
    align: HorizontalAlignment,
    _stereo: TextBlock,
    width: number,
    height: number,
    ctx: SymbolContext,
    stereoAlign: HorizontalAlignment,
  ): TextBlock {
    this.calls.push({ width, height, ctx, align, stereoAlign });
    return {
      calculateDimension: () => new XDimension2D(width, height),
      drawU: (ug) => this.origins.push(ug.getTranslate()),
    };
  }
}

function diagramOver(symbol: USymbol | null, style: ElkClusterStyle, colors: ElkColors, titleDim: [number, number]) {
  const diagram: ElkClusterDiagram = {
    getUSymbol: () => symbol,
    getPackageStyle: () => null,
    getEntityColors: () => colors,
    getClusterHeader: () => ({
      getTitleAndAttributeHeight: () => 0,
      getTitle: () => block(...titleDim),
      getStereo: () => block(0, 0),
    }),
    getClusterStyle: () => style,
    getClusterStyleForMagneticBorder: () => style,
    getClusterBackColor: () => '#112233',
    packageStyle: () => PackageStyle.FOLDER,
    getPackageTitleAlignment: () => HorizontalAlignment.LEFT,
    getStereotypeAlignment: () => HorizontalAlignment.CENTER,
  };
  return diagram;
}

const stroke = new UStroke(0, 0, 1.5);
const style: ElkClusterStyle = { shadowing: 3, stroke, roundCorner: 2.5, lineColor: '#181818' };
const noColors: ElkColors = { getColor: () => null, getSpecificLineStroke: () => null };

describe('MyElkCluster.drawSingleCluster', () => {
  it('hands the decoration the corner, dimension, colours, shadow and round corner', () => {
    const symbol = new RecordingSymbol();
    const cluster = new MyElkCluster(diagramOver(symbol, style, noColors, [30, 16]), GROUP, node(12, 20, 140, 208));
    const ug = UGraphicSvg.build(0, basicSvgOption(), '$version$', stubStringBounder);
    cluster.drawSingleCluster(ug);
    const call = symbol.calls[0]!;
    expect([call.width, call.height]).toEqual([140, 208]);
    expect(call.ctx.getBackColor()).toBe('#112233');
    expect(call.ctx.getForeColor()).toBe('#181818');
    expect(call.ctx.getDeltaShadow()).toBe(3);
    expect(call.ctx.getRoundCorner()).toBe(2.5);
    expect(call.ctx.getStroke()).toBe(stroke);
    expect([call.align, call.stereoAlign]).toEqual([HorizontalAlignment.LEFT, HorizontalAlignment.CENTER]);
    expect([symbol.origins[0]!.getDx(), symbol.origins[0]!.getDy()]).toEqual([12, 20]);
  });

  it('prefers the entity LINE colour and its specific stroke over the style', () => {
    const own = new UStroke(5, 5, 2);
    const colors: ElkColors = {
      getColor: (key) => (key === ColorType.LINE ? '#FF0000' : null),
      getSpecificLineStroke: () => own,
    };
    const symbol = new RecordingSymbol();
    new MyElkCluster(diagramOver(symbol, style, colors, [0, 0]), GROUP, node(0, 0, 10, 10)).drawSingleCluster(
      UGraphicSvg.build(0, basicSvgOption(), '$version$', stubStringBounder),
    );
    expect(symbol.calls[0]!.ctx.getForeColor()).toBe('#FF0000');
    expect(symbol.calls[0]!.ctx.getStroke()).toBe(own);
  });

  it("draws cirojo-62-dubo306's cluster as the jar's folder path", () => {
    const svg = readFileSync(resolve('test-results/dot-cache/class/cirojo-62-dubo306/in.svg'), 'utf8');
    const jarPath = /<path d="(M14\.5,12[^"]*)"/.exec(svg)![1]!;
    const jarStyle: ElkClusterStyle = { shadowing: 0, stroke, roundCorner: 5, lineColor: '#000000' };
    const cluster = new MyElkCluster(
      diagramOver(PACKAGE, jarStyle, noColors, [30.362, 14]),
      GROUP,
      node(12, 12, 139.85, 208),
    );
    const ug = UGraphicSvg.build(0, basicSvgOption(), '$version$', stubStringBounder);
    cluster.drawSingleCluster(ug);
    const ours = /<path d="(M[^"]*)"/.exec(ug.getSvgString())![1]!;
    expect(ours).toBe(jarPath);
  });
});

describe('MyElkCluster.getMagneticBorder', () => {
  it('is MagneticBorderNone for a plain package style without a symbol', () => {
    const diagram = { ...diagramOver(null, style, noColors, [0, 0]), packageStyle: () => PackageStyle.RECTANGLE };
    const border = new MyElkCluster(diagram, GROUP, node(0, 0, 10, 10)).getMagneticBorder(stubStringBounder as never);
    expect(border.getForceAt({ x: 1, y: 1 })).toEqual(UTranslate.none());
  });

  it('shifts the probe point by the cluster corner before asking the folder border', () => {
    const diagram = diagramOver(PACKAGE, style, noColors, [40, 16]);
    const at = (cx: number, cy: number) =>
      new MyElkCluster(diagram, GROUP, node(cx, cy, 200, 100)).getMagneticBorder(stubStringBounder as never);
    // inside the title tab (height 16 + margins) a folder pushes the point down
    const local = at(0, 0).getForceAt({ x: 60, y: 5 }, stubStringBounder as never);
    const shifted = at(100, 50).getForceAt({ x: 160, y: 55 }, stubStringBounder as never);
    expect(shifted).toEqual(local);
    expect(local.getDy()).toBeGreaterThan(0);
  });
});

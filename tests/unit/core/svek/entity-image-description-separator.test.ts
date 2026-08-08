/**
 * entity-image-description-separator.test.ts — G1 I9b: bare Creole
 * horizontal-line separator markers (`----`/`====`/`....`, EMPTY content
 * between the delimiters) inside a multi-line entity display.
 *
 * Upstream: `klimt/creole/legacy/CreoleStripeSimpleParser.java`'s
 * SECTION_HEADER_PATTERN/SECTION_TITLE_PATTERN/SECTION_SEPARATOR_PATTERN/
 * DOUBLE_DOT_DELIMITED_LINE feed `StripeSimple#analyzeAndAdd`'s
 * `StripeStyleType.HORIZONTAL_LINE` branch, which draws a
 * `CreoleHorizontalLine` atom (-> `UHorizontalLine`, an SVG `<line>`)
 * instead of literal text. This port's `buildTextBlock`
 * (`EntityImageDescriptionSupport.ts`) previously had no such
 * classification at all — every display line, including a bare `----`,
 * rendered as a literal `<text>----</text>`.
 *
 * jarFragment provenance: rebased (-134.14,-111) from the REAL,
 * deterministic-mode-captured jar SVG,
 * `test-results/dot-cache/component/butebe-90-dozo380/in.svg`'s `queue3`
 * entity (`queue "queue1\n----\ntoto" as queue3`) — the fixture this
 * mechanism was drilled against (G1 ledger.md I9b). Uses
 * `DeterministicMeasurer` (not `jarMeasurer`) because that corpus was
 * captured under `-DPLANTUML_DETERMINISTIC_TEXT=true` — see
 * `entity-image-description.test.ts`'s own module doc comment for why
 * mixing measurer systems silently fails conformance for reasons
 * unrelated to the code under test.
 *
 * E2r/L1 update (2026-07-15): `classifySeparatorLine` was SUBSUMED by
 * `klimt/creole/legacy/CreoleStripeSimpleParser.ts#classifyStripeLine`,
 * which also now runs NORMAL lines through the ported style-command
 * engine.
 *
 * T4 update (2026-07-29, `plans/bodyenhanced-atom-seams/`): `desc` now
 * routes through the REAL `BodyFactory.create3`/`BodyEnhanced2`, whose OWN
 * `isBlockSeparator` (java:67-82, an EARLIER, coarser check than the
 * Creole lexer's line classifier) treats ANY "--Header--"/"-----"-shaped
 * line as a TITLED block separator, regardless of captured content —
 * superseding the "--Header--"/"5 dashes" tests' PRE-T4 pins (both
 * literal-text/struck-text expectations from when `desc` had no
 * `BodyEnhanced2` separator layer to reach). Diagnosed 2026-07-29: the
 * OLD "5 dashes" pin's own "jar-verified 2026-07-15" oracle used `queue
 * "..." as x` WITHOUT a `component`/`database` keyword present, which the
 * real jar's diagram-type dispatch resolves to a SEQUENCE diagram — a
 * DIFFERENT upstream drawing class (`data-diagram-type="SEQUENCE"`,
 * confirmed) than `svek/image/EntityImageDescription.java`, which this
 * class actually models. Re-verified against `component component1 /
 * queue "queue1\n-----\ntoto" as queue3` (matching G1 ledger.md I9b's own
 * `component/butebe-90-dozo380` fixture shape) — the REAL component-
 * diagram jar output matches this port's NEW titled-separator output
 * byte-for-byte (see the two updated tests' own citations).
 */
import { describe, expect, test } from 'vitest';
import { XDimension2D } from '../../../../src/core/klimt/geom/XDimension2D.js';
import { HorizontalAlignment } from '../../../../src/core/klimt/geom/HorizontalAlignment.js';
import { UStroke } from '../../../../src/core/klimt/UStroke.js';
import { FontStyle } from '../../../../src/core/klimt/shape/UText.js';
import type { FontConfiguration } from '../../../../src/core/klimt/shape/UText.js';
import { UGraphicSvg } from '../../../../src/core/klimt/drawing/svg/u-graphic-svg.js';
import { basicSvgOption } from '../../../../src/core/klimt/drawing/svg/svg-graphics.js';
import type { StringBounder as DriverStringBounder } from '../../../../src/core/klimt/drawing/svg/driver-text-svg.js';
import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';
import { ActorStyle } from '../../../../src/core/skin/ActorStyle.js';
import { ComponentStyle } from '../../../../src/core/decoration/symbol/USymbols.js';
import { EntityImageDescription, type EntityImageDescriptionParams } from '../../../../src/core/svek/image/EntityImageDescription.js';

const TITLE_FONT: FontConfiguration = { family: 'sans-serif', size: 14, color: '#000000', styles: new Set() };
const STEREO_FONT: FontConfiguration = {
  family: 'sans-serif',
  size: 14,
  color: '#000000',
  styles: new Set([FontStyle.ITALIC]),
};

const measurer = new DeterministicMeasurer();

const deterministicDriverBounder: DriverStringBounder = {
  calculateDimension(font, text) {
    return { width: measurer.measure(text, { family: font.family, size: font.size }).width };
  },
};

function deterministicStringBounder(): {
  calculateDimension: (font: { family: string; size: number }, text: string) => XDimension2D;
  getDescent: (font: { family: string; size: number }, text: string) => number;
} {
  return {
    calculateDimension(font, text) {
      const { width, height } = measurer.measure(text, { family: font.family, size: font.size });
      return new XDimension2D(width, height);
    },
    getDescent(font, text) {
      return measurer.getDescent({ family: font.family, size: font.size }, text);
    },
  };
}

function newGraphic(): UGraphicSvg {
  return UGraphicSvg.build(0, basicSvgOption(), '$version$', deterministicDriverBounder, measurer);
}

function extractTopGroup(svg: string): string {
  const match = /<g[^>]*>([\s\S]*)<\/g><\/svg>$/.exec(svg);
  if (match === null) throw new Error('extractTopGroup: no top-level <g>...</g></svg> found');
  const inner = match[1];
  if (inner === undefined) throw new Error('extractTopGroup: capture group did not match');
  return inner;
}

function wrapFragment(inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg"><g>${inner}</g></svg>`;
}

function render(entity: EntityImageDescription): string {
  const ug = newGraphic();
  entity.drawU(ug);
  return wrapFragment(extractTopGroup(ug.getSvgString()));
}

function baseParams(overrides: Partial<EntityImageDescriptionParams>): EntityImageDescriptionParams {
  return {
    entity: { name: 'queue3', uid: 'ent0004', qualifiedName: 'queue3', location: { position: 1 }, url: null },
    symbol: { keyword: 'queue', actorStyle: ActorStyle.STICKMAN, componentStyle: ComponentStyle.UML2 },
    labels: { codeName: 'queue3', displayText: 'queue1\n----\ntoto', stereotypeLabels: [] },
    paint: {
      forecolor: '#181818',
      backcolor: '#F1F1F1',
      roundCorner: 0,
      diagonalCorner: 0,
      deltaShadow: 0,
      stroke: UStroke.withThickness(0.5),
      fontTitle: TITLE_FONT,
      fontStereo: STEREO_FONT,
      titleAlignment: HorizontalAlignment.CENTER,
      stereotypeAlignment: HorizontalAlignment.CENTER,
    },
    links: [],
    fixCircleLabelOverlapping: false,
    ...overrides,
  };
}

/**
 * Real-jar geometry facts, `test-results/dot-cache/component/
 * butebe-90-dozo380/in.svg`'s `queue3` fragment (`queue "queue1\n----\n
 * toto" as queue3`, rebased -134.14,-111 to the entity's own box origin).
 * The bare `----` line draws as a single solid `<line>` at y="19" -- the
 * `SEPARATOR_DRAW_ADVANCE`/`SEPARATOR_SIZE_HEIGHT` constants
 * (`EntityImageDescriptionSupport.ts`) this test pins -- not a literal
 * `<text>----</text>`. `queue1`'s own position is unaffected by the
 * SEPARATE, already-ledgered post-separator-line alignment gap (G1 I9b
 * ledger entry): it is the WIDEST line, so a CENTER-vs-LEFT alignment
 * bug produces the same x=5 offset either way -- this test asserts only
 * facts this mechanism's fix actually calibrated, not the full-fragment
 * round trip (which would also require the alignment fix to pass).
 */
const JAR_QUEUE3_OUTER_D =
  'M5,0 L61.725,0 C66.725,0 66.725,23 66.725,23 C66.725,23 66.725,46 61.725,46 ' +
  'L5,46 C0,46 0,23 0,23 C0,23 0,0 5,0';

describe('EntityImageDescription — bare Creole horizontal-line separator (G1 I9b)', () => {
  test('a bare "----" display line draws as ONE <line> at the calibrated cursor position, not literal text', () => {
    const entity = new EntityImageDescription(baseParams({}));
    const svg = render(entity);
    expect(svg).not.toContain('----');
    const lines = [...svg.matchAll(/<line ([^/]*)\/>/g)];
    expect(lines).toHaveLength(1);
    const attrs = lines[0]?.[1] ?? '';
    expect(/y1="19"/.test(attrs)).toBe(true);
    expect(/y2="19"/.test(attrs)).toBe(true);
    expect(/stroke-width:1;/.test(attrs)).toBe(true);
    // "queue1" (the widest line, drawn BEFORE the separator) keeps its
    // exact jar-measured position regardless of the separate, deferred
    // post-separator alignment gap.
    expect(svg).toContain('<text x="5" y="15.889"');
    // The outer cylinder shape (drawQueue -- untouched by this fix) is
    // unaffected: width/height still derive correctly from the 3-line
    // block's total measured height (14 + SEPARATOR_SIZE_HEIGHT[8] + 14 = 36
    // content, +10 margin = 46 total, matching the jar's own box height).
    const outerPath = /<path d="([^"]+)"[^/]*fill="#F1F1F1"/.exec(svg);
    expect(outerPath?.[1]).toBe(JAR_QUEUE3_OUTER_D);
  });

  test('calculateDimensionSlow reproduces the jar box height exactly (14 + 8 + 14 + margin 10 = 46)', () => {
    const entity = new EntityImageDescription(baseParams({}));
    const dim = entity.calculateDimensionSlow(deterministicStringBounder());
    expect(dim.getHeight()).toBeCloseTo(46, 3);
  });

  test('a non-empty "--Header--" line is a TITLED block separator (T4, `plans/bodyenhanced-atom-seams/`: ADR-4/S1L-i closes as a consequence of wiring `desc` through the real `BodyFactory.create3`/`BodyEnhanced2` -- `BodyEnhancedAbstract.isBlockSeparator` (java:67-82) matches ANY line starting+ending with "--", regardless of captured content, and `getTitle` builds "Header" as a real title `TextBlock`; superseded the OLD "still literal text" pin (BodyEnhanced2 did not exist to reach it). Jar-verified 2026-07-29 against `component component1 / queue "queue1\\n--Header--\\ntoto" as queue3` -- the OLD test\'s own oracle used a SEQUENCE-diagram `queue` participant, a different upstream drawing class than `svek/image/EntityImageDescription.java`, which is why it disagreed)', () => {
    const withHeader = baseParams({
      paint: { ...baseParams({}).paint, titleAlignment: HorizontalAlignment.LEFT },
      labels: { codeName: 'queue3', displayText: 'queue1\n--Header--\ntoto', stereotypeLabels: [] },
    });
    const svg = render(new EntityImageDescription(withHeader));
    expect(svg).not.toContain('--Header--');
    expect(svg).toContain('<text x="5" y="15.889"'); // queue1, flush left (jar-verified)
    expect(svg).toContain('<text x="5" y="43.889"'); // toto, flush left (jar-verified)
    const lines = [...svg.matchAll(/<line ([^/]*)\/>/g)].map((m) => m[1] ?? '');
    expect(lines).toHaveLength(2); // TWO short flanking lines, not one full-width separator
    expect(lines[0]).toContain('x1="1"');
    expect(lines[0]).toContain('x2="9.179"');
    expect(lines[1]).toContain('x1="55.1161"');
    expect(lines[1]).toContain('x2="63.2946"');
    expect(svg).toContain('<text x="9.1786" y="29.3889"');
    expect(svg).toContain('>Header</text>');
  });

  test('a run of 5 dashes ("-----") IS a titled block separator with title "-" (T4: same `isBlockSeparator` mechanism as "--Header--" above -- "-----" both starts AND ends with "--", so `getTitle` captures the single sandwiched dash as its title. Supersedes the OLD "reaches the creole style engine as NORMAL text" pin, which was jar-verified 2026-07-15 against a SEQUENCE-diagram `queue` participant -- a different upstream drawing class; re-verified 2026-07-29 against the descriptive/component `EntityImageDescription.java` path this class actually models, via `component component1 / queue "queue1\\n-----\\ntoto" as queue3`)', () => {
    const withFiveDashes = baseParams({
      paint: { ...baseParams({}).paint, titleAlignment: HorizontalAlignment.LEFT },
      labels: { codeName: 'queue3', displayText: 'queue1\n-----\ntoto', stereotypeLabels: [] },
    });
    const svg = render(new EntityImageDescription(withFiveDashes));
    expect(svg).not.toContain('-----');
    expect(svg).not.toContain('text-decoration="line-through"');
    const lines = [...svg.matchAll(/<line ([^/]*)\/>/g)].map((m) => m[1] ?? '');
    expect(lines).toHaveLength(2);
    const titleText = /<text x="([\d.]+)" y="29.3889"[^>]*>(-)<\/text>/.exec(svg);
    expect(titleText?.[2]).toBe('-');
  });

  test('a bare "====" line draws TWO parallel <line> elements (double-line style)', () => {
    const withEquals = baseParams({
      labels: { codeName: 'queue3', displayText: 'queue1\n====\ntoto', stereotypeLabels: [] },
    });
    const svg = render(new EntityImageDescription(withEquals));
    const lineCount = (svg.match(/<line /g) ?? []).length;
    expect(lineCount).toBe(2);
    expect(svg).not.toContain('====');
  });

  test('a bare "...." line draws as a single dotted <line>', () => {
    const withDots = baseParams({
      labels: { codeName: 'queue3', displayText: 'queue1\n....\ntoto', stereotypeLabels: [] },
    });
    const svg = render(new EntityImageDescription(withDots));
    expect(svg).toContain('<line ');
    expect(svg).not.toContain('....');
  });
});

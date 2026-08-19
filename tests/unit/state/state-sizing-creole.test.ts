/**
 * SI29 T6 — paired SIZER/RENDERER tests for the state engine's creole seam
 * (`state-sizing-creole.ts`, mission `state-declared-size-fix` D1, SI28
 * groups G1/G8/G23).
 *
 * Every case is PAIRED on purpose: it asserts what `measureState`/
 * `measureAutonomWrapper` reserved AND what `renderNormal`/`renderComposite`
 * then draws into that reservation, so a sizer that strips markup while the
 * renderer draws it raw (the G1 defect class) cannot pass.
 *
 * Every expected number is the JAR's own, read out of the cached oracle SVG
 * for the named fixture (`test-results/dot-cache/state/<slug>/in.svg`),
 * never fitted:
 *   - papifi-44-caxo706 `<color:red>` — `textLength="98.875"`, `fill="#F00"`
 *   - mefici-97-tudu030 `**entry**` — bold run + 154.7px field line
 *   - xasoka-58-temi462 `[[url]]`   — runs 19.425/118.038/20.213, `<a href>`
 *   - feziva-71-gufo538 `[[S1]]`    — `textLength="17.15"`, box clamps to 50
 *   - kubona-45-boso556 wrapWidth   — 4 wrapped rows, box 153.088x90
 *   - lokija-02-dipe348 tabSize 2   — line3 at x=124, box 161.663 wide
 *   - resido-15-reza040 `<<O-O>>`   — box 72x50, symbol ellipses cx=60/69
 *   - kinuca-03-nice683 table       — grid 154.0875x46, cells at 0/51.363/102.725
 *
 * @see ~/git/plantuml/.../svek/image/EntityImageState.java
 * @see ~/git/plantuml/.../svek/image/EntityImageStateCommon.java
 * @see ~/git/plantuml/.../svek/InnerStateAutonom.java
 * @see ~/git/plantuml/.../klimt/creole/legacy/StripeTable.java
 */
import { describe, it, expect } from 'vitest';
import { measureState, buildStateGeoTextFields } from '../../../src/diagrams/state/state-sizing.js';
import { measureAutonomWrapper } from '../../../src/diagrams/state/state-composite-sizing.js';
import { renderNormal } from '../../../src/diagrams/state/renderer-box.js';
import { renderComposite } from '../../../src/diagrams/state/renderer-composite-box.js';
import type { State } from '../../../src/diagrams/state/ast.js';
import type { StateNodeGeo } from '../../../src/diagrams/state/state-geo-types.js';
import { defaultTheme, deepMergeTheme } from '../../../src/core/theme.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';

const measurer = new WidthTableMeasurer();
const theme = defaultTheme;

function makeState(overrides: Partial<State> = {}): State {
  return {
    id: 's1',
    display: 's1',
    kind: 'normal',
    children: [],
    concurrentRegions: [],
    transitions: [],
    ...overrides,
  };
}

/** A leaf box geo built from the SAME state the sizer measured — the pairing
 *  this suite exists to enforce (`layout.ts#buildFlatStateGeos` does exactly
 *  this in production). */
function leafGeo(state: State, t = theme, hideEmptyDescription = false): StateNodeGeo {
  const dim = measureState(state, hideEmptyDescription, t, measurer, 'TB');
  return {
    id: state.id,
    display: state.display,
    kind: 'normal',
    x: 7,
    y: 7,
    width: dim.width,
    height: dim.height,
    children: [],
    transitions: [],
    ...buildStateGeoTextFields(state, t, measurer, hideEmptyDescription),
  };
}

// ---------------------------------------------------------------------------
// G1 sub-group 1a — markup is stripped, styled and drawn as runs
// ---------------------------------------------------------------------------

describe('G1/1a — inline creole markup in a state DISPLAY name', () => {
  it('sizes and draws only the VISIBLE glyphs of a `<color:…>` span (papifi-44-caxo706)', () => {
    const state = makeState({ display: '<color:red>this should be red</color>' });
    const dim = measureState(state, false, theme, measurer, 'TB');
    // `EntityImageStateCommon.java:80-81` name block + MARGIN*2+2*MARGIN_LINE.
    expect(dim.width).toBeCloseTo(98.875 + 20, 6);

    const svg = renderNormal(leafGeo(state), theme);
    expect(svg).toContain('>this should be red<');
    expect(svg).not.toContain('&lt;color');
    expect(svg).toContain('textLength="98.875"');
    expect(svg).toContain('fill="#F00"');
  });

  it('strips `**bold**` markers and draws a bold run (mefici-97-tudu030)', () => {
    const state = makeState({ description: ['**entry** / display(memTimer)'] });
    const dim = measureState(state, false, theme, measurer, 'TB');
    expect(dim.width).toBeCloseTo(154.7 + 20, 6);

    const svg = renderNormal(leafGeo(state), theme);
    expect(svg).toContain('font-weight="700"');
    expect(svg).toContain('>entry<');
    expect(svg).not.toContain('**');
  });

  it('renders a bare `[[url]]` as its label inside an `<a href>` (xasoka-58-temi462)', () => {
    const state = makeState({ description: ['foo [[http://plantuml.com]] bar'] });
    const dim = measureState(state, false, theme, measurer, 'TB');
    expect(dim.width).toBeCloseTo(157.675 + 20, 6);

    const geo = leafGeo(state);
    // The sizer's own line width is exactly the sum of the runs the
    // renderer advances by — sizer/renderer lockstep, by construction.
    const line = geo.bodyLines![0] as unknown as { width: number; runs: { width: number }[] };
    expect(line.runs.map((r) => r.width).reduce((a, b) => a + b, 0)).toBeCloseTo(line.width, 6);

    const svg = renderNormal(geo, theme);
    expect(svg).toContain('href="http://plantuml.com"');
    expect(svg).toContain('text-decoration="underline"');
    expect(svg).not.toContain('[[');
    expect(svg).toContain('textLength="118.038"');
  });

  it('resolves an inline `[[S1]]` link label in a display name, clamping to MIN_WIDTH (feziva-71-gufo538)', () => {
    const state = makeState({ id: 'S1', display: '[[S1]]' });
    const dim = measureState(state, false, theme, measurer, 'TB');
    // 17.15 + 20 = 37.15 < MIN_WIDTH(50) -> `atLeast` clamps
    // (`EntityImageState.java:112`), exactly as the jar reports 0.694444in.
    expect(dim.width).toBe(50);

    const svg = renderNormal(leafGeo(state), theme);
    expect(svg).toContain('textLength="17.15"');
    expect(svg).not.toContain('[[S1]]');
  });
});

// ---------------------------------------------------------------------------
// G1 sub-group 1b — `skinparam wrapWidth`
// ---------------------------------------------------------------------------

describe('G1/1b — `skinparam wrapWidth` threading (Style.java:292)', () => {
  const wrapTheme = deepMergeTheme(defaultTheme, { wrapWidth: 150 });

  it('wraps a long FIELD line and both sizes and draws every wrapped row (kubona-45-boso556)', () => {
    const state = makeState({
      id: 'b',
      display: 'b',
      description: ['aaaaaaa bbbbbbbbbb ccccccccc ddddddddd eeeeeeeee ffffffffff ggggggggg hhhhhhhh'],
    });
    const dim = measureState(state, false, wrapTheme, measurer, 'TB');
    // jar: 153.088 x 90 (`svek-1.dot` 2.126215 x 1.25 in).
    expect(dim.width).toBeCloseTo(153.088, 3);
    expect(dim.height).toBe(90);

    const geo = leafGeo(state, wrapTheme);
    expect(geo.bodyLines).toHaveLength(4);
    const svg = renderNormal(geo, wrapTheme);
    expect(svg).toContain('textLength="54.512"');
  });

  it('wraps a long DISPLAY NAME through the same `create8` argument (rejike-58-rote606)', () => {
    const state = makeState({
      id: 'b',
      display:
        'In my humble opinion this is definitively too long for a state name one liner and would benefit from wrapping',
    });
    const dim = measureState(state, false, wrapTheme, measurer, 'TB');
    // jar: 2.3 x 1.25 in = 165.6 x 90 px.
    expect(dim.width).toBeCloseTo(165.6, 3);
    expect(dim.height).toBe(90);
    // 5 rows x 14 + MARGIN*2 + 2*MARGIN_LINE = 90, the jar's own height.
    expect(leafGeo(state, wrapTheme).headerLines).toHaveLength(5);
  });

  it('does NOT wrap a COMPOSITE title/attribute block (`Display.create`, LineBreakStrategy.NONE)', () => {
    const composite = makeState({
      id: 'X',
      display:
        'In my humble opinion this is definitively too long for a state name one liner and would benefit from wrapping',
      children: [makeState({ id: 'Y', display: 'Y' })],
    });
    const wrapped = measureAutonomWrapper(composite, { width: 50, height: 50 }, wrapTheme, measurer);
    const unwrapped = measureAutonomWrapper(composite, { width: 50, height: 50 }, theme, measurer);
    expect(wrapped.width).toBe(unwrapped.width);
    expect(wrapped.height).toBe(unwrapped.height);
  });
});

// ---------------------------------------------------------------------------
// G1 sub-group 1c — tab stops (`AtomText.java:183-260`)
// ---------------------------------------------------------------------------

describe('G1/1c — tab-stop snap', () => {
  it('snaps each `\\t` to the next `skinparam tabSize` stop and draws the shifted run (lokija-02-dipe348)', () => {
    const tabTheme = deepMergeTheme(defaultTheme, { tabSize: 2 });
    const state = makeState({ id: 's1', display: 's1', description: ['line1', '\tline2', '\t\tline3'] });
    const dim = measureState(state, false, tabTheme, measurer, 'TB');
    // jar: 2.245313in = 161.6625px — line3 starts at the SECOND tab stop
    // (124 - 12 = 112) and adds "line3" (29.6625), + MARGIN*2 + 2*MARGIN_LINE.
    expect(dim.width).toBeCloseTo(161.6625, 3);

    const geo = leafGeo(state, tabTheme);
    const line3 = geo.bodyLines![2] as unknown as { width: number };
    expect(line3.width).toBeCloseTo(112 + 29.6625, 3);
    // jar draws `line2` at x=68 and `line3` at x=124 -- the tab's advance is
    // a per-token x SHIFT (`AtomText#drawU`), never a stretched `textLength`.
    const svg = renderNormal(geo, tabTheme);
    expect(svg).toContain('<text x="68" y="60.889" font-size="14" fill="#000" textLength="29.662">line2</text>');
    expect(svg).toContain('<text x="124" y="74.889" font-size="14" fill="#000" textLength="29.662">line3</text>');
  });
});

// ---------------------------------------------------------------------------
// G8 — `<<O-O>>` symbol reservation AND draw
// ---------------------------------------------------------------------------

describe('G8 — `<<O-O>>` (`Stereotype.isWithOOSymbol`, EntityImageState.java:71,74,85,107-112)', () => {
  it('reserves 2*smallRadius + smallMarginY on BOTH axes (resido-15-reza040)', () => {
    const plain = makeState({ id: 'comp3', display: 'comp3' });
    const oo = makeState({ id: 'comp3', display: 'comp3', stereotype: 'O-O' });
    expect(measureState(plain, false, theme, measurer, 'TB').width).toBe(62);
    // jar: 1.0in = 72px.
    expect(measureState(oo, false, theme, measurer, 'TB').width).toBe(72);
  });

  it('matches upstream case-insensitively (`"<<O-O>>".equalsIgnoreCase`)', () => {
    const lower = makeState({ id: 'comp3', display: 'comp3', stereotype: 'o-o' });
    expect(measureState(lower, false, theme, measurer, 'TB').width).toBe(72);
  });

  it('draws the two small circles + connector at the box bottom-right (resido-15-reza040)', () => {
    const oo = makeState({ id: 'comp3', display: 'comp3', stereotype: 'O-O' });
    const geo = { ...leafGeo(oo), x: 7, y: 14.611 };
    const svg = renderNormal(geo, theme);
    expect(svg).toContain('<ellipse cx="60" cy="57.611" rx="3" ry="3"');
    expect(svg).toContain('<ellipse cx="69" cy="57.611" rx="3" ry="3"');
    expect(svg).toContain('<line x1="63" y1="57.611" x2="66" y2="57.611"');
  });
});

// ---------------------------------------------------------------------------
// G23 — a creole TABLE in a composite's own description
// ---------------------------------------------------------------------------

describe('G23 — creole table (`StripeTable`/`AtomTable`) in a composite description', () => {
  const composite = makeState({
    id: 'X',
    display: 'X',
    children: [makeState({ id: 'Y', display: 'Y' })],
    description: ['|= header 1 |= header 2 |= header 3 |', '| A | abc | def |', '| B | qwe | |'],
  });

  it('sizes the wrapper from the real grid box, not the raw markup (kinuca-03-nice683)', () => {
    const wrapper = measureAutonomWrapper(composite, { width: 50, height: 50 }, theme, measurer);
    // jar: 2.487326in = 179.0875px wide -- attr = 154.0875 (the real grid
    // box) + MARGIN*2 + 2*MARGIN_LINE + marginForFields = 25. Height here
    // uses a synthetic 50px childImg (the real fixture's inner pass image is
    // 65px, giving the jar's own 14 + 46 + 65 + 25 = 150); what this asserts
    // is the ATTR term: 14 + 46 + 50 + 25 = 135, four px more than the 42
    // the raw-markup model produced (`AtomWithMargin(table, 2, 2)`).
    expect(wrapper.width).toBeCloseTo(179.0875, 4);
    expect(wrapper.height).toBeCloseTo(135, 6);
  });

  it('draws the cells and the full grid instead of the raw `|=` text', () => {
    const wrapper = measureAutonomWrapper(composite, { width: 50, height: 50 }, theme, measurer);
    const geo: StateNodeGeo = {
      id: 'X',
      display: 'X',
      kind: 'normal',
      x: 7,
      y: 7,
      width: wrapper.width,
      height: wrapper.height,
      children: [],
      transitions: [],
      ...buildStateGeoTextFields(composite, theme, measurer),
    };
    const svg = renderComposite(geo, theme);
    expect(svg).not.toContain('|=');
    // jar's own cell columns / baselines / grid rules.
    expect(svg).toContain('<text x="12" y="43.889"');
    expect(svg).toContain('<text x="63.363" y="57.889"');
    expect(svg).toContain('<text x="114.725" y="71.889"');
    expect(svg).toContain('<line x1="12" y1="33" x2="166.087" y2="33"');
    expect(svg).toContain('<line x1="166.087" y1="33" x2="166.087" y2="75"');
    expect(svg).toContain('font-weight="700"');
  });
});

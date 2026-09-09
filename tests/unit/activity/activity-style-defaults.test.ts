/**
 * `activity-style-defaults.ts` — the `activityDiagram { }` table (T2).
 *
 * Every assertion here is a claim about `plantuml.skin`, not about any
 * rendered fixture. That is deliberate: CLAUDE.md forbids fitting a
 * constant to an observed golden, so the test that guards these constants
 * must read like the skin file, not like a diff. Where a value could
 * plausibly be mistaken for a derived one (`diamond` 11 as `activity` 12
 * minus 1; the activity arrow's 11 as the root arrow's 13) the test says so
 * outright.
 */
import { describe, it, expect } from 'vitest';

import { resolveTheme } from '../../../src/core/theme.js';
import type { Theme } from '../../../src/core/theme.js';
import {
  ACTIVITY_BAR_FILL,
  ACTIVITY_FONT_SIZE,
  ACTIVITY_PADDING,
  ACTIVITY_ROUND_CORNER,
  ARROW_FONT_SIZE,
  ARROW_LINE_THICKNESS,
  CIRCLE_END_LINE_THICKNESS,
  CIRCLE_INK,
  CIRCLE_LINE_THICKNESS,
  COMPOSITE_LINE_THICKNESS,
  DIAMOND_FONT_SIZE,
  NOTE_FONT_SIZE,
  NOTE_LINE_THICKNESS,
  SWIMLANE_BORDER_COLOR,
  SWIMLANE_FONT_SIZE,
  SWIMLANE_LINE_THICKNESS,
  SWIMLANE_TITLE_FONT_COLOR,
  activityFontSize,
  activityLineThickness,
  activityRoundCorner,
  swimlaneBorderColor,
  swimlaneBorderThickness,
  swimlaneFontSize,
  swimlaneLineThickness,
  swimlaneTitleFontColor,
  swimlaneTitleFontSize,
} from '../../../src/diagrams/activity/activity-style-defaults.js';
import {
  ACTIVITY_FONT_COLOR,
  activityFontColor,
  activityHorizontalAlignment,
  activityMinimumWidth,
} from '../../../src/diagrams/activity/activity-text-style.js';

const DEFAULT = resolveTheme('default');

/** A theme carrying one hand-built bucket override, standing in for the
 * `<style>`/`skinparam` front-ends T1 wired (both of which are tested
 * end-to-end in `tests/unit/core/skinparam-element-buckets.test.ts`). */
function themeWithBucket(sname: string, bucket: Record<string, number | string>): Theme {
  return {
    ...DEFAULT,
    colors: { ...DEFAULT.colors, elements: { ...DEFAULT.colors.elements, [sname]: bucket } },
  };
}

/** A theme carrying T1's `graph.activity.swimlane*` fields (mission
 * `activity-swimlane-rendering` T1, `theme-graph-colors-b.ts:321-350`) —
 * the FIRST tier of the T2 cascade. */
function themeWithActivitySwimlane(overrides: Partial<NonNullable<Theme['colors']['graph']['activity']>>): Theme {
  return {
    ...DEFAULT,
    colors: { ...DEFAULT.colors, graph: { ...DEFAULT.colors.graph, activity: overrides } },
  };
}

describe('the ported plantuml.skin constants', () => {
  it('matches `activityDiagram { activity { Padding 10; FontSize 12; RoundCorner 25 } }`', () => {
    expect(ACTIVITY_PADDING).toBe(10); // plantuml.skin:360
    expect(ACTIVITY_FONT_SIZE).toBe(12); // plantuml.skin:361
    expect(ACTIVITY_ROUND_CORNER).toBe(25); // plantuml.skin:362
  });

  it('matches `activityDiagram { composite { LineThickness 1.5 } }`', () => {
    expect(COMPOSITE_LINE_THICKNESS).toBe(1.5); // plantuml.skin:367
  });

  it('matches `activityDiagram { diamond { FontSize 11 } }` — declared, not derived', () => {
    expect(DIAMOND_FONT_SIZE).toBe(11); // plantuml.skin:370
    // 11 IS numerically `ACTIVITY_FONT_SIZE - 1`, which is exactly the
    // coincidence that makes this worth stating: upstream declares it
    // outright, and the diamond's own signature nests UNDER `activity`
    // (`FtileFactoryDelegator.java:80`), so writing it as a subtraction
    // would silently invert the moment a user overrode only `activity`.
    // The guard is the literal constant with its own citation above, not
    // an inequality -- an inequality here would be false.
    expect(activityFontSize(themeWithBucket('activity', { fontSize: 30 }), 'diamond')).toBe(11);
  });

  it('matches `activityDiagram { arrow { FontSize 11; LineThickness 1 } }`', () => {
    expect(ARROW_FONT_SIZE).toBe(11); // plantuml.skin:373
    expect(ARROW_LINE_THICKNESS).toBe(1); // plantuml.skin:374
    // The activity-scoped block BEATS the root `arrow { FontSize 13 }` at
    // plantuml.skin:317 -- the more-specific signature wins.
    expect(ARROW_FONT_SIZE).not.toBe(13);
  });

  it('splits the circle terminals: start/stop/end 1, `end` alone 1.5', () => {
    expect(CIRCLE_LINE_THICKNESS).toBe(1); // plantuml.skin:378
    expect(CIRCLE_END_LINE_THICKNESS).toBe(1.5); // plantuml.skin:383
  });

  it('matches the ROOT `swimlane { LineThickness 1.5; FontSize 18 }` block', () => {
    expect(SWIMLANE_FONT_SIZE).toBe(18); // plantuml.skin:313
    expect(SWIMLANE_LINE_THICKNESS).toBe(1.5); // plantuml.skin:312
  });

  it('matches the ROOT `note { FontSize 13; LineThickness 0.5 }` block', () => {
    expect(NOTE_FONT_SIZE).toBe(13); // plantuml.skin:323
    expect(NOTE_LINE_THICKNESS).toBe(0.5); // plantuml.skin:325
  });
});

describe('the #N palette shorthands resolve through HColorSet (D5)', () => {
  it('`circle { LineColor #2; BackgroundColor #2 }` resolves the one-digit hex', () => {
    // plantuml.skin:379-380. Resolved through the ported
    // `HColorSet#parseSimpleColor` digit-length table, never written as a
    // literal -- D5 forbids hardcoding, and CLAUDE.md forbids fitting the
    // observed golden value.
    expect(CIRCLE_INK).toBe('#222222');
  });

  it('`activityBar { BackgroundColor #5 }` resolves the same way', () => {
    expect(ACTIVITY_BAR_FILL).toBe('#555555'); // plantuml.skin:387
  });
});

describe('activityFontSize — default tier', () => {
  it('an action box is 12, NOT the diagram-wide root default of 14', () => {
    expect(activityFontSize(DEFAULT, 'activity')).toBe(12);
    expect(activityFontSize(DEFAULT, 'activity')).not.toBe(DEFAULT.fontSize);
  });

  it('a diamond is 11 — not `theme.fontSize - 2`', () => {
    expect(activityFontSize(DEFAULT, 'diamond')).toBe(11);
    expect(activityFontSize(DEFAULT, 'diamond')).not.toBe(DEFAULT.fontSize - 2);
  });

  it('an arrow label is 11 and a note is 13', () => {
    expect(activityFontSize(DEFAULT, 'arrow')).toBe(11);
    expect(activityFontSize(DEFAULT, 'note')).toBe(13);
  });

  it('a swimlane is 18', () => {
    expect(swimlaneFontSize(DEFAULT)).toBe(18);
  });

  it('a kind declaring no FontSize inherits the ROOT `theme.fontSize`, not a copy of 14', () => {
    // `composite` (plantuml.skin:364-368), `circle` (the bare block at
    // :331-332 is EMPTY) and `activityBar` (:387) declare no FontSize
    // anywhere upstream. Inheriting the theme rather than restating 14
    // means a user's `skinparam defaultFontSize` moves them, as it does
    // upstream.
    for (const sname of ['composite', 'circle', 'activityBar'] as const) {
      expect(activityFontSize(DEFAULT, sname)).toBe(DEFAULT.fontSize);
      expect(activityFontSize({ ...DEFAULT, fontSize: 20 }, sname)).toBe(20);
    }
    // ...while a kind that DOES declare one is unmoved by the root.
    expect(activityFontSize({ ...DEFAULT, fontSize: 20 }, 'activity')).toBe(12);
    expect(activityFontSize({ ...DEFAULT, fontSize: 20 }, 'diamond')).toBe(11);
  });

  it('never returns undefined — supplying the default is this module s job', () => {
    for (const sname of ['activity', 'activityBar', 'arrow', 'circle', 'composite', 'diamond', 'note'] as const) {
      expect(typeof activityFontSize(DEFAULT, sname)).toBe('number');
      expect(typeof activityLineThickness(DEFAULT, sname)).toBe('number');
      expect(typeof activityRoundCorner(DEFAULT, sname)).toBe('number');
    }
  });
});

describe('activityLineThickness — default tier', () => {
  it('an arrow is 1, not the 1.5 the port emitted for 2503 of 2702 lines', () => {
    expect(activityLineThickness(DEFAULT, 'arrow')).toBe(1);
    expect(activityLineThickness(DEFAULT, 'arrow')).not.toBe(1.5);
  });

  it('a composite frame is 1.5 and a note is 0.5', () => {
    expect(activityLineThickness(DEFAULT, 'composite')).toBe(1.5);
    expect(activityLineThickness(DEFAULT, 'note')).toBe(0.5);
  });

  it('an element declaring none inherits the root `LineThickness 1.0`', () => {
    // plantuml.skin:15. `activity`, `activityBar` and `diamond` each
    // declare only a FontSize/BackgroundColor/RoundCorner of their own.
    expect(activityLineThickness(DEFAULT, 'activity')).toBe(1);
    expect(activityLineThickness(DEFAULT, 'diamond')).toBe(1);
    expect(activityLineThickness(DEFAULT, 'activityBar')).toBe(1);
  });

  it('a swimlane is 1.5', () => {
    expect(swimlaneLineThickness(DEFAULT)).toBe(1.5);
  });
});

describe('activityRoundCorner — default tier, RAW and unhalved', () => {
  it('an action box is 25; callers halve it onto both rx and ry (D4)', () => {
    expect(activityRoundCorner(DEFAULT, 'activity')).toBe(25);
    expect(activityRoundCorner(DEFAULT, 'activity') / 2).toBe(12.5);
  });

  it('every other kind inherits the root `RoundCorner 0`', () => {
    // plantuml.skin:13.
    for (const sname of ['activityBar', 'arrow', 'circle', 'composite', 'diamond', 'note'] as const) {
      expect(activityRoundCorner(DEFAULT, sname)).toBe(0);
    }
  });
});

describe('the override tier wins over the default (D2)', () => {
  it('a user diamond fontSize of 40 beats the built-in 11', () => {
    expect(activityFontSize(themeWithBucket('diamond', { fontSize: 40 }), 'diamond')).toBe(40);
  });

  it('a user activity lineThickness of 3 beats the inherited root 1', () => {
    expect(activityLineThickness(themeWithBucket('activity', { lineThickness: 3 }), 'activity')).toBe(3);
  });

  it('a user activity roundCorner of 0 beats the built-in 25 — zero is a value, not an absence', () => {
    expect(activityRoundCorner(themeWithBucket('activity', { roundCorner: 0 }), 'activity')).toBe(0);
  });

  it('`activityBar` folds to the LOWERCASED bucket key the allowlist spells', () => {
    // `skinparam-element-buckets.ts` spells it `activitybar`; the
    // `ActivitySName` union spells it `activityBar`. A resolver that forgot
    // to fold would silently miss every activityBar override.
    expect(activityFontSize(themeWithBucket('activitybar', { fontSize: 7 }), 'activityBar')).toBe(7);
  });

  it('an override on ONE sname does not leak to another', () => {
    const theme = themeWithBucket('diamond', { fontSize: 40 });
    expect(activityFontSize(theme, 'activity')).toBe(12);
    expect(activityFontSize(theme, 'note')).toBe(13);
  });

  it('a swimlane override beats the built-in 18 / 1.5', () => {
    const theme = themeWithBucket('swimlane', { fontSize: 9, lineThickness: 4 });
    expect(swimlaneFontSize(theme)).toBe(9);
    expect(swimlaneLineThickness(theme)).toBe(4);
  });
});

describe('swimlane title & border resolvers (T2, D4)', () => {
  it('default border colour is the root `swimlane { LineColor black }` (plantuml.skin:311)', () => {
    expect(swimlaneBorderColor(DEFAULT)).toBe('#000000');
    expect(SWIMLANE_BORDER_COLOR).toBe('#000000');
  });

  it('default border thickness is 1.5, delegated to swimlaneLineThickness — not a second literal', () => {
    expect(swimlaneBorderThickness(DEFAULT)).toBe(swimlaneLineThickness(DEFAULT));
    expect(swimlaneBorderThickness(DEFAULT)).toBe(1.5);
  });

  it('default title font size is 18, delegated to swimlaneFontSize — not a second literal', () => {
    expect(swimlaneTitleFontSize(DEFAULT)).toBe(swimlaneFontSize(DEFAULT));
  });

  it('default title font colour is the inherited ROOT `FontColor black` (plantuml.skin:9)', () => {
    expect(swimlaneTitleFontColor(DEFAULT)).toBe('#000000');
    expect(SWIMLANE_TITLE_FONT_COLOR).toBe('#000000');
  });

  it('never returns undefined — supplying the default is this module s job', () => {
    expect(typeof swimlaneBorderColor(DEFAULT)).toBe('string');
    expect(typeof swimlaneBorderThickness(DEFAULT)).toBe('number');
    expect(typeof swimlaneTitleFontSize(DEFAULT)).toBe('number');
    expect(typeof swimlaneTitleFontColor(DEFAULT)).toBe('string');
  });

  it('T1 field wins: swimlaneTitleFontSize 30, swimlaneBorderThickness 5', () => {
    const theme = themeWithActivitySwimlane({ swimlaneTitleFontSize: 30, swimlaneBorderThickness: 5 });
    expect(swimlaneTitleFontSize(theme)).toBe(30);
    expect(swimlaneBorderThickness(theme)).toBe(5);
  });

  it('T1 field wins: swimlaneBorder resolves through resolveColorToSvgHex, not verbatim', () => {
    const theme = themeWithActivitySwimlane({ swimlaneBorder: 'blue' });
    expect(swimlaneBorderColor(theme)).toBe('#0000FF');
  });

  it('T1 field wins: swimlaneTitleFontColor resolves through resolveColorToSvgHex, not verbatim', () => {
    const theme = themeWithActivitySwimlane({ swimlaneTitleFontColor: 'red' });
    expect(swimlaneTitleFontColor(theme)).toBe('#FF0000');
  });

  it('bucket tier beats the constant when no T1 field is set', () => {
    const theme = themeWithBucket('swimlane', { border: '#0000FF', font: '#00FF00' });
    expect(swimlaneBorderColor(theme)).toBe('#0000FF');
    expect(swimlaneTitleFontColor(theme)).toBe('#00FF00');
  });

  it('T1 field beats the bucket tier when both are set', () => {
    const theme: Theme = {
      ...themeWithBucket('swimlane', { border: '#0000FF', font: '#00FF00' }),
      colors: {
        ...DEFAULT.colors,
        elements: { ...DEFAULT.colors.elements, swimlane: { border: '#0000FF', font: '#00FF00' } },
        graph: { ...DEFAULT.colors.graph, activity: { swimlaneBorder: 'red', swimlaneTitleFontColor: 'blue' } },
      },
    };
    expect(swimlaneBorderColor(theme)).toBe('#FF0000');
    expect(swimlaneTitleFontColor(theme)).toBe('#0000FF');
  });

  it('a Gradient bucket Paint is not a solid colour and falls through to the constant', () => {
    // No corpus fixture sets a gradient LineColor/FontColor on a swimlane;
    // the bucket's `border`/`font` roles carry the shared `Paint` type
    // (string | Gradient), so a Gradient value must not crash the resolver.
    const theme = themeWithBucket('swimlane', {});
    theme.colors.elements!.swimlane = { border: { color1: '#FFF', color2: '#000', policy: '-' } };
    expect(swimlaneBorderColor(theme)).toBe(SWIMLANE_BORDER_COLOR);
  });
});

describe('activityMinimumWidth (mission activity-min-box-width, T1, D1)', () => {
  it('the default theme floors nothing — FtileBox.java:87 initialises the field to 0', () => {
    expect(activityMinimumWidth(DEFAULT)).toBe(0);
  });

  it('a bare `skinparam minClassWidth 200` floors the box (FromSkinparamToStyle.java:241)', () => {
    // `addConvert("MinClassWidth", PName.MinimumWidth)` registers with NO
    // SName arguments, so `StyleStorage`'s empty-key match reaches the
    // activity box too (D1) — the bare `theme.minimumWidth` tier.
    const theme: Theme = { ...DEFAULT, minimumWidth: 200 };
    expect(activityMinimumWidth(theme)).toBe(200);
  });

  it('a `<style> activity { MinimumWidth 150 }` bucket wins over a bare 200', () => {
    const theme: Theme = {
      ...DEFAULT,
      minimumWidth: 200,
      colors: { ...DEFAULT.colors, elements: { activity: { minimumWidth: 150 } } },
    };
    expect(activityMinimumWidth(theme)).toBe(150);
  });

  it('never returns undefined — resolveElementMinimumWidth‘s ?? 0 is this module’s job', () => {
    expect(typeof activityMinimumWidth(DEFAULT)).toBe('number');
  });
});

describe('activityFontColor (mission activity-min-box-width, T1, D3)', () => {
  it('the default is the root `FontColor black` (plantuml.skin:9), same shape as swimlaneTitleFontColor', () => {
    expect(activityFontColor(DEFAULT, 'activity')).toBe(ACTIVITY_FONT_COLOR);
    expect(ACTIVITY_FONT_COLOR).toBe('#000000');
  });

  it('every ActivitySName defaults to the same black — no per-site constant (D3)', () => {
    for (const sname of ['activity', 'activityBar', 'arrow', 'circle', 'composite', 'diamond', 'note'] as const) {
      expect(activityFontColor(DEFAULT, sname)).toBe('#000000');
    }
  });

  it('`<style> activityDiagram { activity { FontColor red } }` colours only `activity`', () => {
    const theme = themeWithBucket('activity', { font: 'red' });
    expect(activityFontColor(theme, 'activity')).toBe('#FF0000');
    expect(activityFontColor(theme, 'diamond')).toBe('#000000');
  });

  it('`activityBar` folds to the lowercased bucket key the allowlist spells', () => {
    const theme = themeWithBucket('activitybar', { font: 'blue' });
    expect(activityFontColor(theme, 'activityBar')).toBe('#0000FF');
  });

  it('a Gradient bucket Paint is not a solid colour and falls through to the constant', () => {
    const theme = themeWithBucket('activity', {});
    theme.colors.elements!.activity = { font: { color1: '#FFF', color2: '#000', policy: '-' } };
    expect(activityFontColor(theme, 'activity')).toBe(ACTIVITY_FONT_COLOR);
  });

  it('never returns undefined — supplying the default is this module’s job', () => {
    for (const sname of ['activity', 'activityBar', 'arrow', 'circle', 'composite', 'diamond', 'note'] as const) {
      expect(typeof activityFontColor(DEFAULT, sname)).toBe('string');
    }
  });
});

describe('activityHorizontalAlignment (mission activity-min-box-width, T1, D2)', () => {
  it('the default theme resolves the root `HorizontalAlignment left` (plantuml.skin:12)', () => {
    expect(activityHorizontalAlignment(DEFAULT)).toBe('left');
  });

  it('is unmoved by fields the alignment cascade does not read', () => {
    // Neither cascade tier is reachable today (filed in the module's own
    // doc comment): `ElementColors` carries no alignment role and
    // `skinparam defaultTextAlignment` is unparsed anywhere in `src/core`.
    // A bucket/minimumWidth change must not accidentally move alignment.
    const theme: Theme = {
      ...DEFAULT,
      minimumWidth: 200,
      colors: { ...DEFAULT.colors, elements: { activity: { minimumWidth: 150, font: 'red' } } },
    };
    expect(activityHorizontalAlignment(theme)).toBe('left');
  });

  it('never returns undefined — supplying the default is this module’s job', () => {
    expect(typeof activityHorizontalAlignment(DEFAULT)).toBe('string');
  });
});

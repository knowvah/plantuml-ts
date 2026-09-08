/**
 * The LIVE activity sizer — the `Gtile*` constructors in
 * `src/diagrams/activity/tiles/` (mission `activity-style-defaults`, T3).
 *
 * WHICH SIZER THIS IS, AND WHY IT MATTERS. `activityPlugin.layoutSync`
 * calls `layoutActivity` from `layout/tile-layout.ts`, which builds these
 * Gtiles; each computes its own width and height in its constructor. The
 * older `layout.old.ts` + `activity-layout-*.ts` cluster reachable from
 * `tests/unit/activity/layout.test.ts` is NOT on that path — the live path
 * imports it for types only (`layout/tile-layout.ts:30`,
 * `layout/tile-coordinates.ts:2`, both `import type`). Editing the old
 * cluster moves no rendered output; this mission's T3 was originally
 * scoped there and measured a 0.00% change before being re-pointed here.
 * If you are changing activity geometry, this is the file that does it.
 *
 * WHAT IS ASSERTED. Each tile measures its text at the font its own
 * upstream StyleSignature resolves, not at the diagram-wide root default.
 * The measurer is injected, so the assertions are about WHICH SIZE was
 * requested — which is the thing that was wrong — rather than about glyph
 * metrics.
 */
import { describe, it, expect } from 'vitest';

import { resolveTheme } from '../../../src/core/theme.js';
import type { Theme } from '../../../src/core/theme.js';
import type { StringBounder } from '../../../src/diagrams/activity/tiles/tile.js';
import { GtileAction } from '../../../src/diagrams/activity/tiles/gtile-action.js';
import { GtileDiamond } from '../../../src/diagrams/activity/tiles/gtile-diamond.js';
import { GtileNote } from '../../../src/diagrams/activity/tiles/gtile-note.js';
import { GtileSpot } from '../../../src/diagrams/activity/tiles/gtile-spot.js';
import { GtileGroup } from '../../../src/diagrams/activity/tiles/gtile-group.js';
import type { ActivityAction, ActivityNote } from '../../../src/diagrams/activity/ast.js';

const THEME = resolveTheme('default');

/** Records every size the tile asks for, and answers with a shape simple
 * enough that a height assertion is arithmetic rather than font metrics:
 * height = size (the cited 1x advance), width = 10 per character. */
function recordingBounder(): { bounder: StringBounder; sizes: number[] } {
  const sizes: number[] = [];
  const bounder: StringBounder = {
    getDimension: (text: string, size: number) => {
      sizes.push(size);
      return { width: text.length * 10, height: size };
    },
  };
  return { bounder, sizes };
}

function action(label: string): ActivityAction {
  return { kind: 'action', label };
}

describe('GtileAction — the action box measures at activity FontSize 12', () => {
  it('requests size 12, not the diagram-wide root 14', () => {
    const { bounder, sizes } = recordingBounder();
    new GtileAction(action('hello'), bounder, THEME);
    expect(new Set(sizes)).toEqual(new Set([12]));
    expect(sizes).not.toContain(THEME.fontSize);
  });

  it('advances multi-line text at EXACTLY 1x the font size, not 1.4x', () => {
    // StringBounderFromWidthTable.java:71 -- the returned height is `size`,
    // unconditionally. Three lines at 12 reserve 36 of text height; the old
    // `* 1.4` reserved 50.4, which is the 40% over-reservation D6 names.
    const { bounder } = recordingBounder();
    const tile = new GtileAction(action('a\nb\nc'), bounder, THEME);
    // T4 replaced the box's own `V_PAD = 8` with the resolved
    // `Padding 10` (plantuml.skin:360); the ADVANCE assertion below is
    // independent of which padding is added, since it is the same on both
    // sides of the comparison.
    const PAD = 10;
    expect(tile.height).toBe(3 * 12 + 2 * PAD);
    expect(tile.height).not.toBe(3 * 12 * 1.4 + 2 * PAD);
  });

  it('grows when the user overrides the activity font — a fixed size could not', () => {
    const themed: Theme = {
      ...THEME,
      colors: { ...THEME.colors, elements: { ...THEME.colors.elements, activity: { fontSize: 24 } } },
    };
    const { bounder, sizes } = recordingBounder();
    const tile = new GtileAction(action('a\nb'), bounder, themed);
    expect(new Set(sizes)).toEqual(new Set([24]));
    expect(tile.height).toBe(2 * 24 + 2 * 10);
  });
});

describe('GtileDiamond — the rhombus measures at diamond FontSize 11', () => {
  it('requests 11, not the previous unsourced `theme.fontSize - 2`', () => {
    const { bounder, sizes } = recordingBounder();
    new GtileDiamond('yes', bounder, THEME);
    expect(sizes).toEqual([11]);
    // The old expression evaluated to 12 from the default 14 -- close to 11
    // but never equal to it, and it tracked the ROOT rather than the
    // diamond's own `activityDiagram { diamond { FontSize 11 } }`.
    expect(sizes).not.toContain(THEME.fontSize - 2);
  });

  it('is unmoved by a change to the ROOT font, unlike the old expression', () => {
    const { bounder, sizes } = recordingBounder();
    new GtileDiamond('yes', bounder, { ...THEME, fontSize: 30 });
    expect(sizes).toEqual([11]);
  });
});

describe('GtileNote — a note measures at note FontSize 13', () => {
  it('requests 13, which is LARGER than the action box, not smaller', () => {
    const { bounder, sizes } = recordingBounder();
    const note: ActivityNote = { kind: 'note', text: 'n', position: 'right' };
    new GtileNote(note, bounder, THEME);
    expect(sizes).toEqual([13]);
    // The previous `theme.fontSize - 2` gave 12 -- smaller than the action
    // box's own 12 is equal to it, and both were the wrong direction: the
    // jar draws note text at 13 against an activity box's 12.
    expect(sizes[0]).toBeGreaterThan(12);
  });
});

describe('GtileSpot and GtileGroup — kinds that INHERIT the root font', () => {
  it('a connector spot measures at the root font, not root minus two', () => {
    // `of(root, element, activityDiagram, circle, spot)` --
    // VCompactFactory.java:103-105. The bare `circle { }` skin block is
    // empty (plantuml.skin:331-332), so the label inherits root FontSize 14.
    const { bounder, sizes } = recordingBounder();
    // `ActivitySpot` is a file-local interface in `gtile-spot.ts` ("Local
    // until ast.ts is extended"), so it is spelled inline here rather than
    // imported.
    new GtileSpot({ kind: 'spot', name: 'A' }, bounder, THEME);
    expect(sizes).toEqual([14]);
  });

  it('a group title measures at the root font, and follows a root override', () => {
    // `of(..., <symbol>, composite)` -- FtileGroup.java:89-92;
    // `activityDiagram { composite { ... } }` declares no FontSize.
    const { bounder, sizes } = recordingBounder();
    const body = new GtileAction(action('x'), recordingBounder().bounder, THEME);
    new GtileGroup('title', body, bounder, THEME);
    expect(sizes).toContain(14);

    const { bounder: b2, sizes: s2 } = recordingBounder();
    new GtileGroup('title', body, b2, { ...THEME, fontSize: 20 });
    expect(s2).toContain(20);
  });

  it('a composite override reaches the group title through the resolver', () => {
    const themed: Theme = {
      ...THEME,
      colors: { ...THEME.colors, elements: { ...THEME.colors.elements, composite: { fontSize: 9 } } },
    };
    const { bounder, sizes } = recordingBounder();
    const body = new GtileAction(action('x'), recordingBounder().bounder, THEME);
    new GtileGroup('title', body, bounder, themed);
    expect(sizes).toContain(9);
  });
});

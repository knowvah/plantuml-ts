import { describe, expect, it } from 'vitest';
import { buildIf, ifBuilderOf } from '../../../../src/diagrams/activity/layout/conditional-builder.js';
import type { ActivityIf, ActivityNode } from '../../../../src/diagrams/activity/ast.js';
import { GtileIfDown } from '../../../../src/diagrams/activity/tiles/gtile-if-down.js';
import { GtileIfWithLinks } from '../../../../src/diagrams/activity/tiles/gtile-if-with-links.js';
import { GtileDiamondEmpty } from '../../../../src/diagrams/activity/tiles/gtile-diamond-empty.js';
import { GtileDiamondSquare } from '../../../../src/diagrams/activity/tiles/gtile-diamond-square.js';
import { GtileIfLongHorizontal } from '../../../../src/diagrams/activity/tiles/gtile-if-long-horizontal.js';
import type { StringBounder } from '../../../../src/diagrams/activity/tiles/tile.js';
import type { Theme } from '../../../../src/core/theme.js';
import { resolveTheme } from '../../../../src/core/theme.js';

const bounder: StringBounder = {
  getDimension: (text: string, _size: number) => ({ width: text.length * 7, height: 14 }),
};
const theme: Theme = { ...resolveTheme('default'), fontSize: 13, fontFamily: 'Arial' };

function makeIf(
  thenBranch: ActivityNode[],
  elseBranch: ActivityNode[],
  elseIfBranches: ActivityIf['elseIfBranches'] = [],
): ActivityIf {
  return { kind: 'if', condition: 'c', thenBranch, elseBranch, elseIfBranches };
}

const action = (label: string): ActivityNode => ({ kind: 'action', label });

describe('ifBuilderOf — down, no swap, no optionalStop', () => {
  // cemipu-87-dinu624: if(foo) then :something; endif -- implicit empty else.
  it('routes plain then + empty else to down', () => {
    const result = ifBuilderOf(makeIf([action('something')], []));
    expect(result).toEqual({ builder: 'down', swapped: false });
  });
});

describe('ifBuilderOf — down, swap + optionalStop (outer c3 branch)', () => {
  // becaje-01-vaji284: then=[end], else=[action,action].
  it('makes the else-branch the main flow and the end the side box', () => {
    const result = ifBuilderOf(makeIf([{ kind: 'end' }], [action('a'), action('b')]));
    expect(result).toEqual({ builder: 'down', swapped: true, optionalStop: true });
  });
});

describe('ifBuilderOf — down, swap + optionalStop, empty else omits diamond2', () => {
  // vaxiki-78-nice114: then=[stop], implicit empty else.
  it('the empty else becomes main, the stop becomes optionalStop', () => {
    const result = ifBuilderOf(makeIf([{ kind: 'stop' }], []));
    expect(result).toEqual({ builder: 'down', swapped: true, optionalStop: true });
  });
});

describe("ifBuilderOf — [action, kill] is Java's single killed instruction", () => {
  it('is stop-or-spot (down), not with-links', () => {
    const result = ifBuilderOf(makeIf([action('a'), { kind: 'kill' }], [action('b'), action('c')]));
    expect(result.builder).toBe('down');
  });

  it('detach is the same command as kill', () => {
    const result = ifBuilderOf(makeIf([action('a'), { kind: 'detach' }], [action('b'), action('c')]));
    expect(result.builder).toBe('down');
  });
});

describe('ifBuilderOf — a bare or killed spot is stop-or-spot (zaloze, T3d)', () => {
  // zaloze-31-jibo311: then=[action], else=[(A) spot, detach].
  // InstructionSpot#isOnlySingleStopOrSpot is unconditionally true in the
  // Java (InstructionList.java:98-99) -- killed or not.
  it('[spot, detach] routes to down, not with-links', () => {
    const result = ifBuilderOf(makeIf([action('next')], [{ kind: 'spot', name: 'A' }, { kind: 'detach' }]));
    expect(result).toEqual({ builder: 'down', swapped: false, optionalStop: true });
  });

  it('[spot, kill] is the same command as detach', () => {
    const result = ifBuilderOf(makeIf([action('next')], [{ kind: 'spot', name: 'A' }, { kind: 'kill' }]));
    expect(result.builder).toBe('down');
  });

  it('a bare (unkilled) spot alone is also stop-or-spot', () => {
    const result = ifBuilderOf(makeIf([action('next')], [{ kind: 'spot', name: 'A' }]));
    expect(result).toEqual({ builder: 'down', swapped: false, optionalStop: true });
  });
});

describe('ifBuilderOf — with-links', () => {
  it('both branches non-empty, neither a lone stop -> with-links', () => {
    expect(ifBuilderOf(makeIf([action('a')], [action('b')]))).toEqual({ builder: 'with-links' });
  });

  it('[nested-if, kill] is NOT stop-or-spot (last is not InstructionSimple)', () => {
    const nested = makeIf([action('x')], []);
    const result = ifBuilderOf(makeIf([action('a')], [nested, { kind: 'kill' }]));
    expect(result.builder).toBe('with-links');
  });
});

describe('ifBuilderOf — long-horizontal', () => {
  it('any elseif routes to long-horizontal, bypassing ConditionalBuilder entirely', () => {
    const result = ifBuilderOf(makeIf([action('a')], [], [{ condition: 'c2', body: [action('b')] }]));
    expect(result).toEqual({ builder: 'long-horizontal' });
  });
});

describe('buildIf — dispatch to the right tile class', () => {
  it('with-links builds GtileIfWithLinks', () => {
    const tile = buildIf(makeIf([action('a')], [action('b')]), bounder, theme);
    expect(tile).toBeInstanceOf(GtileIfWithLinks);
  });

  it('down builds GtileIfDown (mission activity-if-tile-port T4)', () => {
    const tile = buildIf(makeIf([action('a')], []), bounder, theme);
    expect(tile).toBeInstanceOf(GtileIfDown);
  });

  it('long-horizontal builds GtileIfLongHorizontal (mission activity-if-tile-port T5)', () => {
    const tile = buildIf(makeIf([action('a')], [], [{ condition: 'c2', body: [action('b')] }]), bounder, theme);
    expect(tile).toBeInstanceOf(GtileIfLongHorizontal);
  });

  it('long-horizontal builds one diamond per then + elseif branch', () => {
    const node = makeIf([action('a')], [action('c')], [{ condition: 'c2', body: [action('b')] }]);
    const tile = buildIf(node, bounder, theme) as GtileIfLongHorizontal;
    expect(tile.diamonds).toHaveLength(2);
    expect(tile.tiles).toHaveLength(2);
  });

  // ELSEIFIN (add2 T3i): CommandElseIf2.java:70-76's leading `(incoming)`
  // group -- FtileIfLongHorizontal.java:178-186 `diamond.withWest`.
  it('threads elseif.incomingLabel onto the branch diamond west side', () => {
    const node = makeIf(
      [action('a')],
      [action('c')],
      [{ condition: 'c2', incomingLabel: 'in', body: [action('b')] }],
    );
    const tile = buildIf(node, bounder, theme) as GtileIfLongHorizontal;
    expect(tile.diamonds[0]!.labelAt('west')).toBeNull();
    expect(tile.diamonds[1]!.labelAt('west')).toEqual({ x: -14, y: -2, width: 14, height: 14, label: 'in' });
  });

  it('a wider incomingLabel widens the whole if-tile (not just the hexagon)', () => {
    const bare = makeIf([action('a')], [action('c')], [{ condition: 'c2', body: [action('b')] }]);
    const withLabel = makeIf(
      [action('a')],
      [action('c')],
      [{ condition: 'c2', incomingLabel: 'incoming', body: [action('b')] }],
    );
    const bareWidth = (buildIf(bare, bounder, theme) as GtileIfLongHorizontal).width;
    const labeledWidth = (buildIf(withLabel, bounder, theme) as GtileIfLongHorizontal).width;
    expect(labeledWidth).toBeGreaterThan(bareWidth);
  });
});

// add3-T3c (CONDSTYLE-EMPTY): `buildIfWithLinks` now dispatches on
// `theme.conditionStyle` like `buildIfDown` already did
// (`ConditionalBuilder#getShape1`, `:259-266`), via the SAME
// `createConditionDiamond` both builders share.
describe('buildIf — with-links honours conditionStyle (add3-T3c)', () => {
  it('conditionStyle emptyDiamond: diamond1 is GtileDiamondEmpty, not GtileDiamondInside', () => {
    const emptyTheme: Theme = { ...theme, conditionStyle: 'emptyDiamond' };
    const tile = buildIf(makeIf([action('a')], [action('b')]), bounder, emptyTheme) as GtileIfWithLinks;
    expect(tile.diamond1).toBeInstanceOf(GtileDiamondEmpty);
  });

  it('conditionStyle insideDiamond: diamond1 is GtileDiamondSquare', () => {
    const squareTheme: Theme = { ...theme, conditionStyle: 'insideDiamond' };
    const tile = buildIf(makeIf([action('a')], [action('b')]), bounder, squareTheme) as GtileIfWithLinks;
    expect(tile.diamond1).toBeInstanceOf(GtileDiamondSquare);
  });

  it('conditionStyle omitted: diamond1 stays GtileDiamondInside (no regression)', () => {
    const tile = buildIf(makeIf([action('a')], [action('b')]), bounder, theme) as GtileIfWithLinks;
    expect(tile.diamond1.kind).toBe('gtile-diamond-inside');
  });

  it('emptyDiamond: the north test label is a real, non-empty slot (routes the condition text there, not the always-"" tile label)', () => {
    const emptyTheme: Theme = { ...theme, conditionStyle: 'emptyDiamond' };
    const tile = buildIf(makeIf([action('a')], [action('b')]), bounder, emptyTheme) as GtileIfWithLinks;
    expect(tile.diamond1.label).toBe('');
    expect(tile.diamond1.labelAt('north')).toEqual({ x: 18, y: 0, width: 7, height: 14, label: 'c' });
  });
});

import { describe, expect, it } from 'vitest';
import { buildIf, ifBuilderOf } from '../../../../src/diagrams/activity/layout/conditional-builder.js';
import type { ActivityIf, ActivityNode } from '../../../../src/diagrams/activity/ast.js';
import { GtileIfDown } from '../../../../src/diagrams/activity/tiles/gtile-if-down.js';
import { GtileIfWithLinks } from '../../../../src/diagrams/activity/tiles/gtile-if-with-links.js';
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
});

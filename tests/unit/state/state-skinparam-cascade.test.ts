/**
 * Feature: `resolveSkinparam`'s `statebackgroundcolor<<X>>`/
 * `statefontcolor<<X>>`/`statefontsize<<X>>` parsing (mission G4 S15/S16).
 *
 * Mirrors `core/skinparam.ts`'s own pre-existing `statebordercolor<<X>>`
 * (mission G4 S9) direct stereotype-qualified value-lookup mechanism
 * (`SkinParam#getColor(ColorParam, Stereotype)`), applied to a state box's
 * own fill/text color/font-size instead of its border. `statefontsize<<X>>`
 * (mission G4 S16) is the SAME direct-value-lookup shape (jar-verified via
 * `FromSkinparamToStyle.java`'s `addConFont("state", SName.state)` ->
 * `getFirstValueNonNullWithSuffix("fontsize" + stereotype, ...)`, NOT the
 * `<style>`-block cascade family this mission's write-set boundary blocks --
 * see `state-render-colors.ts#resolveStateFontSize`'s own doc comment for
 * the full derivation). Kept in `tests/unit/state/` (this mission's own
 * write-set) rather than the top-level `tests/unit/skinparam.test.ts`
 * (outside the write-set) — a state-scoped test of a `core/skinparam.ts`
 * function, same rationale as `state-render-colors.test.ts` testing
 * `theme.ts`-typed color resolution from within this mission's own
 * directory.
 *
 * Jar-verified `laferu-31-tice836` (`skinparam stateBackgroundColor<<Foo>>
 * red` + `skinparam stateFontColor<<Foo>> yellow` + `skinparam
 * stateFontSize<<Foo>> 30`, `state state1 <<Foo>>` -> `fill="#FF0000"`,
 * label `fill="#FFFF00" font-size="30"`).
 *
 * @see plans/g4-state-svg/ledger.md (S15, S16)
 */
import { describe, it, expect } from 'vitest';
import { resolveSkinparam, parseStyleBlock } from '../../../src/core/skinparam.js';
import { defaultTheme } from '../../../src/core/theme.js';

describe('resolveSkinparam — statebackgroundcolor<<X>>/statefontcolor<<X>> (mission G4 S15)', () => {
  it('maps statebackgroundcolor<<stereo>> to colors.graph.stateBackgroundColorByStereo', () => {
    const { theme, unknown } = resolveSkinparam(
      new Map([['statebackgroundcolor<<Foo>>', 'red']]),
      defaultTheme,
    );
    expect(theme.colors.graph.stateBackgroundColorByStereo).toEqual({ foo: 'red' });
    expect(unknown).toEqual([]);
  });

  it('maps statefontcolor<<stereo>> to colors.graph.stateFontColorByStereo', () => {
    const { theme, unknown } = resolveSkinparam(
      new Map([['statefontcolor<<Foo>>', 'yellow']]),
      defaultTheme,
    );
    expect(theme.colors.graph.stateFontColorByStereo).toEqual({ foo: 'yellow' });
    expect(unknown).toEqual([]);
  });

  it('lowercases the stereotype label in statebackgroundcolor<<X>>/statefontcolor<<X>>', () => {
    const { theme } = resolveSkinparam(
      new Map([
        ['statebackgroundcolor<<MeBlue>>', '#FF0000'],
        ['statefontcolor<<MeBlue>>', '#FFFF00'],
      ]),
      defaultTheme,
    );
    expect(theme.colors.graph.stateBackgroundColorByStereo).toEqual({ meblue: '#FF0000' });
    expect(theme.colors.graph.stateFontColorByStereo).toEqual({ meblue: '#FFFF00' });
  });

  it('does not confuse statebackgroundcolor<<X>> with the plain stateBackgroundColor bucket', () => {
    const { theme } = resolveSkinparam(
      new Map([
        ['statebackgroundcolor', 'white'],
        ['statebackgroundcolor<<Foo>>', 'red'],
      ]),
      defaultTheme,
    );
    expect(theme.colors.elements?.['state']?.background).toBe('white');
    expect(theme.colors.graph.stateBackgroundColorByStereo).toEqual({ foo: 'red' });
  });

  it('an unrecognized stereotype-qualified key outside these two forms stays unknown', () => {
    const { unknown } = resolveSkinparam(
      new Map([['statesomethingelse<<Foo>>', 'red']]),
      defaultTheme,
    );
    expect(unknown).toEqual(['statesomethingelse<<foo>>']);
  });
});

describe('resolveSkinparam — statefontsize<<X>> (mission G4 S16)', () => {
  it('maps statefontsize<<stereo>> to colors.graph.stateFontSizeByStereo', () => {
    const { theme, unknown } = resolveSkinparam(
      new Map([['statefontsize<<Foo>>', '30']]),
      defaultTheme,
    );
    expect(theme.colors.graph.stateFontSizeByStereo).toEqual({ foo: 30 });
    expect(unknown).toEqual([]);
  });

  it('lowercases the stereotype label in statefontsize<<X>>', () => {
    const { theme } = resolveSkinparam(
      new Map([['statefontsize<<MeBlue>>', '18']]),
      defaultTheme,
    );
    expect(theme.colors.graph.stateFontSizeByStereo).toEqual({ meblue: 18 });
  });

  it('ignores a non-numeric statefontsize<<X>> value', () => {
    const { theme, unknown } = resolveSkinparam(
      new Map([['statefontsize<<Foo>>', 'notanumber']]),
      defaultTheme,
    );
    expect(theme.colors.graph.stateFontSizeByStereo).toBeUndefined();
    expect(unknown).toEqual([]);
  });

  it('combines with statebackgroundcolor<<X>>/statefontcolor<<X>> on the same stereotype (laferu-31-tice836)', () => {
    const { theme } = resolveSkinparam(
      new Map([
        ['statebackgroundcolor<<Foo>>', 'red'],
        ['statefontcolor<<Foo>>', 'yellow'],
        ['statefontsize<<Foo>>', '30'],
      ]),
      defaultTheme,
    );
    expect(theme.colors.graph.stateBackgroundColorByStereo).toEqual({ foo: 'red' });
    expect(theme.colors.graph.stateFontColorByStereo).toEqual({ foo: 'yellow' });
    expect(theme.colors.graph.stateFontSizeByStereo).toEqual({ foo: 30 });
  });
});

/**
 * `core/skinparam.ts#parseStyleBlock`'s bare `stateDiagram { ... }` cascade
 * alias (mission G6 T4). Jar-verified `decede-10-buvu414`: `<style>
 * stateDiagram { RoundCorner 2; Shadowing 0; BackgroundColor cyan; LineColor
 * green; FontColor red } </style>` tints every box's fill/stroke/text AND
 * the transition's own path+arrowhead stroke, while the SAME properties on a
 * bare `state { ... }` selector (no diagram-type wrapper) reach ONLY the
 * element bucket, never the edge (see `state-render-colors.ts
 * #resolveStateBorder`/`#resolveStateArrowHeadColor`'s own doc comments for
 * the consumption side of this same mechanism). Kept in `tests/unit/state/`
 * per this file's own top doc-comment rationale (a state-scoped test of a
 * `core/skinparam.ts` function).
 */
describe('parseStyleBlock — bare stateDiagram{} cascade alias (mission G6 T4)', () => {
  it('aliases BackgroundColor/LineColor/FontColor into statediagram.state (bordercolor renamed from linecolor)', () => {
    const styleMap = parseStyleBlock(`
      stateDiagram {
        RoundCorner 2
        Shadowing 0
        BackgroundColor cyan
        LineColor green
        FontColor red
      }
    `);
    expect(styleMap.get('statediagram.state')).toEqual(
      new Map([
        ['backgroundcolor', 'cyan'],
        ['bordercolor', 'green'],
        ['fontcolor', 'red'],
      ]),
    );
  });

  it('aliases LineColor into statediagram.arrow (linecolor key unchanged)', () => {
    const styleMap = parseStyleBlock(`
      stateDiagram {
        LineColor green
      }
    `);
    expect(styleMap.get('statediagram.arrow')).toEqual(new Map([['linecolor', 'green']]));
  });

  it('does not alias RoundCorner/Shadowing (unconsumed by either target)', () => {
    const styleMap = parseStyleBlock(`
      stateDiagram {
        RoundCorner 2
        Shadowing 0
      }
    `);
    expect(styleMap.get('statediagram.state')).toBeUndefined();
    expect(styleMap.get('statediagram.arrow')).toBeUndefined();
  });

  it('does not overwrite an explicit nested state{} selector own BackgroundColor', () => {
    const styleMap = parseStyleBlock(`
      stateDiagram {
        BackgroundColor cyan
        state {
          BackgroundColor yellow
        }
      }
    `);
    expect(styleMap.get('statediagram.state')?.get('backgroundcolor')).toBe('yellow');
  });

  it('does not overwrite an explicit nested arrow{} selector own LineColor', () => {
    const styleMap = parseStyleBlock(`
      stateDiagram {
        LineColor green
        arrow {
          LineColor blue
        }
      }
    `);
    expect(styleMap.get('statediagram.arrow')?.get('linecolor')).toBe('blue');
  });

  // Negative case: a bare classDiagram{} block must NOT leak into either
  // state-diagram cascade target — selector "classdiagram" shares no token
  // with the "statediagram" bare-key lookup this alias keys off.
  it('does NOT alias a bare classDiagram{} block into statediagram.state/statediagram.arrow', () => {
    const styleMap = parseStyleBlock(`
      classDiagram {
        BackgroundColor cyan
        LineColor green
      }
    `);
    expect(styleMap.get('statediagram.state')).toBeUndefined();
    expect(styleMap.get('statediagram.arrow')).toBeUndefined();
    expect(styleMap.get('classdiagram')).toEqual(
      new Map([
        ['backgroundcolor', 'cyan'],
        ['linecolor', 'green'],
      ]),
    );
  });

  it('a bare stateDiagram{} block with no color properties produces no alias entries', () => {
    const styleMap = parseStyleBlock(`
      stateDiagram {
        LineThickness 2
      }
    `);
    expect(styleMap.get('statediagram.state')).toBeUndefined();
    expect(styleMap.get('statediagram.arrow')).toBeUndefined();
  });
});

/**
 * `skin-command.ts` -- `TitledDiagram#loadSkin`'s command errors
 * (`TitledDiagram.java:159-182`) and where they cut the dispatch.
 */
import { describe, expect, it } from 'vitest';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { DiagramRegistry } from '../../../src/core/dispatcher.js';
import type { DiagramPlugin } from '../../../src/core/dispatcher.js';
import { refuse } from '../../../src/core/parse-refusal.js';
import { skinCommandError, skinCutOf } from '../../../src/core/skin-command.js';

const INCOMPLETE =
  'Incomplete style strictuml: root does not define ' +
  '[FontName, FontSize, FontStyle, FontColor, LineColor, LineThickness, BackGroundColor, HorizontalAlignment]';

function sourceOf(lines: string[], linePositions?: number[]): UmlSource {
  return { lines, type: 'sequence', ...(linePositions === undefined ? {} : { linePositions }) };
}

describe('skinCommandError', () => {
  it('accepts every complete sheet the jar bundles', () => {
    for (const name of ['plantuml', 'rose', 'debug', 'sonyxperiadev']) expect(skinCommandError(name)).toBeUndefined();
  });

  it('cannot find a sheet the jar does not bundle, case-sensitively', () => {
    expect(skinCommandError('reddress')).toBe('Cannot find style reddress');
    expect(skinCommandError('Rose')).toBe('Cannot find style Rose');
  });

  it('refuses a fragment as incomplete (StyleLoader.java:157-158)', () => {
    expect(skinCommandError('strictuml')).toBe(INCOMPLETE);
  });
});

describe('skinCutOf', () => {
  it('is undefined with no failing skin line', () => {
    expect(skinCutOf({}, sourceOf(['a']))).toBeUndefined();
    expect(skinCutOf({ skinDirectives: [{ name: 'rose', position: 1 }] }, sourceOf(['a']))).toBeUndefined();
  });

  it('cuts at the FIRST failing line, after the body lines that precede it', () => {
    const cut = skinCutOf(
      {
        skinDirectives: [
          { name: 'rose', position: 1 },
          { name: 'reddress', position: 3 },
          { name: 'Rose', position: 5 },
        ],
      },
      sourceOf(['a', 'b', 'c'], [2, 4, 6]),
    );
    expect(cut).toEqual({ index: 1, refusal: refuse('execution', 3, 1, 'Cannot find style reddress') });
  });

  it('counts no body line when the source carries no positions', () => {
    const cut = skinCutOf({ skinDirectives: [{ name: 'reddress', position: undefined }] }, sourceOf(['a']));
    expect(cut).toEqual({ index: 0, refusal: refuse('execution', 0, 0, 'Cannot find style reddress') });
  });
});

describe('DiagramRegistry#resolve under a skin cut', () => {
  const accepting = (type: 'sequence' | 'class'): DiagramPlugin =>
    ({ type, parse: (s: UmlSource) => ({ lines: s.lines }) }) as unknown as DiagramPlugin;
  const refusingAt = (type: 'sequence' | 'class', line: number): DiagramPlugin =>
    ({ type, parse: () => refuse('syntax', line, line, 'Syntax Error?') }) as unknown as DiagramPlugin;
  const cut = { index: 2, refusal: refuse('execution', 7, 2, 'Cannot find style x') };

  it('refuses an engine that parses the lines before the cut, at the cut', () => {
    const registry = new DiagramRegistry();
    registry.register(refusingAt('sequence', 0));
    registry.register(accepting('class'));
    const resolution = registry.resolve(sourceOf(['a', 'b', 'c']), undefined, cut);
    expect(resolution.plugin.type).toBe('class');
    expect(resolution.refusal).toBe(cut.refusal);
  });

  it('keeps the first engine on a tie, and refuses outright on an empty prefix', () => {
    const registry = new DiagramRegistry();
    registry.register(accepting('sequence'));
    registry.register(accepting('class'));
    const resolution = registry.resolve(sourceOf(['a']), undefined, { ...cut, index: 0 });
    expect(resolution.plugin.type).toBe('sequence');
    expect(resolution.refusal).toBe(cut.refusal);
  });
});

import { describe, it, expect } from 'vitest';
import { preprocess } from '../../../src/core/preprocessor.js';

/**
 * cdd6-T1e. Two properties of the preprocessor's hoisting pass that upstream
 * gets from layers the port folds into `preprocessor.ts#resultOf`:
 *
 * 1. `BlockUml.java:153` `Jaws.mutateExpands1(tmp)` splits every
 *    `%breakline()` (`BLOCK_E1_BREAKLINE`) outside `{{...}}` into its own line
 *    BEFORE any command sees it (`jaws/Jaws.java:65-120`) -- so C4's
 *    `$defineSkinparams`, which joins several `skinparam ... { }` blocks with
 *    `$bl()`, yields one skinparam block per piece.
 * 2. A `skinparam` / `<style>` line inside an embedded `{{ ... }}` diagram
 *    belongs to the nested diagram: upstream's outer multiline command
 *    consumes it as display text and `EmbeddedDiagram#createAndSkip`
 *    (`EmbeddedDiagram.java:97-114`) hands it to the nested `BlockUml`.
 */
function run(lines: string[]) {
  return preprocess(lines.join('\n'));
}

describe('preprocessor: %breakline() split before collection (Jaws.mutateExpands1)', () => {
  it('collects each breakline-joined skinparam block as its own key', () => {
    const result = run([
      'skinparam rectangle<<person>> {%breakline()  FontColor #444444%breakline()}%breakline()skinparam database<<person>> {%breakline()  FontColor #111111%breakline()}',
    ]);
    expect(result.skinparam.get('rectanglefontcolor<<person>>')).toBe('#444444');
    expect(result.skinparam.get('databasefontcolor<<person>>')).toBe('#111111');
    expect(result.skinparam.has('rectangle<<person>>')).toBe(false);
    expect(result.lines).toEqual([]);
  });

  it('collects a split-out skinparam whose name continues after its <<stereotype>> (CommandSkinParam NAME)', () => {
    // C4's `$defineSkinparams` emits `skinparam package<<boundary>>StereotypeFontColor
    // transparent` between `$bl()`s; once split, the line must still be a
    // skinparam -- upstream NAME is `[\w.]*(?:<<[^<>]*>>)?[\w.]*`
    // (`CommandSkinParam.java:60`).
    const result = run([
      'skinparam rectangle<<b>> {%breakline()  FontColor #444444%breakline()}%breakline()skinparam package<<b>>StereotypeFontColor transparent',
    ]);
    expect(result.skinparam.get('packagestereotypefontcolor<<b>>')).toBe('transparent');
    expect(result.lines).toEqual([]);
  });

  it('does not read a stereotype-only block opener as a single-line skinparam (CommandSkinParam VALUE)', () => {
    // `([^{}]*)` (`CommandSkinParam.java:62`) cannot take `{` as a value.
    const result = run(['skinparam <<verb>> {', 'roundCorner 25', '}']);
    expect(result.skinparam.has('<<verb>>')).toBe(false);
  });

  it('splits a body line at a breakline outside {{...}}, each piece keeping the line position', () => {
    const result = run(['class A', 'class B%breakline()class C']);
    expect(result.lines).toEqual(['class A', 'class B', 'class C']);
    expect(result.linePositions).toEqual([0, 1, 1]);
  });

  it('keeps a breakline inside {{...}} on one line', () => {
    const result = run(['note as N {{ a%breakline()b }}%breakline()class D']);
    expect(result.lines).toEqual(['note as N {{ ab }}', 'class D']);
  });
});

describe('preprocessor: CommandSkinParam NAME accepts a mid-name stereotype (T1a)', () => {
  // Upstream NAME `([\w.]*(?:\<\<[^<>]*\>\>)?[\w.]*)` (`CommandSkinParam.java:60`).
  it('collects `frame<<x>>BackgroundColor`, keyed with the stereotype moved to the end', () => {
    const result = run(['skinparam frame<<x>>BackgroundColor red']);
    expect(result.skinparam.get('framebackgroundcolor<<x>>')).toBe('red');
    expect(result.lines).toEqual([]);
  });

  it('collects a `.`-containing name (NAME is `[\\w.]*`)', () => {
    // The port's `cleanSkinKey` does not strip `.` (upstream `cleanForKeySlow`
    // does); only the acceptance is pinned here.
    const result = run(['skinparam a.b red']);
    expect(result.skinparam.get('a.b')).toBe('red');
    expect(result.lines).toEqual([]);
  });
});

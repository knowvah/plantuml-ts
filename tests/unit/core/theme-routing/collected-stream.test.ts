/**
 * cdd4-T7b: the skinparam / `<style>` collector reads the FINISHED,
 * substituted TIM result -- the stream upstream's `CommandSkinParam` /
 * `CommandStyleMultilinesCSS` dispatch over (`TContext.java:455-466`).
 */
import { describe, expect, it } from 'vitest';
import { preprocess } from '../../../../src/core/preprocessor.js';

describe('the collector sees procedure output, substituted', () => {
  const PROC = '!procedure $scheme()\n  FontColor red\n  BorderColor blue\n!endprocedure';

  it('runs a procedure call standing inside a skinparam block', () => {
    const r = preprocess(`@startuml\n${PROC}\nskinparam class {\n  $scheme()\n}\nclass A\n@enduml`);
    expect(r.skinparam.get('classfontcolor')).toBe('red');
    expect(r.skinparam.get('classbordercolor')).toBe('blue');
    expect(r.lines).toEqual(['@startuml', 'class A', '@enduml']);
  });

  it("keeps a mid-line call's prefix inside the <style> block (puml-theme-aws-orange.puml:645)", () => {
    const r = preprocess(
      `@startuml\n${PROC}\n<style>\nnode {\n  BackGroundColor $scheme()\n}\n</style>\nA -> B\n@enduml`,
    );
    expect(r.styles[0]).toContain('  BackGroundColor   FontColor red');
    expect(r.lines).toEqual(['@startuml', 'A -> B', '@enduml']);
  });
});

describe('stylePositions: a <style> block sits where it executed in the document', () => {
  it("places a theme's block at the line before its !theme, not at its line in the theme file", () => {
    const r = preprocess('@startuml\n!theme plain\n<style>\nroot { X 1 }\n</style>\n@enduml');
    // `@startuml` is line 0; the document's own block opens at line 2.
    expect(r.stylePositions).toEqual([0, 2]);
  });
});

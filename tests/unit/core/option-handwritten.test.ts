/**
 * sdd3-T8f-2: `!option handwritten true` reaches the theme.
 *
 * `TitledDiagram.java:115-118`: `isHandwritten()` is `skinParam.handwritten()`
 * (`SkinParam.java:1076-1077`, `isTrue("handwritten")`) OR
 * `UgDiagram.java:117-121`'s `getPreprocessingArtifact().getOption().isTrue(
 * OptionKey.HANDWRITTEN)`, where `ConfigurationStore#isTrue` is
 * `"true".equalsIgnoreCase(value)` (`ConfigurationStore.java:60-62`).
 * `EaterOption.java:56-70` stores `value.toString()`, or the key's default
 * `"true"` (`OptionKey.java:40`) for a bare `!option handwritten`; the key is
 * matched by `OptionKey.lazyFrom` (letters only, case-insensitive).
 */
import { describe, it, expect } from 'vitest';
import { buildTheme } from '../../../src/core/build-theme.js';
import { preprocess } from '../../../src/core/preprocessor.js';

const handwrittenOf = (body: string): boolean | undefined =>
  buildTheme(preprocess(`@startuml\n${body}\nAlice -> Bob: hi\n@enduml`)).theme.handwritten;

describe('PreprocessorResult.options (EaterOption.java:61-70)', () => {
  it('records the defined option under its OptionKey name', () => {
    expect(preprocess('@startuml\n!option handwritten true\n@enduml').options?.get('HANDWRITTEN')).toBe('true');
  });

  it('records a bare option as the key default (OptionKey.java:40)', () => {
    expect(preprocess('@startuml\n!option handwritten\n@enduml').options?.get('HANDWRITTEN')).toBe('true');
  });

  it('is empty when no !option is written', () => {
    expect(preprocess('@startuml\nAlice -> Bob\n@enduml').options?.size).toBe(0);
  });
});

describe('buildTheme honours !option handwritten (TitledDiagram.java:115-118)', () => {
  it('!option handwritten true -> theme.handwritten === true', () => {
    expect(handwrittenOf('!option handwritten true')).toBe(true);
  });

  it('matches the value case-insensitively and the key by letters only (lazyFrom)', () => {
    expect(handwrittenOf('!option Handwritten TRUE')).toBe(true);
    expect(handwrittenOf('!option HAND_WRITTEN true')).toBe(true);
  });

  it('a bare !option handwritten takes the default true', () => {
    expect(handwrittenOf('!option handwritten')).toBe(true);
  });

  it('!option handwritten false, or no option, leaves the theme unchanged', () => {
    expect(handwrittenOf('!option handwritten false')).toBeUndefined();
    expect(handwrittenOf('')).toBeUndefined();
  });

  it('an unknown option key is no handwritten', () => {
    expect(handwrittenOf('!option handwrittn true')).toBeUndefined();
  });

  it('the skinparam form still works', () => {
    expect(handwrittenOf('skinparam handwritten true')).toBe(true);
    expect(handwrittenOf('skinparam handwritten false')).toBe(false);
  });

  it('is an OR: the option wins over skinparam handwritten false, the skinparam over a false option', () => {
    expect(handwrittenOf('skinparam handwritten false\n!option handwritten true')).toBe(true);
    expect(handwrittenOf('skinparam handwritten true\n!option handwritten false')).toBe(true);
  });

  it('the sketchy theme (which writes !option handwritten true) is handwritten', () => {
    expect(handwrittenOf('!theme sketchy')).toBe(true);
  });

  it('a caller Partial<Theme> still wins (Stage 4)', () => {
    const pre = preprocess('@startuml\n!option handwritten true\nAlice -> Bob\n@enduml');
    expect(buildTheme(pre, { theme: { handwritten: false } }).theme.handwritten).toBe(false);
  });
});

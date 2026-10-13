/**
 * `PSystemEggFactory` (eggs/PSystemEggFactory.java). The sentences are secret
 * (D10): the refused lines were checked against the jar through `jshell`
 * (`new SentenceDecoder(line, all[i]).isOk()` false for both payloads). The
 * accepted line is synthetic, not a secret: `SYNTHETIC_LINE` spells, in base
 * 26, the key that xors the jar's SECOND payload (java:52) into
 * `Hello|from|the|tests!`. Jar probe (`scripts/oracle-render.sh`,
 * 1.2026.8beta1): `JAR_SYNTHETIC_EGG`.
 */
import { describe, expect, it } from 'vitest';

import { parseRefusalOf } from '../../../src/core/parse-refusal.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import { eggPlugin, PSystemEggFactory } from '../../../src/diagrams/eggs/PSystemEggFactory.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';
import { renderWith, sourceOf } from './plugin-harness.js';

/** Base-26 (`a` = 0) of `0a7b371b...1a` = payload xor `Hello|from|the|tests!`. */
const SYNTHETIC_LINE = 'lxvbbhmpdcicntnfcksjrrvqyoxsiiexvws';

/** The jar's render of `SYNTHETIC_LINE`. */
const JAR_SYNTHETIC_EGG =
  '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" style="width:39px;height:59px;background:#FFFFFF;" width="39px" height="59px" viewBox="0 0 39 59" zoomAndPan="magnify" preserveAspectRatio="none" contentStyleType="text/css"><?plantuml $version$?><defs/><g font-family="sans-serif" lengthAdjust="spacing"><text x="5" y="14.333" fill="#000" font-size="12" textLength="27.45">Hello</text><text x="5" y="26.333" fill="#000" font-size="12" textLength="23.925">from</text><text x="5" y="38.333" fill="#000" font-size="12" textLength="16.65">the</text><text x="5" y="50.333" fill="#000" font-size="12" textLength="28.575">tests!</text><?plantuml-src owaeIqhAo2r8ISvCpYl9IqlEBiugAYehhColACxCJAqeAoy60000?></g></svg>';

describe('PSystemEggFactory.executeLine (java:55-68)', () => {
  it.each(['charlie', 'apple //e', 'jean canouet', 'license', 'hello', 'a', 'Write your own dedication!'])(
    'decodes no secret from %j',
    (line) => {
      expect(
        new PSystemEggFactory().executeLine(sourceOf('@startuml\nx\n@enduml'), line, new PreprocessingArtifact()),
      ).toBe(undefined);
    },
  );
});

describe('eggPlugin', () => {
  it('renders the synthetic egg as the jar does', () => {
    const svg = renderWith(eggPlugin, `@startuml\n${SYNTHETIC_LINE}\n@enduml`);
    expect(compareSvg(svg, JAR_SYNTHETIC_EGG, 'deterministic').diffs).toEqual([]);
  });

  it('renders the synthetic egg identically three times', () => {
    const runs = [0, 1, 2].map(() => renderWith(eggPlugin, `@startuml\n${SYNTHETIC_LINE}\n@enduml`));
    expect(new Set(runs).size).toBe(1);
  });

  it('is a @startuml (sequence) candidate', () => {
    expect(eggPlugin.type).toBe('sequence');
  });

  it('refuses a line it does not decode with "Syntax Error?"', () => {
    expect(parseRefusalOf(eggPlugin.parse(sourceOf('@startuml\nhello\n@enduml')))?.message).toBe('Syntax Error?');
  });

  it('refuses a 4-line source at the single-line gate', () => {
    expect(parseRefusalOf(eggPlugin.parse(sourceOf('@startuml\nhello\nworld\n@enduml')))?.commandScore).toBe(
      Number.NEGATIVE_INFINITY,
    );
  });
});

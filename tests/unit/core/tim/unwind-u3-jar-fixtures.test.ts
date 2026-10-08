/**
 * unwind-U3: preprocessor (TIM) behaviour pinned against jar renders.
 *
 * Each `tests/fixtures/unwind-U3/<name>.puml` sits beside the jar's own
 * `<name>.svg`, rendered by `scripts/oracle-render.sh` (deterministic text).
 * The port renders the same source through `renderSync` with the harness's
 * measurer and include store (`scripts/svg-parity-survey.ts#renderOneMode`),
 * and is held to the jar three ways, strongest first:
 *
 *  - `conformant`: `compareSvg` passes outright.
 *  - `texts`: every drawn `<text>` matches the jar's, in order -- used where
 *    the engine itself is not yet conformant (sequence: diff-baseline
 *    ratchet), so a full compare would measure the engine, not the TIM.
 *  - `errorMessage`: both render an error page whose LAST text line (the
 *    message `PSystemError` draws under the listing) is the same string.
 *  - `syntaxErrorLine`: both render a "Syntax Error?" page blaming the same
 *    source line. The assumed diagram type and the listing are NOT compared:
 *    both come from the error-page / routing layer, not the TIM (renderSync
 *    lists the raw source where the jar lists the preprocessed lines).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { renderSync } from '../../../../src/index.js';
import { WidthTableMeasurer } from '../../../../src/core/measurer.js';
import { fixtureIncludeStore } from '../../../helpers/fixture-include-store.js';
import { compareSvg } from '../../../oracle/svg-conformance/compare.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '../../../fixtures/unwind-U3');
const RE_TEXT = /<text[^>]*>([^<]*)<\/text>/g;

type Expectation = 'conformant' | 'texts' | 'errorMessage' | 'syntaxErrorLine';
const RE_FROM_LINE = /\(line (\d+)\)/;

function load(name: string): { ours: string; jar: string } {
  const source = readFileSync(join(FIXTURES, `${name}.puml`), 'utf-8');
  const ours = renderSync(source, { measurer: new WidthTableMeasurer(), includeStore: fixtureIncludeStore() });
  return { ours, jar: readFileSync(join(FIXTURES, `${name}.svg`), 'utf-8') };
}

function textsOf(svg: string): string[] {
  return [...svg.matchAll(RE_TEXT)].map((m) => m[1]!);
}

function expectLikeJar(name: string, how: Expectation): void {
  const { ours, jar } = load(name);
  if (how === 'conformant') expect(compareSvg(ours, jar, 'deterministic').diffs).toEqual([]);
  else if (how === 'texts') expect(textsOf(ours)).toEqual(textsOf(jar));
  else if (how === 'errorMessage') expect(textsOf(ours).at(-1)).toBe(textsOf(jar).at(-1));
  else expect(syntaxErrorLineOf(ours)).toEqual(syntaxErrorLineOf(jar));
}

function syntaxErrorLineOf(svg: string): { line: string | undefined; syntaxError: boolean } {
  const texts = textsOf(svg);
  const from = texts.find((t) => t.startsWith('[From '));
  return { line: from?.match(RE_FROM_LINE)?.[1], syntaxError: texts.at(-1)?.startsWith('Syntax Error?') ?? false };
}

describe('unwind-U3 divergence 1: `!undef` only (TLineType.java:87)', () => {
  // `simpleKeyword("!undef")` is `^\s*!undef\b` (TLineType.java:53-56): the
  // `\b` fails between `f` and `i`, so `!undefine FOO` is a PLAIN line. Its
  // `FOO` is substituted (`!define FOO Alice`) and the diagram parser refuses
  // `!undefine Alice` -- the jar draws a syntax-error page at line 3.
  it('`!undefine` is not a directive: the jar renders a syntax error', () => {
    expectLikeJar('undefine-alias-error', 'syntaxErrorLine');
  });

  // `EaterUndef#analyze` only calls `memory.removeVariable(varname)`
  // (EaterUndef.java:48-54); a legacy `!define F(x)` lives in `FunctionsSet`,
  // which has no removal path, so `!undef WRAP` leaves the macro callable.
  it('`!undef` of a macro name keeps the macro (jar expands `WRAP(One)`)', () => {
    expectLikeJar('undef-keeps-macro', 'conformant');
  });

  it('`!undef` of a variable removes it', () => {
    expectLikeJar('undef-variable', 'conformant');
  });
});

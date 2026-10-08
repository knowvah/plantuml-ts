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

describe('unwind-U3 divergence 2: %newline()/%breakline() BLOCK_E1 sentinels', () => {
  // `JawsFlags.USE_BLOCK_E1_IN_NEWLINE_FUNCTION = true` (JawsFlags.java:40):
  // `Newline`/`NewlineShort` return `Jaws.BLOCK_E1_NEWLINE`, decoded into a
  // display line break by `Display#getWithNewlines` (Display.java:316-341).
  it.each([
    ['newline-activity-action', 'conformant'],
    ['newline-note', 'conformant'],
    ['newline-sequence-message', 'texts'],
  ] as const)('%s decodes the sentinel as the jar does', (name, how) => {
    expectLikeJar(name, how);
  });

  // `%breakline()` returns `BLOCK_E1_BREAKLINE`, which `Jaws.mutateExpands1`
  // splits into separate source lines (`BlockUml.java:153`, `Jaws.java:65-120`):
  // the dangling `c` is a syntax error at line 2 in the jar.
  it('%breakline() splits the source line before the diagram parser', () => {
    expectLikeJar('breakline-sequence-message', 'syntaxErrorLine');
  });

  // KNOWN RESIDUAL (outside the TIM): these display consumers split label
  // text with their own scanner instead of `Display#getWithNewlines`
  // (`MethodsOrFieldsArea.java:255,264` for members), so the sentinel is drawn
  // as an invisible character (or UText's `↵`) instead of a line break.
  // `it.fails` turns red the day a consumer is fixed -- move it up then.
  it.fails.each(['newline-class-member-only', 'newline-usecase', 'newline-state'])(
    '%s: consumer does not decode BLOCK_E1_NEWLINE yet',
    (name) => {
      expectLikeJar(name, 'texts');
    },
  );

  // TIM function names are case-sensitive: `FunctionsSet` finds call sites
  // through `TrieImpl#getLonguestMatchStartingIn`, an exact-`char` walk
  // (TrieImpl.java:91-111, `brothers.get(s.charAt(pos))`), so `%N()` /
  // `%NEWLINE()` are plain text and the jar draws them literally.
  it('`%N()` / `%NEWLINE()` are literal text, never a line break', () => {
    expectLikeJar('newline-uppercase-literal', 'texts');
  });
});

describe('unwind-U3 divergence 3: `!include <bundle/thing>` misses', () => {
  // An unknown bundle: `PathSystem#getInputFile` calls `Stdlib.retrieve`
  // before any reader exists (PathSystem.java:196-201, TContext.java:815); the
  // missing `info.spm` escapes as an UncheckedIOException (Stdlib.java:166-176)
  // and `executeOneLineSafe` raises `EaterException("Fatal parsing error", s)`
  // (TContext.java:374-384). No `/` fails the same way, one line earlier
  // (`substring(0, -1)`, PathSystem.java:198).
  it('an unknown bundle is the jar\'s "Fatal parsing error" page', () => {
    expectLikeJar('include-stdlib-unknown', 'errorMessage');
  });

  it('a bracketed path with no slash is the same "Fatal parsing error" page', () => {
    expectLikeJar('include-stdlib-no-slash', 'errorMessage');
  });

  // KNOWN RESIDUAL: a folder the jar ships, file missing. The jar says
  // `cannot include <what>` (TContext.java:885); the port cannot tell "bundle
  // supplied, file missing" from "bundle not supplied" through the public
  // `StdlibStore` (getPumlResource only), so it keeps `StdlibNotBundledError`.
  it.fails('a missing file in a jar folder is "cannot include <what>"', () => {
    expectLikeJar('include-stdlib-missing-file', 'errorMessage');
  });

  it('a bundled stdlib include renders the diagram', () => {
    expectLikeJar('include-stdlib-bundled', 'texts');
  });
});

// @vitest-environment node
/**
 * Fitness test for the D5/D8 `no-restricted-syntax` gate
 * (`eslint.config.ts#ATTRIBUTE_SINK_RULE_CONFIG`).
 *
 * `npm run lint` type-checks `src/**\/*.ts` against the project's
 * `tsconfig.json`, which is slow and -- for a synthetic in-memory fixture
 * with no real path -- throws rather than failing a rule (`parserOptions
 * .project` cannot resolve a file that was never on disk). This test does
 * not need any type-checked rule: it exercises exactly one untyped rule,
 * `no-restricted-syntax`, so it builds a minimal flat config that reuses
 * `ATTRIBUTE_SINK_RULE_CONFIG` -- the SAME object `eslint.config.ts` ships
 * in its `src/**\/*.ts` block -- rather than a re-derived copy that could
 * drift from it. `new Linter()` (ESLint v10's `Linter.verify`, flat-config
 * mode by default) runs against in-memory source strings; no disk I/O.
 *
 * The `@vitest-environment node` pragma above is load-bearing, not
 * cosmetic. `eslint.config.ts` computes `tsconfigRootDir` from
 * `fileURLToPath(new URL('.', import.meta.url))` at module-evaluation
 * time. Under this suite's default `jsdom` environment (vitest.config.ts),
 * a module's `import.meta.url` resolves against jsdom's fake
 * `http://localhost:3000/` document location, not a `file:` URL, so
 * `fileURLToPath` throws `ERR_INVALID_URL_SCHEME` on the mere act of
 * importing `eslint.config.ts` -- before any selector or rule runs. The
 * per-file `node` environment override gives the module a real `file:`
 * `import.meta.url`, which is all this test needs.
 */
import { describe, it, expect } from 'vitest';
import { Linter } from 'eslint';
import type { Linter as LinterTypes } from 'eslint';

import { ATTRIBUTE_SINK_RULE_CONFIG } from '../../eslint.config.js';

// `ATTRIBUTE_SINK_RULE_CONFIG` is typed as `typescript-eslint`'s
// `ConfigWithExtends` (what `eslint.config.ts` itself needs); `eslint`'s
// own `Linter.Config` is structurally compatible at runtime but not
// identical under `exactOptionalPropertyTypes` (a `languageOptions` shape
// mismatch neither file actually exercises here -- this block sets no
// `languageOptions`). The cast documents that gap rather than widening
// either file's real type.
const config = [
  {
    files: ['**/*.ts'],
    ...ATTRIBUTE_SINK_RULE_CONFIG,
  },
] as LinterTypes.Config[];

const linter = new Linter();

/** Only the messages this gate itself produced -- filters out ESLint's own
 *  "no matching configuration" advisory for a filename `ignores` excludes
 *  (severity 1, `ruleId: null`), which is not a rule violation. */
function sinkMessages(code: string, filename: string): LinterTypes.LintMessage[] {
  return linter.verify(code, config, filename).filter((m) => m.ruleId === 'no-restricted-syntax');
}

describe('attribute-sink-rule (D5/D8 fitness gate)', () => {
  it('(a) flags a raw attribute-value template sink -- one D5 error', () => {
    const messages = sinkMessages('const x = `<a href="${y}">`;', 'src/x.ts');
    expect(messages).toHaveLength(1);
    expect(messages[0]?.message).toContain('decisions.md D5');
  });

  it('(b) allows the attrs() seam -- zero errors', () => {
    const messages = sinkMessages("const x = `<a${attrs([['href', y]])}>`;", 'src/x.ts');
    expect(messages).toHaveLength(0);
  });

  it('(c) allows `="` mid-quasi when not immediately before an interpolation -- zero errors', () => {
    const messages = sinkMessages('const x = `<a b="c">${y}`;', 'src/x.ts');
    expect(messages).toHaveLength(0);
  });

  it('(g) flags an interpolation in the MIDDLE of an attribute value -- one D5 error', () => {
    // PR #59 review: `<div style="a;font-family:${name}">` opened the value
    // long before the interpolation, so an `="$`-anchored selector missed it.
    const messages = sinkMessages('const x = `<div style="a;b:${y}">`;', 'src/x.ts');
    expect(messages).toHaveLength(1);
    expect(messages[0]?.message).toContain('decisions.md D5');
  });

  it('(d) flags a raw XML-comment template sink -- one D8 error', () => {
    const messages = sinkMessages('const x = `<!--class ${name}-->`;', 'src/x.ts');
    expect(messages).toHaveLength(1);
    expect(messages[0]?.message).toContain('decisions.md D8');
  });

  it('(e) still flags the comment sink even when the interpolation itself calls escapeComment() -- one D8 error', () => {
    // The chunk BEFORE the interpolation (`<!--class `) is identical to (d);
    // the selector cannot see what the interpolated expression does. This is
    // why the comment sinks must build the string around escapeComment(),
    // not interpolate its result into an unclosed `<!--` -- documented so a
    // future reader does not "fix" this by wrapping the call site instead.
    const messages = sinkMessages('const x = `<!--class ${escapeComment(name)}-->`;', 'src/x.ts');
    expect(messages).toHaveLength(1);
    expect(messages[0]?.message).toContain('decisions.md D8');
  });

  it('(f) does not apply to the DOT/HTML-like-label file-pattern exclusion -- zero errors', () => {
    const messages = sinkMessages('const x = `<a href="${y}">`;', 'src/core/svek-dot-emit-x.ts');
    expect(messages).toHaveLength(0);
  });
});

/**
 * `!theme` execution (cdd4-T7a, D3): `EaterTheme#getTheme` + `ThemeUtils#loadTheme`
 * + `TContext#executeTheme`, driven through the interpreter.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/tim/TContext.java#executeTheme
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/tim/EaterTheme.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/theme/ThemeUtils.java
 */
import { describe, expect, it } from 'vitest';
import { preprocess, preprocessOrError } from '../../../../src/core/preprocessor.js';
import { EaterException } from '../../../../src/core/tim/EaterException.js';
import { getFilename, loadTheme, readThemeWithYamlHeader } from '../../../../src/core/tim/EaterTheme.js';
import { EMPTY_INCLUDE_STORE, MapIncludeStore, type IncludeStore } from '../../../../src/core/tim/IncludeStore.js';
import { readLines } from '../../../../src/core/tim/ReadLineReader.js';
import { withStdlib } from '../../../../src/core/tim/StdlibStore.js';
import { StringLocated } from '../../../../src/core/tim/StringLocated.js';
import { TContext } from '../../../../src/core/tim/TContext.js';
import { TMemoryGlobal } from '../../../../src/core/tim/TMemoryGlobal.js';

const AWS_PRIMARY = '#EC7211'; // puml-theme-aws-orange.puml:52
const C4_THEME_KEY = 'C4/themes/puml-theme-C4_united.puml';
const MINI_THEME = ['---', 'name: mini', 'author: me', '---', '!$MINI = "yes"', 'skinparam backgroundColor red'].join(
  '\n',
);

function run(source: readonly string[], store?: IncludeStore): { context: TContext; memory: TMemoryGlobal } {
  const context = new TContext({ includeStore: store });
  const memory = new TMemoryGlobal();
  context.executeLines(
    memory,
    source.map((text) => new StringLocated(text, undefined)),
    undefined,
    false,
  );
  return { context, memory };
}

function variable(memory: TMemoryGlobal, name: string): string | undefined {
  return memory.getVariable(name)?.toString();
}

function output(context: TContext): string[] {
  return context.getResultList().map((l) => l.getString());
}

function messageOf(fn: () => unknown): string {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(EaterException);
    return (e as Error).message;
  }
  throw new Error('expected an EaterException');
}

describe('!theme executes the bundled theme source', () => {
  it('puts the theme variables in memory', () => {
    const { context, memory } = run(['!theme aws-orange', 'class A']);
    expect(variable(memory, '$PRIMARY')).toBe(AWS_PRIMARY);
    expect(variable(memory, '$THEME')).toBe('aws-orange');
    expect(context.getThemeName()).toBe('aws-orange');
  });

  it("makes the theme's procedures callable by the document", () => {
    const { lines } = preprocess('@startuml\n!theme aws-orange\nA -> B : $success("ok")\n@enduml');
    // The theme's one non-styling line (`puml-theme-aws-orange.puml:73`) is
    // diagram content upstream too: `CommandAssumeTransparent` takes it.
    expect(lines.filter((l) => l !== '')).toEqual([
      '@startuml',
      '    !assume transparent light',
      'A -> B :   <font color=#1D8102><b>ok',
      '@enduml',
    ]);
  });

  it("emits the theme's styling at the directive: a later document skinparam wins (TContext.java:737-743)", () => {
    const r = preprocess('@startuml\n!theme aws-orange\nskinparam ArrowColor red\nclass A\n@enduml');
    expect(r.skinparam.get('arrowcolor')).toBe('red');
    expect(r.skinparam.get('defaultfontsize')).toBe('12'); // puml-theme-aws-orange.puml:196
    expect(r.styles).toHaveLength(1); // puml-theme-aws-orange.puml:555-665
    expect(r.theme).toBe('aws-orange');
  });

  it('lets the theme override an EARLIER document skinparam', () => {
    const r = preprocess('@startuml\nskinparam ArrowColor red\n!theme aws-orange\n@enduml');
    // :201 `ArrowColor $DARK`, then :282-284 `skinparam arrow { Color $PRIMARY }`
    expect(r.skinparam.get('arrowcolor')).toBe(AWS_PRIMARY);
  });

  it('runs a procedure call inside a skinparam block (the collector reads the substituted stream)', () => {
    // `skinparam class { $primary_scheme() }` -- puml-theme-aws-orange.puml:158-166
    const r = preprocess('@startuml\n!theme aws-orange\n@enduml');
    expect(r.skinparam.get('classbackgroundcolor')).toBe('#F18E3E-#EC7211');
    expect(r.skinparam.get('classbordercolor')).toBe('#EC7211');
  });

  it("orders the theme's `<style>` before a later document skinparam", () => {
    const r = preprocess('@startuml\n!theme plain\nskinparam backgroundColor red\n@enduml');
    const order = r.declarationOrder!;
    expect(order.skinparam.get('backgroundcolor')).toBeGreaterThan(order.styles[0]!);
  });

  it('%get_current_theme() reads the executed theme metadata (GetCurrentTheme.java:65)', () => {
    const { lines } = preprocess('@startuml\n!theme amiga\n!$m = %get_current_theme()\ntitle $m.name\n@enduml');
    expect(lines).toContain('title amiga');
  });

  it('keeps the YAML header as theme metadata', () => {
    const { context } = run(['!theme aws-orange']);
    expect(context.getThemeMetadata()).toMatchObject({
      name: 'aws-orange',
      display_name: 'AWS orange',
      license: 'MIT',
    });
  });

  it('lets the document override a theme variable after the directive', () => {
    const { memory } = run(['!theme aws-orange', '!$PRIMARY = "#000000"']);
    expect(variable(memory, '$PRIMARY')).toBe('#000000');
  });

  it('keeps the theme text a document variable set first reads (%variable_exists)', () => {
    const { memory } = run(['!$PUML_MODE = "dark"', '!theme aws-orange']);
    expect(variable(memory, '$PUML_MODE')).toBe('dark');
  });
});

describe('!theme resolution (ThemeUtils#loadTheme)', () => {
  it('resolves `from <lib>` through the store stdlib seam, nested !theme included', () => {
    const c4 = '!theme united\n!$THEME = "C4_united"\n';
    const store = withStdlib(EMPTY_INCLUDE_STORE, { getPumlResource: (f) => (f === C4_THEME_KEY ? c4 : undefined) });
    const { context, memory } = run(['!theme C4_united from <C4/themes>'], store);
    expect(variable(memory, '$THEME')).toBe('C4_united');
    expect(context.getThemeName()).toBe('C4_united');
    expect(context.getThemeMetadata()).toEqual({});
  });

  it('resolves `from <lib>` by exact store key first', () => {
    const store = new MapIncludeStore({ [`<${C4_THEME_KEY}>`]: '!$FROM_KEY = "1"' });
    expect(variable(run(['!theme C4_united from <C4/themes>'], store).memory, '$FROM_KEY')).toBe('1');
  });

  it('reads a non-bundled theme as a local file, then a `from` directory or URL', () => {
    const store = new MapIncludeStore({
      [getFilename('mini')]: MINI_THEME,
      'dir/puml-theme-mini.puml': '!$WHERE = "dir"',
      'https://x.test/t/puml-theme-mini.puml': '!$WHERE = "url"',
    });
    const local = run(['!theme mini'], store);
    expect(variable(local.memory, '$MINI')).toBe('yes');
    expect(local.context.getThemeMetadata()).toEqual({ name: 'mini', author: 'me' });
    expect(output(local.context)).toEqual(['skinparam backgroundColor red']);
    expect(variable(run(['!theme mini from dir/'], store).memory, '$WHERE')).toBe('dir');
    expect(variable(run(['!theme mini from https://x.test/t'], store).memory, '$WHERE')).toBe('url');
  });

  it('substitutes variables in the name and the from clause', () => {
    const store = new MapIncludeStore({ 'lib/puml-theme-mini.puml': '!$OK = "1"' });
    const { memory } = run(['!$N = "mini"', '!$D = "lib"', '!theme $N from $D'], store);
    expect(variable(memory, '$OK')).toBe('1');
  });
});

describe('unknown theme: the jar error (EaterTheme.java:82-85)', () => {
  it('names the theme', () => {
    expect(messageOf(() => run(['!theme foo']))).toBe('Cannot load theme foo');
  });

  it('names the from location too', () => {
    expect(messageOf(() => run(['!theme foo from <C4/themes>']))).toBe('Cannot load theme foo in <C4/themes>');
    expect(messageOf(() => run(['!theme foo from somewhere']))).toBe('Cannot load theme foo in somewhere');
  });

  it('does not resolve an Object prototype member as a theme', () => {
    expect(messageOf(() => run(['!theme constructor']))).toBe('Cannot load theme constructor');
  });

  it('surfaces as the error diagram trace, at the directive line', () => {
    const outcome = preprocessOrError('@startuml\n!theme foo\na -> b\n@enduml');
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.failure.trace.map((l) => l.getString())).toEqual(['@startuml', '!theme foo']);
    expect(outcome.failure.trace[1]?.getPreprocessorError()).toBe('Cannot load theme foo');
  });
});

describe('readThemeWithYamlHeader (ReadLineWithYamlHeader#readLine)', () => {
  it('passes a header-less source through untouched', () => {
    const theme = readThemeWithYamlHeader(readLines('a\nb', 'x'));
    expect(theme.lines.map((l) => l.getString())).toEqual(['a', 'b']);
    expect(theme.metadata).toEqual({});
  });

  it('records only keys whose colon is past index 0, trimmed, and drops both separators', () => {
    const theme = readThemeWithYamlHeader(readLines('---\n k : v \n:skip\nnocolon\n---\nbody', 'x'));
    expect(theme.lines.map((l) => l.getString())).toEqual(['body']);
    expect(theme.metadata).toEqual({ k: 'v' });
  });

  it('treats an unterminated header as all header', () => {
    expect(readThemeWithYamlHeader(readLines('---\na: 1', 'x')).lines).toEqual([]);
  });
});

describe('loadTheme descriptions (the error-diagram "[From ...]" text)', () => {
  it('describes a bundled theme by its jar resource path', () => {
    const theme = loadTheme(EMPTY_INCLUDE_STORE, 'plain', undefined);
    expect(theme?.lines[0]?.getLocation()?.getDescription()).toBe('</themes/puml-theme-plain.puml>');
  });

  it('returns undefined for an unresolvable stdlib or file theme', () => {
    expect(loadTheme(EMPTY_INCLUDE_STORE, 'x', '<lib>')).toBeUndefined();
    expect(loadTheme(EMPTY_INCLUDE_STORE, 'x', 'dir')).toBeUndefined();
  });
});

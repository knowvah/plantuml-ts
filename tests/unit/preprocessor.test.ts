import { describe, it, expect } from 'vitest';
import { preprocess } from '../../src/core/preprocessor.js';
import { BLOCK_E1_NEWLINE } from '../../src/core/tim/builtin/jaws-constants.js';

/**
 * Helper: build a source string from an array of lines, then run preprocess.
 * Returns the resulting lines array.
 */
function run(lines: string[], defines?: ReadonlyMap<string, string>): readonly string[] {
  return preprocess(lines.join('\n'), defines).lines;
}

describe('preprocessor', () => {
  it('strips single-line comments', () => {
    const result = run(["' this is a comment", 'Alice -> Bob: hi']);
    expect(result).toEqual(['Alice -> Bob: hi']);
  });

  it('keeps a bare mid-line apostrophe as ordinary text (not a comment)', () => {
    // Upstream only recognizes full-line comments (preproc2/
    // ReadFilterQuoteComment.java:66) and `/' ... '/` block comments
    // (text/StringLocated.java:209-229) — a mid-line `'` is not comment
    // syntax at all (live-oracle-verified: the full label, including
    // " ' ignored", renders unchanged).
    const result = run(["Alice -> Bob: hi ' ignored"]);
    expect(result).toEqual(["Alice -> Bob: hi ' ignored"]);
  });

  it('replaces !define token in subsequent lines', () => {
    const result = run(['!define TIMEOUT 30', 'delay TIMEOUT']);
    expect(result).toEqual(['delay 30']);
  });

  it('!define with no value substitutes empty string', () => {
    const result = run(['!define DEBUG', 'note DEBUG over Alice']);
    expect(result).toEqual(['note  over Alice']);
  });

  it('!undef removes a previous definition', () => {
    const result = run(['!define FOO bar', '!undef FOO', 'text FOO']);
    expect(result).toEqual(['text FOO']);
  });

  it('!undefine is NOT a directive: a plain line, substituted like any other', () => {
    // Upstream's PATTERN_UNDEF is `simpleKeyword("!undef")` (TLineType.java:87),
    // `^\s*!undef\b` (java:53-56): the `\b` fails between `f` and `i`, so the
    // line is PLAIN, FOO is still defined, and the diagram parser sees
    // `!undefine bar` (the jar renders a syntax error --
    // tests/fixtures/unwind-U3/undefine-alias-error.svg).
    const result = run(['!define FOO bar', '!undefine FOO', 'text FOO']);
    expect(result).toEqual(['!undefine bar', 'text bar']);
  });

  it('!ifdef includes block when token is defined', () => {
    const result = run(['!define DEBUG', '!ifdef DEBUG', 'note debug', '!endif', 'Alice -> Bob']);
    expect(result).toEqual(['note debug', 'Alice -> Bob']);
  });

  it('!ifdef skips block when token is not defined', () => {
    const result = run(['!ifdef DEBUG', 'note debug', '!endif', 'Alice -> Bob']);
    expect(result).toEqual(['Alice -> Bob']);
  });

  it('!ifndef includes block when token is not defined', () => {
    const result = run(['!ifndef PROD', 'note dev only', '!endif']);
    expect(result).toEqual(['note dev only']);
  });

  it('!ifndef skips block when token is defined', () => {
    const result = run(['!define PROD', '!ifndef PROD', 'note dev only', '!endif']);
    expect(result).toEqual([]);
  });

  it('nested !ifdef works correctly', () => {
    const result = run(['!define A', '!define B', '!ifdef A', '!ifdef B', 'both', '!endif', '!endif']);
    expect(result).toEqual(['both']);
  });

  it('!theme directive is stripped: its styling lines are collected, blank lines kept', () => {
    // An upstream theme name: `dark` is not one, so the jar (and, since
    // cdd4-T7a, this port) stops at `Cannot load theme dark`.
    const { lines, theme } = preprocess('!theme plain\nAlice -> Bob');
    expect(lines.filter((l) => l !== '')).toEqual(['Alice -> Bob']);
    expect(theme).toBe('plain');
  });

  it('returns null theme when no !theme directive is present', () => {
    const { theme } = preprocess('Alice -> Bob: hi');
    expect(theme).toBeNull();
  });

  it('accepts pre-seeded defines from the defines parameter', () => {
    const defines = new Map([['VERSION', '42']]);
    const result = run(['note VERSION'], defines);
    expect(result).toEqual(['note 42']);
  });

  it('strips block comments spanning multiple lines', () => {
    const result = run(["/' this is", 'a block comment', "'/", 'Alice -> Bob']);
    expect(result).toEqual(['Alice -> Bob']);
  });

  it('returns empty lines array for empty source', () => {
    const { lines } = preprocess('');
    expect(lines).toEqual([]);
  });

  it('preserves lines that are not directives or comments', () => {
    const result = run(['participant Alice', 'Alice -> Bob: hello']);
    expect(result).toEqual(['participant Alice', 'Alice -> Bob: hello']);
  });

  // ── styles: readonly string[] ────────────────────────────────────────────

  it('returns empty styles array when no <style> block is present', () => {
    const { styles } = preprocess('Alice -> Bob');
    expect(styles).toEqual([]);
  });

  it('extracts a single <style> block and excludes it from lines', () => {
    const { lines, styles } = preprocess('<style>\nbackground: red\n</style>\nAlice -> Bob');
    expect(lines).toEqual(['Alice -> Bob']);
    expect(styles).toEqual(['background: red']);
  });

  it('collects multiple <style> blocks as separate entries', () => {
    const { styles } = preprocess('<style>\ncolor: blue\n</style>\nnote\n<style>\nfont: bold\n</style>');
    expect(styles).toHaveLength(2);
    expect(styles[0]).toBe('color: blue');
    expect(styles[1]).toBe('font: bold');
  });

  it('style block content IS macro/$var-substituted (jar-verified, not verbatim)', () => {
    // Upstream substitutes !define/$var tokens inside <style> blocks
    // (CommandStyleMultilinesCSS dispatches over the post-substitution stream,
    // same as skinparam) -- see preprocessor.ts#collectStyleLine.
    const { styles } = preprocess('!define BG red\n<style>\nbackground: BG\n</style>');
    expect(styles).toEqual(['background: red']);
    const affect = preprocess('!$c = "#1a66c2"\n<style>\nBackgroundColor $c\n</style>');
    expect(affect.styles).toEqual(['BackgroundColor #1a66c2']);
  });

  it('style block with multi-line content joins lines with newline', () => {
    const { styles } = preprocess('<style>\nline one\nline two\n</style>');
    expect(styles).toEqual(['line one\nline two']);
  });

  it('<style> tag matching is case-insensitive', () => {
    const { lines, styles } = preprocess('<STYLE>\nbold\n</STYLE>\nAlice -> Bob');
    expect(lines).toEqual(['Alice -> Bob']);
    expect(styles).toEqual(['bold']);
  });

  it('style block inside inactive !ifdef is discarded (not collected)', () => {
    const { styles } = preprocess('!ifdef NOPE\n<style>\ncolor: red\n</style>\n!endif');
    expect(styles).toEqual([]);
  });

  it('empty source returns empty styles', () => {
    const { styles } = preprocess('');
    expect(styles).toEqual([]);
  });

  // ── stylePositions: readonly (number | undefined)[] (G2 N39) ──────────────

  it("records the 0-indexed source line of a single <style> block's opening tag", () => {
    const { stylePositions } = preprocess('Alice -> Bob\n<style>\nbg: red\n</style>');
    expect(stylePositions).toEqual([1]);
  });

  it('records one position per block, in source order, for multiple blocks', () => {
    const { stylePositions } = preprocess('<style>\ncolor: blue\n</style>\nnote\nnote\n<style>\nfont: bold\n</style>');
    expect(stylePositions).toEqual([0, 5]);
  });

  it('empty source returns empty stylePositions', () => {
    const { stylePositions } = preprocess('');
    expect(stylePositions).toEqual([]);
  });

  // ── !else clause ─────────────────────────────────────────────────────────

  it('!ifdef with !else: includes if-branch when token is defined', () => {
    const result = run(['!define X', '!ifdef X', 'yes', '!else', 'no', '!endif']);
    expect(result).toEqual(['yes']);
  });

  it('!ifdef with !else: includes else-branch when token is not defined', () => {
    const result = run(['!ifdef X', 'yes', '!else', 'no', '!endif']);
    expect(result).toEqual(['no']);
  });

  it('!ifndef with !else: includes if-branch when token is not defined', () => {
    const result = run(['!ifndef X', 'yes', '!else', 'no', '!endif']);
    expect(result).toEqual(['yes']);
  });

  it('!ifndef with !else: includes else-branch when token is defined', () => {
    const result = run(['!define X', '!ifndef X', 'yes', '!else', 'no', '!endif']);
    expect(result).toEqual(['no']);
  });

  // SI6 (was: "!else with no enclosing conditional is a no-op"). That no-op was
  // a documented plantuml-ts divergence, held open only because a faithful
  // throw had nowhere to land -- there was no error-diagram path, so it would
  // have escaped `renderSync`. SI6 ported `net/sourceforge/plantuml/error/`, so
  // the orphan now errors exactly as upstream does and the DOCUMENT still
  // renders: `renderSync` draws the error diagram (see
  // tests/integration/error-diagram.test.ts). Live-oracle verified.
  it('!else with no enclosing conditional is an error, as upstream has it', () => {
    expect(() => run(['Alice -> Bob', '!else', 'Carol -> Dave'])).toThrow('No if related to this else');
  });

  it('!endif with no enclosing conditional is an error', () => {
    expect(() => run(['Alice -> Bob', '!endif'])).toThrow('No if related to this endif');
  });

  // NOT the same case: the jar TOLERATES an !ifdef left unclosed at EOF and
  // renders the document (forum.plantuml.net/6808; pdiff buveco-86-tibo673).
  it('an !ifdef left unclosed at EOF is tolerated, and its body still renders', () => {
    const result = run(['!define FOO', '!ifdef FOO', 'Alice -> Bob']);
    expect(result).toEqual(['Alice -> Bob']);
  });

  it('an unclosed FALSE !ifdef suppresses the rest of the document, without erroring', () => {
    const result = run(['!ifdef NEVER', 'Alice -> Bob']);
    expect(result).toEqual([]);
  });

  // ── parametric macros ────────────────────────────────────────────────────

  it('single-param macro expands ##param## in body', () => {
    const result = run(['!define BOLD(x) <b>##x##</b>', 'BOLD(hello)']);
    expect(result).toEqual(['<b>hello</b>']);
  });

  it('two-param macro substitutes both params', () => {
    const result = run(['!define PAIR(a,b) ##a## and ##b##', 'PAIR(cats,dogs)']);
    expect(result).toEqual(['cats and dogs']);
  });

  it('adjacent ##param## tokens produce concatenated output', () => {
    const result = run(['!define CONCAT(a,b) ##a####b##', 'CONCAT(foo,bar)']);
    expect(result).toEqual(['foobar']);
  });

  // SI6 (was: "wrong arg count leaves call-site unchanged"). The passthrough was
  // a plantuml-ts divergence held open only because a faithful throw had nowhere
  // to land. The jar errors -- live-oracle verified, `!define BOLD(x)` called as
  // `BOLD(x,y)` renders the error diagram with `Function not found BOLD` -- and
  // now so does this port. The DOCUMENT still renders: `renderSync` draws that
  // error diagram (tests/integration/error-diagram.test.ts).
  it('a known macro called with an arity no overload covers is an error', () => {
    expect(() => run(['!define BOLD(x) <b>##x##</b>', 'BOLD(x,y)'])).toThrow('Function not found BOLD');
  });

  it('parametric macro with space-padded args trims correctly', () => {
    const result = run(['!define PAIR(a,b) ##a## and ##b##', 'PAIR( cats , dogs )']);
    expect(result).toEqual(['cats and dogs']);
  });

  it('multiple call-sites on one line are all expanded', () => {
    const result = run(['!define BOLD(x) <b>##x##</b>', 'BOLD(one) and BOLD(two)']);
    expect(result).toEqual(['<b>one</b> and <b>two</b>']);
  });

  it('!undef does not remove a parametric macro', () => {
    // `EaterUndef#analyze` only calls `memory.removeVariable(varname)`
    // (EaterUndef.java:48-54); `FunctionsSet` has no removal path, so the
    // macro survives (tests/fixtures/unwind-U3/undef-keeps-macro.svg).
    const result = run(['!define BOLD(x) <b>##x##</b>', '!undef BOLD', 'BOLD(hello)']);
    expect(result).toEqual(['<b>hello</b>']);
  });

  it('simple define still works after a parametric define is added (regression)', () => {
    const result = run(['!define FOO bar', '!define WRAP(x) [##x##]', 'FOO', 'WRAP(baz)']);
    expect(result).toEqual(['bar', '[baz]']);
  });

  // ── skinparam: ReadonlyMap<string, string> ───────────────────────────────

  it('single-line skinparam is collected with lowercase key', () => {
    const { skinparam, lines } = preprocess('skinparam backgroundColor #FF0000\nAlice -> Bob');
    expect(skinparam.get('backgroundcolor')).toBe('#FF0000');
    expect(lines).not.toContain('skinparam backgroundColor #FF0000');
    expect(lines).toContain('Alice -> Bob');
  });

  it('matches the `skinparam` keyword case-INSENSITIVELY, in all three forms (cdd-T28)', () => {
    // `Pattern2.compileInternal` compiles every upstream command regex with
    // `Pattern.CASE_INSENSITIVE` (`regex/Pattern2.java:114`), covering
    // `CommandSkinParam.java:58`'s `(skinparam|skinparamlocked)` leaf and
    // `CommandSkinParamMultilines.java:49`'s block opener. `repuga-78-
    // xora226` writes `skinParam CaptionFontSize 10`; this port used to
    // drop the whole line silently.
    const line = preprocess('skinParam CaptionFontSize 10\nAlice -> Bob');
    expect(line.skinparam.get('captionfontsize')).toBe('10');
    expect(line.lines).not.toContain('skinParam CaptionFontSize 10');

    const bare = preprocess('SkinParam {\n  BackgroundColor #FF0000\n}\nAlice -> Bob');
    expect(bare.skinparam.get('backgroundcolor')).toBe('#FF0000');

    const scoped = preprocess('SKINPARAM component {\n  Style rectangle\n}\nAlice -> Bob');
    expect(scoped.skinparam.get('componentstyle')).toBe('rectangle');
  });

  it('single-line skinparam stores plain lowercase key (no arrow normalisation)', () => {
    const { skinparam } = preprocess('skinparam classArrowColor red');
    expect(skinparam.get('classarrowcolor')).toBe('red');
    // Full normalisation to 'arrowcolor' happens in resolveSkinparam (T2).
    expect(skinparam.has('arrowcolor')).toBe(false);
  });

  // G2 N51: `classBorderThickness<<stereo>>` has NO space before the
  // guillemet suffix -- the ORIGINAL `(\w+)\s+` key group failed to match
  // at all here (the char right after the key word is `<`, not
  // whitespace), silently dropping the whole line. Diagnosed `ragona-89-
  // fadi984`.
  it('single-line skinparam key accepts a directly-appended <<stereotype>> suffix', () => {
    const { skinparam } = preprocess('skinparam classBorderThickness<<stereo>> 5');
    expect(skinparam.get('classborderthickness<<stereo>>')).toBe('5');
  });

  it('block-form skinparam entry accepts a directly-appended <<stereotype>> suffix', () => {
    const { skinparam } = preprocess('skinparam {\n  classBorderThickness<<stereo>> 5\n}');
    expect(skinparam.get('classborderthickness<<stereo>>')).toBe('5');
  });

  it('block-form skinparam collects all entries', () => {
    const { skinparam, lines } = preprocess('skinparam {\n  backgroundColor red\n  borderColor blue\n}');
    expect(skinparam.get('backgroundcolor')).toBe('red');
    expect(skinparam.get('bordercolor')).toBe('blue');
    // Neither the block lines nor the braces should appear in output.
    expect(lines).toEqual([]);
  });

  it('block-form skinparam line is not emitted to outputLines', () => {
    const { lines } = preprocess('skinparam {\n  fontSize 14\n}\nAlice -> Bob');
    expect(lines).toEqual(['Alice -> Bob']);
  });

  it('duplicate skinparam key: last value wins', () => {
    const { skinparam } = preprocess('skinparam foo a\nskinparam foo b');
    expect(skinparam.get('foo')).toBe('b');
  });

  it('skinparam inside inactive !ifdef is skipped (not collected)', () => {
    const { skinparam } = preprocess('!ifdef X\nskinparam foo bar\n!endif');
    expect(skinparam.size).toBe(0);
  });

  it('skinparam block inside inactive !ifdef is skipped (not collected)', () => {
    const { skinparam } = preprocess('!ifdef X\nskinparam {\n  foo bar\n}\n!endif');
    expect(skinparam.size).toBe(0);
  });

  it('source with no skinparam directives returns empty map', () => {
    const { skinparam } = preprocess('Alice -> Bob: hi');
    expect(skinparam.size).toBe(0);
  });

  it('empty source returns empty skinparam map', () => {
    const { skinparam } = preprocess('');
    expect(skinparam.size).toBe(0);
  });

  it('skinparam value is trimmed of surrounding whitespace', () => {
    const { skinparam } = preprocess('skinparam backgroundColor   #AABBCC  ');
    expect(skinparam.get('backgroundcolor')).toBe('#AABBCC');
  });

  it('block-form skinparam duplicate key last wins', () => {
    const { skinparam } = preprocess('skinparam foo a\nskinparam {\n  foo b\n}');
    expect(skinparam.get('foo')).toBe('b');
  });

  it('mixed single-line and block skinparam both collected', () => {
    const { skinparam } = preprocess('skinparam backgroundColor red\nskinparam {\n  borderColor blue\n}');
    expect(skinparam.get('backgroundcolor')).toBe('red');
    expect(skinparam.get('bordercolor')).toBe('blue');
  });
});

describe('%n() and %newline() built-in expansion', () => {
  // Mission A2s R2b: `JawsFlags.USE_BLOCK_E1_IN_NEWLINE_FUNCTION` is `true`
  // (upstream jaws/JawsFlags.java:40) -- `%n()`/`%newline()` now return the
  // inline `Jaws.BLOCK_E1_NEWLINE` sentinel (''), which stays IN the
  // source line; the Display layer (`DisplayNewlines.ts#parseWithNewlines`,
  // the port of `Display#getWithNewlines`'s BLOCK_E1 branches) decodes it
  // as a line break. The old `false`-branch behavior (a real newline, split
  // into separate source lines) destroyed single-line commands whose TEXT
  // used `%n()`: rozudo-79-zavu288's `note top of foo : some%n()%n()notes`
  // truncated to "some", where the jar keeps ONE note with 3 display lines.
  it('%n() in a content line stays inline as the BLOCK_E1_NEWLINE sentinel', () => {
    const { lines } = preprocess('@startuml\n:hello %n() world;\n@enduml');
    expect(lines).toContain(':hello  world;');
  });

  it('%newline() behaves identically to %n()', () => {
    const { lines } = preprocess('@startuml\n:a %newline() b;\n@enduml');
    expect(lines).toContain(':a  b;');
  });

  it('multiple %n() calls produce multiple sentinels on one line', () => {
    const { lines } = preprocess('@startuml\n:x %n() y %n() z;\n@enduml');
    expect(lines).toContain(':x  y  z;');
  });

  it('line without %n() is emitted unchanged', () => {
    const { lines } = preprocess('@startuml\n:hello;\n@enduml');
    expect(lines).toContain(':hello;');
  });

  it('case-folded %N() is not a TIM function and stays literal text', () => {
    // TIM call sites are found by `TrieImpl#getLonguestMatchStartingIn`, an
    // exact-char walk (TrieImpl.java:91-111): `%N()` is plain text and the jar
    // draws it literally (tests/fixtures/unwind-U3/newline-uppercase-literal.svg).
    const { lines } = preprocess('@startuml\n:a %N() b;\n@enduml');
    expect(lines).toEqual(['@startuml', ':a %N() b;', '@enduml']);
  });
});

describe('linePositions — G2 N9 line-tracking plumbing', () => {
  it('is index-aligned with lines and 0-indexed, @startuml counts as line 0', () => {
    const result = preprocess('@startuml\nclass A\nclass B\n@enduml');
    expect(result.lines).toEqual(['@startuml', 'class A', 'class B', '@enduml']);
    expect(result.linePositions).toEqual([0, 1, 2, 3]);
  });

  it('keeps a blank line AND its position (A2s: blanks are content downstream)', () => {
    const result = preprocess('@startuml\nclass A\n\nclass B\n@enduml');
    // A2s flatten change: upstream keeps blank lines and the command layer
    // decides per-construct (a blank in a note/class body is CONTENT --
    // CommandFactoryNoteOnEntity.java:236-238); position tracking follows.
    expect(result.lines).toEqual(['@startuml', 'class A', '', 'class B', '@enduml']);
    expect(result.linePositions).toEqual([0, 1, 2, 3, 4]);
  });

  it('is empty for empty source', () => {
    expect(preprocess('').linePositions).toEqual([]);
  });
});

describe('skin <name> directive -- skin-file-loading mission Batch 1', () => {
  it('captures a single-line `skin <name>` directive, lowercased', () => {
    const result = preprocess('@startuml\nskin rose\nstate a\n@enduml');
    expect(result.skin).toBe('rose');
  });

  it('matches the keyword case-insensitively and keeps the name as written', () => {
    // unwind2-S8: the jar looks `<name>.skin` up case-sensitively
    // (`TitledDiagram.java:161`): `SKIN rose` loads rose (jar-verified),
    // `skin Rose` is "Cannot find style Rose" (skin-command.ts).
    const result = preprocess('@startuml\nSKIN Rose\nstate a\n@enduml');
    expect(result.skin).toBe('Rose');
    expect(result.skinDirectives).toEqual([{ name: 'Rose', position: 1 }]);
  });

  it('removes the skin line from the emitted lines (consumed, not content)', () => {
    const result = preprocess('@startuml\nskin debug\nstate a\n@enduml');
    expect(result.lines).not.toContain('skin debug');
    expect(result.lines).toContain('state a');
  });

  it('does not match a `skinparam` line as a skin directive', () => {
    const result = preprocess('@startuml\nskinparam backgroundColor red\nstate a\n@enduml');
    expect(result.skin).toBeUndefined();
    expect(result.skinparam.get('backgroundcolor')).toBe('red');
  });

  it('is undefined when the document has no skin directive', () => {
    const result = preprocess('@startuml\nstate a\n@enduml');
    expect(result.skin).toBeUndefined();
  });

  it('last skin line wins when the directive repeats', () => {
    const result = preprocess('@startuml\nskin rose\nskin debug\nstate a\n@enduml');
    expect(result.skin).toBe('debug');
  });
});

// Upstream's preprocessor keeps trailing whitespace (ReadLineReader.java:89-115
// reads the line verbatim; TimLoader.getResultList hands it on); each command
// decides — `SingleLineCommand2#myTrim2` (SingleLineCommand2.java:74-79) trims
// only when `doTrim`, and `CommandMindMapOrgmode.java:55` is `super(false, …)`.
describe('trailing whitespace reaches the command layer (T6i)', () => {
  it('keeps a trailing space and a trailing tab on a plain line', () => {
    const r = preprocess('@startmindmap\n* **1** \n** a\t\n@endmindmap');
    expect(r.lines).toEqual(['@startmindmap', '* **1** ', '** a\t', '@endmindmap']);
  });

  it('keeps the trailing space on a line carrying the inline %n() sentinel', () => {
    const { lines } = preprocess('@startuml\n:hello %n() world; \n@enduml');
    expect(lines).toContain(`:hello ${BLOCK_E1_NEWLINE} world; `);
  });

  it('keeps the trailing space on a line carrying a literal case-folded %N()', () => {
    const { lines } = preprocess('@startuml\n:a %N() b; \n@enduml');
    expect(lines).toEqual(['@startuml', ':a %N() b; ', '@enduml']);
  });
});

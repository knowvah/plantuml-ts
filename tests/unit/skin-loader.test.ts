import { describe, it, expect } from 'vitest';
import { applySkinLayer } from '../../src/core/skin-loader.js';
import { defaultTheme } from '../../src/core/theme.js';

describe('applySkinLayer -- skin-file-loading mission Batch 1', () => {
  it('is a no-op when no skin directive is present', () => {
    const result = applySkinLayer({ skin: undefined }, defaultTheme);
    expect(result).toBe(defaultTheme);
  });

  it('is a no-op for an unrecognized skin name', () => {
    const result = applySkinLayer({ skin: 'not-a-real-skin' }, defaultTheme);
    expect(result).toBe(defaultTheme);
  });

  it('resolves rose colors: root BackgroundColor/LineColor', () => {
    const result = applySkinLayer({ skin: 'rose' }, defaultTheme);
    expect(result.colors.graph.rootElementBackground).toBe('#FEFECE');
    expect(result.colors.border).toBe('#A80036');
  });

  it('resolves rose Shadowing 4.0 from the bare element {} selector', () => {
    const result = applySkinLayer({ skin: 'rose' }, defaultTheme);
    expect(result.shadowing).toBe(4);
  });

  it('resolves rose document { BackgroundColor white } as the canvas background, not the entity default', () => {
    // root's own BackGroundColor is #FEFECE (entity-fill default); document's
    // is white -- both must resolve to DIFFERENT theme fields.
    const result = applySkinLayer({ skin: 'rose' }, defaultTheme);
    expect(result.colors.background).toBe('white');
    expect(result.colors.graph.rootElementBackground).toBe('#FEFECE');
  });

  it('resolves debug colors: root BackgroundColor/LineColor and the element {} override', () => {
    const result = applySkinLayer({ skin: 'debug' }, defaultTheme);
    // debug.skin has no `document {}` block, so root's own BackgroundColor
    // (#AAA) is what reaches the canvas.
    expect(result.colors.background).toBe('#AAA');
    expect(result.colors.border).toBe('#3600A8');
    // debug.skin's `element { BackGroundColor #CEFEFE }` overrides root's
    // #AAA for the entity-fill default specifically (registered later).
    expect(result.colors.graph.rootElementBackground).toBe('#CEFEFE');
  });

  it('resolves debug Shadowing 0.0 -- root sets it, element does not override it', () => {
    const result = applySkinLayer({ skin: 'debug' }, defaultTheme);
    expect(result.shadowing).toBe(0);
  });

  it('resolves strictuml Shadowing 0.0 from both root and element', () => {
    const result = applySkinLayer({ skin: 'strictuml' }, defaultTheme);
    expect(result.shadowing).toBe(0);
  });

  it('is case-insensitive-safe when the collector already lowercased the name', () => {
    // preprocessor.ts lowercases the captured directive argument before
    // this ever runs -- verify the registry key itself is lowercase.
    const result = applySkinLayer({ skin: 'rose' }, defaultTheme);
    expect(result).not.toBe(defaultTheme);
  });
});

describe('applySkinLayer -- skin-file-loading mission Batch 4 (preprocessor+skinparam skins)', () => {
  it('resolves sonyxperiadev colors/font/shadowing via preprocess() + resolveSkinparam', () => {
    // sonyxperiadev.skin is embedded VERBATIM with upstream's `SkinParam`
    // capitalization -- this also exercises the loader's own case
    // normalization (`normalizeSkinparamKeywordCase`), not just the D1
    // grammar routing: without it, preprocess()'s collector (which matches
    // the literal lowercase `skinparam` keyword only) would capture NOTHING
    // and every assertion below would see `defaultTheme`'s own values.
    const result = applySkinLayer({ skin: 'sonyxperiadev' }, defaultTheme);
    expect(result.fontFamily).toBe('Arial'); // SkinParam DefaultFontName Arial
    expect(result.shadowing).toBe(0); // SkinParam Shadowing false
    expect(result.colors.elements?.entity?.background).toBe('#999999'); // SkinParam EntityBackgroundColor
    // SkinParam NoteBackgroundColor/NoteBorderColor each appear TWICE in the
    // verbatim upstream file -- last occurrence wins (#ffffcd/#a9a980), not
    // the first (#fbfb77/#cbcb47).
    expect(result.colors.elements?.note?.border).toBe('#a9a980');
  });

  it('resolves reddress via the SAME preprocess() + resolveSkinparam path (no <style> mis-parse)', () => {
    // Before Batch 4, `reddress` (leading `!ifndef`) was absent from
    // BUILTIN_SKINS entirely (D1's Batch-1 guard) -- now it resolves
    // SOMETHING rather than being silently dropped. `circledCharacterRadius
    // 8` is a plain numeric literal (not a `!define`d macro token), so it
    // resolves correctly even though the macro-substitution gap below
    // blocks every FONTNAME/FONTSIZE/ACCENT-style reference.
    const result = applySkinLayer({ skin: 'reddress' }, defaultTheme);
    expect(result.colors.graph.circledCharacterRadius).toBe(8);
  });

  it(
    'resolves reddress\'s unconditional !define FONTNAME (skin-reddress-variants ' +
      'Fix 1 -- skinparam VALUES now run through TIM substitution; the ' +
      'macro-substitution gap tracked in .agent-notes/skin-batch4-preproc.md ' +
      'is fixed for the skinparam-line path)',
    () => {
      const result = applySkinLayer({ skin: 'reddress' }, defaultTheme);
      // `!define FONTNAME "Verdana"` (top-level `!ifndef` default, active in
      // EVERY reddress mode) now resolves -- the value INCLUDES the quote
      // characters, since `!define` substitution is plain text replacement.
      expect(result.colors.graph.classFontFamily).toBe('"Verdana"');
    },
  );

  it(
    'still renders BOXBG/BORDERCOLOR literally in BARE mode -- correctly, ' +
      'not a residual bug: those macros are `!define`d only inside the ' +
      '`!ifdef DARKSTYLE`/`!ifdef LIGHTSTYLE` branches, which a bare ' +
      '`skin reddress` (no DARKBLUE/LIGHTBLUE/... flag) never enters, so ' +
      "the names genuinely aren't registered functions to substitute",
    () => {
      const result = applySkinLayer({ skin: 'reddress' }, defaultTheme);
      expect(result.colors.graph.classBackground).toBe('BOXBG');
      expect(result.colors.graph.classBorder).toBe('BORDERCOLOR');
    },
  );

  it('threads a bare `!define DARKBLUE` from the document into reddress\'s own `!ifdef` gate', () => {
    // `!ifdef DARKBLUE` only checks EXISTENCE (EaterIfdef#isTrue). Both the
    // gate AND the value now resolve (Fix 1): `skinparam backgroundColor 777`
    // (a literal) and `skinparam stereotypeCBackgroundColor ACCENT` (a macro
    // reference resolved via the SAME DARKBLUE-branch `!define ACCENT
    // 1a66c2`) both land.
    const withThreading = applySkinLayer({ skin: 'reddress' }, defaultTheme, [
      '!define DARKBLUE',
      'skin reddress',
    ]);
    // `documentRawSourceLines` omitted -- gate never fires, root theme
    // background is untouched (default, `undefined` background override).
    const untouched = applySkinLayer({ skin: 'reddress' }, defaultTheme);
    expect(withThreading.colors.background).not.toBe(untouched.colors.background);
    expect(withThreading.colors.background).toBe('777');
  });

  it(
    'resolves reddress\'s DARKBLUE-branch !define ACCENT into ' +
      'stereotypeCBackgroundColor (skin-reddress-variants Fix 1 -- the ' +
      '!ifdef GATE alone was already threaded by Batch 4; this proves the ' +
      "VALUE macro reference inside the selected branch now resolves too, " +
      "not just literal tokens)",
    () => {
      const result = applySkinLayer({ skin: 'reddress' }, defaultTheme, [
        '!define DARKBLUE',
        'skin reddress',
      ]);
      // `resolveSkinparam` maps `stereotypeCBackgroundColor` to the "spot C"
      // class-stereotype element bucket.
      expect(result.colors.elements?.spotclass?.background).toBe('1a66c2');
    },
  );

  it('is a no-op for a bare `!define DARKBLUE` with no matching skin (defensive)', () => {
    const result = applySkinLayer({ skin: undefined }, defaultTheme, ['!define DARKBLUE']);
    expect(result).toBe(defaultTheme);
  });
});

import { describe, it, expect } from 'vitest';
import {
  computeArrowFontOverride,
  computeCardinalityFontOverride,
  computeClassStyleCascadeOverrides,
  computeClassTagCascadeGenerations,
  resolveClassTagCascadeEntry,
} from '../../../src/core/style-cascade-class.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { StyleMap } from '../../../src/core/skinparam.js';

/** Build a StyleMap from a plain object of selector → declarations. */
function styleMap(spec: Record<string, Record<string, string>>): StyleMap {
  const m: StyleMap = new Map();
  for (const [sel, decls] of Object.entries(spec)) {
    m.set(sel, new Map(Object.entries(decls)));
  }
  return m;
}

describe('computeClassStyleCascadeOverrides (G2 N36)', () => {
  it('resolves a bare classDiagram {} BackGroundColor to hex (cilaba-36-zogi212 shape)', () => {
    const override = computeClassStyleCascadeOverrides(
      styleMap({ classdiagram: { backgroundcolor: 'Green' } }),
    );
    expect(override.classCascadeBackground).toBe('#008000');
  });

  it('resolves root/classDiagram/class BackGroundColor/LineColor/FontColor together (bikuka-40-pezi068 shape)', () => {
    const override = computeClassStyleCascadeOverrides(
      styleMap({
        root: { fontcolor: 'Blue', backgroundcolor: 'Red' },
        classdiagram: { backgroundcolor: 'Green', linecolor: 'yellow' },
        class: { linecolor: 'lightblue' },
      }),
    );
    expect(override.classCascadeBackground).toBe('#008000'); // classDiagram wins over root
    expect(override.classCascadeBorder).toBe('#ADD8E6'); // class (lightblue) wins over classDiagram (yellow)
    expect(override.classCascadeFontColor).toBe('#0000FF'); // root only source of FontColor
    expect(override.classCascadeArrowColor).toBe('#FFFF00'); // classDiagram's LineColor, arrow has no class-level override
    expect(override.spotCascadeBackground).toBe('#FF0000'); // root only (classDiagram excluded from spot signature)
    expect(override.spotCascadeFont).toBe('#0000FF');
  });

  it('a nested classDiagram.class selector reaches the same fields as a bare class {} (fumalu/bajula shape)', () => {
    const override = computeClassStyleCascadeOverrides(
      styleMap({ 'classdiagram.class': { fontcolor: 'blue', backgroundcolor: 'yellow' } }),
    );
    expect(override.classCascadeBackground).toBe('#FFFF00');
    expect(override.classCascadeFontColor).toBe('#0000FF');
  });

  it('a header-nested override wins for classCascadeHeaderFontColor but not classCascadeFontColor (momaku-69-duxe918 shape)', () => {
    const override = computeClassStyleCascadeOverrides(
      styleMap({
        'classdiagram.class': { fontcolor: 'blue' },
        'classdiagram.class.header': { fontcolor: 'violet' },
      }),
    );
    expect(override.classCascadeFontColor).toBe('#0000FF');
    expect(override.classCascadeHeaderFontColor).toBe('#EE82EE');
  });

  it('an arrow-scoped nested selector under classDiagram sets classCascadeArrowColor (rakici-44-tivo701 shape)', () => {
    const override = computeClassStyleCascadeOverrides(
      styleMap({ 'classdiagram.arrow': { linecolor: 'blue' } }),
    );
    expect(override.classCascadeArrowColor).toBe('#0000FF');
  });

  it('returns an empty object for a StyleMap with no matching selectors', () => {
    const override = computeClassStyleCascadeOverrides(styleMap({ database: { backgroundcolor: '#000' } }));
    expect(override).toEqual({});
  });

  it('a bare document {} selector never leaks into any class-cascade field', () => {
    const override = computeClassStyleCascadeOverrides(styleMap({ document: { backgroundcolor: 'Navy' } }));
    expect(override).toEqual({});
  });
});

describe('computeClassStyleCascadeOverrides -- unresolvable color guard (G2 N36 regression)', () => {
  // G2 N48 (item 29): `#?light:dark[:transparent]` (`HColorScheme`) is no
  // longer an "unresolvable" token discarded by the N36 guard -- it is now
  // RESOLVED against the classifier's own local background
  // (`cascadeFontColorHex`/`resolveConditionalColor`, `plans/g2-class-svg
  // /ledger.md` N48). These two cases pre-date that mechanism and asserted
  // the OLD "discard, fall back to caller's own default" behavior;
  // corrected in place to the jar-verified resolved values (diagnosis.md:
  // a PRE-fix-encoded test, not a live regression -- both fixtures cited
  // in their own titles, `xalaco-64-vuzu312`/(unnamed), now render
  // zero-diff against the real jar oracle with these exact values).
  it('resolves jar\'s `#?black:white` conditional-color ternary against the DEFAULT classifier background (xalaco-64-vuzu312 shape, no BackgroundColor override -- light, not dark -- picks colorLight)', () => {
    const override = computeClassStyleCascadeOverrides(
      styleMap({ root: { fontcolor: '#?black:white' } }),
    );
    expect(override.classCascadeFontColor).toBe('#000000');
  });

  it('resolves `#?black:white` against an explicit BackgroundColor override on the SAME declaration (Red is dark by YIQ -- picks colorDark)', () => {
    const override = computeClassStyleCascadeOverrides(
      styleMap({ root: { fontcolor: '#?black:white', backgroundcolor: 'Red' } }),
    );
    expect(override.classCascadeFontColor).toBe('#FFFFFF');
    expect(override.classCascadeBackground).toBe('#FF0000');
  });

  it('still resolves the transparent keyword (not swallowed by the unresolvable-color guard)', () => {
    const override = computeClassStyleCascadeOverrides(
      styleMap({ classdiagram: { backgroundcolor: 'transparent' } }),
    );
    expect(override.classCascadeBackground).toBe('#00000000');
  });
});


// ---------------------------------------------------------------------------
// `.tagname` stereotype sub-selector cascade + ancestor-only RoundCorner
// (G2 N37)
// ---------------------------------------------------------------------------
describe('computeClassStyleCascadeOverrides -- classCascadeRoundCorner (G2 N37)', () => {
  it('resolves a bare classDiagram { RoundCorner N } to the ancestor field (dozude Alice1 shape)', () => {
    const override = computeClassStyleCascadeOverrides(styleMap({ classdiagram: { roundcorner: '15' } }));
    expect(override.classCascadeRoundCorner).toBe(15);
  });

  it('ignores a non-numeric RoundCorner value', () => {
    const override = computeClassStyleCascadeOverrides(styleMap({ classdiagram: { roundcorner: 'nope' } }));
    expect(override.classCascadeRoundCorner).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// classCascadeMaximumWidth / classCascadeHeaderMaximumWidth (G2 N65 item 35)
// ---------------------------------------------------------------------------
describe('computeClassStyleCascadeOverrides -- MaximumWidth word-wrap (G2 N65 item 35)', () => {
  it('a bare class { MaximumWidth N } sets BOTH the member and header fields to the same value (nucite/nufini shape)', () => {
    const override = computeClassStyleCascadeOverrides(styleMap({ class: { maximumwidth: '150' } }));
    expect(override.classCascadeMaximumWidth).toBe(150);
    expect(override.classCascadeHeaderMaximumWidth).toBe(150);
  });

  it('a header-nested override wins for classCascadeHeaderMaximumWidth but not classCascadeMaximumWidth', () => {
    const override = computeClassStyleCascadeOverrides(
      styleMap({
        class: { maximumwidth: '150' },
        'class.header': { maximumwidth: '80' },
      }),
    );
    expect(override.classCascadeMaximumWidth).toBe(150);
    expect(override.classCascadeHeaderMaximumWidth).toBe(80);
  });

  it('ignores a non-numeric MaximumWidth value', () => {
    const override = computeClassStyleCascadeOverrides(styleMap({ class: { maximumwidth: 'nope' } }));
    expect(override.classCascadeMaximumWidth).toBeUndefined();
    expect(override.classCascadeHeaderMaximumWidth).toBeUndefined();
  });

  it('absent when no MaximumWidth declaration exists anywhere', () => {
    const override = computeClassStyleCascadeOverrides(styleMap({ class: { backgroundcolor: 'red' } }));
    expect(override.classCascadeMaximumWidth).toBeUndefined();
    expect(override.classCascadeHeaderMaximumWidth).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// noteCascadeMaximumWidth (G2 N66, item 35's own named remainder) --
// `EntityImageNote`'s OWN style signature (`{root,element,classDiagram,
// note}`, `NOTE_SNAMES`) is DISTINCT from `CLASS_SNAMES`/`HEADER_SNAMES`
// (trailing token `note` vs `class_`) -- a bare `class { MaximumWidth N } }`
// selector must NOT reach it, but a shared ancestor token (`element`/
// `classDiagram`/`root`) must.
// ---------------------------------------------------------------------------
describe('computeClassStyleCascadeOverrides -- noteCascadeMaximumWidth (G2 N66)', () => {
  it('a bare element { MaximumWidth N } reaches BOTH the note AND class/header fields (rubecu-40-cixu870 shape)', () => {
    const override = computeClassStyleCascadeOverrides(styleMap({ element: { maximumwidth: '100' } }));
    expect(override.noteCascadeMaximumWidth).toBe(100);
    expect(override.classCascadeMaximumWidth).toBe(100);
    expect(override.classCascadeHeaderMaximumWidth).toBe(100);
  });

  it('a bare class { MaximumWidth N } does NOT reach noteCascadeMaximumWidth (nufini-44-jofo787 shape)', () => {
    const override = computeClassStyleCascadeOverrides(
      styleMap({ note: { maximumwidth: '100' }, class: { maximumwidth: '150' } }),
    );
    expect(override.noteCascadeMaximumWidth).toBe(100);
    expect(override.classCascadeMaximumWidth).toBe(150);
    expect(override.classCascadeHeaderMaximumWidth).toBe(150);
  });

  it('an explicit note { MaximumWidth N } sets ONLY the note field, not class/header', () => {
    const override = computeClassStyleCascadeOverrides(styleMap({ note: { maximumwidth: '100' } }));
    expect(override.noteCascadeMaximumWidth).toBe(100);
    expect(override.classCascadeMaximumWidth).toBeUndefined();
    expect(override.classCascadeHeaderMaximumWidth).toBeUndefined();
  });

  it('ignores a non-numeric MaximumWidth value', () => {
    const override = computeClassStyleCascadeOverrides(styleMap({ note: { maximumwidth: 'nope' } }));
    expect(override.noteCascadeMaximumWidth).toBeUndefined();
  });

  it('absent when no MaximumWidth declaration exists anywhere', () => {
    const override = computeClassStyleCascadeOverrides(styleMap({ note: { backgroundcolor: 'red' } }));
    expect(override.noteCascadeMaximumWidth).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// noteCascadeFontColor (G2 N67 item 49) -- the SAME `NOTE_SNAMES` signature
// `noteCascadeMaximumWidth` (N66) already established, wired for FontColor
// exactly the way `classCascadeFontColor` already handles the class-side
// signature (`cascadeFontColorHex`, including the `#?light:dark` conditional
// path against the note's own default background). `renderer-note.ts
// #renderNoteLineAtoms`/`renderNoteText` previously hardcoded `fill=
// "#000000"` unconditionally -- this is the cascade those call sites now
// consult as a fallback tier BELOW an atom's own explicit `<color>` run.
// ---------------------------------------------------------------------------
describe('computeClassStyleCascadeOverrides -- noteCascadeFontColor (G2 N67 item 49)', () => {
  it('an explicit note { Fontcolor red } sets ONLY the note field, not class/header (nufini-44-jofo787 shape)', () => {
    const override = computeClassStyleCascadeOverrides(
      styleMap({ note: { fontcolor: 'red' }, class: { fontcolor: 'green' } }),
    );
    expect(override.noteCascadeFontColor).toBe('#FF0000');
    expect(override.classCascadeFontColor).toBe('#008000');
  });

  it('a bare element { FontColor N } reaches BOTH the note AND class/header fields (rubecu-40-cixu870 shape)', () => {
    const override = computeClassStyleCascadeOverrides(styleMap({ element: { fontcolor: 'blue' } }));
    expect(override.noteCascadeFontColor).toBe('#0000FF');
    expect(override.classCascadeFontColor).toBe('#0000FF');
  });

  it('a bare class { FontColor N } does NOT reach noteCascadeFontColor', () => {
    const override = computeClassStyleCascadeOverrides(styleMap({ class: { fontcolor: 'green' } }));
    expect(override.noteCascadeFontColor).toBeUndefined();
    expect(override.classCascadeFontColor).toBe('#008000');
  });

  it("resolves the #?light:dark conditional-color ternary against the note's own default background", () => {
    const override = computeClassStyleCascadeOverrides(styleMap({ note: { fontcolor: '#?black:white' } }));
    // NOTE_FILL (#FEFFDD) is a light background by YIQ -- picks colorLight.
    expect(override.noteCascadeFontColor).toBe('#000000');
  });

  it('ignores a non-resolvable FontColor value', () => {
    const override = computeClassStyleCascadeOverrides(styleMap({ note: { fontcolor: 'not-a-color' } }));
    expect(override.noteCascadeFontColor).toBeUndefined();
  });

  it('absent when no FontColor declaration exists anywhere', () => {
    const override = computeClassStyleCascadeOverrides(styleMap({ note: { backgroundcolor: 'red' } }));
    expect(override.noteCascadeFontColor).toBeUndefined();
  });
});

describe('computeClassStyleCascadeOverrides -- classTagCascade (G2 N37)', () => {
  it('resolves BackgroundColor/RoundCorner/FontColor/FontStyle for a nested .tagname (dozude shape)', () => {
    const override = computeClassStyleCascadeOverrides(
      styleMap({
        classdiagram: { roundcorner: '15' },
        'classdiagram..mystyle': {
          roundcorner: '5',
          backgroundcolor: 'cyan',
          fontstyle: 'Bold',
          fontcolor: 'red',
        },
      }),
    );
    expect(override.classTagCascade?.mystyle).toEqual({
      background: '#00FFFF',
      roundCorner: 5,
      fontColor: '#FF0000',
      fontBold: true,
      fontItalic: false,
    });
  });

  it('resolves TWO distinct tags to DIFFERENT entries (rakici-44-tivo701 shape)', () => {
    const override = computeClassStyleCascadeOverrides(
      styleMap({
        'classdiagram..x': { backgroundcolor: '#00ffff' },
        'classdiagram..y': { backgroundcolor: '#ff0000' },
      }),
    );
    expect(override.classTagCascade?.x?.background).toBe('#00FFFF');
    expect(override.classTagCascade?.y?.background).toBe('#FF0000');
  });

  it('a tag with NO class-relevant declaration contributes no entry', () => {
    const override = computeClassStyleCascadeOverrides(styleMap({ 'note..faint': { backgroundcolor: 'red' } }));
    expect(override.classTagCascade).toBeUndefined();
  });
});

describe('resolveClassTagCascadeEntry (G2 N37)', () => {
  const cascade = { mystyle: { background: '#00FFFF' }, other: { background: '#FF0000' } };

  it('returns the entry for the first matching label', () => {
    const theme = { ...defaultTheme, colors: { ...defaultTheme.colors, graph: { ...defaultTheme.colors.graph, classTagCascade: cascade } } };
    expect(resolveClassTagCascadeEntry(theme, ['mystyle'])?.background).toBe('#00FFFF');
    expect(resolveClassTagCascadeEntry(theme, ['nomatch', 'other'])?.background).toBe('#FF0000');
  });

  it('returns undefined when no cascade exists or labels is undefined', () => {
    expect(resolveClassTagCascadeEntry(defaultTheme, ['mystyle'])).toBeUndefined();
    const theme = { ...defaultTheme, colors: { ...defaultTheme.colors, graph: { ...defaultTheme.colors.graph, classTagCascade: cascade } } };
    expect(resolveClassTagCascadeEntry(theme, undefined)).toBeUndefined();
  });

  it('picks the position-scoped generation entry over the final classTagCascade when both are set (G2 N39)', () => {
    const generations = [undefined, { a: { background: '#FFC0CB' } }, { a: { background: '#98FB98' } }];
    const theme = {
      ...defaultTheme,
      colors: {
        ...defaultTheme.colors,
        graph: {
          ...defaultTheme.colors.graph,
          classTagCascade: { a: { background: '#98FB98' } },
          classTagCascadeGenerations: generations,
        },
      },
    };
    expect(resolveClassTagCascadeEntry(theme, ['a'], 1)?.background).toBe('#FFC0CB');
    expect(resolveClassTagCascadeEntry(theme, ['a'], 2)?.background).toBe('#98FB98');
  });

  it('falls back to the plain classTagCascade when styleGeneration is undefined or generations is unset (G2 N39)', () => {
    const generations = [undefined, { a: { background: '#FFC0CB' } }];
    const withGenerations = {
      ...defaultTheme,
      colors: {
        ...defaultTheme.colors,
        graph: {
          ...defaultTheme.colors.graph,
          classTagCascade: { a: { background: '#98FB98' } },
          classTagCascadeGenerations: generations,
        },
      },
    };
    expect(resolveClassTagCascadeEntry(withGenerations, ['a'])?.background).toBe('#98FB98');
    const theme = { ...defaultTheme, colors: { ...defaultTheme.colors, graph: { ...defaultTheme.colors.graph, classTagCascade: cascade } } };
    expect(resolveClassTagCascadeEntry(theme, ['mystyle'], 0)?.background).toBe('#00FFFF');
  });
});

describe('computeClassTagCascadeGenerations (G2 N39)', () => {
  it('returns undefined for 0 or 1 style blocks (nothing to disambiguate)', () => {
    expect(computeClassTagCascadeGenerations([])).toBeUndefined();
    expect(computeClassTagCascadeGenerations(['.a {BackGroundColor pink}'])).toBeUndefined();
  });

  it('snapshots the SAME selector redefined across two blocks (fexuta-62-piko653 shape)', () => {
    const generations = computeClassTagCascadeGenerations([
      '.a {BackGroundColor pink}',
      '.a {BackGroundColor palegreen}',
    ]);
    expect(generations).toBeDefined();
    expect(generations![0]).toBeUndefined();
    expect(generations![1]?.['a']?.background).toBe('#FFC0CB');
    expect(generations![2]?.['a']?.background).toBe('#98FB98');
  });

  it('carries an UNRELATED selector forward across a later block that does not touch it', () => {
    const generations = computeClassTagCascadeGenerations([
      '.a {BackGroundColor pink}',
      '.b {BackGroundColor yellow}',
    ]);
    expect(generations![1]?.['a']?.background).toBe('#FFC0CB');
    expect(generations![2]?.['a']?.background).toBe('#FFC0CB');
    expect(generations![2]?.['b']?.background).toBe('#FFFF00');
  });
});
// ---------------------------------------------------------------------------
// B4 (mission A2s): `skinparam wrapWidth` bridged into the MaximumWidth
// cascade DEFAULTS -- upstream `FromSkinparamToStyle.java:250` converts the
// skinparam into a `PName.MaximumWidth` declaration on `SName.element`,
// which is a member of ALL THREE style signatures this module resolves
// (`CLASS_SNAMES`/`HEADER_SNAMES`/`NOTE_SNAMES` each contain `element`) --
// so a bare `skinparam wrapWidth N` behaves exactly like `<style> element {
// MaximumWidth N }` (rubecu-40-cixu870 jar-verified shape), EXCEPT that an
// explicit `<style>` MaximumWidth declaration always wins over the
// skinparam default (locked requirement, task F-E).
// ---------------------------------------------------------------------------
describe('computeClassStyleCascadeOverrides -- skinparam wrapWidth default (A2s B4)', () => {
  it('sets all three MaximumWidth fields when no <style> declares MaximumWidth (ponono-25/sumocu-27 shape)', () => {
    const override = computeClassStyleCascadeOverrides(styleMap({}), 300);
    expect(override.classCascadeMaximumWidth).toBe(300);
    expect(override.classCascadeHeaderMaximumWidth).toBe(300);
    expect(override.noteCascadeMaximumWidth).toBe(300);
  });

  it('a <style> class { MaximumWidth } overrides the skinparam for class/header but the note still gets the skinparam default', () => {
    const override = computeClassStyleCascadeOverrides(styleMap({ class: { maximumwidth: '150' } }), 300);
    expect(override.classCascadeMaximumWidth).toBe(150);
    expect(override.classCascadeHeaderMaximumWidth).toBe(150);
    expect(override.noteCascadeMaximumWidth).toBe(300);
  });

  it('a <style> element { MaximumWidth } overrides the skinparam for all three fields', () => {
    const override = computeClassStyleCascadeOverrides(styleMap({ element: { maximumwidth: '100' } }), 300);
    expect(override.classCascadeMaximumWidth).toBe(100);
    expect(override.classCascadeHeaderMaximumWidth).toBe(100);
    expect(override.noteCascadeMaximumWidth).toBe(100);
  });

  it('no skinparam wrapWidth (undefined) leaves all fields absent -- byte-identical to the pre-B4 call shape', () => {
    const override = computeClassStyleCascadeOverrides(styleMap({}));
    expect(override.classCascadeMaximumWidth).toBeUndefined();
    expect(override.classCascadeHeaderMaximumWidth).toBeUndefined();
    expect(override.noteCascadeMaximumWidth).toBeUndefined();
  });

  it('does not leak the wrapWidth default into any non-MaximumWidth field', () => {
    const override = computeClassStyleCascadeOverrides(styleMap({}), 300);
    expect(Object.keys(override).sort()).toEqual([
      'classCascadeHeaderMaximumWidth',
      'classCascadeMaximumWidth',
      'noteCascadeMaximumWidth',
    ]);
  });
});

// ---------------------------------------------------------------------------
// T1 (edge-label-box-backlog, D3): `computeCardinalityFontOverride` --
// `{root,element,classDiagram,arrow,cardinality}` (`GraphvizImageBuilder
// .java:124-126`, `getStyleArrowCardinality`). Building block only -- no
// caller yet (T5/T6 wire it). `camuna-58-veca254`'s own `<style>` block is
// used verbatim below (not a synthesized shape) per the project's "prefer
// upstream fixtures" convention.
// ---------------------------------------------------------------------------
describe('computeCardinalityFontOverride (T1, D3)', () => {
  it('returns nothing for an empty StyleMap -- the caller keeps the Theme default', () => {
    const override = computeCardinalityFontOverride(styleMap({}));
    expect(override).toEqual({});
  });

  it("camuna-58-veca254's arrow { cardinality { FontSize 10 } } resolves to 10, not arrow's own 14", () => {
    const override = computeCardinalityFontOverride(
      styleMap({
        arrow: { fontcolor: 'blue', fontsize: '14', fontstyle: 'bold' },
        'arrow.cardinality': { fontcolor: 'red', fontsize: '10', fontstyle: 'italic' },
      }),
    );
    expect(override.cardinalityFontSize).toBe(10);
  });

  it('a <style> block setting only arrow { FontSize 14 } (no cardinality block) falls through to 14', () => {
    const override = computeCardinalityFontOverride(styleMap({ arrow: { fontsize: '14' } }));
    expect(override.cardinalityFontSize).toBe(14);
  });

  it('resolves FontName the same way -- arrow.cardinality wins over a plain arrow declaration', () => {
    const override = computeCardinalityFontOverride(
      styleMap({
        arrow: { fontname: 'Arial' },
        'arrow.cardinality': { fontname: 'Courier' },
      }),
    );
    expect(override.cardinalityFontFamily).toBe('Courier');
  });

  it('a bare classDiagram {} cascades down (a genuine CARDINALITY_SNAMES ancestor token), but class {} does not', () => {
    const override = computeCardinalityFontOverride(
      styleMap({ classdiagram: { fontsize: '20' }, class: { fontsize: '30' } }),
    );
    expect(override.cardinalityFontSize).toBe(20);
  });

  it('a bare class {} declaration never leaks into the cardinality font -- class is not an arrow ancestor', () => {
    const override = computeCardinalityFontOverride(styleMap({ class: { fontsize: '30' } }));
    expect(override).toEqual({});
  });

  it('non-numeric FontSize is dropped, matching every sibling cascade\'s guard', () => {
    const override = computeCardinalityFontOverride(styleMap({ arrow: { fontsize: 'not-a-number' } }));
    expect(override.cardinalityFontSize).toBeUndefined();
  });

  it("defaultTheme's own cardinality font is 13/sans-serif -- the plantuml.skin arrow default (:307/:6), used when no override resolves", () => {
    expect(defaultTheme.cardinalityFontSize).toBe(13);
    expect(defaultTheme.cardinalityFontFamily).toBe('sans-serif');
  });
});

// ---------------------------------------------------------------------------
// T2 (edge-label-box-followups, D3): `computeArrowFontOverride` --
// `{root,element,classDiagram,arrow}` (`GraphvizImageBuilder.java:234-235`,
// SvekEdge's `labelFont`). Building block only -- no caller yet (D4/Batch 3
// wires it).
// ---------------------------------------------------------------------------
describe('computeArrowFontOverride (T2, D3)', () => {
  it('returns nothing for an empty StyleMap -- the caller keeps the Theme default', () => {
    expect(computeArrowFontOverride(styleMap({}))).toEqual({});
  });

  it('camuna shape: arrow { FontSize 14  FontStyle bold } resolves size/style, no family', () => {
    const override = computeArrowFontOverride(
      styleMap({ arrow: { fontsize: '14', fontstyle: 'bold' } }),
    );
    expect(override).toEqual({ arrowFontSize: 14, arrowFontStyle: 'bold' });
  });

  it("arrow { cardinality { FontSize 10 } } alone (no plain arrow FontSize) does NOT leak into the arrow font", () => {
    const override = computeArrowFontOverride(
      styleMap({ 'arrow.cardinality': { fontsize: '10' } }),
    );
    expect(override).toEqual({});
  });

  it('a plain arrow { FontSize N } declaration is NOT shadowed by a sibling arrow.cardinality block', () => {
    const override = computeArrowFontOverride(
      styleMap({
        arrow: { fontsize: '14' },
        'arrow.cardinality': { fontsize: '10' },
      }),
    );
    expect(override.arrowFontSize).toBe(14);
  });

  it('ticuxa shape: resolves FontName alongside FontSize/FontStyle', () => {
    const override = computeArrowFontOverride(
      styleMap({ arrow: { fontsize: '58', fontname: 'Courier', fontstyle: 'italic' } }),
    );
    expect(override).toEqual({
      arrowFontSize: 58,
      arrowFontFamily: 'Courier',
      arrowFontStyle: 'italic',
    });
  });

  it('a bare class {} declaration never leaks into the arrow font -- class is not an arrow ancestor', () => {
    expect(computeArrowFontOverride(styleMap({ class: { fontsize: '30' } }))).toEqual({});
  });

  it('non-numeric FontSize is dropped, matching every sibling cascade\'s guard', () => {
    const override = computeArrowFontOverride(styleMap({ arrow: { fontsize: 'not-a-number' } }));
    expect(override.arrowFontSize).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// SI26 T2 (D4/D5): `arrow { FontColor }` / `arrow { cardinality { FontColor } }`
// -- oracle experiment ids refer to `plans/arrow-label-font-colour/
// decisions.md`. Precedence is `resolveStyleCascade`'s source-order walk
// (`StyleStorage#computeMergedStyle`, `style/StyleStorage.java:102-116`),
// no specificity: i/k/l/m fall out with no new logic.
// ---------------------------------------------------------------------------
describe('computeArrowFontOverride / computeCardinalityFontOverride -- FontColor (SI26 T2)', () => {
  it('f/e: arrow { FontColor blue } -> arrowFontColor #0000FF, cardinality colour absent (inherits)', () => {
    const map = styleMap({ arrow: { fontcolor: 'blue' } });
    expect(computeArrowFontOverride(map).arrowFontColor).toBe('#0000FF');
    // CARDINALITY_SNAMES is a superset of ARROW_SNAMES, so the bare `arrow`
    // declaration satisfies it too -- the cardinality override CARRIES it.
    // `resolveCardinalityFontColor`'s `?? arrow` covers the absent case.
    expect(computeCardinalityFontOverride(map).cardinalityFontColor).toBe('#0000FF');
  });

  it("camuna: arrow { FontColor Blue ... cardinality { FontColor red } } -> #0000FF and #FF0000", () => {
    const map = styleMap({
      arrow: { fontcolor: 'Blue', fontsize: '14', fontstyle: 'bold' },
      'arrow.cardinality': { fontcolor: 'red', fontsize: '10', fontstyle: 'italic' },
    });
    expect(computeArrowFontOverride(map).arrowFontColor).toBe('#0000FF');
    expect(computeCardinalityFontOverride(map).cardinalityFontColor).toBe('#FF0000');
  });

  it('with a background, #?light:dark resolves against it; without one the plain path runs', () => {
    const map = styleMap({ arrow: { fontcolor: '#?red:green' } });
    expect(computeArrowFontOverride(map, [], '#FFFFFF').arrowFontColor).toBe('#FF0000');
    expect(computeArrowFontOverride(map, [], '#000000').arrowFontColor).toBe('#008000');
    expect(computeCardinalityFontOverride(map, [], '#000000').cardinalityFontColor).toBe('#008000');
    // `cascadeHex` (no background) drops the unresolvable-as-plain token.
    expect(computeArrowFontOverride(map).arrowFontColor).toBeUndefined();
  });

  it('a StyleMap that never touches arrow yields no colour field on either override', () => {
    const map = styleMap({ class: { fontcolor: 'red' } });
    expect(computeArrowFontOverride(map)).toEqual({});
    expect(computeCardinalityFontOverride(map)).toEqual({});
  });
});

/**
 * A creole `<math>`/`<latex>` atom in a CLASS diagram is DRAWN, not dropped:
 * `AtomMath#drawU` paints one image and nothing else (`AtomMath.java:78-97`)
 * and `#calculateDimensionSlow` is that same image's box
 * (`AtomMath.java:64-71`).
 *
 * TDD: written before `class-member-atom-resolve.ts` grew `resolveLatexAtom`.
 * Registering `CommandCreoleMath` (`CommandCreoleBuilder.java:111`) turned
 * `<math>expr</math>` into a `'latex'` atom in every family; the class engine
 * sized that atom at zero and drew nothing for it, so a formula that used to
 * render as its own literal markup disappeared from the page entirely. Both
 * of the class engine's creole consumers -- a classifier MEMBER row and a
 * NOTE body -- go through the one `resolveMemberAtoms` seam, so both are
 * pinned here.
 *
 * NO NUMBER here is compared against the jar's. The image's bytes and its
 * exact width/height are a PERMANENT divergence (`DIVERGENCES.md`, "LaTeX
 * rendering engine -- KaTeX, not JLaTeXMath", which names `<math>`), and
 * every latex oracle in this corpus is `ScientificEquationSafe#getRollback`'s
 * monospace fallback rather than typeset mathematics. Presence and ORDER are
 * the conformance targets; dimensions are not.
 */
import { describe, expect, test } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import type { FontConfiguration } from '../../../src/core/klimt/shape/UText.js';
import { renderLatexAsImage } from '../../../src/core/latex.js';
import { JAR_DEFAULT_TEXT_COLOR } from '../../../src/core/decoration/symbol/usymbol-resolve.js';
import { buildMemberAtoms, resolveMemberAtoms } from '../../../src/diagrams/class/class-member-creole.js';

const measurer = new WidthTableMeasurer();
const FONT: FontConfiguration = { family: 'sans-serif', size: 14, color: null, styles: new Set() };

/** The regression source: a member row AND a note, each carrying one
 *  `<math>` formula. Both formulas vanished between `CommandCreoleMath`
 *  being registered and this fix. */
const REPRO = [
  '@startuml',
  'class Foo {',
  '  +compute() : <math>ax^2+bx+c=0</math>',
  '}',
  'note right of Foo : formula <math>x=1/n</math> here',
  '@enduml',
].join('\n');

function svgOf(source: string): string {
  const out = renderSync(source, { measurer: new WidthTableMeasurer() });
  return typeof out === 'string' ? out : (out as { svg: string }).svg;
}

function textRuns(svg: string): readonly string[] {
  return [...svg.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)].map((m) => m[1] as string);
}

describe('class creole <math> — the atom draws its image', () => {
  test('resolveMemberAtoms resolves a latex atom to a drawable image atom', () => {
    const atoms = buildMemberAtoms('a <math>x=1</math> b', FONT);
    expect(atoms.map((a) => a.kind)).toEqual(['text', 'latex', 'text']);
    const build = resolveMemberAtoms(atoms, FONT, measurer);
    // The atom is KEPT, in source order, between its two text siblings --
    // it used to be dropped, collapsing the row to two runs.
    expect(build.atoms.map((a) => a.kind)).toEqual(['text', 'image', 'text']);
    const img = build.atoms[1] as Extract<(typeof build.atoms)[number], { kind: 'image' }>;
    // `core/latex.ts#renderLatexAsImage` is the ONE renderer both the sizer
    // and the renderer go through, so the href is derived from it -- fed the
    // ATOM's own already-converted `expr`, never a jar golden.
    const latexAtom = atoms[1] as Extract<(typeof atoms)[number], { kind: 'latex' }>;
    expect(img.href).toBe(renderLatexAsImage(latexAtom.expr, JAR_DEFAULT_TEXT_COLOR).href);
  });

  test('the atom colour is AtomMath#getColor default black when the run carries none', () => {
    // `AtomMath#getColor(colorMapper, foreground, XColor.BLACK)` returns the
    // default whenever `foreground` is not an `HColorSimple`
    // (`AtomMath.java:100-106`); a run with no `<color:...>` in scope has a
    // `null` atom colour, so it draws black.
    const atoms = buildMemberAtoms('<math>x=1</math>', FONT);
    const latexAtom = atoms[0] as Extract<(typeof atoms)[number], { kind: 'latex' }>;
    expect(latexAtom.color).toBeNull();
    const build = resolveMemberAtoms(atoms, FONT, measurer);
    const img = build.atoms[0] as Extract<(typeof build.atoms)[number], { kind: 'image' }>;
    expect(img.href).toBe(renderLatexAsImage(latexAtom.expr, JAR_DEFAULT_TEXT_COLOR).href);
  });

  test('the repro emits one <image> per formula and keeps every text run', () => {
    const svg = svgOf(REPRO);
    expect((svg.match(/<image /g) ?? []).length).toBe(2);
    expect(textRuns(svg)).toEqual(['Foo', 'compute() :', 'formula', 'here']);
  });

  test('the note image is emitted BETWEEN the two text runs that surround it', () => {
    const svg = svgOf(REPRO);
    const formulaAt = svg.indexOf('>formula<');
    const hereAt = svg.indexOf('>here<');
    // The one `<image>` that falls inside the note line's own run sequence.
    const imageAt = svg.indexOf('<image ', formulaAt);
    expect(formulaAt).toBeGreaterThan(-1);
    expect(imageAt).toBeGreaterThan(formulaAt);
    expect(hereAt).toBeGreaterThan(imageAt);
  });

  test('<latex> draws too, on its own VERBATIM source', () => {
    // `CommandCreoleBuilder.java:111` registers `CommandCreoleMath` beside
    // `CommandCreoleLatex`; both `stripe.addMath` an `AtomMath`, so both
    // draw. They do NOT agree on the expression: `CommandCreoleMath` wraps
    // its capture in `ScientificEquationSafe.fromAsciiMath`
    // (`CommandCreoleMath.java:79`) while `CommandCreoleLatex` uses
    // `fromLatex` (`CommandCreoleLatex.java:78`) -- so `<math>x=1</math>`
    // reaches the renderer as CONVERTED LaTeX and `<latex>x=1</latex>` as
    // the untouched source. Same atom kind, deliberately different bytes.
    const mathAtoms = buildMemberAtoms('<math>x=1</math>', FONT);
    const latexAtoms = buildMemberAtoms('<latex>x=1</latex>', FONT);
    const latexBuild = resolveMemberAtoms(latexAtoms, FONT, measurer);
    expect(latexBuild.atoms.map((a) => a.kind)).toEqual(['image']);
    const latexExpr = (latexAtoms[0] as Extract<(typeof latexAtoms)[number], { kind: 'latex' }>).expr;
    const mathExpr = (mathAtoms[0] as Extract<(typeof mathAtoms)[number], { kind: 'latex' }>).expr;
    expect(latexExpr).toBe('x=1');
    expect(mathExpr).not.toBe(latexExpr);
    const img = latexBuild.atoms[0] as Extract<(typeof latexBuild.atoms)[number], { kind: 'image' }>;
    expect(img.href).toBe(renderLatexAsImage(latexExpr, JAR_DEFAULT_TEXT_COLOR).href);
  });
});

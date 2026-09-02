/**
 * ASCIIMathTeXImg.test.ts — the ASCIIMath to LaTeX converter ported from
 * `math/ASCIIMathTeXImg.java`, plus its `AsciiMath` wrapper.
 *
 * ## Where the expected LaTeX comes from
 *
 * Every expected string below was produced by RUNNING the canonical Java —
 * `new ASCIIMathTeXImg().getTeX(input)` on upstream's own class, out of
 * `plantuml-1.2026.7beta11.jar` — never written from knowledge of ASCIIMath
 * notation. The private helpers are pinned the same way, through a reflection
 * probe on `slice`, `substr`, `aAMremoveCharsAndBlanks`, `aAMposition` and
 * `aAMgetSymbol`. Cases upstream RAISES on (Java string-bounds exceptions —
 * see `ASCIIMathTeXImg.ts`'s module doc comment) are pinned as throws, because
 * that raise is what `ScientificEquationSafe.fromAsciiMath`'s catch keys on:
 * under JS clamping semantics they would silently emit different LaTeX.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/math/ASCIIMathTeXImg.java
 */
import { describe, expect, it } from 'vitest';
import { ASCIIMathTeXImg } from '../../../../src/core/math/ASCIIMathTeXImg.js';
import { AsciiMath } from '../../../../src/core/math/AsciiMath.js';
import {
  Flag,
  Ttype,
  Tuple,
  aAMquote,
  aAMsymbols,
} from '../../../../src/core/math/ASCIIMathTeXImgSymbols.js';

const tex = (input: string): string => new ASCIIMathTeXImg().getTeX(input);

/** The private surface upstream keeps inside the class (java:77-95, 465-561). */
interface Internals {
  slice(str: string, start: number, end?: number): string;
  substr(str: string, pos: number, len: number): string;
  aAMremoveCharsAndBlanks(str: string, n: number): string;
  aAMposition(arr: string[], str: string, n: number): number;
  aAMgetSymbol(str: string): Tuple;
}

const internals = (): Internals => new ASCIIMathTeXImg() as unknown as Internals;

describe('getTeX — the four expressions this port\'s corpus contains', () => {
  it('ax^2+bx+c=0', () => {
    expect(tex('ax^2+bx+c=0')).toBe('{a}{x}^{{2}}+{b}{x}+{c}={0}');
  });

  it('x = (-b+-sqrt(b^2-4ac))/(2a)', () => {
    expect(tex('x = (-b+-sqrt(b^2-4ac))/(2a)')).toBe('{x}=\\frac{{-{b}\\pm\\sqrt{{{b}^{{2}}-{4}{a}{c}}}}}{{{2}{a}}}');
  });

  it('[[a,b],[c,d]]((n),(k))', () => {
    expect(tex('[[a,b],[c,d]]((n),(k))')).toBe('{\\left[\\begin{array}{cc} {a}&{b}\\\\{c}&{d}\\end{array}\\right]}{\\left(\\begin{array}{c} {n}\\\\{k}\\end{array}\\right)}');
  });

  it('S<=1/(F+(1-F)/N)', () => {
    expect(tex('S<=1/(F+(1-F)/N)')).toBe('{S}\\le\\frac{{1}}{{{F}+\\frac{{{1}-{F}}}{{N}}}}');
  });

});

describe('getTeX — upstream-derived expression table', () => {
  const cases: readonly (readonly [string, string])[] = [
    ['sum_(i=1)^n i^3=((n(n+1))/2)^2', '{\\sum_{{{i}={1}}}^{{n}}}{i}^{{3}}={\\left(\\frac{{{n}{\\left({n}+{1}\\right)}}}{{2}}\\right)}^{{2}}'],
    ['int_0^1 f(x)dx', '{\\int_{{0}}^{{1}}}{f{{\\left({x}\\right)}}}{\\left.{d}{x}\\right.}'],
    ['lim_(x->oo) 1/x', '\\lim_{{{x}\\to\\infty}}\\frac{{1}}{{x}}'],
    ['root(3)(x)', '{\\sqrt[{{3}}]{{{x}}}}'],
    ['frac(a)(b)', '{\\frac{{{a}}}{{{b}}}}'],
    ['stackrel(a)(b)', '{\\stackrel{{{a}}}{{{b}}}}'],
    ['color(red)(x)', '{\\textcolor{red}{{x}}}'],
    ['text(hello)', '\\text{hello}'],
    ['"quoted text"', '\\text{quoted text}'],
    ['mbox(boxed)', '\\text{boxed}'],
    ['abs(x)', '{\\left|{{x}}\\right|}'],
    ['floor(x)', '{\\left\\lfloor{{x}}\\right\\rfloor}'],
    ['ceil(x)', '{\\left\\lceil{{x}}\\right\\rceil}'],
    ['norm(v)', '{\\left\\|{{v}}\\right\\|}'],
    ['hat(x) bar(y) vec(z) dot(w) ddot(v) ul(u) ubrace(a) obrace(b)', '\\hat{{{x}}}\\overline{{{y}}}\\vec{{{z}}}\\dot{{{w}}}\\ddot{{{v}}}\\underline{{{u}}}\\underbrace{{{a}}}\\overbrace{{{b}}}'],
    ['bb(A) sf(B) bbb(C) cc(D) tt(E) fr(F)', '{\\mathbf{{{A}}}}{\\mathsf{{{B}}}}{\\mathbb{{{C}}}}{\\mathcal{{{D}}}}{\\mathtt{{{E}}}}{\\mathfrak{{{F}}}}'],
    ['sqrt(x)', '\\sqrt{{{x}}}'],
    ['cancel(x)', '\\cancel{{{x}}}'],
    ['{: x :}', '{\\left.{x}\\right.}'],
    ['(: a,b :)', '{\\left\\langle{a},{b}\\right\\rangle}'],
    ['a and b or c if d', '{a}{\\quad\\text{and}\\quad}{b}{\\quad\\text{or}\\quad}{c}{\\quad\\text{if}\\quad}{d}'],
    ['x|y', '{x}{\\mid}{y}'],
    ['|x|', '{\\left|{x}\\right|}'],
    ['{x | x > 0}', '{\\left\\lbrace{x}{\\mid}{x}>{0}\\right\\rbrace}'],
    ['f(x)', '{f{{\\left({x}\\right)}}}'],
    ['g(x)', '{g{{\\left({x}\\right)}}}'],
    ['sin(x)', '{\\sin{{\\left({x}\\right)}}}'],
    ['sinx', '{\\sin{{x}}}'],
    ['lcm(a,b)', '{\\text{lcm}{{\\left({a},{b}\\right)}}}'],
    ['mod', '\\text{mod}'],
    ['dx', '{\\left.{d}{x}\\right.}'],
    ['lceiling', '\\lceil'],
    ['cong', '\\stackrel{\\sim}{=}'],
    ['divide', '\\div'],
    ['implies', '\\Rightarrow'],
    ['iff', '\\Leftrightarrow'],
    ['newline', '\\\\'],
    ['alpha beta Gamma Delta', '\\alpha\\beta\\Gamma\\Delta'],
    ['3.14', '{3.14}'],
    ['-3.14', '-{3.14}'],
    ['1/2', '\\frac{{1}}{{2}}'],
    ['x_i^2', '{{x}_{{i}}^{{2}}}'],
    ['x_i', '{x}_{{i}}'],
    ['x^2', '{x}^{{2}}'],
    ['a_b_c', '{a}_{{b}}_{c}'],
    ['CC NN QQ RR ZZ', '\\mathbb{C}\\mathbb{N}\\mathbb{Q}\\mathbb{R}\\mathbb{Z}'],
    ['%', '\\%'],
    ['\\ ', '\\ '],
    ['\'\'\'', '\'\'\''],
    ['prime', '\''],
    [':|:', '|'],
    ['|:x:|', '{\\left|{x}\\right|}'],
    ['left(x right)', '{\\left({x}\\right)}'],
    ['[[1,2,3],[4,5,6]]', '{\\left[\\begin{array}{ccc} {1}&{2}&{3}\\\\{4}&{5}&{6}\\end{array}\\right]}'],
    ['((a),(b),(c))', '{\\left(\\begin{array}{c} {a}\\\\{b}\\\\{c}\\end{array}\\right)}'],
    ['[[a,b,|,c],[d,e,|,f]]', '{\\left[\\begin{array}{cc|c} {a}&{b}&{c}\\\\{d}&{e}&{f}\\end{array}\\right]}'],
    ['sqrt', '\\sqrt{}'],
    ['/x', '/{x}'],
    ['x/', '\\frac{{x}}{}'],
    ['a/b/c', '\\frac{{a}}{{b}}/{c}'],
    ['overset(x)(y)', '{\\overset{{{x}}}{{{y}}}}'],
    ['underset(x)(y)', '{\\underset{{{x}}}{{{y}}}}'],
    ['Abs(x)', '{\\left|{{x}}\\right|}'],
    ['Sqrt(x)', '{\\Sqrt{{{x}}}}'],
    ['overarc(x)', '\\stackrel{\\frown}{{{x}}}'],
    ['setminus', '\\setminus'],
    ['-<=', '\\preceq'],
    ['>-=', '\\succeq'],
    [':\'', '\\because'],
    ['/_\\', '\\triangle'],
    ['qquad', '\\qquad'],
    ['{:d x:}', '{\\left.{d}{x}\\right.}'],
    ['Lim', '\\Lim'],
    ['lub glb', '\\lub\\glb'],
    ['det(A)', '{\\det{{\\left({A}\\right)}}}'],
    ['exp(x)', '{\\exp{{\\left({x}\\right)}}}'],
    ['dim', '\\dim'],
    ['max min', '\\max\\min'],
    ['uarr darr rarr harr hArr', '\\uparrow\\downarrow\\rightarrow\\leftrightarrow\\Leftrightarrow'],
    ['>->>', '\\twoheadrightarrowtail'],
    ['|->', '\\mapsto'],
    ['_|_', '\\bot'],
    ['TT', '\\top'],
    ['|--', '\\vdash'],
    ['|==', '\\models'],
    ['O/', '\\emptyset'],
    ['oo', '\\infty'],
    ['aleph', '\\aleph'],
    ['...', '\\ldots'],
    [':.', '\\therefore'],
    ['frown', '\\frown'],
    ['square', '\\boxempty'],
    ['|__x__|', '\\lfloor{x}\\rfloor'],
    ['|~x~|', '\\lceil{x}\\rceil'],
    ['a/-b', '\\frac{{a}}{{-{{b}}}}'],
    ['x^-2', '{x}^{{-{{2}}}}'],
    ['x_-1', '{x}_{{-{{1}}}}'],
    ['sqrt{x}', '\\sqrt{{{x}}}'],
    ['{x}/{y}', '\\frac{{{x}}}{{{y}}}'],
    ['(a)/(b)', '\\frac{{{a}}}{{{b}}}'],
    ['text[abc]', '\\text{abc}'],
    ['text(a b )', '\\text{a b }\\ '],
    ['text( a)', '\\ \\text{ a}'],
    ['text{ a }', '\\ \\text{ a }\\ '],
    ['"a b "', '\\text{a b }\\ '],
    ['" a"', '\\ \\text{ a}'],
    ['text{abc', '\\text{abc}'],
    ['mbox[q]', '\\text{q}'],
    ['f/x', '\\frac{{f}}{{x}}'],
    ['f|x', '{f}{\\mid}{x}'],
    ['f,x', '{f},{x}'],
    ['fx', '{f}{x}'],
    ['f^2(x)', '{{f}^{{2}}{\\left({x}\\right)}}'],
    ['sin^2(x)', '{{\\sin}^{{2}}{\\left({x}\\right)}}'],
    ['root)', '{\\sqrt[{)}]{}}'],
    ['frac)', '{\\frac{{)}}{}}'],
    ['root(3))', '{\\sqrt[{{3}}]{{)}}}'],
    [')x', '{)}{x}'],
    ['x^)', '{x}^{{)}}'],
    ['x/)', '\\frac{{x}}{{)}}'],
    ['[[a,b],[c]]', '{\\left[{\\left[{a},{b}\\right]},{\\left[{c}\\right]}\\right]}'],
    ['[[a,b],[c,d],[e,f]]', '{\\left[\\begin{array}{cc} {a}&{b}\\\\{c}&{d}\\\\{e}&{f}\\end{array}\\right]}'],
    ['(x', '{\\left({x}\\right.}'],
    ['x)', '{x}{)}'],
    ['{x:}', '{\\left\\lbrace{x}\\right.}'],
    ['abs{x}', '{\\left|{{x}}\\right|}'],
    ['bb{x}', '{\\mathbf{{{x}}}}'],
    ['hat{x}', '\\hat{{{x}}}'],
    ['2^-3', '{2}^{{-{{3}}}}'],
    ['{:x:}/y', '\\frac{{\\left.{x}\\right.}}{{y}}'],
    ['sqrt{:x:}', '\\sqrt{{\\left.{x}\\right.}}'],
    ['[[a,(b)],[c,d]]', '{\\left[\\begin{array}{cc} {a}&{\\left({b}\\right)}\\\\{c}&{d}\\end{array}\\right]}'],
    ['[[a,b],[c,d]', '{\\left[{\\left[{a},{b}\\right]},{\\left[{c},{d}\\right]}\\right.}'],
    ['((a,b),(c,d))', '{\\left(\\begin{array}{cc} {a}&{b}\\\\{c}&{d}\\end{array}\\right)}'],
    ['[(a,b),(c,d)]', '{\\left[\\begin{array}{cc} {a}&{b}\\\\{c}&{d}\\end{array}\\right]}'],
    ['{(a,b),(c,d)}', '{\\left\\lbrace{\\left({a},{b}\\right)},{\\left({c},{d}\\right)}\\right\\rbrace}'],
    ['[[a,|,b],[c,|,d]]', '{\\left[\\begin{array}{c|c} {a}&{b}\\\\{c}&{d}\\end{array}\\right]}'],
    ['(a)', '{\\left({a}\\right)}'],
    ['[a]', '{\\left[{a}\\right]}'],
    ['{a}', '{\\left\\lbrace{a}\\right\\rbrace}'],
    ['(:a:)', '{\\left\\langle{a}\\right\\rangle}'],
    ['<<a>>', '{\\left\\langle{a}\\right\\rangle}'],
    ['|:a:|', '{\\left|{a}\\right|}'],
    [':|a', '{|}{a}'],
    ['x |-- y', '{x}\\vdash{y}'],
    ['lim_(n->oo)(1+1/n)^n', '\\lim_{{{n}\\to\\infty}}{\\left({1}+\\frac{{1}}{{n}}\\right)}^{{n}}'],
    ['Sqrt{x}', '{\\Sqrt{{{x}}}}'],
    ['color(red)x', '{\\textcolor{red}{x}}'],
    ['overset(a)(b)', '{\\overset{{{a}}}{{{b}}}}'],
    ['cancel{x}', '\\cancel{{{x}}}'],
    ['{\\ x}', '{\\left\\lbrace\\ {x}\\right\\rbrace}'],
    ['[[a,b],[c,d]]/2', '\\frac{{\\begin{array}{cc} {a}&{b}\\\\{c}&{d}\\end{array}}}{{2}}'],
    ['sin(x)/cos(x)', '\\frac{{\\sin{{\\left({x}\\right)}}}}{{\\cos{{\\left({x}\\right)}}}}'],
    ['()', '{()}'],
    ['(]', '{(]}'],
    ['[)', '{[)}'],
    ['[]', '{[]}'],
    ['{}', '{\\lbrace}'],
    ['(:)', '{\\langle)}'],
    ['{: :}', '{}'],
    ['((a),(b)', '{\\left({\\left({a}\\right)},{\\left({b}\\right)}\\right.}'],
    ['root(a)', '{\\sqrt[{{a}}]{}}'],
    ['frac(a)', '{\\frac{{{a}}}{}}'],
    ['x^', '{x}^{}'],
    ['x_', '{x}_{}'],
    ['x/', '\\frac{{x}}{}'],
    ['frac()', '{\\frac{{()}}{}}'],
    ['root()', '{\\sqrt[{()}]{}}'],
    ['stackrel()', '{\\stackrel{{()}}{}}'],
    ['[[a,b],[c,d)]', '{\\left[{\\left[{a},{b}\\right]},{\\left[{c},{d}\\right)}\\right]}'],
    ['f,x2', '{f},{x}{2}'],
    ['f(x),g(y)', '{f{{\\left({x}\\right)}}},{g{{\\left({y}\\right)}}}'],
    ['text[a]', '\\text{a}'],
    ['mbox[a]', '\\text{a}'],
    ['"(a)"', '\\text{(a)}'],
    ['(())', '{\\left({()}\\right)}'],
    ['([])', '{\\left({[]}\\right)}'],
    ['{()}', '{\\left\\lbrace{()}\\right\\rbrace}'],
    ['(:():)', '{\\left\\langle{()}\\right\\rangle}'],
    ['[[(a),(b)],[(c),(d)]]', '{\\left[\\begin{array}{c} \\begin{array}{c} {a}\\\\{b}\\end{array}\\\\\\begin{array}{c} {c}\\\\{d}\\end{array}\\end{array}\\right]}'],
    ['[[a,b],[c,d]]]', '{\\left[\\begin{array}{cc} {a}&{b}\\\\{c}&{d}\\end{array}\\right]}{]}'],
    ['sqrt()', '\\sqrt{{()}}'],
    ['abs()', '{\\left|{()}\\right|}'],
    ['(,)', '{\\left(,\\right)}'],
    ['(a,)', '{\\left({a},\\right)}'],
    ['(,a)', '{\\left(,{a}\\right)}'],
    ['[[,],[,]]', '{\\left[\\begin{array}{cc} &\\\\&\\end{array}\\right]}'],
    ['text x', '\\text{x}'],
    ['mbox y', '\\text{y}'],
    ['f', '{f}'],
    ['sin', '{\\sin{}}'],
    ['(root)', '{\\left({\\root}\\right)}'],
    ['(frac)', '{\\left({\\frac}\\right)}'],
    ['(stackrel)', '{\\left({\\stackrel}\\right)}'],
    ['(root(3))', '{\\left({\\root}{\\left({3}\\right)}\\right)}'],
    ['(frac(a))', '{\\left({\\frac}{\\left({a}\\right)}\\right)}'],
    ['(overset(a))', '{\\left({\\overset}{\\left({a}\\right)}\\right)}'],
    ['(x^)', '{\\left({x}^{{}}\\right)}'],
    ['(x_)', '{\\left({x}_{{}}\\right)}'],
    ['(x/)', '{\\left(\\frac{{x}}{{}}\\right)}'],
    ['(x^)/y', '\\frac{{{x}^{{}}}}{{y}}'],
    ['[[a,b}],[c,d]]', '{\\left[{\\left[{a},{b}\\right\\rbrace}\\right]},{\\left[{c},{d}\\right]}{]}'],
    ['[[a,b)],[c,d]]', '{\\left[{\\left[{a},{b}\\right)}\\right]},{\\left[{c},{d}\\right]}{]}'],
    ['[[a,b],[c,d}]]', '{\\left[{\\left[{a},{b}\\right]},{\\left[{c},{d}\\right\\rbrace}\\right]}{]}'],
    ['((a}),(b))', '{\\left({\\left({a}\\right\\rbrace}\\right)},{\\left({b}\\right)}{)}'],
    ['[[a,b],[c,d]}', '{\\left[\\begin{array}{cc} {a}&{b}\\\\{c}&{d}\\end{array}\\right\\rbrace}'],
    ['(a,b}', '{\\left({a},{b}\\right\\rbrace}'],
    ['[a,b}]', '{\\left[{a},{b}\\right\\rbrace}{]}'],
    ['[[a,b],c],[d,e]]', '{\\left[{\\left[{a},{b}\\right]},{c}\\right]},{\\left[{d},{e}\\right]}{]}'],
    ['[[{:a:},b],[c,d]]', '{\\left[\\begin{array}{cc} {\\left.{a}\\right.}&{b}\\\\{c}&{d}\\end{array}\\right]}'],
    ['[[a,|],[c,d]]', '{\\left[{\\left[{a},{\\mid}\\right]},{\\left[{c},{d}\\right]}\\right]}'],
    ['[[a,b],[c,d]],[[e,f],[g,h]]', '{\\left[\\begin{array}{cc} {a}&{b}\\\\{c}&{d}\\end{array}\\right]},{\\left[\\begin{array}{cc} {e}&{f}\\\\{g}&{h}\\end{array}\\right]}'],
    ['[(a,b],[c,d)]', '{\\left[{\\left({a},{b}\\right]},{\\left[{c},{d}\\right)}\\right]}'],
    ['[[a,b]],[c,d]]', '{\\left[\\begin{array}{cc} {a}&{b}\\end{array}\\right]},{\\left[{c},{d}\\right]}{]}'],
    ['((a),b),(c,d))', '{\\left({\\left({a}\\right)},{b}\\right)},{\\left({c},{d}\\right)}{)}'],
    ['[[a,b],[c,d]],x]', '{\\left[\\begin{array}{cc} {a}&{b}\\\\{c}&{d}\\end{array}\\right]},{x}{]}'],
    ['[[abs(a),b],[c,d]]', '{\\left[\\begin{array}{cc} {\\left|{{a}}\\right|}&{b}\\\\{c}&{d}\\end{array}\\right]}'],
    ['[[text(a),b],[c,d]]', '{\\left[\\begin{array}{cc} \\text{a}&{b}\\\\{c}&{d}\\end{array}\\right]}'],
    ['[[a,b],[c,d],e]', '{\\left[{\\left[{a},{b}\\right]},{\\left[{c},{d}\\right]},{e}\\right]}'],
    ['[[a,b],x,[c,d]]', '{\\left[{\\left[{a},{b}\\right]},{x},{\\left[{c},{d}\\right]}\\right]}'],
    ['[[a,b],[c,d]]}]', '{\\left[\\begin{array}{cc} {a}&{b}\\\\{c}&{d}\\end{array}\\right]}{\\rbrace}{]}'],
    ['[x,[a,b],[c,d]]', '{\\left[{x},{\\left[{a},{b}\\right]},{\\left[{c},{d}\\right]}\\right]}'],
    ['[[a,b],[c,d]],', '{\\left[\\begin{array}{cc} {a}&{b}\\\\{c}&{d}\\end{array}\\right]},'],
  ];

  it.each(cases)('%j -> %j', (input, expected) => {
    expect(tex(input)).toBe(expected);
  });
});

describe('getTeX — inputs upstream raises on', () => {
  const cases: readonly string[] = [
    'text',
    '"',
  ];

  it.each(cases)('%j raises, the way the Java does', (input) => {
    expect(() => tex(input)).toThrow();
  });
});

describe('slice (java:77-88) — Java substring bounds, not JS clamping', () => {
  it('past-the-end end falls back to substring(start) (java:78-80)', () => {
    expect(internals().slice('hello', 1, 99)).toBe('ello');
    expect(internals().slice('abc', 0, 10)).toBe('abc');
  });

  it('in-range end is a plain substring (java:81)', () => {
    expect(internals().slice('hello', 1, 3)).toBe('el');
    expect(internals().slice('hello', 0, 0)).toBe('');
  });

  it('the 2-argument form drops the prefix (java:86-88)', () => {
    expect(internals().slice('hello', 2)).toBe('llo');
    expect(internals().slice('hello', 5)).toBe('');
  });

  it('raises where Java raises: start past the length, and start > end', () => {
    expect(() => internals().slice('hello', 6, 7)).toThrow(/StringIndexOutOfBounds/);
    expect(() => internals().slice('hello', 3, 1)).toThrow(/StringIndexOutOfBounds/);
  });
});

describe('substr (java:90-95)', () => {
  it('clamps an over-long length to the rest of the string (java:91-92)', () => {
    expect(internals().substr('hello', 3, 10)).toBe('lo');
  });

  it('takes len characters from pos otherwise (java:94)', () => {
    expect(internals().substr('hello', 1, 2)).toBe('el');
    expect(internals().substr('hello', 0, 5)).toBe('hello');
  });

  it('raises on a negative length, the way Java substring(pos, pos+len) does', () => {
    expect(() => internals().substr('hello', 2, -1)).toThrow(/StringIndexOutOfBounds/);
  });
});

describe('aAMremoveCharsAndBlanks (java:465-477)', () => {
  it('drops n characters then every char <= 32', () => {
    expect(internals().aAMremoveCharsAndBlanks('  x', 0)).toBe('x');
    expect(internals().aAMremoveCharsAndBlanks('ab   cd', 2)).toBe('cd');
    expect(internals().aAMremoveCharsAndBlanks('x', 0)).toBe('x');
    expect(internals().aAMremoveCharsAndBlanks('', 0)).toBe('');
  });

  it('eats one extra char for a backslash escape (java:468-469)', () => {
    expect(internals().aAMremoveCharsAndBlanks('\\alpha', 0)).toBe('alpha');
  });

  it('leaves a doubled backslash and a backslash-space alone (java:468)', () => {
    expect(internals().aAMremoveCharsAndBlanks('\\\\x', 0)).toBe('\\\\x');
    expect(internals().aAMremoveCharsAndBlanks('\\ y', 0)).toBe('\\ y');
  });

  it('raises when the escape test runs off the end (java:468, charAt(n + 1))', () => {
    expect(() => internals().aAMremoveCharsAndBlanks('a\\', 1)).toThrow(
      /StringIndexOutOfBounds/,
    );
  });
});

describe('aAMposition (java:479-496)', () => {
  const names = (): string[] => aAMsymbols.map((t) => t.input);

  it('binary-searches from 0 to the index of the entry (java:482-493)', () => {
    const arr = names();
    expect(internals().aAMposition(arr, 'sqrt', 0)).toBe(295);
    expect(arr[295]).toBe('sqrt');
    expect(internals().aAMposition(arr, 'alpha', 0)).toBe(102);
    expect(arr[102]).toBe('alpha');
    expect(internals().aAMposition(arr, 'AA', 0)).toBe(46);
    expect(arr[46]).toBe('AA');
  });

  it('returns the insertion point for an absent key', () => {
    const arr = names();
    // '{' (0x7B) sorts after 'zzzz', so that is where zzzz would be inserted.
    expect(internals().aAMposition(arr, 'zzzz', 0)).toBe(348);
    expect(arr[348]).toBe('{');
    expect(internals().aAMposition(arr, '', 0)).toBe(0);
  });

  it('scans linearly when n > 0, and stops at the array end (java:494-495)', () => {
    const arr = names();
    expect(internals().aAMposition(arr, 'sqrt', 5)).toBe(295);
    expect(internals().aAMposition(arr, 'sqrt', 400)).toBe(400);
  });
});

describe('aAMgetSymbol (java:498-561) — maximal initial substring', () => {
  it('prefers the longest matching name', () => {
    expect(internals().aAMgetSymbol('*').input).toBe('*');
    expect(internals().aAMgetSymbol('**').input).toBe('**');
    expect(internals().aAMgetSymbol('***').input).toBe('***');
  });

  it('matches a prefix and leaves the rest', () => {
    const sym = internals().aAMgetSymbol('sqrtx');
    expect(sym).toBeInstanceOf(Tuple);
    expect(sym.input).toBe('sqrt');
    expect(sym.tag).toBe('msqrt');
    expect(sym.ttype).toBe(Ttype.UNARY);
  });

  it('returns a DEFINITION entry with its rewrite target as output', () => {
    const sym = internals().aAMgetSymbol('lamda');
    expect(sym.ttype).toBe(Ttype.DEFINITION);
    expect(sym.output).toBe('lambda');
  });

  it('falls back to a maximal digit run tagged mn (java:522-546)', () => {
    expect(internals().aAMgetSymbol('123x').input).toBe('123');
    expect(internals().aAMgetSymbol('123x').tag).toBe('mn');
    expect(internals().aAMgetSymbol('3.14').input).toBe('3.14');
    expect(internals().aAMgetSymbol('3.14').tag).toBe('mn');
  });

  it('tags a single letter mi and a single non-letter mo (java:548-551)', () => {
    expect(internals().aAMgetSymbol('A').tag).toBe('mi');
    expect(internals().aAMgetSymbol('#').tag).toBe('mo');
    expect(internals().aAMgetSymbol('#').input).toBe('#');
  });

  it('takes one character when no name matches (java:549)', () => {
    expect(internals().aAMgetSymbol('abcdef').input).toBe('a');
  });

  it('greek names resolve to their unicode output', () => {
    expect(internals().aAMgetSymbol('alpha').output).toBe('α');
  });
});

describe('the symbol table after aAMinitSymbols (java:443-462)', () => {
  it('holds the 272 declared entries plus 92 TeX-name aliases', () => {
    // 272 `new Tuple`/named-tuple elements are declared at java:154-439; the
    // 364 total is what upstream's own `aAMsymbols` field reports after its
    // static initialiser runs (read back by reflection out of the jar).
    expect(aAMsymbols).toHaveLength(364);
  });

  it('is sorted by input, ascending, in UTF-16 code-unit order', () => {
    for (let i = 1; i < aAMsymbols.length; i++) {
      expect(aAMsymbols[i - 1]!.input <= aAMsymbols[i]!.input).toBe(true);
    }
    expect(aAMsymbols[0]!.input).toBe('!=');
    expect(aAMsymbols[aAMsymbols.length - 1]!.input).toBe('~~');
  });

  it('keeps the quote tuple by identity, so the TEXT branch can test it', () => {
    expect(aAMsymbols).toContain(aAMquote);
    expect(aAMquote.input).toBe('"');
    expect(aAMquote.output).toBe('mbox');
  });

  it('carries rewriteleftright pairs on abs/norm/floor/ceil (java:388-391)', () => {
    const abs = aAMsymbols.find((t) => t.input === 'abs')!;
    expect(abs.rewriteleftright).toEqual(['|', '|']);
    expect(abs.hasFlag(Flag.NOTEXCOPY)).toBe(true);
    expect(abs.hasFlag(Flag.ACC)).toBe(false);
    const floor = aAMsymbols.find((t) => t.input === 'floor')!;
    expect(floor.rewriteleftright).toEqual(['\\lfloor', '\\rfloor']);
  });

  it('copies the ACC flag onto an accent alias but not onto a plain one', () => {
    // `bar` has tex `overline` and Flag.ACC, so java:449-450 clones it under
    // the name `overline`, ACC included; `<=` has tex `le` and no flags.
    const overline = aAMsymbols.find((t) => t.input === 'overline')!;
    expect(overline.hasFlag(Flag.ACC)).toBe(true);
    expect(overline.tex).toBeNull();
    const le = aAMsymbols.find((t) => t.input === 'le')!;
    expect(le.hasFlag(Flag.ACC)).toBe(false);
    expect(le.output).toBe('≤');
  });

  it('does not alias an entry flagged NOTEXCOPY (java:445)', () => {
    expect(aAMsymbols.some((t) => t.input === 'mathbb{C}')).toBe(false);
  });
});

describe('patchColor (java:1018-1020)', () => {
  it('rewrites every \\color{, not just the first', () => {
    expect(tex('color(red)(x)+color(blue)(y)')).toBe(
      '{\\textcolor{red}{{x}}}+{\\textcolor{blue}{{y}}}',
    );
  });
});

describe('AsciiMath (math/AsciiMath.java)', () => {
  it('getSource returns exactly what ASCIIMathTeXImg#getTeX produced', () => {
    expect(new AsciiMath('x/y').getSource()).toBe(tex('x/y'));
    expect(new AsciiMath('x/y').getSource()).toBe('\\frac{{x}}{{y}}');
  });

  it('propagates a converter raise, which is what fromAsciiMath catches', () => {
    expect(() => new AsciiMath('text')).toThrow(/StringIndexOutOfBounds/);
  });
});

/**
 * ASCIIMathTeXImg — a faithful transcription of upstream's
 * `math/ASCIIMathTeXImg.java` (1032 lines): the ASCIIMath-notation to LaTeX
 * converter reached from `AsciiMath`'s constructor, and through it from
 * `ScientificEquationSafe.fromAsciiMath` and the `<math>` creole command.
 *
 * The symbol table lives in `ASCIIMathTeXImgSymbols.ts`; this file is the
 * algorithm — `aAMinitSymbols`/`refreshSymbols` (java:443-462) and the
 * recursive-descent parser (java:465-1028), with upstream's method names,
 * branch order and mutation preserved verbatim so the two files diff.
 *
 * ## Java string semantics are ported, not assumed
 *
 * Upstream defines its own `slice`/`substr` helpers (java:77-90) on top of
 * `String.substring`, and calls `String.charAt`/`compareTo` throughout. None
 * of the three behaves like its JavaScript near-namesake:
 *
 *  - `String.substring` THROWS `StringIndexOutOfBoundsException` for a
 *    negative begin, an end past the length, or begin > end; JS `substring`
 *    silently clamps and swaps. `aAMTremoveBrackets`'s `\rbrace}` branch
 *    (java:590-592) computes `length - 14` on a string that can be shorter
 *    than 14, and the matrix splitter (java:938-967) computes negative
 *    `substr` lengths on malformed input — both raise in Java and would
 *    silently emit different LaTeX under JS clamping.
 *  - `String.charAt` THROWS past the end; JS `charAt` returns `''`. Reached
 *    for e.g. the bare input `text` (java:687, `str.charAt(0)` on an empty
 *    remainder).
 *  - `String.compareTo` is a UTF-16 code-unit comparison returning an int;
 *    JS has no equivalent method, and `localeCompare` is NOT it.
 *
 * Every one of those throws propagates to `ScientificEquationSafe`'s
 * `catch (Exception e)` (java:71-79), which is the difference between "this
 * formula falls back to plain text" and "this formula renders wrong LaTeX".
 * So `javaSubstring`/`javaCharAt`/`javaCompareTo` below reproduce the Java
 * contract exactly, including the exceptions, and every upstream call site
 * routes through them.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/math/ASCIIMathTeXImg.java
 */
import { Flag, Ttype, Tuple, aAMquote, aAMsymbols } from './ASCIIMathTeXImgSymbols.js';

/**
 * `java.lang.String#substring(int, int)` / `#substring(int)`, exceptions
 * included — see this file's module doc comment for why JS `substring`
 * cannot be used in its place.
 */
function javaSubstring(str: string, beginIndex: number): string;
function javaSubstring(str: string, beginIndex: number, endIndex: number): string;
function javaSubstring(str: string, beginIndex: number, endIndex?: number): string {
  const end = endIndex === undefined ? str.length : endIndex;
  if (beginIndex < 0 || end > str.length || beginIndex > end) {
    throw new Error(
      `StringIndexOutOfBoundsException: begin ${String(beginIndex)}, end ${String(end)}, length ${String(str.length)}`,
    );
  }
  return str.slice(beginIndex, end);
}

/** `java.lang.String#charAt(int)`, exception included. */
function javaCharAt(str: string, index: number): string {
  if (index < 0 || index >= str.length) {
    throw new Error(
      `StringIndexOutOfBoundsException: index ${String(index)}, length ${String(str.length)}`,
    );
  }
  return str.charAt(index);
}

/** `java.lang.String#compareTo(String)` — UTF-16 code-unit lexicographic. */
function javaCompareTo(a: string, b: string): number {
  const lim = Math.min(a.length, b.length);
  for (let k = 0; k < lim; k++) {
    const c1 = a.charCodeAt(k);
    const c2 = b.charCodeAt(k);
    if (c1 !== c2) {
      return c1 - c2;
    }
  }
  return a.length - b.length;
}

/** java:441. */
let aAMnames: string[] = [];

/** java:443-454. Appends a TeX-name alias for every entry that carries one. */
function aAMinitSymbols(): void {
  const symlen = aAMsymbols.length;
  for (let i = 0; i < symlen; i++) {
    const entry = aAMsymbols[i]!;
    if (entry.tex !== null && !entry.hasFlag(Flag.NOTEXCOPY)) {
      const tmp = entry.hasFlag(Flag.ACC)
        ? new Tuple(entry.tex, entry.tag, entry.output, null, entry.ttype, Flag.ACC)
        : new Tuple(entry.tex, entry.tag, entry.output, null, entry.ttype);
      aAMsymbols.push(tmp);
    }
  }
  refreshSymbols();
}

/** java:456-462. */
function refreshSymbols(): void {
  aAMsymbols.sort((o1, o2) => javaCompareTo(o1.input, o2.input));
  aAMnames = new Array<string>(aAMsymbols.length);
  for (let i = 0; i < aAMsymbols.length; i++) {
    aAMnames[i] = aAMsymbols[i]!.input;
  }
}

/**
 * A `[node, remainder]` pair — upstream's `String[]` of length 2, whose
 * first element is nullable (java:632, `new String[] { null, str }`).
 */
type ParseResult = [string | null, string];

export class ASCIIMathTeXImg {
  /** java:73-75. */
  private aAMnestingDepth = 0;
  private aAMpreviousSymbol: Ttype = Ttype.CONST;
  private aAMcurrentSymbol: Ttype = Ttype.CONST;

  /** java:77-84 (3-arg) and java:86-88 (2-arg). */
  private slice(str: string, start: number, end?: number): string {
    if (end === undefined) {
      return javaSubstring(str, start);
    }
    if (end > str.length) {
      return javaSubstring(str, start);
    }
    return javaSubstring(str, start, end);
  }

  /** java:90-95. */
  private substr(str: string, pos: number, len: number): string {
    if (pos + len > str.length) {
      return javaSubstring(str, pos);
    }
    return javaSubstring(str, pos, pos + len);
  }

  /** java:465-477. */
  private aAMremoveCharsAndBlanks(str: string, n: number): string {
    // remove n characters and any following blanks
    let st: string;
    if (
      str.length > 1 &&
      str.length > n &&
      javaCharAt(str, n) === '\\' &&
      javaCharAt(str, n + 1) !== '\\' &&
      javaCharAt(str, n + 1) !== ' '
    ) {
      st = this.slice(str, n + 1);
    } else {
      st = this.slice(str, n);
    }
    let i: number;
    for (i = 0; i < st.length && st.charCodeAt(i) <= 32; i = i + 1);
    return this.slice(st, i);
  }

  /** java:479-496. */
  private aAMposition(arr: string[], str: string, n: number): number {
    // return position >=n where str appears or would be inserted
    // assumes arr is sorted
    let i = 0;
    if (n === 0) {
      let h: number;
      let m: number;
      n = -1;
      h = arr.length;
      while (n + 1 < h) {
        m = (n + h) >> 1;
        if (javaCompareTo(arr[m]!, str) < 0) {
          n = m;
        } else {
          h = m;
        }
      }
      return h;
    } else {
      for (i = n; i < arr.length && javaCompareTo(arr[i]!, str) < 0; i++);
    }
    return i; // i=arr.length || arr[i]>=str
  }

  /** java:498-561. */
  private aAMgetSymbol(str: string): Tuple {
    // return maximal initial substring of str that appears in names
    // return null if there is none
    let k = 0; // new pos
    let j = 0; // old pos
    let mk = 0; // match pos
    let st: string;
    let tagst: string;
    let match = '';
    let more = true;
    for (let i = 1; i <= str.length && more; i++) {
      st = javaSubstring(str, 0, i); // initial substring of length i
      j = k;
      k = this.aAMposition(aAMnames, st, j);
      if (k < aAMnames.length && this.slice(str, 0, aAMnames[k]!.length) === aAMnames[k]) {
        match = aAMnames[k]!;
        mk = k;
        i = match.length;
      }
      more =
        k < aAMnames.length &&
        javaCompareTo(this.slice(str, 0, aAMnames[k]!.length), aAMnames[k]!) >= 0;
    }
    this.aAMpreviousSymbol = this.aAMcurrentSymbol;
    if (match !== '') {
      this.aAMcurrentSymbol = aAMsymbols[mk]!.ttype;
      return aAMsymbols[mk]!;
    }
    // if str[0] is a digit or - return maxsubstring of digits.digits
    this.aAMcurrentSymbol = Ttype.CONST;
    k = 1;
    st = this.slice(str, 0, 1);
    let integ = true;

    while (javaCompareTo('0', st) <= 0 && javaCompareTo(st, '9') <= 0 && k <= str.length) {
      st = this.slice(str, k, k + 1);
      k++;
    }

    if (st === '.') {
      st = this.slice(str, k, k + 1);
      if (javaCompareTo('0', st) <= 0 && javaCompareTo(st, '9') <= 0) {
        integ = false;
        k++;
        while (javaCompareTo('0', st) <= 0 && javaCompareTo(st, '9') <= 0 && k <= str.length) {
          st = this.slice(str, k, k + 1);
          k++;
        }
      }
    }
    if ((integ && k > 1) || k > 2) {
      st = this.slice(str, 0, k - 1);
      tagst = 'mn';
    } else {
      //k = 2;
      st = this.slice(str, 0, 1); // take 1 character
      tagst =
        (javaCompareTo('A', st) > 0 || javaCompareTo(st, 'Z') > 0) &&
        (javaCompareTo('a', st) > 0 || javaCompareTo(st, 'z') > 0)
          ? 'mo'
          : 'mi';
    }
    if (
      st === '-' &&
      str.length > 1 &&
      javaCharAt(str, 1) !== ' ' &&
      this.aAMpreviousSymbol === Ttype.INFIX
    ) {
      this.aAMcurrentSymbol = Ttype.INFIX;
      return new Tuple(st, tagst, st, null, Ttype.UNARY, Flag.FUNC, Flag.VAL);
    }
    return new Tuple(st, tagst, st, null, Ttype.CONST, Flag.VAL); // added val bit
  }

  /** java:563-597. */
  private aAMTremoveBrackets(node: string): string {
    let st: string;
    if (node.length > 1 && javaCharAt(node, 0) === '{' && javaCharAt(node, node.length - 1) === '}') {
      let leftchop = 0;

      st = this.substr(node, 1, 5);
      if (st === '\\left') {
        st = javaCharAt(node, 6);
        if (st === '(' || st === '[' || st === '{') {
          leftchop = 7;
        } else {
          st = this.substr(node, 6, 7);
          if (st === '\\lbrace') {
            leftchop = 13;
          }
        }
      } else {
        st = javaCharAt(node, 1);
        if (st === '(' || st === '[') {
          leftchop = 2;
        }
      }
      if (leftchop > 0 && node.length > 8) {
        st = javaSubstring(node, node.length - 8);
        if (st === '\\right)}' || st === '\\right]}' || st === '\\right.}') {
          node = '{' + javaSubstring(node, leftchop);
          node = javaSubstring(node, 0, node.length - 8) + '}';
        } else if (st === '\\rbrace}') {
          node = '{' + javaSubstring(node, leftchop);
          node = javaSubstring(node, 0, node.length - 14) + '}';
        }
      }
    }
    return node;
  }

  /* Parsing ASCII math expressions with the following grammar:
  v ::= [A-Za-z] | greek letters | numbers | other constant symbols
  u ::= sqrt | text | bb | other unary symbols for font commands
  b ::= frac | root | stackrel         binary symbols
  l ::= ( | [ | { | (: | {:            left brackets
  r ::= ) | ] | } | :) | :}            right brackets
  S ::= v | lEr | uS | bSS             Simple expression
  I ::= S_S | S^S | S_S^S | S          Intermediate expression
  E ::= IE | I/I                       Expression
  */

  /** java:611-624. */
  private aAMTgetTeXsymbol(symb: Tuple): string {
    let pre: string;
    if (symb.hasFlag(Flag.VAL)) {
      pre = '';
    } else {
      pre = '\\';
    }
    if (symb.tex === null) {
      // can't remember why this was here. Breaks /delta /Delta to removed
      // return (pre+(pre==''?symb.input:symb.input.toLowerCase()));
      return pre + symb.input;
    } else {
      return pre + symb.tex;
    }
  }

  /** java:626-791. */
  private aAMTparseSexpr(str: string): ParseResult {
    let symbol: Tuple;
    let i: number;
    let node: string;
    let st: string;
    let newFrag = '';
    let result: ParseResult;
    str = this.aAMremoveCharsAndBlanks(str, 0);
    symbol = this.aAMgetSymbol(str); // either a token or a bracket or empty
    // java:631 reads `if (symbol == null || symbol.ttype == RIGHTBRACKET &&
    // aAMnestingDepth > 0)`. The `symbol == null` disjunct is dead upstream
    // too: every one of `aAMgetSymbol`'s three exits (java:557, java:559,
    // java:560) returns a Tuple, despite its comment claiming otherwise. It is
    // dropped rather than transcribed as an unreachable branch.
    if (symbol.ttype === Ttype.RIGHTBRACKET && this.aAMnestingDepth > 0) {
      return [null, str];
    }
    if (symbol.ttype === Ttype.DEFINITION) {
      str = symbol.output! + this.aAMremoveCharsAndBlanks(str, symbol.input.length);
      symbol = this.aAMgetSymbol(str);
    }
    switch (symbol.ttype) {
      case Ttype.UNDEROVER:
      case Ttype.CONST: {
        str = this.aAMremoveCharsAndBlanks(str, symbol.input.length);
        const texsymbol = this.aAMTgetTeXsymbol(symbol);
        if (texsymbol.length === 0 || javaCharAt(texsymbol, 0) === '\\' || symbol.tag === 'mo') {
          return [texsymbol, str];
        } else {
          return ['{' + texsymbol + '}', str];
        }
      }

      case Ttype.LEFTBRACKET: {
        // read (expr+)
        this.aAMnestingDepth++;
        str = this.aAMremoveCharsAndBlanks(str, symbol.input.length);

        const bracketResult = this.aAMTparseExpr(str, true);
        this.aAMnestingDepth--;
        let leftchop = 0;
        if (this.substr(bracketResult[0], 0, 6) === '\\right') {
          st = javaCharAt(bracketResult[0], 6);
          if (st === ')' || st === ']' || st === '}') {
            leftchop = 6;
          } else if (st === '.') {
            leftchop = 7;
          } else {
            st = this.substr(bracketResult[0], 6, 7);
            if (st === '\\rbrace') {
              leftchop = 13;
            }
          }
        }
        if (leftchop > 0) {
          bracketResult[0] = javaSubstring(bracketResult[0], leftchop);
          if (symbol.hasFlag(Flag.INVISIBLE)) {
            node = '{' + bracketResult[0] + '}';
          } else {
            node = '{' + this.aAMTgetTeXsymbol(symbol) + bracketResult[0] + '}';
          }
        } else {
          if (symbol.hasFlag(Flag.INVISIBLE)) {
            node = '{\\left.' + bracketResult[0] + '}';
          } else {
            node = '{\\left' + this.aAMTgetTeXsymbol(symbol) + bracketResult[0] + '}';
          }
        }
        return [node, bracketResult[1]];
      }

      case Ttype.TEXT:
        if (symbol !== aAMquote) {
          str = this.aAMremoveCharsAndBlanks(str, symbol.input.length);
        }
        if (javaCharAt(str, 0) === '{') {
          i = str.indexOf('}');
        } else if (javaCharAt(str, 0) === '(') {
          i = str.indexOf(')');
        } else if (javaCharAt(str, 0) === '[') {
          i = str.indexOf(']');
        } else if (symbol === aAMquote) {
          i = str.indexOf('"', 1);
        } else {
          i = 0;
        }
        if (i === -1) {
          i = str.length;
        }
        if (i === 0) {
          newFrag = '\\text{' + javaCharAt(str, 0) + '}';
        } else {
          st = javaSubstring(str, 1, i);
          if (javaCharAt(st, 0) === ' ') {
            newFrag = '\\ ';
          }
          newFrag += '\\text{' + st + '}';
          if (javaCharAt(st, st.length - 1) === ' ') {
            newFrag += '\\ ';
          }
        }
        if (i === str.length) {
          i = i - 1;
        }
        str = this.aAMremoveCharsAndBlanks(str, i + 1);
        return [newFrag, str];

      case Ttype.UNARY:
        str = this.aAMremoveCharsAndBlanks(str, symbol.input.length);
        result = this.aAMTparseSexpr(str);
        if (result[0] === null) {
          return ['{' + this.aAMTgetTeXsymbol(symbol) + '}', str];
        }
        if (symbol.hasFlag(Flag.FUNC)) {
          // functions hack
          st = str.length === 0 ? '' : javaCharAt(str, 0);
          if (
            st === '^' ||
            st === '_' ||
            st === '/' ||
            st === '|' ||
            st === ',' ||
            (symbol.input.length === 1 && /^\w$/.test(symbol.input) && st !== '(')
          ) {
            return ['{' + this.aAMTgetTeXsymbol(symbol) + '}', str];
          } else {
            node = '{' + this.aAMTgetTeXsymbol(symbol) + '{' + result[0] + '}}';
            return [node, result[1]];
          }
        }
        result[0] = this.aAMTremoveBrackets(result[0]);
        if (symbol.input === 'sqrt') {
          // sqrt
          return ['\\sqrt{' + result[0] + '}', result[1]];
        } else if (symbol.input === 'cancel') {
          // cancel
          return ['\\cancel{' + result[0] + '}', result[1]];
        } else if (symbol.rewriteleftright !== null) {
          // abs, floor, ceil
          return [
            '{\\left' + symbol.rewriteleftright[0]! + result[0] + '\\right' + symbol.rewriteleftright[1]! + '}',
            result[1],
          ];
        } else if (symbol.hasFlag(Flag.ACC)) {
          // accent
          return [this.aAMTgetTeXsymbol(symbol) + '{' + result[0] + '}', result[1]];
        } else {
          // font change command
          return ['{' + this.aAMTgetTeXsymbol(symbol) + '{' + result[0] + '}}', result[1]];
        }
      case Ttype.BINARY: {
        str = this.aAMremoveCharsAndBlanks(str, symbol.input.length);
        result = this.aAMTparseSexpr(str);
        if (result[0] === null) {
          return ['{' + this.aAMTgetTeXsymbol(symbol) + '}', str];
        }
        result[0] = this.aAMTremoveBrackets(result[0]);
        const result2 = this.aAMTparseSexpr(result[1]);
        if (result2[0] === null) {
          return ['{' + this.aAMTgetTeXsymbol(symbol) + '}', str];
        }
        result2[0] = this.aAMTremoveBrackets(result2[0]);
        if (symbol.input === 'color') {
          newFrag = '{\\color{' + result[0].replace(/[{}]/g, '') + '}' + result2[0] + '}';
        } else if (symbol.input === 'root') {
          newFrag = '{\\sqrt[' + result[0] + ']{' + result2[0] + '}}';
        } else {
          newFrag = '{' + this.aAMTgetTeXsymbol(symbol) + '{' + result[0] + '}{' + result2[0] + '}}';
        }
        return [newFrag, result2[1]];
      }
      case Ttype.INFIX:
        str = this.aAMremoveCharsAndBlanks(str, symbol.input.length);
        return [symbol.output, str];
      case Ttype.SPACE:
        str = this.aAMremoveCharsAndBlanks(str, symbol.input.length);
        return ['{\\quad\\text{' + symbol.input + '}\\quad}', str];
      case Ttype.LEFTRIGHT: {
        this.aAMnestingDepth++;
        str = this.aAMremoveCharsAndBlanks(str, symbol.input.length);
        const lrResult = this.aAMTparseExpr(str, false);
        this.aAMnestingDepth--;
        st = javaCharAt(lrResult[0], lrResult[0].length - 1);
        if (st === '|' && javaCharAt(str, 0) !== ',') {
          // its an absolute value subterm
          node = '{\\left|' + lrResult[0] + '}';
          return [node, lrResult[1]];
        } else {
          // the "|" is a \mid
          node = '{\\mid}';
          return [node, str];
        }
      }
      default:
        // alert("default");
        str = this.aAMremoveCharsAndBlanks(str, symbol.input.length);
        return ['{' + this.aAMTgetTeXsymbol(symbol) + '}', str];
    }
  }

  /** java:793-841. */
  private aAMTparseIexpr(str: string): ParseResult {
    let sym2: Tuple;
    let result: ParseResult;
    let node: string | null;
    str = this.aAMremoveCharsAndBlanks(str, 0);
    const sym1: Tuple = this.aAMgetSymbol(str);
    result = this.aAMTparseSexpr(str);
    node = result[0];
    str = result[1];
    const symbol: Tuple = this.aAMgetSymbol(str);
    if (symbol.ttype === Ttype.INFIX && symbol.input !== '/') {
      str = this.aAMremoveCharsAndBlanks(str, symbol.input.length);
      result = this.aAMTparseSexpr(str);
      if (result[0] === null) {
        // show box in place of missing argument
        result[0] = '{}';
      } else {
        result[0] = this.aAMTremoveBrackets(result[0]);
      }
      str = result[1];
      if (symbol.input === '_') {
        sym2 = this.aAMgetSymbol(str);
        if (sym2.input === '^') {
          str = this.aAMremoveCharsAndBlanks(str, sym2.input.length);
          const res2 = this.aAMTparseSexpr(str);
          // upstream passes res2[0] straight in; a null here NPEs there, and
          // throws a TypeError here -- both land in fromAsciiMath's catch.
          res2[0] = this.aAMTremoveBrackets(res2[0]!);
          str = res2[1];
          node = '{' + node;
          node += '_{' + result[0] + '}';
          node += '^{' + res2[0] + '}';
          node += '}';
        } else {
          node += '_{' + result[0] + '}';
        }
      } else {
        // must be ^
        node = node + '^{' + result[0] + '}';
      }
      if (sym1.hasFlag(Flag.FUNC)) {
        sym2 = this.aAMgetSymbol(str);
        if (
          sym2.ttype !== Ttype.INFIX &&
          sym2.ttype !== Ttype.RIGHTBRACKET &&
          (sym1.input.length > 1 || sym2.ttype === Ttype.LEFTBRACKET)
        ) {
          result = this.aAMTparseIexpr(str);
          node = '{' + node + result[0] + '}';
          str = result[1];
        }
      }
    }
    return [node, str];
  }

  /** java:843-1016. */
  private aAMTparseExpr(str: string, rightbracket: boolean): [string, string] {
    let result: ParseResult;
    let symbol!: Tuple;
    let node: string | null;
    // var symbol, node, result, i, nodeList = [],
    let newFrag = '';
    let addedright = false;
    do {
      str = this.aAMremoveCharsAndBlanks(str, 0);
      result = this.aAMTparseIexpr(str);
      node = result[0];
      str = result[1];
      symbol = this.aAMgetSymbol(str);

      if (symbol.ttype === Ttype.INFIX && symbol.input === '/') {
        str = this.aAMremoveCharsAndBlanks(str, symbol.input.length);
        result = this.aAMTparseIexpr(str);

        if (result[0] === null) {
          // show box in place of missing argument
          result[0] = '{}';
        } else {
          result[0] = this.aAMTremoveBrackets(result[0]);
        }
        str = result[1];
        // upstream passes a possibly-null node straight in (java:865); the
        // NPE there and the TypeError here both land in fromAsciiMath's catch.
        node = this.aAMTremoveBrackets(node!);
        node = '\\frac' + '{' + node + '}';
        node += '{' + result[0] + '}';
        newFrag += node;
        symbol = this.aAMgetSymbol(str);
      } else if (node !== null) {
        newFrag += node;
      }
    } while (
      ((symbol.ttype !== Ttype.RIGHTBRACKET && (symbol.ttype !== Ttype.LEFTRIGHT || rightbracket)) ||
        this.aAMnestingDepth === 0) &&
      (symbol.output === null || symbol.output !== '')
    );

    if (symbol.ttype === Ttype.RIGHTBRACKET || symbol.ttype === Ttype.LEFTRIGHT) {
      const len = newFrag.length;
      if (len > 2 && javaCharAt(newFrag, 0) === '{' && newFrag.indexOf(',') > 0) {
        const right = javaCharAt(newFrag, len - 2);
        if (right === ')' || right === ']') {
          const left = javaCharAt(newFrag, 6);
          if (
            (left === '(' && right === ')' && symbol.output !== '}') ||
            (left === '[' && right === ']')
          ) {
            let mxout = '';
            const pos: number[] = []; // position of commas
            pos.push(0);
            let matrix = true;
            let mxnestingd = 0;
            const subpos: (number[] | null)[] = [];
            subpos.push([0]);
            let lastsubposstart = 0;
            let mxanynestingd = 0;
            let columnaligns = '';

            for (let i = 1; i < len - 1; i++) {
              if (javaCharAt(newFrag, i) === left) {
                mxnestingd++;
              }
              if (javaCharAt(newFrag, i) === right) {
                mxnestingd--;
                if (
                  mxnestingd === 0 &&
                  i + 3 < newFrag.length &&
                  javaCharAt(newFrag, i + 2) === ',' &&
                  javaCharAt(newFrag, i + 3) === '{'
                ) {
                  pos.push(i + 2);
                  lastsubposstart = i + 2;
                  while (subpos.length <= lastsubposstart) {
                    subpos.push(null);
                  }
                  subpos[lastsubposstart] = [i + 2];
                }
              }
              if (
                javaCharAt(newFrag, i) === '[' ||
                javaCharAt(newFrag, i) === '(' ||
                javaCharAt(newFrag, i) === '{'
              ) {
                mxanynestingd++;
              }
              if (
                javaCharAt(newFrag, i) === ']' ||
                javaCharAt(newFrag, i) === ')' ||
                javaCharAt(newFrag, i) === '}'
              ) {
                mxanynestingd--;
              }
              if (javaCharAt(newFrag, i) === ',' && mxanynestingd === 1) {
                subpos[lastsubposstart]!.push(i);
              }
              if (mxanynestingd < 0) {
                // happens at the end of the row
                if (lastsubposstart === i + 1) {
                  // if at end of row, skip to next row
                  i++;
                } else {
                  // misformed something - abandon treating as a matrix
                  matrix = false;
                }
              }
            }

            pos.push(len);
            let lastmxsubcnt = -1;
            if (mxnestingd === 0 && pos.length !== 0 && matrix) {
              for (let i = 0; i < pos.length - 1; i++) {
                let subarr: string[];
                if (i > 0) {
                  mxout += '\\\\';
                }
                // `sub` aliases upstream's repeated `subpos.get(pos.get(i))`
                // (java:938-967) -- same value, read the same number of times.
                const sub = subpos[pos[i]!]!;
                if (i === 0) {
                  // var subarr = newFrag.substr(pos[i]+7,pos[i+1]-pos[i]-15).split(',');
                  if (sub.length === 1) {
                    subarr = [this.substr(newFrag, pos[i]! + 7, pos[i + 1]! - pos[i]! - 15)];
                  } else {
                    subarr = [javaSubstring(newFrag, pos[i]! + 7, sub[1]!)];
                    for (let j = 2; j < sub.length; j++) {
                      subarr.push(javaSubstring(newFrag, sub[j - 1]! + 1, sub[j]!));
                    }
                    subarr.push(javaSubstring(newFrag, sub[sub.length - 1]! + 1, pos[i + 1]! - 8));
                  }
                } else {
                  // var subarr = newFrag.substr(pos[i]+8,pos[i+1]-pos[i]-16).split(',');
                  if (sub.length === 1) {
                    subarr = [this.substr(newFrag, pos[i]! + 8, pos[i + 1]! - pos[i]! - 16)];
                  } else {
                    subarr = [javaSubstring(newFrag, pos[i]! + 8, sub[1]!)];
                    for (let j = 2; j < sub.length; j++) {
                      subarr.push(javaSubstring(newFrag, sub[j - 1]! + 1, sub[j]!));
                    }
                    subarr.push(javaSubstring(newFrag, sub[sub.length - 1]! + 1, pos[i + 1]! - 8));
                  }
                }
                for (let j = subarr.length - 1; j >= 0; j--) {
                  if (subarr[j] === '{\\mid}') {
                    if (i === 0) {
                      columnaligns = '|' + columnaligns;
                    }
                    subarr.splice(j, 1);
                  } else if (i === 0) {
                    columnaligns = 'c' + columnaligns;
                  }
                }
                if (lastmxsubcnt > 0 && subarr.length !== lastmxsubcnt) {
                  matrix = false;
                } else if (lastmxsubcnt === -1) {
                  lastmxsubcnt = subarr.length;
                }
                // mxout += subarr.join('&');
                for (let z = 0; z < subarr.length; z++) {
                  mxout += subarr[z];
                  if (z < subarr.length - 1) {
                    mxout += '&';
                  }
                }
              }
            }
            mxout = '\\begin{array}{' + columnaligns + '} ' + mxout + '\\end{array}';

            if (matrix) {
              newFrag = mxout;
            }
          }
        }
      }
      str = this.aAMremoveCharsAndBlanks(str, symbol.input.length);
      if (!symbol.hasFlag(Flag.INVISIBLE)) {
        node = '\\right' + this.aAMTgetTeXsymbol(symbol);
        newFrag += node;
        addedright = true;
      } else {
        newFrag += '\\right.';
        addedright = true;
      }
    }
    if (this.aAMnestingDepth > 0 && !addedright) {
      newFrag += '\\right.'; // adjust for non-matching left brackets
      // todo: adjust for non-matching right brackets
    }
    return [newFrag, str];
  }

  /** java:1018-1020. */
  private patchColor(latex: string): string {
    return latex.replaceAll('\\color{', '\\textcolor{');
  }

  /** java:1022-1028. */
  getTeX(asciiMathInput: string): string {
    this.aAMnestingDepth = 0;
    this.aAMpreviousSymbol = Ttype.CONST;
    this.aAMcurrentSymbol = Ttype.CONST;
    const result = this.aAMTparseExpr(asciiMathInput, false)[0];
    return this.patchColor(result);
  }
}

// java:1030 -- upstream's `static {}` block. Java runs it once at class
// initialisation; this runs once at module evaluation, and like the Java it
// MUTATES the shared `aAMsymbols` array (appending TeX-name aliases) before
// sorting it and filling `aAMnames`.
aAMinitSymbols();

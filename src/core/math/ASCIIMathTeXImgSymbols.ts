/**
 * ASCIIMathTeXImgSymbols — the data half of upstream's
 * `math/ASCIIMathTeXImg.java`: the `Ttype` (java:96-99) and `Flag`
 * (java:101-104) enums, the `Tuple` record (java:106-141), the ten named
 * tuples (java:142-151) and the `aAMsymbols` table (java:153-440).
 *
 * Split out of `ASCIIMathTeXImg.ts` so the ~290-line table sits beside
 * nothing else. Every entry keeps upstream's exact order, spelling, `\\uXXXX`
 * escapes and flag set: `refreshSymbols` (java:456-462) re-sorts the list at
 * module init and `aAMgetSymbol` (java:502-561) binary-searches it, so a
 * single altered `input`/`output`/`tex` string silently emits valid-looking
 * LaTeX for the wrong glyph. Double-quoted string literals are kept from the
 * Java verbatim (identical `\\\\`/`\\uXXXX` escape semantics in both
 * languages) so the two tables diff line for line.
 *
 * `aAMsymbols` is deliberately a MUTABLE module-level array: upstream's
 * `aAMinitSymbols` (java:443-454) appends TeX-name aliases to the very same
 * `static final List`, and `refreshSymbols` sorts it in place. That mutation
 * is mirrored in `ASCIIMathTeXImg.ts`, which owns initialisation exactly as
 * upstream's `static {}` block (java:1030) owns it there.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/math/ASCIIMathTeXImg.java
 */

/** Token types. java:95-99. */
export enum Ttype {
  CONST,
  UNARY,
  BINARY,
  INFIX,
  LEFTBRACKET,
  RIGHTBRACKET,
  SPACE,
  UNDEROVER,
  DEFINITION,
  LEFTRIGHT,
  TEXT,
}

/** Flag. java:101-104. */
export enum Flag {
  ACC,
  VAL,
  FUNC,
  INVISIBLE,
  NOTEXCOPY,
}

/**
 * java:106-141. Upstream declares two constructors — one taking a leading
 * `String[] rewriteleftright` (java:114-124), one without (java:126-134).
 * TypeScript cannot overload a constructor whose tail is a rest parameter, so
 * the common form stays the constructor and the five entries carrying a
 * `rewriteleftright` pair use the `withRewrite` static factory. Field set,
 * nullability and `hasFlag` are otherwise unchanged; `rewriteleftright` is
 * the one field not marked `readonly`, because `withRewrite` assigns it
 * immediately after construction in place of upstream's second constructor.
 */
export class Tuple {
  readonly input: string;
  readonly tag: string;
  readonly output: string | null;
  readonly tex: string | null;
  readonly ttype: Ttype;
  rewriteleftright: readonly string[] | null;
  private readonly flags: readonly Flag[];

  /** java:126-134. */
  constructor(
    input: string,
    tag: string,
    output: string | null,
    tex: string | null,
    ttype: Ttype,
    ...flags: Flag[]
  ) {
    this.input = input;
    this.tag = tag;
    this.output = output;
    this.tex = tex;
    this.ttype = ttype;
    this.flags = flags;
    this.rewriteleftright = null;
  }

  /** java:114-124. */
  static withRewrite(
    rewriteleftright: readonly string[],
    input: string,
    tag: string,
    output: string | null,
    tex: string | null,
    ttype: Ttype,
    ...flags: Flag[]
  ): Tuple {
    const result = new Tuple(input, tag, output, tex, ttype, ...flags);
    result.rewriteleftright = rewriteleftright;
    return result;
  }

  /** java:136-138. */
  hasFlag(flagName: Flag): boolean {
    return this.flags.includes(flagName);
  }
}

// java:142-151 — the named tuples, referenced by identity from the parser
// (`symbol != aAMquote`, java:686) as well as from the table below.
export const aAMsqrt  = new Tuple("sqrt"    , "msqrt", "sqrt"    , null, Ttype.UNARY );
export const aAMroot  = new Tuple("root"    , "mroot", "root"    , null, Ttype.BINARY);
export const aAMfrac  = new Tuple("frac"    , "mfrac", "/"       , null, Ttype.BINARY);
export const aAMdiv   = new Tuple("/"       , "mfrac", "/"       , null, Ttype.INFIX );
export const aAMover  = new Tuple("stackrel", "mover", "stackrel", null, Ttype.BINARY);
export const aAMsub   = new Tuple("_"       , "msub" , "_"       , null, Ttype.INFIX );
export const aAMsup   = new Tuple("^"       , "msup" , "^"       , null, Ttype.INFIX );
export const aAMtext  = new Tuple("text"    , "mtext", "text"    , null, Ttype.TEXT  );
export const aAMmbox  = new Tuple("mbox"    , "mtext", "mbox"    , null, Ttype.TEXT  );
export const aAMquote = new Tuple("\""      , "mtext", "mbox"    , null, Ttype.TEXT  );

/** java:153-440. Mutated in place by `aAMinitSymbols`/`refreshSymbols`. */
export const aAMsymbols: Tuple[] = [
  // some greek symbols
  new Tuple("alpha"     , "mi", "\u03B1", null     , Ttype.CONST     ),
  new Tuple("beta"      , "mi", "\u03B2", null     , Ttype.CONST     ),
  new Tuple("chi"       , "mi", "\u03C7", null     , Ttype.CONST     ),
  new Tuple("delta"     , "mi", "\u03B4", null     , Ttype.CONST     ),
  new Tuple("Delta"     , "mo", "\u0394", null     , Ttype.CONST     ),
  new Tuple("epsi"      , "mi", "\u03B5", "epsilon", Ttype.CONST     ),
  new Tuple("varepsilon", "mi", "\u025B", null     , Ttype.CONST     ),
  new Tuple("eta"       , "mi", "\u03B7", null     , Ttype.CONST     ),
  new Tuple("gamma"     , "mi", "\u03B3", null     , Ttype.CONST     ),
  new Tuple("Gamma"     , "mo", "\u0393", null     , Ttype.CONST     ),
  new Tuple("iota"      , "mi", "\u03B9", null     , Ttype.CONST     ),
  new Tuple("kappa"     , "mi", "\u03BA", null     , Ttype.CONST     ),
  new Tuple("lambda"    , "mi", "\u03BB", null     , Ttype.CONST     ),
  new Tuple("Lambda"    , "mo", "\u039B", null     , Ttype.CONST     ),
  new Tuple("lamda"     , "mi", "lambda", null     , Ttype.DEFINITION),
  new Tuple("Lamda"     , "mi", "Lambda", null     , Ttype.DEFINITION),
  new Tuple("mu"        , "mi", "\u03BC", null     , Ttype.CONST     ),
  new Tuple("nu"        , "mi", "\u03BD", null     , Ttype.CONST     ),
  new Tuple("omega"     , "mi", "\u03C9", null     , Ttype.CONST     ),
  new Tuple("Omega"     , "mo", "\u03A9", null     , Ttype.CONST     ),
  new Tuple("phi"       , "mi", "\u03C6", null     , Ttype.CONST     ),
  new Tuple("varphi"    , "mi", "\u03D5", null     , Ttype.CONST     ),
  new Tuple("Phi"       , "mo", "\u03A6", null     , Ttype.CONST     ),
  new Tuple("pi"        , "mi", "\u03C0", null     , Ttype.CONST     ),
  new Tuple("Pi"        , "mo", "\u03A0", null     , Ttype.CONST     ),
  new Tuple("psi"       , "mi", "\u03C8", null     , Ttype.CONST     ),
  new Tuple("Psi"       , "mi", "\u03A8", null     , Ttype.CONST     ),
  new Tuple("rho"       , "mi", "\u03C1", null     , Ttype.CONST     ),
  new Tuple("sigma"     , "mi", "\u03C3", null     , Ttype.CONST     ),
  new Tuple("Sigma"     , "mo", "\u03A3", null     , Ttype.CONST     ),
  new Tuple("tau"       , "mi", "\u03C4", null     , Ttype.CONST     ),
  new Tuple("theta"     , "mi", "\u03B8", null     , Ttype.CONST     ),
  new Tuple("vartheta"  , "mi", "\u03D1", null     , Ttype.CONST     ),
  new Tuple("Theta"     , "mo", "\u0398", null     , Ttype.CONST     ),
  new Tuple("upsilon"   , "mi", "\u03C5", null     , Ttype.CONST     ),
  new Tuple("xi"        , "mi", "\u03BE", null     , Ttype.CONST     ),
  new Tuple("Xi"        , "mo", "\u039E", null     , Ttype.CONST     ),
  new Tuple("zeta"      , "mi", "\u03B6", null     , Ttype.CONST     ),

  // binary operation symbols
  new Tuple("*"       , "mo"    , "\u22C5"  , "cdot"     , Ttype.CONST                                ),
  new Tuple("**"      , "mo"    , "\u2217"  , "ast"      , Ttype.CONST                                ),
  new Tuple("***"     , "mo"    , "\u22C6"  , "star"     , Ttype.CONST                                ),
  new Tuple("//"      , "mo"    , "/"       , "/"        , Ttype.CONST      , Flag.VAL, Flag.NOTEXCOPY),
  new Tuple("\\\\"    , "mo"    , "\\"      , "backslash", Ttype.CONST                                ),
  new Tuple("setminus", "mo"    , "\\"      , null       , Ttype.CONST                                ),
  new Tuple("xx"      , "mo"    , "\u00D7"  , "times"    , Ttype.CONST                                ),
  new Tuple("|><"     , "mo"    , "\u22C9"  , "ltimes"   , Ttype.CONST                                ),
  new Tuple("><|"     , "mo"    , "\u22CA"  , "rtimes"   , Ttype.CONST                                ),
  new Tuple("|><|"    , "mo"    , "\u22C8"  , "bowtie"   , Ttype.CONST                                ),
  new Tuple("-:"      , "mo"    , "\u00F7"  , "div"      , Ttype.CONST                                ),
  new Tuple("divide"  , "mo"    , "-:"      , null       , Ttype.DEFINITION                           ),
  new Tuple("@"       , "mo"    , "\u2218"  , "circ"     , Ttype.CONST                                ),
  new Tuple("o+"      , "mo"    , "\u2295"  , "oplus"    , Ttype.CONST                                ),
  new Tuple("ox"      , "mo"    , "\u2297"  , "otimes"   , Ttype.CONST                                ),
  new Tuple("o."      , "mo"    , "\u2299"  , "odot"     , Ttype.CONST                                ),
  new Tuple("sum"     , "mo"    , "\u2211"  , null       , Ttype.UNDEROVER                            ),
  new Tuple("prod"    , "mo"    , "\u220F"  , null       , Ttype.UNDEROVER                            ),
  new Tuple("^^"      , "mo"    , "\u2227"  , "wedge"    , Ttype.CONST                                ),
  new Tuple("^^^"     , "mo"    , "\u22C0"  , "bigwedge" , Ttype.UNDEROVER                            ),
  new Tuple("vv"      , "mo"    , "\u2228"  , "vee"      , Ttype.CONST                                ),
  new Tuple("vvv"     , "mo"    , "\u22C1"  , "bigvee"   , Ttype.UNDEROVER                            ),
  new Tuple("nn"      , "mo"    , "\u2229"  , "cap"      , Ttype.CONST                                ),
  new Tuple("nnn"     , "mo"    , "\u22C2"  , "bigcap"   , Ttype.UNDEROVER                            ),
  new Tuple("uu"      , "mo"    , "\u222A"  , "cup"      , Ttype.CONST                                ),
  new Tuple("uuu"     , "mo"    , "\u22C3"  , "bigcup"   , Ttype.UNDEROVER                            ),
  new Tuple("overset" , "mover" , "stackrel", null       , Ttype.BINARY                               ),
  new Tuple("underset", "munder", "stackrel", null       , Ttype.BINARY                               ),

  // binary relation symbols
  new Tuple("!="   , "mo", "\u2260" , "ne"                , Ttype.CONST     ),
  new Tuple(":="   , "mo", ":="     , null                , Ttype.CONST     ),
  new Tuple("lt"   , "mo", "<"      , null                , Ttype.CONST     ),
  new Tuple("gt"   , "mo", ">"      , null                , Ttype.CONST     ),
  new Tuple("<="   , "mo", "\u2264" , "le"                , Ttype.CONST     ),
  new Tuple("lt="  , "mo", "\u2264" , "leq"               , Ttype.CONST     ),
  new Tuple("gt="  , "mo", "\u2265" , "geq"               , Ttype.CONST     ),
  new Tuple(">="   , "mo", "\u2265" , "ge"                , Ttype.CONST     ),
  new Tuple("mlt"  , "mo", "\u226A" , "ll"                , Ttype.CONST     ),
  new Tuple("mgt"  , "mo", "\u226B" , "gg"                , Ttype.CONST     ),
  new Tuple("-<"   , "mo", "\u227A" , "prec"              , Ttype.CONST     ),
  new Tuple("-lt"  , "mo", "\u227A" , null                , Ttype.CONST     ),
  new Tuple(">-"   , "mo", "\u227B" , "succ"              , Ttype.CONST     ),
  new Tuple("-<="  , "mo", "\u2AAF" , "preceq"            , Ttype.CONST     ),
  new Tuple(">-="  , "mo", "\u2AB0" , "succeq"            , Ttype.CONST     ),
  new Tuple("in"   , "mo", "\u2208" , null                , Ttype.CONST     ),
  new Tuple("!in"  , "mo", "\u2209" , "notin"             , Ttype.CONST     ),
  new Tuple("sub"  , "mo", "\u2282" , "subset"            , Ttype.CONST     ),
  new Tuple("sup"  , "mo", "\u2283" , "supset"            , Ttype.CONST     ),
  new Tuple("sube" , "mo", "\u2286" , "subseteq"          , Ttype.CONST     ),
  new Tuple("supe" , "mo", "\u2287" , "supseteq"          , Ttype.CONST     ),
  new Tuple("-="   , "mo", "\u2261" , "equiv"             , Ttype.CONST     ),
  new Tuple("~="   , "mo", "\u2245" , "stackrel{\\sim}{=}", Ttype.CONST     , Flag.NOTEXCOPY),
  new Tuple("cong" , "mo", "~="     , null                , Ttype.DEFINITION),
  new Tuple("~"    , "mo", "\u223C" , "sim"               , Ttype.CONST     ),
  new Tuple("~~"   , "mo", "\u2248" , "approx"            , Ttype.CONST     ),
  new Tuple("prop" , "mo", "\u221D" , "propto"            , Ttype.CONST     ),

  // logical symbols
  new Tuple("and"    , "mtext", "and"   , null            , Ttype.SPACE     ),
  new Tuple("or"     , "mtext", "or"    , null            , Ttype.SPACE     ),
  new Tuple("not"    , "mo"   , "\u00AC", "neg"           , Ttype.CONST     ),
  new Tuple("=>"     , "mo"   , "\u21D2", "Rightarrow"    , Ttype.CONST     ),
  new Tuple("implies", "mo"   , "=>"    , null            , Ttype.DEFINITION),
  new Tuple("if"     , "mo"   , "if"    , null            , Ttype.SPACE     ),
  new Tuple("<=>"    , "mo"   , "\u21D4", "Leftrightarrow", Ttype.CONST     ),
  new Tuple("iff"    , "mo"   , "<=>"   , null            , Ttype.DEFINITION),
  new Tuple("AA"     , "mo"   , "\u2200", "forall"        , Ttype.CONST     ),
  new Tuple("EE"     , "mo"   , "\u2203", "exists"        , Ttype.CONST     ),
  new Tuple("_|_"    , "mo"   , "\u22A5", "bot"           , Ttype.CONST     ),
  new Tuple("TT"     , "mo"   , "\u22A4", "top"           , Ttype.CONST     ),
  new Tuple("|--"    , "mo"   , "\u22A2", "vdash"         , Ttype.CONST     ),
  new Tuple("|=="    , "mo"   , "\u22A8", "models"        , Ttype.CONST     ),

  // grouping brackets
  new Tuple("("      , "mo", "("      , null    , Ttype.LEFTBRACKET  , Flag.VAL                ),
  new Tuple(")"      , "mo", ")"      , null    , Ttype.RIGHTBRACKET , Flag.VAL                ),
  new Tuple("["      , "mo", "["      , null    , Ttype.LEFTBRACKET  , Flag.VAL                ),
  new Tuple("]"      , "mo", "]"      , null    , Ttype.RIGHTBRACKET , Flag.VAL                ),
  new Tuple("left("  , "mo", "("      , "("     , Ttype.LEFTBRACKET  , Flag.VAL, Flag.NOTEXCOPY),
  new Tuple("right)" , "mo", ")"      , ")"     , Ttype.RIGHTBRACKET , Flag.VAL, Flag.NOTEXCOPY),
  new Tuple("left["  , "mo", "["      , "["     , Ttype.LEFTBRACKET  , Flag.VAL, Flag.NOTEXCOPY),
  new Tuple("right]" , "mo", "]"      , "]"     , Ttype.RIGHTBRACKET , Flag.VAL, Flag.NOTEXCOPY),
  new Tuple("{"      , "mo", "{"      , "lbrace", Ttype.LEFTBRACKET                            ),
  new Tuple("}"      , "mo", "}"      , "rbrace", Ttype.RIGHTBRACKET                           ),
  new Tuple("|"      , "mo", "|"      , null    , Ttype.LEFTRIGHT    , Flag.VAL                ),
  new Tuple("|:"     , "mo", "|"      , "|"     , Ttype.LEFTRIGHT    , Flag.VAL, Flag.NOTEXCOPY),
  new Tuple(":|"     , "mo", "|"      , "|"     , Ttype.RIGHTBRACKET , Flag.VAL, Flag.NOTEXCOPY),
  new Tuple(":|:"    , "mo", "|"      , "|"     , Ttype.CONST        , Flag.VAL, Flag.NOTEXCOPY),
  new Tuple("(:"     , "mo", "\u2329" , "langle", Ttype.LEFTBRACKET                            ),
  new Tuple(":)"     , "mo", "\u232A" , "rangle", Ttype.RIGHTBRACKET                           ),
  new Tuple("<<"     , "mo", "\u2329" , "langle", Ttype.LEFTBRACKET                            ),
  new Tuple(">>"     , "mo", "\u232A" , "rangle", Ttype.RIGHTBRACKET                           ),
  new Tuple("{:"     , "mo", "{:"     , null    , Ttype.LEFTBRACKET  , Flag.INVISIBLE          ),
  new Tuple(":}"     , "mo", ":}"     , null    , Ttype.RIGHTBRACKET , Flag.INVISIBLE          ),

  // miscellaneous symbols
  new Tuple("int"      , "mo", "\u222B"                   , null       , Ttype.CONST                           ),
  new Tuple("dx"       , "mi", "{:d x:}"                  , null       , Ttype.DEFINITION                      ),
  new Tuple("dy"       , "mi", "{:d y:}"                  , null       , Ttype.DEFINITION                      ),
  new Tuple("dz"       , "mi", "{:d z:}"                  , null       , Ttype.DEFINITION                      ),
  new Tuple("dt"       , "mi", "{:d t:}"                  , null       , Ttype.DEFINITION                      ),
  new Tuple("oint"     , "mo", "\u222E"                   , null       , Ttype.CONST                           ),
  new Tuple("del"      , "mo", "\u2202"                   , "partial"  , Ttype.CONST                           ),
  new Tuple("grad"     , "mo", "\u2207"                   , "nabla"    , Ttype.CONST                           ),
  new Tuple("+-"       , "mo", "\u00B1"                   , "pm"       , Ttype.CONST                           ),
  new Tuple("-+"       , "mo", "\u2213"                   , "mp"       , Ttype.CONST                           ),
  new Tuple("O/"       , "mo", "\u2205"                   , "emptyset" , Ttype.CONST                           ),
  new Tuple("oo"       , "mo", "\u221E"                   , "infty"    , Ttype.CONST                           ),
  new Tuple("aleph"    , "mo", "\u2135"                   , null       , Ttype.CONST                           ),
  new Tuple("..."      , "mo", "..."                      , "ldots"    , Ttype.CONST                           ),
  new Tuple(":."       , "mo", "\u2234"                   , "therefore", Ttype.CONST                           ),
  new Tuple(":'"       , "mo", "\u2235"                   , "because"  , Ttype.CONST                           ),
  new Tuple("/_"       , "mo", "\u2220"                   , "angle"    , Ttype.CONST                           ),
  new Tuple("/_\\"     , "mo", "\u25B3"                   , "triangle" , Ttype.CONST                           ),
  new Tuple("\\ "      , "mo", "\u00A0"                   , null       , Ttype.CONST      , Flag.VAL           ),
  new Tuple("frown"    , "mo", "\u2322"                   , null       , Ttype.CONST                           ),
  new Tuple("%"        , "mo", "%"                        , "%"        , Ttype.CONST      , Flag.NOTEXCOPY     ),
  new Tuple("quad"     , "mo", "\u00A0\u00A0"             , null       , Ttype.CONST                           ),
  new Tuple("qquad"    , "mo", "\u00A0\u00A0\u00A0\u00A0" , null       , Ttype.CONST                           ),
  new Tuple("cdots"    , "mo", "\u22EF"                   , null       , Ttype.CONST                           ),
  new Tuple("vdots"    , "mo", "\u22EE"                   , null       , Ttype.CONST                           ),
  new Tuple("ddots"    , "mo", "\u22F1"                   , null       , Ttype.CONST                           ),
  new Tuple("diamond"  , "mo", "\u22C4"                   , null       , Ttype.CONST                           ),
  new Tuple("square"   , "mo", "\u25A1"                   , "boxempty" , Ttype.CONST                           ),
  new Tuple("|__"      , "mo", "\u230A"                   , "lfloor"   , Ttype.CONST                           ),
  new Tuple("__|"      , "mo", "\u230B"                   , "rfloor"   , Ttype.CONST                           ),
  new Tuple("|~"       , "mo", "\u2308"                   , "lceil"    , Ttype.CONST                           ),
  new Tuple("lceiling" , "mo", "|~"                       , null       , Ttype.DEFINITION                      ),
  new Tuple("~|"       , "mo", "\u2309"                   , "rceil"    , Ttype.CONST                           ),
  new Tuple("rceiling" , "mo", "~|"                       , null       , Ttype.DEFINITION                      ),
  new Tuple("CC"       , "mo", "\u2102"                   , "mathbb{C}", Ttype.CONST      , Flag.NOTEXCOPY     ),
  new Tuple("NN"       , "mo", "\u2115"                   , "mathbb{N}", Ttype.CONST      , Flag.NOTEXCOPY     ),
  new Tuple("QQ"       , "mo", "\u211A"                   , "mathbb{Q}", Ttype.CONST      , Flag.NOTEXCOPY     ),
  new Tuple("RR"       , "mo", "\u211D"                   , "mathbb{R}", Ttype.CONST      , Flag.NOTEXCOPY     ),
  new Tuple("ZZ"       , "mo", "\u2124"                   , "mathbb{Z}", Ttype.CONST      , Flag.NOTEXCOPY     ),
  new Tuple("f"        , "mi", "f"                        , null       , Ttype.UNARY      , Flag.FUNC, Flag.VAL),
  new Tuple("g"        , "mi", "g"                        , null       , Ttype.UNARY      , Flag.FUNC, Flag.VAL),
  new Tuple("prime"    , "mo", "\u2032"                   , "'"        , Ttype.CONST      , Flag.VAL , Flag.NOTEXCOPY),
  new Tuple("''"       , "mo", "''"                       , null       , Ttype.CONST      , Flag.VAL           ),
  new Tuple("'''"      , "mo", "'''"                      , null       , Ttype.CONST      , Flag.VAL           ),
  new Tuple("''''"     , "mo", "''''"                     , null       , Ttype.CONST      , Flag.VAL           ),

  // standard functions
  new Tuple("lim"   , "mo", "lim"   , null, Ttype.UNDEROVER           ),
  new Tuple("Lim"   , "mo", "Lim"   , null, Ttype.UNDEROVER           ),
  new Tuple("sin"   , "mo", "sin"   , null, Ttype.UNARY    , Flag.FUNC),
  new Tuple("cos"   , "mo", "cos"   , null, Ttype.UNARY    , Flag.FUNC),
  new Tuple("tan"   , "mo", "tan"   , null, Ttype.UNARY    , Flag.FUNC),
  new Tuple("arcsin", "mo", "arcsin", null, Ttype.UNARY    , Flag.FUNC),
  new Tuple("arccos", "mo", "arccos", null, Ttype.UNARY    , Flag.FUNC),
  new Tuple("arctan", "mo", "arctan", null, Ttype.UNARY    , Flag.FUNC),
  new Tuple("sinh"  , "mo", "sinh"  , null, Ttype.UNARY    , Flag.FUNC),
  new Tuple("cosh"  , "mo", "cosh"  , null, Ttype.UNARY    , Flag.FUNC),
  new Tuple("tanh"  , "mo", "tanh"  , null, Ttype.UNARY    , Flag.FUNC),
  new Tuple("cot"   , "mo", "cot"   , null, Ttype.UNARY    , Flag.FUNC),
  new Tuple("coth"  , "mo", "coth"  , null, Ttype.UNARY    , Flag.FUNC),
  new Tuple("sech"  , "mo", "sech"  , null, Ttype.UNARY    , Flag.FUNC),
  new Tuple("csch"  , "mo", "csch"  , null, Ttype.UNARY    , Flag.FUNC),
  new Tuple("sec"   , "mo", "sec"   , null, Ttype.UNARY    , Flag.FUNC),
  new Tuple("csc"   , "mo", "csc"   , null, Ttype.UNARY    , Flag.FUNC),
  new Tuple("log"   , "mo", "log"   , null, Ttype.UNARY    , Flag.FUNC),
  new Tuple("ln"    , "mo", "ln"    , null, Ttype.UNARY    , Flag.FUNC),
  Tuple.withRewrite([ "|"       , "|"        ], "abs"  , "mo", "abs"  , null, Ttype.UNARY, Flag.NOTEXCOPY),
  Tuple.withRewrite([ "\\|"     , "\\|"      ], "norm" , "mo", "norm" , null, Ttype.UNARY, Flag.NOTEXCOPY),
  Tuple.withRewrite([ "\\lfloor", "\\rfloor" ], "floor", "mo", "floor", null, Ttype.UNARY, Flag.NOTEXCOPY),
  Tuple.withRewrite([ "\\lceil" , "\\rceil"  ], "ceil" , "mo", "ceil" , null, Ttype.UNARY, Flag.NOTEXCOPY),
  new Tuple("Sin"   , "mo", "Sin"   , null, Ttype.UNARY, Flag.FUNC),
  new Tuple("Cos"   , "mo", "Cos"   , null, Ttype.UNARY, Flag.FUNC),
  new Tuple("Tan"   , "mo", "Tan"   , null, Ttype.UNARY, Flag.FUNC),
  new Tuple("Arcsin", "mo", "Arcsin", null, Ttype.UNARY, Flag.FUNC),
  new Tuple("Arccos", "mo", "Arccos", null, Ttype.UNARY, Flag.FUNC),
  new Tuple("Arctan", "mo", "Arctan", null, Ttype.UNARY, Flag.FUNC),
  new Tuple("Sinh"  , "mo", "Sinh"  , null, Ttype.UNARY, Flag.FUNC),
  new Tuple("Cosh"  , "mo", "Cosh"  , null, Ttype.UNARY, Flag.FUNC),
  new Tuple("Tanh"  , "mo", "Tanh"  , null, Ttype.UNARY, Flag.FUNC),
  new Tuple("Cot"   , "mo", "Cot"   , null, Ttype.UNARY, Flag.FUNC),
  new Tuple("Sec"   , "mo", "Sec"   , null, Ttype.UNARY, Flag.FUNC),
  new Tuple("Csc"   , "mo", "Csc"   , null, Ttype.UNARY, Flag.FUNC),
  new Tuple("Log"   , "mo", "Log"   , null, Ttype.UNARY, Flag.FUNC),
  new Tuple("Ln"    , "mo", "Ln"    , null, Ttype.UNARY, Flag.FUNC),
  Tuple.withRewrite([ "|", "|" ], "Abs", "mo", "abs", null, Ttype.UNARY, Flag.NOTEXCOPY),
  new Tuple("det", "mo", "det", null       , Ttype.UNARY    , Flag.FUNC                ),
  new Tuple("exp", "mo", "exp", null       , Ttype.UNARY    , Flag.FUNC                ),
  new Tuple("dim", "mo", "dim", null       , Ttype.CONST                               ),
  new Tuple("mod", "mo", "mod", "text{mod}", Ttype.CONST    , Flag.NOTEXCOPY           ),
  new Tuple("gcd", "mo", "gcd", null       , Ttype.UNARY    , Flag.FUNC                ),
  new Tuple("lcm", "mo", "lcm", "text{lcm}", Ttype.UNARY    , Flag.FUNC, Flag.NOTEXCOPY),
  new Tuple("lub", "mo", "lub", null       , Ttype.CONST                               ),
  new Tuple("glb", "mo", "glb", null       , Ttype.CONST                               ),
  new Tuple("min", "mo", "min", null       , Ttype.UNDEROVER                           ),
  new Tuple("max", "mo", "max", null       , Ttype.UNDEROVER                           ),

  // arrows
  new Tuple("uarr", "mo", "\u2191", "uparrow"              , Ttype.CONST),
  new Tuple("darr", "mo", "\u2193", "downarrow"            , Ttype.CONST),
  new Tuple("rarr", "mo", "\u2192", "rightarrow"           , Ttype.CONST),
  new Tuple("->"  , "mo", "\u2192", "to"                   , Ttype.CONST),
  new Tuple(">->" , "mo", "\u21A3", "rightarrowtail"       , Ttype.CONST),
  new Tuple("->>" , "mo", "\u21A0", "twoheadrightarrow"    , Ttype.CONST),
  new Tuple(">->>", "mo", "\u2916", "twoheadrightarrowtail", Ttype.CONST),
  new Tuple("|->" , "mo", "\u21A6", "mapsto"               , Ttype.CONST),
  new Tuple("larr", "mo", "\u2190", "leftarrow"            , Ttype.CONST),
  new Tuple("harr", "mo", "\u2194", "leftrightarrow"       , Ttype.CONST),
  new Tuple("uArr", "mo", "\u21D1", "Uparrow"              , Ttype.CONST),
  new Tuple("dArr", "mo", "\u21D3", "Downarrow"            , Ttype.CONST),
  new Tuple("rArr", "mo", "\u21D2", "Rightarrow"           , Ttype.CONST),
  new Tuple("lArr", "mo", "\u21D0", "Leftarrow"            , Ttype.CONST),
  new Tuple("hArr", "mo", "\u21D4", "Leftrightarrow"       , Ttype.CONST),


  // commands with argument
  aAMsqrt, aAMroot, aAMfrac, aAMdiv, aAMover, aAMsub, aAMsup,
  new Tuple("cancel"   , "menclose", "cancel", null               , Ttype.UNARY                          ),
  new Tuple("Sqrt"     , "msqrt"   , "sqrt"  , null               , Ttype.UNARY                          ),
  new Tuple("hat"      , "mover"   , "\u005E", null               , Ttype.UNARY, Flag.ACC                ),
  new Tuple("bar"      , "mover"   , "\u00AF", "overline"         , Ttype.UNARY, Flag.ACC                ),
  new Tuple("vec"      , "mover"   , "\u2192", null               , Ttype.UNARY, Flag.ACC                ),
  new Tuple("tilde"    , "mover"   , "~"     , null               , Ttype.UNARY, Flag.ACC                ),
  new Tuple("dot"      , "mover"   , "."     , null               , Ttype.UNARY, Flag.ACC                ),
  new Tuple("ddot"     , "mover"   , ".."    , null               , Ttype.UNARY, Flag.ACC                ),
  new Tuple("overarc"  , "mover"   , "\u23DC", "stackrel{\\frown}", Ttype.UNARY, Flag.ACC, Flag.NOTEXCOPY),
  new Tuple("overparen", "mover"   , "\u23DC", "stackrel{\\frown}", Ttype.UNARY, Flag.ACC, Flag.NOTEXCOPY),
  new Tuple("ul"       , "munder"  , "\u0332", "underline"        , Ttype.UNARY, Flag.ACC                ),
  new Tuple("ubrace"   , "munder"  , "\u23DF", "underbrace"       , Ttype.UNARY, Flag.ACC                ),
  new Tuple("obrace"   , "mover"   , "\u23DE", "overbrace"        , Ttype.UNARY, Flag.ACC                ),
  aAMtext, aAMmbox, aAMquote,
  new Tuple("color"   , "mstyle", null      , null      , Ttype.BINARY                ),
  new Tuple("bb"      , "mstyle", "bb"      , "mathbf"  , Ttype.UNARY , Flag.NOTEXCOPY),
  new Tuple("mathbf"  , "mstyle", "mathbf"  , null      , Ttype.UNARY                 ),
  new Tuple("sf"      , "mstyle", "sf"      , "mathsf"  , Ttype.UNARY , Flag.NOTEXCOPY),
  new Tuple("mathsf"  , "mstyle", "mathsf"  , null      , Ttype.UNARY                 ),
  new Tuple("bbb"     , "mstyle", "bbb"     , "mathbb"  , Ttype.UNARY , Flag.NOTEXCOPY),
  new Tuple("mathbb"  , "mstyle", "mathbb"  , null      , Ttype.UNARY                 ),
  new Tuple("cc"      , "mstyle", "cc"      , "mathcal" , Ttype.UNARY , Flag.NOTEXCOPY),
  new Tuple("mathcal" , "mstyle", "mathcal" , null      , Ttype.UNARY                 ),
  new Tuple("tt"      , "mstyle", "tt"      , "mathtt"  , Ttype.UNARY , Flag.NOTEXCOPY),
  new Tuple("mathtt"  , "mstyle", "mathtt"  , null      , Ttype.UNARY                 ),
  new Tuple("fr"      , "mstyle", "fr"      , "mathfrak", Ttype.UNARY , Flag.NOTEXCOPY),
  new Tuple("mathfrak", "mstyle", "mathfrak", null      , Ttype.UNARY                 ),

  // newline for formatting: in order to add a new line between multiple formulas
  new Tuple("newline", "mo", "newline", "\\\\", Ttype.CONST, Flag.VAL, Flag.NOTEXCOPY),
];

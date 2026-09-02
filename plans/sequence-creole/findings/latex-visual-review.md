# Visual review of latex rendering — findings and the order to fix them

From a side-by-side review of all 8 latex/math fixtures against the
Batik-regenerated oracles (`latex-comparison.html`, uncommitted). Four findings,
one fixed, three open. **The ordering ruling is the maintainer's: sequence
rendering must be corrected before any of this is worth comparing.**

## 0. PRECEDENCE — sequence diagram rendering is wrong, and it comes first

Maintainer ruling, 2026-09-02, from the side-by-side. Sequence output is wrong
independently of latex, so latex comparisons on sequence fixtures measure the
wrong thing. That is its own mission and **precedes** the remaining latex work.
`camuxi-33-nopo108` and `mefeke-43-xotu192` should not be cited as latex
evidence until it lands.

## 1. FIXED — `\mbox` rendered as red error text

KaTeX implements `\text` but not its `\mbox` alias, and with
`throwOnError: false` renders an unknown control sequence as its literal name in
error red. `component/vimulo-11-buni641` drew a red `\mbox` where the jar draws
the word "or". JLaTeXMath implements the standard LaTeX text-mode box commands,
so `\mbox{...}` and `\text{...}` are the same thing.

Mapped through KaTeX's own `macros` option (`55d30756`). Scoped to measured
reach: `\mbox` is the only command in this corpus's ten latex/math expressions
KaTeX rejects, and with the mapping none is.

## 2. OPEN — the scale mismatch has a cited cause

**Upstream renders every formula at size 20, display style:**

```java
clTeXIconBuilder.getMethod("setStyle", int.class).invoke(builder, 0);
clTeXIconBuilder.getMethod("setSize", float.class).invoke(builder, (float) 20);
```
`~/git/plantuml/src/main/java/net/sourceforge/plantuml/math/TeXIconBuilder.java:64-65`

That is the `scale(20,20)` visible in the Batik output's own inner SVG, and it
is the em size. The diagram's `scale` directive multiplies it afterwards:
`component/vimulo-11-buni641` writes `scale 1000 width` and its image carries
`scale(4,4)` over a natural 171x28 — exactly `gevozu-46-sasu860`'s unscaled box
for the same formula.

`core/latex.ts#measureLatex` has **no font-size concept at all**. It is
`atoms x 10` floored at 120 for width, `40 + 20*markers` capped at 80 for
height — invented, with no upstream citation, and it predates this work.

Measured against the real oracles, natural (unscaled) boxes:

| expression | jar | ours | note |
|---|---|---|---|
| `P(y|\mathbf{x}) \mbox{ or } f(\mathbf{x})+\epsilon` | 171x28 | 170x40 | width within 0.6% |
| `\mathcal{D}` | 24x22 | 120x40 | the 120 floor dominates |
| `\mathcal{g}` | 18x21 | 120x40 | 567% too wide |
| `P(\mathbf{x})` | 52x28 | 120x40 | |
| `{S}\le\frac{{1}}{{{F}+\frac{{{1}-{F}}}{{N}}}}` | 127x58 | 120x80 | |

**What KaTeX can and cannot give us.** `katex.__renderToDomTree(expr, ...)`
returns real `height` and `depth` in em, so VERTICAL extent is derivable
honestly. **Width is not exposed** — `t.width` is `undefined`, and KaTeX
delegates horizontal layout to the browser; reconstructing it means walking the
tree summing glyph advances from KaTeX's font-metrics tables, i.e.
reimplementing typesetting.

With em x 20 the heights land close but not exact (jar 22/28/58 against
em x 20 of 13.7/20.0/48.6, leaving an inset of 8-9.4 that is not constant). The
residual is JLaTeXMath's own icon insets and is NOT to be fitted.

## 3. OPEN — `<back:gray>` is not painted

`component/vimulo-11-buni641` writes
`[<back:gray><latex>...</latex></back>]` and the jar paints a gray band behind
the formula. This port paints nothing.

Cause, documented rather than accidental: the `'latex'` `CreoleAtom` variant
carries only `color` (`atom/Atom.ts:70`) — no background field — and
`FontConfiguration` models no background either. `AtomMath.ts`'s own doc comment
records that upstream's `background` constructor parameter is "threaded for
structural fidelity" and that this port "paints no background at all", because
KaTeX's MathML `<foreignObject>` output paints none.

Closing it means adding a background to the atom union and painting it — a
core-creole change with reach beyond latex, since `<back:>` applies to text runs
too.

## 4. OPEN — the description path drops one image

`gevozu-46-sasu860` and `sunuju-01-pote718` each declare **7** `<latex>` tags
and the jar emits 7 images; this port emits **6**. A dropped atom, not a sizing
disagreement, and it should be treated as a defect independently of every
question above.

## Recommended order

1. The sequence rendering mission (maintainer ruling, above).
2. #4, the dropped image — a plain defect with a plain fix.
3. #2, sizing, anchored on `TeXIconBuilder.java:65`'s size 20 and KaTeX's own em
   height/depth. Width has no principled source; decide deliberately rather than
   fitting.
4. #3, the background, if wanted — the largest of the three, because it reaches
   core creole rather than latex.

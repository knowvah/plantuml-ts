# cdd8 T1d: latex sized by JLaTeXMath's TeXIcon rule

## Observation: JLaTeXMath ground truth needs one fresh JVM per formula
- **Context**: harvesting TeXIcon sizes from the oracle jar for unit tests.
- **Finding**: `SymbolAtom.get` returns shared singletons and
  `TeXParser.java:714-720` sets `atom.type = ORDINARY` on a group atom, so a
  formula can size 155x57 alone but 149x57 after another formula in the same
  JVM. Jar output can depend on formula order within one fixture.
- **Impact**: batch harvesting in one JVM gives order-dependent "truth".
- **Confidence**: High (bisected by the T1d agent)

## Observation: KaTeX metrics vs JLaTeXMath box construction
- **Finding**: KaTeX's `tryCombineChars` keeps only the first glyph's width,
  so the HTML tree cannot supply widths (probe one glyph at a time). KaTeX
  centres operator/delimiter/radical metrics on the axis; JLaTeXMath uses the
  TFM split (cmex display operators height 0.100001, integrals/text-size 0,
  radicals 0.039999). KaTeX has no kern pairs and collapses text-mode spaces
  (library-forced D11.3 candidates).
- **Impact**: `src/core/latex-metrics/` runs JLaTeXMath 1.0.7 rules over
  KaTeX's parse tree; 13/13 corpus `<latex>` formulas exact.
- **Confidence**: High

## Observation: the oracle's latex payloads are real JLaTeXMath now
- **Finding**: 537 decoded `<image>` payloads across 40 latex fixtures:
  519 Batik (JLaTeXMath) SVG, 18 monospace rollbacks (cunotu, kebadi, marese,
  pecafo, roxita, rozesu, vocalo, xanuke).
- **Impact**: DIVERGENCES' "every latex oracle is a rollback" is stale (T3c).
- **Confidence**: High

## Observation: zsh does not word-split $ROWS
- **Finding**: pass several render-diff rows via xargs or an array.
- **Confidence**: High

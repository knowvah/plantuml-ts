# Every latex/math oracle in this corpus is a FALLBACK, not typeset maths

Found 2026-09-02 while wiring `<math>` through to a drawn image. Verified by
decoding the base64 of the jar's own `<image>` payloads, not inferred.

## What the oracles actually contain

`sequence/mefeke-43-xotu192`'s `<image>`, decoded:

```svg
<svg height="25" width="122" ...><defs/><g font-family="sans-serif"
 lengthAdjust="spacing"><text x="5" y="15.889" fill="#000" font-size="14"
 textLength="111.475" font-family="monospace">[[a,b],[c,d]]((n),(k))</text></g></svg>
```

That is the raw ASCIIMath source drawn in **monospace 14pt** — it is
`ScientificEquationSafe#getRollback()`
(`GraphicStrings.createBlackOnWhiteMonospaced(formula)`,
`ScientificEquationSafe.java:92-124`), the path taken when JLaTeXMath cannot be
reached. Not one glyph of typeset mathematics.

Checked across every latex- or math-bearing fixture in the corpus — **all 8, in
three families**:

| fixture | tag | images | rollback? |
|---|---|---:|---|
| `sequence/mefeke-43-xotu192` | `<math>` | 1 | yes |
| `sequence/camuxi-33-nopo108` | `<math>` | 2 | yes |
| `state/corumi-91-mizo869` | `<math>` | 1 | yes |
| `state/gupeto-19-mesa256` | `<math>` | 1 | yes |
| `component/gevozu-46-sasu860` | `<latex>` | 7 | yes |
| `component/sunuju-01-pote718` | `<latex>` | 7 | yes |
| `component/kezodo-14-pume985` | `<latex>` | — | — |
| `component/vimulo-11-buni641` | `<latex>` | — | — |

The oracle-generation environment had no JLaTeXMath on its classpath.

## Why this matters, and what it corrects

`DIVERGENCES.md:317-339` frames the permanent divergence as **KaTeX against
JLaTeXMath**, and says "the image bytes and exact glyph metrics never will be"
conformant. The direction is right and the entry's conclusion stands, but the
comparison it names does not exist in this corpus: there is no JLaTeXMath output
here to diverge FROM. The real comparison is KaTeX-typeset mathematics against a
monospace rendering of the raw source.

Three consequences, all load-bearing for anyone who touches this again:

1. **These oracles cannot validate maths typesetting or its metrics at all.**
   A width or height compared against them is a comparison against monospace
   text. Do not drive a latex fixture's size delta toward 0; do not read a
   residual there as a defect.
2. **The only meaningful target is structural**: an `<image>` present, in the
   right place in the flow, in the right order among the text runs. That is what
   the state, sequence and class wirings assert, and deliberately all they
   assert.
3. **Regenerating the oracles on a host WITH JLaTeXMath would change them**, and
   would change what "conformant" means for these fixtures. Anyone refreshing
   the corpus should know that before diffing.

## A correction to the state size backlog

`oracle/goldens/state/size-backlog.json`'s `_doc` attributes
`corumi-91-mizo869` / `gupeto-19-mesa256`'s identical 1.106597 pin to the KaTeX
divergence. That is wrong about its ORIGIN: at the time the pin was taken,
`CommandCreoleMath` did not exist, so `<math>S<=1/(F+(1-F)/N)</math>` measured as
33 characters of literal, tag-inclusive text —
`measure(that string, 14pt).width` is 206.675, `+20` margins = 226.675px =
3.148in, minus the jar's 2.041667in = **1.106597 exactly**. The pin recorded a
missing creole command, not a typesetting divergence.

Its CURRENT residual (0.305555 after the wiring) genuinely is the divergence.
Both files are left unedited here — the correction is recorded rather than
applied, because the entry's shrink-only contract is unaffected either way.

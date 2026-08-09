# T10e — AtomMath / StripeLatex / ScientificEquationSafe

## Observation: `ScientificEquationSafe`'s rasterization surface
(`getSvg`/`getImage`/`export`/`printTrace`/`getRollback`) is an
architectural boundary, not a gap or a filesystem seam

- **Context**: deciding what of `ScientificEquationSafe.java` (171 lines)
  can exist in this port, per the task's own "only the part that can
  exist here" framing.
- **Finding**: every one of those five methods routes through upstream's
  raster/vector image pipeline (`PortableImage`, `MutableImage`,
  `UImageSvg`, `EpsGraphics`, `SImageIO`, `GraphicStrings`,
  `TextBlockExporter`) — none exist in this port, and none could exist
  without contradicting `CLAUDE.md`'s "Pure SVG renderer — no DOM, no
  async, no canvas" architecture note. This port already renders
  `<latex>` as inline KaTeX MathML instead of a rasterized image
  (`CommandCreoleLatex.ts`'s own doc comment; `EntityImageDescriptionSupport
  .ts`'s pre-existing `'latex'` `CreoleAtom` branch) — a deliberate,
  PRE-EXISTING substitution this task did not invent.
- **Resolution**: NOT ported. Distinguished explicitly from
  `SignatureUtils.ts`'s "BLOCKED ON THE FILE SEAM" wording (per this
  task's own instruction) — this is not a missing Node/filesystem
  callback, it's a chosen output format. `getFormula`/`getSource`/
  `fromLatex` (the reachable, non-rasterizing surface) ARE ported.
- **Confidence**: High — read `ScientificEquationSafe.java`,
  `LatexBuilder.java` directly; grepped `src/` for `PortableImage`/
  `MutableImage`/`UImageSvg` (zero hits, confirming the gap is port-wide).

## Observation: `fromAsciiMath` is a genuinely large, separable follow-on
(1032+79 lines), cited rather than silently dropped — ADR-8 corollary
applied, not evaded

- **Context**: `fromAsciiMath` is a real member of `ScientificEquationSafe`
  (this task's own write-set target); the ADR-8 corollary forbids dropping
  a member for "no caller today."
- **Finding**: `fromAsciiMath`'s only two callers anywhere upstream
  (`CommandCreoleMath.java`, `math/PSystemMath.java`) are themselves
  unported — genuinely unreached, not unreachable. Tracing what porting it
  would actually need: `new AsciiMath(formula)` (`math/AsciiMath.java`, 79
  lines) immediately calls `new ASCIIMathTeXImg().getTeX(form)`
  (`math/ASCIIMathTeXImg.java`, 1032 lines) — a full ASCIIMath-to-LaTeX
  parser, unrelated to `StripeLatex`/`AtomMath`/`core/latex.ts` and outside
  this task's 3-file write-set.
- **Resolution**: NOT silently dropped. `fromAsciiMath` throws a cited,
  labelled seam naming both blockers, at the exact point upstream's real
  work begins (`AsciiMath`'s constructor) — matching the batch's
  established `blockedOnStripeTable`/`blockedOnAtomLayer`/
  `blockedOnSibling` pattern (T9a, T10a, T10c). Reported here as a
  measured, genuinely-large-and-separable deferral, not an ad hoc skip.
- **Confidence**: High — read `AsciiMath.java`, `ASCIIMathTeXImg.java`
  (`wc -l`); grepped `~/git/plantuml` for every `fromAsciiMath`/
  `ScientificEquationSafe.` call site.

## Observation: `<latex>` SIZING (the description ratchet's own divergence)
is untouched — this task's binding is dead code from the current suite's
perspective

- **Context**: the mission brief's own STOP condition — any change that
  would alter `<latex>` sizing.
- **Finding**: `AtomMath.calculateDimensionSlow` binds to `core/latex.ts
  #measureLatex`, the SAME function `leaf-sizing-text.ts`'s sizer path
  does NOT call for `'latex'` atoms (that file's own doc comment: `'latex'`
  atoms are recognized/consumed by the shared lexer scan and contribute
  ZERO width to the sizer — the deliberate 0-width approximation this
  mission's README records as preserved-on-purpose). Nothing in this
  port's current dispatch (`CreoleParser.ts`'s `isLatexStart` branch) can
  construct a `StripeLatex` yet — `CreoleParser.ts` was NOT touched by
  this task (outside the write-set). `AtomMath.ts`/`StripeLatex.ts` are
  therefore pure additions, exercised only by their own new unit tests.
- **Resolution**: verified via `git diff --stat` (empty — zero tracked
  files modified) and all three ratchets re-measured at their exact
  baseline values (below).
- **Confidence**: High — grepped `src/` for any caller of `StripeLatex`/
  `AtomMath` outside their own test files (zero hits); re-ran all three
  ratchets after landing the files.

## Nothing else dropped

`AtomMath`'s constructor and `getStartingAltitude` are ported in full and
reachable/tested. `StripeLatex`'s constructor, `addAndCheckTermination`,
`isTerminated`, `getAtom` (memoization), `calculateDimension`,
`getStartingAltitude`, `drawU` are ported in full and reachable/tested.
`getAtoms()`/`getLHeader()` on `StripeLatex` are typed against the real
upstream `Atom` contract, not `../Stripe.ts`'s `CreoleAtom[]`-narrowed
signature — the identical, already-established fork `StripeTree.ts`/
`StripeCode.ts` (T10c/T10d) hit first; flagged again for T10g.
`getNeutrons()` on both `AtomMath` (inherited from `AbstractAtom`) and
`StripeLatex` throws per the ADR-9 `Neutron` verdict, matching
`StripeCode.ts`'s identical reasoning exactly (only call site is
`Fission.java`, already ported as `Fission.ts#getNeutronsForAtom`).

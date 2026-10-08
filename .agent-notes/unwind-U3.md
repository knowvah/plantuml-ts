# unwind-U3 — preprocessor (TIM) divergences

## Observation: the BLOCK_E1 DIVERGENCES entry was already stale
- **Context**: unwinding "`%newline()` / `%breakline()` emit a real newline".
- **Finding**: `jaws-constants.ts#USE_BLOCK_E1_IN_NEWLINE_FUNCTION` is already
  `true` (A2s R2b) and `DisplayNewlines.ts#parseWithNewlines` decodes the
  sentinels. The divergence that remained is CONSUMERS that split display
  text with their own narrower scanner and never see the sentinel:
  `src/diagrams/class/class-member-display.ts#splitMemberDisplayLines`
  (its doc claims the sentinels "never reach this AST" — false), the
  description link label, and the state transition label. Fixtures:
  `tests/fixtures/unwind-U3/newline-{class-member-only,usecase,state}.puml`.
- **Impact**: the fix is per-consumer (route through `splitDisplayLines`),
  not in the producer or in `src/core/klimt/creole/`.
- **Confidence**: High (jar renders vs ours, 2026-10-08).

## Observation: jar stdlib folder set == vendored assets/stdlib set
- **Context**: deciding what the jar does for an unknown `<bundle/thing>`.
- **Finding**: the jar's 34 `stdlib/<name>/info.spm` resources equal the 34
  folders in `assets/stdlib/` and `~/git/plantuml-stdlib/stdlib/`
  (case-folded). The deciding call is NOT `Stdlib.getPumlResource` but
  `PathSystem#getInputFile` (PathSystem.java:196-201, from TContext.java:815),
  which runs `Stdlib.retrieve(libname)` before any reader: an unknown folder
  (UncheckedIOException, Stdlib.java:166-176) and a slashless `<c4>`
  (substring(0,-1)) both become "Fatal parsing error" via
  `executeOneLineSafe` (TContext.java:374-384). A known folder with a missing
  file is "cannot include <what>" (TContext.java:885). Reading only
  getPumlResource predicts "cannot include <c4>" for the slashless case --
  wrong; the jar render caught it.
- **Impact**: the port can mirror the unknown-bundle page without any assets.
  Telling "known bundle, missing file" from "known bundle not supplied" needs
  a bundle-presence query the public `StdlibStore` interface does not have.
- **Confidence**: High.

## Observation: renderSync's error listing is the RAW source
- **Context**: comparing error pages for `!undefine` / `%breakline()`.
- **Finding**: the jar lists the POST-preprocessor lines (`!undefine Alice`,
  `hello↵world`); `src/index.ts#renderPagesSync`'s catch passes the raw
  `source` to `errorSvg` (render()'s path passes `umlSource.lines`).
- **Impact**: every syntax-error page from preprocessed input differs in its
  listing; outside the TIM write-set.
- **Confidence**: High.

## Observation: the survey cannot see stdlib-include fixtures without goldens
- **Context**: all-engine survey around the unknown-bundle change.
- **Finding**: corpus fixtures `sequence/teruzi-64-mitu401`, `vikinu-17-dano008`,
  `xirine-12-zife795` (`<cloudnonworking/...>`, `<foo/...>`) have no golden,
  so the survey does not list them; engdiff reports 0 movers regardless.
  Checked by hand: jar and port now both end in "Fatal parsing error".
- **Impact**: a TIM change can move unsurveyed corpus fixtures; render them
  directly when the change targets a construct they use.
- **Confidence**: High.

## Observation: the old case-folded split also matched LOWERCASE literal text
- **Context**: sequence diff-baseline ratchet went red on
  `licole-34-vejo527` ("still errors as recorded") after removing
  `preprocessor.ts`'s `RE_NEWLINE_CALL_ANY_CASE` split.
- **Finding**: the regex was `/%n\(\)|%newline\(\)/gi` -- it split not only
  `%N()` but any lowercase `%newline()` that SURVIVED the interpreter as text
  (inside a quoted `!$x = "... %newline() ..."` value, which the jar keeps
  literal). The baseline's recorded mechanism ("a real U+000A from the
  literal") was wrong; the split was flatten's. Ours now draws exactly the
  jar's 12 `<text>` strings for that fixture.
- **Impact**: the fixture moves error -> measurable; its diff-baseline entry
  needs re-pinning (orchestrator-owned file).
- **Confidence**: High.

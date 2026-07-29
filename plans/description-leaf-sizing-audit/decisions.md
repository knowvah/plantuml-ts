# Architecture Decisions (pre-made — treat as LOCKED)

If you discover a conflicting constraint, STOP and log it in
`decision-journal.md`. Do not silently override.

## ADR-1 — Audit tables are hand-written, with a coverage test

**Context.** A hand-maintained table of 36 upstream symbols vs our
dispatch rots the moment either side moves.
**Decision.** Hand-write the tables in `planning/`, and add a test that
fails if our dispatch does not cover every symbol the table lists.
**Consequences.** Prose reasoning stays where humans read it; the
coverage guarantee is enforced by CI. Rejected: generating the table by
parsing `USymbols.java` — extracting *composition shape* from Java source
is more fragile than the thing it would protect.

## ADR-2 — Composition descriptors, but only AFTER counting the kinds

**Context.** Symbol geometry is spread across five parallel tables keyed
by symbol (`SYMBOL_BOX_MARGIN`, `SYMBOL_ICON_ALLOWANCE`,
`FOLDER_FAMILY_SHOW_TITLE`, `SIMPLE_SYMBOL_DRAWING`,
`INTERFACE_CIRCLE_SIZE`) plus a `switch`; a symbol's composition KIND is
implicit in which table it appears in.
**Decision.** Move to one descriptor per symbol
(`{ kind: 'box'|'stacked'|'folder'|'ellipse'|'hideText', margin?, drawing? }`)
mirroring upstream's class hierarchy — but as Batch 5, gated on T2 finding
≥4 kinds AND Batch 4 adding ≥2 new tables.
**Consequences.** Avoids designing the shape before the cases are counted,
which is exactly how five parallel tables happened. If the gate is not
met, skip and ledger.

## ADR-3 — Enforce parity with a fitness function, not a one-time audit

**Context.** The renderer/sizer gap recurred four times.
`architecture.md`: "Express every architectural constraint as a
lint/import check/test — not code review."
**Decision.** Ship a test that FAILS when a `resolveElement*` is
referenced from a renderer module and from no sizer module, unless
allow-listed with a written reason.
**Consequences.** Stops instance #5 of the resolver-shaped variant, and
forces "why is this size-neutral?" to be answered in writing.
**KNOWN LIMIT — state it in the test file.** Only ONE of the four
historical instances was resolver-shaped. `wrapWidth`, the creole lexer
and the use-case point fit would ALL have passed this test. It is a
partial guard; presenting it as proof of parity would be worse than not
having it.

## ADR-4 — Fix what is proven; FILE the rest with evidence

**Context.** The audits will find gaps the 351 goldens do not exercise.
`CLAUDE.md`: the corpus is a starting point, not a ceiling.
**Decision.** Fix any gap a failing fixture proves. For a gap with no
fixture, record a jar probe (command + numbers) in the table and file it —
do not fix it in this mission, and do not drop it.
**Consequences.** Every finding stays evidenced and tracked; a survey
cannot balloon into unbounded fixture authoring. Authoring fixtures for
the filed gaps is scoped separately once the count is known.

## ADR-5 — Tables live in `planning/`, reusable across engines

**Context.** This bug class is not description-only:
`planning/mission-guide.md` already records "Note text measured at 14pt
but rendered at 12pt" in the FILES diagram, still open.
**Decision.** Both tables go in `planning/` (not `plans/`), each with a
"how to reuse this for another engine" section, and `mission-guide.md`
gains a pointer to them.
**Consequences.** They outlive this mission and serve class/state/object.
Scope of CODE change stays description-only.

## ADR-6 — Route `measureLeafNode` through `EntityImageDescription` (2026-07-28)

**Status.** Accepted — maintainer decision, Batch 4 kickoff. Supersedes the
"patch the tables" default that Batch 4's template assumed, and very likely
moots ADR-2 (see Consequences).

**Context.** T2 found six USymbol composition MISMATCHes; T3/T4 found six
parity GAPs. The template treated these as ~12 independent patches to
`leaf-sizing-consts.ts` and the `measure*` functions. Investigation before
building the batch showed that framing is wrong:

- `EntityImageDescription.calculateDimensionSlow(stringBounder)`
  (`EntityImageDescription.ts:288`) already computes the faithful dimension
  via `symbol.asSmall(name, desc, stereo, ctx, align).calculateDimension`,
  which is upstream's OWN sizing entry point.
- Its constructor is pure data — labels, fonts, paint, symbol → `TextBlock`s.
  Nothing render-time-only; the sizer can construct it.
- It already handles `hideText` (interface), the folder magnetic border and
  the shield margins.
- The `SymbolContext` it builds is `.withStroke(paint.stroke)` and
  `.withShadow(paint.deltaShadow)` — so the Shadowing and LineThickness GAPs
  are already carried on that path.
- `Footprint.ts:134` handles `UEmpty`, which is EXACTLY the rule T4 proved
  our `footprintBoxes` lacks and without which USECASE_BUSINESS lands 9.0px
  off.
- `USymbolUsecase.ts` already applies the business `withMargin(7,7,0,0)`,
  with the Java 3-arg → 4-arg argument-order translation reasoned out in a
  comment.
- The measurer seam is not a blocker: `StringBounder.calculateDimension(font,
  text)` vs `StringMeasurer.measure(text, font)` is an argument swap, and
  `getDescent` exists on both.

So `measureLeafNode` is a parallel reimplementation of correct code that
already ships, and the renderer already uses it. That is the same lock-step
divergence this mission documents — at the scale of the whole sizer.

**Decision.** Route `measureLeafNode` through
`EntityImageDescription.calculateDimensionSlow` behind a thin
`StringMeasurer` → `StringBounder` adapter. Delete the five flat tables it
replaces. `CLAUDE.md`: "upstream architecture is authoritative … it is
explicitly OK to look at a plantuml-ts file, say 'hell no,' and rewrite it
from scratch to mirror upstream." This is that case: the local code was
never faithful, so the "do not refactor while porting" guard — which
protects FAITHFULLY-ported behaviour from loss — does not apply.

**Consequences.**
- Expected to close in one change: HEXAGON, PERSON, USECASE_BUSINESS, the
  Shadowing and LineThickness GAPs, and the `wrapWidth`/`guillemet`
  per-path gaps (the desc block is built once by `buildDesc`, so all leaf
  shapes inherit it instead of only `measureBox`).
- Does NOT close: ACTOR_AWESOME/ACTOR_HOLLOW (geometry absent from the port
  — `actorStyleGetTextBlock` throws for both), ARCHIMATE (keyword/parser
  gap, not sizing), and the dead `inkSprites` field (cleanup).
- **ADR-2 is very likely moot.** Its descriptor refactor exists to unify the
  five flat tables; routing deletes them instead. Confirm and retire it
  rather than executing Batch 5 out of habit.
- Risk accepted: one large diff, harder to bisect, and a real chance of
  widening pins mid-way. Mitigated by taking it as its OWN task with nothing
  else in the commit, and by the shrink-only ratchet, which STOPS the batch
  rather than absorbing a regression.
- Reversible: revert the commit and the flat tables return.

### ADR-6 AMENDMENT — the premise was half right (T6 outcome, 2026-07-28)

**What ADR-6 claimed.** The ported `decoration/symbol/` path is faithful and
`measureLeafNode` is a lossy reimplementation, so routing should close six
findings at once.

**What T6 measured.** 311 → **316/351 (90.0%)**, zero widened — a real gain,
but NOT the predicted one, and the routing had to be NARROWED four times.

Of the six expected wins, two are confirmed (PERSON, jar-verified via
mutere-78; and the `wrapWidth`/`guillemet` per-path uniformity, which drove
five fixtures conformant and is where most of the gain came from). Four —
HEXAGON, USECASE_BUSINESS, Shadowing, LineThickness — are NOT verified
closed: no corpus fixture isolates them. Per ADR-4 they stay filed with their
jar probes rather than being claimed.

**The correction that matters.** The two models are not "faithful vs lossy."
They are **faithful in different places**, and routing wholesale LOSES the
other half:

| the ported path is missing | evidence | cost of routing anyway |
|---|---|---|
| the folder/package title margin (T2 traced +12 to `BodyEnhanced1.getMarginX()`=6) | `EntityImageDescription.ts:43` states none of `BodyFactory`/`BodyEnhanced*` are ported | widened 8 fixtures |
| sprite ink offsets in the use-case fit | the shared `AtomImageResolver` has NO ink-offset field | widened bootstrap-0, ruziru-69 |
| the `<img>` cannot-decode fallback at the DIAGRAM-default font (S1L-h) | shared `buildLine` has no `defaultFont` seam | widened jecici-56 |
| our deliberate "`<latex>` contributes 0 width" divergence | shared pipeline does a real KaTeX render | worse on the 2 permanently-divergent LaTeX fixtures |

The ported classes encode SYMBOL-COMPOSITION facts read from Java. The flat
tables encode TEXT-BLOCK facts learned from fixtures — the accreted long tail
`CLAUDE.md` calls the deliverable. Deleting either loses real behaviour.

**Consequences — these change the remaining plan.**
- **T9 must NOT delete the tables wholesale.** Its premise is void. Rescope it
  to deleting only what T6 actually superseded, and to the dead `inkSprites`
  field.
- **ADR-2 is NOT moot after all.** The five tables survive, so the descriptor
  refactor it proposes is live again. Re-evaluate its gate honestly rather
  than retiring it as ADR-6 predicted.
- The real remaining work is upstream of the symbol layer: port
  `BodyFactory`/`BodyEnhanced*`, and add ink-offset and default-font seams to
  the shared atom pipeline. That is what would let the routing widen. It is
  substantial and separable — a tracked follow-on, not a Batch-4 patch.
- T6's narrowing was the right call and is preserved: each of the four cases
  was diagnosed to a mechanism at a `file:line` per `diagnosis.md` and
  resolved by NOT routing that case, never by a fitted constant.

**Accepted deviation.** T6 created `leaf-sizing-legacy-fallback.ts`, outside
its declared write-set. The 500-line pre-commit cap made it impossible to keep
the latex/img fallback in `leaf-sizing.ts` beside the routing. It is a
mechanical relocation of pre-existing `measureBox`/`boxIcon` math, not new
scope, and it was flagged rather than absorbed silently — the correct
handling.

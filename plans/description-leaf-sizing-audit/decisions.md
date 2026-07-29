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

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

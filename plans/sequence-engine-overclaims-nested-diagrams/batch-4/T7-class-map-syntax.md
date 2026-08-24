# T7 — let the class engine claim object `map` syntax

## Context

`plantuml-ts` is a faithful port; the Java at `~/git/plantuml` is canonical.

`zuvila-56-nuda425` is an object diagram built from `map "Arrows legend " as
arrows { ... }`, wrapped in a `legend` containing a nested `{{ }}` sub-diagram
and a `!procedure`. **The jar renders it `data-diagram-type="CLASS"`** — object
diagrams are the class family upstream, and this port has no `objectPlugin`
either (79 of the 80 `dot-cache/object/` fixtures already render `CLASS`).

So the fix is symmetric with T4: T4 stops sequence claiming it, and this task
makes sure `classAccepts` *does*.

**Check the residual first.** If T2/T3/T4 already route it to class, close as
a measured no-op.

## Task

Ensure `classAccepts` recognises object-diagram declaration syntax (`map`,
and check `object` alongside it) so the class engine claims such sources
positively rather than winning them by fallback.

Write the test first (TDD).

## Read-set

- `src/diagrams/class/class-dispatch.ts` — `classAccepts`
- `~/git/plantuml/.../classdiagram/command/CommandCreateMap.java` and the
  `objectdiagram/command/` package — the real declaration grammar for `map`
  and `object`
- `~/git/plantuml/.../classdiagram/ClassDiagramFactory.java` — which commands
  it registers, i.e. what it genuinely accepts
- `test-results/dot-cache/object/zuvila-56-nuda425/in.puml`
- `../decisions.md#d1`

## Write-set

- `src/diagrams/class/class-dispatch.ts`
- `tests/unit/class/class-dispatch.test.ts`

Nothing else. If a file outside this set needs changing, **STOP and report it** rather than changing it.

## Acceptance criteria

1. Given `map "Arrows legend " as arrows {`, when `classAccepts` runs, then
   `true`, with the upstream command class cited in a comment
2. Given `object Foo {`, then `true` (the sibling declaration — check the
   grammar rather than assuming the two are spelled alike)
3. Given the routing gate, then `zuvila-56-nuda425` reports `jarType === ourType
   === 'CLASS'`
4. Given the 314 promoted zero-diff fixtures in `svg-class/ratchet.json` and
   the 34 in `svg-object/ratchet.json`, then none is de-promoted

## Quality bar

All four gates green. AC4 matters most: `classAccepts` is consulted for a
large share of the corpus, so a widening here has the widest blast radius in
the batch.

## Observability

N/A — no new observable operations.

## Rollback

Reversible, but not independently: revert the batch, not the task.

## Boundaries

- **Always:** derive the accepted syntax from the upstream command classes,
  not from the one fixture's text
- **Never:** touch the class parser, layout or renderer — this is dispatch only
- **Ask first:** this is the one task in the batch that legitimately **widens**
  a pattern (class currently claims too little, not too much). Confirm the
  widening is bounded to declaration syntax before writing it, and say so in
  the journal — the batch-wide "narrow, never widen" rule has this single
  documented exception

## Commit

One commit: `fix(T7): claim object map declarations in classAccepts`

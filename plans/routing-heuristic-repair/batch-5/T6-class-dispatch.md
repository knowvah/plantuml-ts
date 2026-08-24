# T6 — `classAccepts`, in both directions

## Context

`plantuml-ts` is a faithful port; the Java at `~/git/plantuml` is canonical.
**Read the Java method body before writing.**

`classAccepts` (`src/diagrams/class/class-dispatch.ts`) has one defect of each
kind. They are separate; do not assume one change closes both.

### It over-claims three sequence diagrams

| fixture | why |
|---|---|
| `dasutu-58-saje713` | `object o1 { … }` inside a `{{ }}` embedded diagram inside a `note left` |
| `rizove-01-move566` | `class Object { … }` inside a `{{ }}` embedded diagram inside a `!unquoted procedure` |
| `tuxido-23-xide677` | no class keyword at all — `Alice o-> Bob` / `Alice <<--o Bob`, i.e. sequence **arrow decorations** read as class relations |

The first two are one mechanism: `classAccepts` probes **inside** embedded
`{{ }}` sub-diagrams and `!procedure` bodies, where a declaration belongs to
the *nested* diagram, not the enclosing one. The third is a second mechanism.

### It under-claims one object diagram

`object/zuvila-56-nuda425` is built from `map "Arrows legend " as arrows { … }`
wrapped in a `legend` containing a nested `{{ }}` sub-diagram and a
`!procedure`. **The jar renders it `data-diagram-type="CLASS"`** — object
diagrams are the class family upstream, and this port has no `objectPlugin`
either (79 of the 80 `dot-cache/object/` fixtures already render `CLASS`).
`classAccepts` does not recognise `map`, so class wins such sources only by
fallback, and here it does not win at all.

This is the batch's D3 widening exception, and it is bounded by
`CommandCreateMap` and the `objectdiagram/command/` package — not by the one
fixture's text.

## Task

Stop `classAccepts` probing inside embedded sub-diagram and procedure bodies,
stop it reading sequence arrow decorations as class relations, and make it
claim object declaration syntax positively.

Write the test first (TDD).

## Read-set

- `src/diagrams/class/class-dispatch.ts` — `classAccepts` in full
- `~/git/plantuml/.../classdiagram/command/CommandCreateMap.java` and the
  `objectdiagram/command/` package — the real declaration grammar for `map`
  and `object`
- `~/git/plantuml/.../classdiagram/ClassDiagramFactory.java` — the command
  list, i.e. what the class factory genuinely accepts
- `~/git/plantuml/.../sequencediagram/command/` — the arrow-decoration
  grammar (`o->`, `<<--o`), so the second over-claim is fixed against the
  real token set rather than one fixture's two lines
- `src/core/EmbeddedDiagram.ts` — how `{{ }}` bodies are delimited elsewhere
  in this port; reuse that notion of "inside a nested diagram" rather than
  inventing a second one
- `test-results/dot-cache/object/zuvila-56-nuda425/in.puml`,
  `.../sequence/rizove-01-move566/in.puml`, `.../sequence/tuxido-23-xide677/in.puml`
- `../decisions.md#d2`, `../decisions.md#d3`

## Write-set

- `src/diagrams/class/class-dispatch.ts`
- `tests/unit/class/class-dispatch.test.ts`

Nothing else. If a file outside this set needs changing, **STOP and report
it** rather than changing it.

## Acceptance criteria

1. Given `map "Arrows legend " as arrows {`, then `classAccepts` is `true`,
   with the upstream command class cited in a comment
2. Given `object Foo {`, then `true` — check the grammar rather than assuming
   the two are spelled alike
3. Given a `class` or `object` declaration that appears **only** inside a
   `{{ }}` body or a `!procedure` body, then `false`
4. Given `Alice o-> Bob : hello` and `Alice <<--o Bob : ok` with no class
   keyword present, then `false` — table-driven over the sequence arrow
   decorations
5. Given the routing gate, then the three over-claimed fixtures report
   `jarType === ourType === 'SEQUENCE'`, and `zuvila-56-nuda425` reports
   `jarType === ourType === 'CLASS'` **once T7 has also landed** (it cannot
   close on this task alone — see the batch overview)
6. Given the 314 promoted fixtures in `svg-class/ratchet.json` and the 34 in
   `svg-object/ratchet.json`, then none is de-promoted

## Quality bar

All four gates green. AC6 matters most: `classAccepts` is consulted for a
large share of the corpus, so this task has the widest blast radius in the
batch — in both directions, since it both narrows and widens.

Do not re-pin any baseline; that is batch 6.

## Observability

N/A — no new observable operations.

## Rollback

Reversible, but not independently: revert the batch range, not the task.

## Boundaries

- **Always:** derive the accepted syntax from the upstream command classes,
  not from a fixture's text; record the D3 widening in the journal
- **Never:** touch the class parser, layout or renderer — this is dispatch
  only; touch `src/index.ts` (D1); widen beyond declaration syntax
- **Ask first:** if "inside a `{{ }}` body" cannot be determined without
  parsing — check `EmbeddedDiagram.ts` first; this port already has a notion
  of that boundary and a second one would be the divergence, not the fix

## Commit

One commit: `fix(T6): scope classAccepts to the enclosing diagram, claim map`

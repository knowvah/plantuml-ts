# T8 — container classification (`foo1.foo2`)

Prepend [../task-preamble.md](../task-preamble.md). Worktree `codd/T8`.

## Context
unknown/gerebe-26-neli152 and unknown/jafexe-59-muzo362 declare a dotted container name
(`foo1.foo2`). The jar makes ONE cluster; we make two (dsw journal row 9, next-missions). In the jar
this is decided by the namespace separator handling (`net/atmp/CucaDiagram.java`, `Quark`,
`CommandPackage*`, and the description `CommandPackageWithUSymbol`). Read the jar code that applies
here before deciding: the description diagram's separator default may be `null`, unlike class.

## Task
1. Quote the Java that decides whether `foo1.foo2` is one quark or a parent/child pair for a
   description diagram, including the effect of `set separator`/`!pragma` if present.
2. Mirror it in `parse-state.ts`/`namespace-groups.ts`, and in `layout-classify.ts` if
   classification reads it.
3. TDD with the two fixtures' jar DOT cluster count as the expected value.

## Write-set
- `src/diagrams/description/parse-state.ts`, `layout-classify.ts`, `namespace-groups.ts`, `parser.ts`
  (only if the separator default lives there)
- `tests/unit/description/**`

## Acceptance
- Given gerebe and jafexe, then our cluster tree equals the jar's (layoutParity `clusterTree` clean)
  and render-diff falls. Report before → after.
- Given every description-family survey, then there are zero conformant losses. A dotted name is
  common, so list every mover with its mechanism.

**Observability:** N/A. **Rollback:** Reversible.

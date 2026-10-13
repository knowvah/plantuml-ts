# T0d: colour core for PSystemColors (D6) — pre-declared core

Prepend [../task-preamble.md](../task-preamble.md).

## Task (TDD)
1. `HColorSet.names()` (`klimt/color/HColorSet.java#names`) over the port's named-colour table
   (`src/core/klimt/color/ColorTrieNode.ts:224` `NAMES`, `HColorSet.ts:329` says unported) — same
   order as the Java returns (read it: TreeSet? insertion?).
2. `ColorUtils.distance` (`ColorUtils.java:77-82`) in `src/core/klimt/color/ColorUtils.ts`
   (header says "Not ported: distance").
3. `HColorSimple.distanceTo` (`HColorSimple.java:217-219`) on the port's `HColorSimple`.
4. Tests: `names()` length and first/last entries vs the Java table; three distances computed by
   hand from the Java formula; `distanceTo` delegating.

## Write-set
`src/core/klimt/color/{HColorSet,HColorSimple,ColorUtils}.ts`, their unit tests,
`docs/catalog.md`, `.agent-notes/ufp-T0d.md`. Any OTHER file is a stop.

## Interface contract (→ T1b)
`HColorSet.names(): string[]`; `ColorUtils.distance(c1, c2): number`; `HColorSimple#distanceTo(other): number`.

## Acceptance
- Given `names()`, then it lists every named colour in the Java's order.
- Given two colours, then `distance` equals the Java formula.

**Observability:** N/A. **Rollback:** Reversible.

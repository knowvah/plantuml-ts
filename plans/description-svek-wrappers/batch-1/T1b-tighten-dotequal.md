# T1b — tighten `compareStructural` (dotEqual)

Prepend [../task-preamble.md](../task-preamble.md).

## Task
Make `dotEqual` see cluster nesting and title-table size (decisions.md D4). Today
`sortedClusterSizes` (`tests/oracle/svek-dot.ts:352`) compares membership counts only, so component
reports "DOT equal 259/263" while laying out differently.

## Write-set
- `tests/oracle/svek-dot.ts`
- its unit tests: a new `tests/unit/oracle/svek-dot.test.ts` (the directory is new; T1a creates it
  too, so expect a trivial merge) if none covers `compareStructural` directly
- **type-only** updates in existing importers (`grep -rln "oracle/svek-dot" tests scripts`: state
  tests, `scripts/dot-sync-report.ts`, `scripts/lib/survey-dot-equal.ts`, …) where a `StructuralCluster`
  literal or field access no longer typechecks. Any behavioural change in an importer is out of the
  write-set (stop 1).

## Read-set
- `tests/oracle/svek-dot.ts:99-120` (`StructuralCluster`/`StructuralGraph`), `:215-265` (`parseClusters`,
  `parseSvekDot`, `dotInputToStructural`), `:395-554` (`StructuralDiff`, `compareStructural`)
- `src/core/svek-dot-wrappers.ts` (whole, 104 lines): `wrapperLevels()` is the ONLY candidate-side
  derivation allowed
- `src/core/graph-layout-cluster.types.ts:60-170`: `labelWidth/labelHeight`, `titleTable*`,
  `innerMarginLevels`, `portRanksLabelOnEe`, `borderPointAncestorWrap`
- `test-results/dot-cache/unknown/bamami-10-lava790/svek-1.dot` (jar wrapper shape)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterDotString.java:91-158`

## Interface contract (output, consumed by T5)
```ts
export interface StructuralCluster {
  memberCount: number;                       // unchanged
  wrapperChain: { a: boolean; p0: boolean; i: boolean; p1: boolean };
  titleTable?: { w: number; h: number };     // the cluster's (or its port anchor's) label TABLE
}
```
- `StructuralDiff` gains one named check (e.g. `clusterNesting`), so a failing row reports which check failed.
- `parseClusters` keeps matching base clusters `^cluster\d+$` and attributes `a/p0/i/p1` subgraphs to
  their base cluster (they are not counted as clusters).

## Acceptance
- Given bamami's jar DOT, when parsed, then cluster6 has `wrapperChain {a:false,p0:true,i:false,p1:true}`
  and `titleTable {w:17,h:23}`.
- Given our current (pre-T3) bamami `DotInputGraph`, when compared, then `compareStructural` fails on
  the new check.
- Given every row in `oracle/goldens/svg-class/ratchet.json`, `svg-object`, `svg-state` (render each,
  capture, compare), when compared before and after this change, then the `dotEqual` verdict is
  identical. Any flip is stop 5; report it with the row and check name. Put this as a corpus test
  (skips without the cache) or a measured list in the report.
- Given a state border-point cluster (`portRanksLabelOnEe`), then its chain is `{a:wrap,p0:false,i:wrap,p1:false}`
  on both sides.

**Observability:** N/A. **Rollback:** Reversible. `dot-parity.json` is NOT regenerated here (T5).

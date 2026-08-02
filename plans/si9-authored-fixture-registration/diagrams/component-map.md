# Component map — what this mission touches

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

package "T1 — code (batch 1)" {
  [scripts/dot-sync-report.ts\nloadFixtures · ensureCanonical · buildAgg] as DSR
  [tests/unit/scripts/\ndot-sync-fixtures.test.ts i(new)/i] as DSRT
}

package "T2 — generated data (batch 2)" {
  [tests/oracle/svg-conformance/parity.json\niregenerated, never hand-edited/i] as PJ
}

package "T3 — pin + docs (batch 3)" {
  [oracle/goldens/svg-description/ratchet.json] as RJ
  [oracle/goldens/svg-description/README.md] as RM
  [plans/svg-sprite-nanoparser/decisions.md\niappend amendment only/i] as PD
}

package "read-only — reused, never reimplemented" {
  [scripts/svg-parity-survey.ts\ncomputeDotEqual · listFixtureDirs] as SUR
  [tests/oracle/svg-conformance/\ncompare.ts · normalize.ts] as CMP
  [tests/oracle/svg-conformance/\nrender-fixture.ts] as RF
}

package "OFF LIMITS — STOP if reached" {
  [tests/visual/data/*.json\n6 other consumers · ADR-1 rejected] as VD
  [src/diagrams/class/ · measureUsecase\nSI10] as CLS
  [any golden.svg · size-backlog.json] as GS
}

DSR --> PJ
PJ --> RJ
SUR ..> PJ : reads
CMP ..> RJ : used by
RF ..> RJ : used by
@enduml
```

## Blast radius by layer

| Layer | Effect |
|---|---|
| Data model | No schema change. `parity.json` regenerates (355 → 358 rows, all re-measured); `ratchet.json` gains 3. `test-results/` is gitignored and rebuildable. |
| API contracts | **None.** Nothing under `src/` changes; `src/index.ts` untouched. No semver implication. |
| Service deps | Pinned oracle jar + java 21, both present. Failure mode unchanged: no jar → no cache → survey sees nothing. |
| Files | 1 script, 1 new test, 2 generated/data files, 2 docs. |

## Why `tests/visual/data/*.json` is off limits

Six consumers read it — `scripts/capture-corpus.ts`,
`scripts/build-pages.ts`, `scripts/classify-corpus.ts`, and four integration
tests. ADR-1's rejected option would push three new fixtures into all of
them, including the demo page builder. Changing only
`dot-sync-report.ts`'s private reader keeps every one of them untouched.

This containment was discovered at trace level two and is now the strongest
argument for the chosen approach.

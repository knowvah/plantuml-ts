# Component map — what this mission touches

```mermaid
flowchart TB
  subgraph T1["T1 — code (batch 1)"]
    DSR["scripts/dot-sync-report.ts<br/>loadFixtures · ensureCanonical · buildAgg"]
    DSRT["tests/unit/scripts/<br/>dot-sync-fixtures.test.ts <i>(new)</i>"]
  end

  subgraph T2["T2 — generated data (batch 2)"]
    PJ["tests/oracle/svg-conformance/parity.json<br/><i>regenerated, never hand-edited</i>"]
  end

  subgraph T3["T3 — pin + docs (batch 3)"]
    RJ["oracle/goldens/svg-description/ratchet.json"]
    RM["oracle/goldens/svg-description/README.md"]
    PD["plans/svg-sprite-nanoparser/decisions.md<br/><i>append amendment only</i>"]
  end

  subgraph RO["read-only — reused, never reimplemented"]
    SUR["scripts/svg-parity-survey.ts<br/>computeDotEqual · listFixtureDirs"]
    CMP["tests/oracle/svg-conformance/<br/>compare.ts · normalize.ts"]
    RF["tests/oracle/svg-conformance/<br/>render-fixture.ts"]
  end

  subgraph OFF["OFF LIMITS — STOP if reached"]
    VD["tests/visual/data/*.json<br/>6 other consumers · ADR-1 rejected"]
    CLS["src/diagrams/class/ · measureUsecase<br/>SI10"]
    GS["any golden.svg · size-backlog.json"]
  end

  DSR --> PJ
  PJ --> RJ
  SUR -.reads.-> PJ
  CMP -.used by.-> RJ
  RF -.used by.-> RJ

  style OFF fill:#fdd,stroke:#c00
  style RO fill:#eef
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

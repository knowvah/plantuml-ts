# cdd-T14 — empty-package double draw + phantom leaf (E9): verified closed

Written 2026-09-22 by the orchestrator. T14 was specified as a diagnosis-mode
task because A2b E9 could not localise the TS mechanism. On the batch-4
tree (`c50a5ee9` = T11 + T13 + T12) every E9 symptom is already absent, so
the task reduced to attribution and verification (push-forward: task
simpler than estimated; decision-journal row 48).

## Diagnosis artifact (attribution, measured)
- **Mechanism**: the "second draw" and the "phantom `<g class="entity">`"
  were the same object — a phantom `Classifier` that `ensureClassifier`
  materialised and ticked for every link endpoint naming a package /
  namespace (`p1 -> p2`, `boo1.boo2 +--- foo1.foo2.foo3`, a dotted endpoint
  naming an implicit package). The row reached `ClassGeometry` and the
  renderer drew it as a leaf beside the real cluster or beside the collapsed
  empty-package leaf (mujopi's `data-entity-1="ent0005"` WAS the phantom).
- **Origin**: `src/diagrams/class/parser.ts:128` pre-batch-1, now
  `class-ensure-classifier.ts#existingGroupAlias` (T3, journal row 13,
  commit `8cd238f6`): upstream `CommandLinkClass.java:326-334` reads
  `quark.getData()` and never calls `reallyCreateLeaf` for an existing
  group (`atmp/CucaDiagram.java:266-286`).
- **Causal chain**: phantom row → extra leaf in geometry → duplicate
  path/line/text triple after a collapsed package (E9 "double draw") or an
  extra `g.entity` beside a real cluster (E9 "phantom leaf").
- **Ruled out**: a render-loop duplication in `renderer.ts` (the leaf loop
  draws each geometry row once; the count of rows was wrong) and
  `class-namespace.ts#collapseEmptyNamespace` (the surviving pair the
  report guessed at was the phantom classifier, not a namespace record).

## Verification on `c50a5ee9`
| fixture | b3 (S/N) | now (S/N) | E9 symptom |
|---|---|---|---|
| mujopi-30-zadi566 | 3/23 | 0/1 | 6 `<path>` in both documents — single draw |
| pisobo-93-sipa138 | 1/0 | 0/2 | 0 `g.entity` in both — no phantom leaf |
| cocube-46-tusu692 | 3/164 | 2/177 | residual is the empty-package leaf's `packageBorderColor` (T12 flag, row 46) |
| runane-30-vena766 | 1/10 | 0/7 | `ent0014` gone; ids equal the jar's |
| vusute-48-xono099 | 1/10 | 0/7 | same |

Remaining numeric residuals are T13's dot-engine issue 18 (`runane`/`vusute`
~20 px on the clip's trailing segment) and mujopi's one title x offset.

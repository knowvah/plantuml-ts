# T2d — divider / separator

Agent: `typescript-pro`, worktree `sdd1-T2d`. Commit:
`fix(sequence): paint dividers from the merged separator style`.
**Read [family-contract.md](family-contract.md) first — it is part of this
prompt.**

## The family
`== text ==` dividers. Style: `separator { LineColor black; LineThickness
2.0; BackGroundColor #e; FontSize 13; FontStyle bold; Padding 4 }`
(`plantuml.skin:179-187`), signature `root, element, sequenceDiagram,
separator` (`ComponentType.java:89-90`), merged in the constructor
(`Divider.java:51-61`). `divider-style.ts` hard-codes these today; replace
every constant with the Style read.

Java: `sequencediagram/Divider.java` (whole); `skin/rose/ComponentRoseDivider
.java` (whole).

## Write-set
`src/diagrams/sequence/{renderer-divider,divider-style}.ts`, their tests
under `tests/unit/sequence/`. If `divider-style.ts` is left with no content,
delete it (memory `delete-archived-code`).

## Read-set
`family-contract.md`; `decisions.md#d1`, `#d2`, `#d5`; both write-set files;
`geo-annotation.ts:40-70` (`DividerGeo`); `sequence-skin-param.ts`.

## Acceptance
- Given `== Init ==`, then line, band fill, font size/weight and padding
  equal the jar's, each value citing `plantuml.skin:179-187` or
  `ComponentRoseDivider.java:N`.
- Given `<style> separator { LineThickness 4 }`, then it arrives.
- Given `grep -n "[0-9]" divider-style.ts` (if kept), then every number
  carries a citation.
- Given the divider rows at b1b, then no row rises without a mechanism.

Quality bar and boundaries: per `family-contract.md`. Observability: N/A — no new
observable operations. Rollback: Reversible.

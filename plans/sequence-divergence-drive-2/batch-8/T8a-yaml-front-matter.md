# T8a — strip YAML front-matter

Agent: `typescript-pro` (sonnet), worktree `sdd2-T8a`. Commit:
`fix(core): strip yaml front-matter before diagram parsing`.
Read [../task-contract.md](../task-contract.md) first. Core, all engines.

## Mechanism (research D §2, fonudu)
`preproc/ReadLineWithYamlHeader.java:98-109` (`removeYamlHeader`), called
from `BlockUml.java:142`: a leading `---` … `---` block is removed before
the diagram is read. The port refuses the `---` line. Read both methods
for the exact boundary rules (what counts as the header, blank lines,
where it may start) and mirror them in `src/core/BlockUmlBuilder.ts`.

## Targets
fonudu-70 (would pin). List every other engine's fixture that moves.

## Write-set
`src/core/BlockUmlBuilder.ts`, its tests.

## Read-set
`research/research-d-structure.md` §2; `BlockUmlBuilder.ts`;
`ReadLineWithYamlHeader.java`, `BlockUml.java:120-160`.

## Acceptance
- Given a source starting with `---\ntitle: x\n---` before `@startuml`
  (or wherever the Java accepts it), then the header is removed (test
  citing `:98-109`).
- Given a `---` that the Java does not treat as a header, then it is kept
  (test).
- Given fonudu, then zero-diff; every engine's pins unchanged.

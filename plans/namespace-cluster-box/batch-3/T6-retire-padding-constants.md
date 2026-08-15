# T6 — retire the padding constants

## Context

`NAMESPACE_SIDE_PADDING = 16` and `NAMESPACE_TOP_EXTRA = 13`
(`src/diagrams/class/class-namespace-shape.ts:180,191`) exist only to
approximate what the cluster polygon already knows. After T5 nothing should
read them for geometry.

Neither carries an upstream `file:line`. Under this port's rule — every
constant ships with its citation, and an uncited one is unfinished — they
have to either go or acquire a citation.

## Task

Delete both constants and every reader. Then discharge the proof obligation
from `decisions.md#3`: **prove no package draws a box while having no
cluster.**

The reasoning that makes deletion look safe, and which must be verified
rather than assumed:

- `buildDotClusters` filters empty namespaces (`nonEmptyNamespaceIds`), so
  they never become clusters;
- `buildNamespaceGeos` already skips a namespace with no member positions;
- an empty package appears to render through `renderEmptyPackageLeaf`
  instead, a different path with its own footprint.

If a package CAN reach the box-drawing path with no cluster, deletion loses
its box entirely — the one failure mode in this mission that removes output
rather than misplacing it. In that case keep the minimum needed as a cited
fallback and record the finding.

## Write-set

- `src/diagrams/class/class-namespace-shape.ts`
- `tests/unit/class/class-empty-package-stereotype-a8.test.ts` and any other
  test asserting on the constants

## Read-set

- `src/diagrams/class/class-namespace-shape.ts:170-195`
- `src/diagrams/class/class-geo-builders.ts` (post-T5) — confirm no reader
  remains
- `src/diagrams/class/renderer.ts` — `renderEmptyPackageLeaf` and its
  dispatch
- `plans/namespace-cluster-box/decisions.md#3`

## Acceptance criteria

- Given `grep -rn "NAMESPACE_SIDE_PADDING\|NAMESPACE_TOP_EXTRA" src/ tests/`,
  when run after this task, then there are no hits — or exactly the cited
  survivor, with its upstream `file:line` in a doc comment.
- Given a package with no members, when rendered, then its box is byte-identical
  to today's output. This is the proof obligation; write it as a test, not as
  a manual check.
- Given T1's harness, when it runs, then both headline numbers are unchanged
  from the end of T5 — this task removes dead code, so it must move nothing.
- Given all four gates, when they run, then green.

## Observability requirements

N/A.

## Rollback

Reversible.

## Quality bar

All four gates green. Never pipe `npm test`.

## Boundaries

- **Always:** grep for readers before deleting. "Looks unused" is not "is
  unused" (`~/.claude/rules/pr-workflow.md`).
- **STOP:** if the empty-package proof fails, do not improvise a fallback
  shape. Log the finding, keep the minimum with a citation, and report.
- **Never:** run any git command.

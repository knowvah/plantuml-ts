# T19a — note connector ends on a package: magnetic border

**Agent:** typescript-pro (sonnet, effort high) · **Depends on:** T18 ·
parallel with T19b, T19c (disjoint write-sets, worktrees).
Prompt = [`../fix-task.md`](../fix-task.md) + this file.

## Fixtures

pecabi-95-demu756, sanixi-31-nofa193 (identical sources; b4: 0/2, both
`g[4]/path[1]/@d[29,31]` Δ4.893 on a note connector whose end sits on a
package).

## Mechanisms

- **CLIP-1a on a note connector** (T12 artifact, `.agent-notes/cdd2-T12.md`,
  journal row 31) — Δ4.893 = exactly the folder force's ramp branch
  `htitle * (x - (wtitle - marginTitleX3)) / (2 * marginTitleX3)`
  (20 × 3.425/14) of `USymbolFolder.java:242-266`. T12 ported the force
  for class edges (`class-shield-helpers.ts#clusterMagneticBorder` /
  `applyClusterMagneticBorders`, `SvekEdge.java:927-941`); the note
  connector's group end (`note-layout-tip.ts:268-269`) never applies it.
  Re-read which upstream path draws a note-to-package connector (a `Link`
  through `SvekEdge#drawU`, so the same magnetic-border code) and reuse
  T12's helper — do not re-derive the force.

## Write-set

`src/diagrams/class/note-layout-tip.ts`, tests beside it,
`.agent-notes/cdd2-T19a.md`. Importing from `class-shield-helpers.ts` is
fine; editing it is not (report instead).

## Acceptance criteria

- Given pecabi and sanixi, when rendered, then diff 0
- Given the 601 conformant class fixtures, when render-all runs, then none
  leaves conformant

## Observability · Rollback

N/A. Reversible.

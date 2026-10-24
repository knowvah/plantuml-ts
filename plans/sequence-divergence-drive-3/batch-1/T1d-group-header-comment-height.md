# T1d — group header height includes the comment's supplementary height

Agent: `typescript-pro` (sonnet), worktree `sdd3-T1d`. Commit:
`fix(sequence): add comment supp height to group header height`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism (sdd2: `group-header-comment-supp-height`; Java re-read)
`ComponentRoseGroupingHeader#getPreferredHeight` is `getTextHeight +
2 * getPaddingY() + getSuppHeightForComment()` (`skin/rose/
ComponentRoseGroupingHeader.java:121-122`), and `getSuppHeightForComment` is
`commentHeight - 15` when the `[comment]` block is taller than 15, else 0
(`:95-105`). `GroupingTile` takes `dim1.getHeight()` from that
(`teoz/GroupingTile.java:257-259`, feeding `h = dim1.getHeight() + MARGINY_MAGIC / 2
+ EXTERNAL_MARGINY` at `:157`, `getTotalHeight` `:349-352` and `getPreferredHeight`
`:355-365`). The drawn corner stays at `getTextHeight` (`:138-142`),
so the supplement raises only the layout advance, not the tab shape. Ours:
`computeHeaderTab` (`sequence-frame-metrics.ts:118-134`) documents
`getSuppHeightForComment` as "0" and returns `tabHeight` from the title block
alone; `sequence-layout-frame.ts:336` advances `cursor.y` by `tab.tabHeight`.
Compute the comment block's height (the file already measures the comment
for `tabWidth` in `renderer-frame-header.ts:172-184`; reuse that block
builder, do not duplicate it), add a `headerHeight` (or equivalent) field to
`HeaderTab`, and use it at `sequence-layout-frame.ts:336` and wherever else
the jar's `getPreferredHeight` is read (`getTotalHeight`/body start,
`GroupingTile.java:157-160,349-365`). `tabHeight` (the drawn corner) must
not change.

## Targets
zedepi-36-come743 to 0 (19 units). A `ref` frame keeps `refHeaderHeight`
(`sequence-layout-ref.ts:113`); do not touch it.

## Write-set
`src/diagrams/sequence/sequence-frame-metrics.ts`, `sequence-layout-frame.ts`
and their tests. `renderer-frame-header.ts` is read-only: if the comment
block builder must move out of it, report (stop 1) rather than edit.

## Read-set
`sequence-frame-metrics.ts:80-135`; `sequence-layout-frame.ts:320-358`;
`renderer-frame-header.ts:108-190`; Java: `ComponentRoseGroupingHeader.java:
56-125`, `GroupingTile.java:137-160,257-259,349-365`.

## Acceptance
- Given a group whose `[comment]` block is 15 + d tall (multi-line comment),
  when laid out, then the next tile starts d lower and the drawn corner
  height is unchanged (unit test citing `:95-105,121-122`).
- Given zedepi, then it diffs to 0; a one-line comment (height <= 15) moves
  nothing.
- Given the 1042 pins, then every pin stays byte-equal.

Observability: N/A — no new observable operations. Rollback: Reversible
(revert the task commit).

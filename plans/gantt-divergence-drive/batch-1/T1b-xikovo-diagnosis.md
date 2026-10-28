# T1b — diagnosis: the hidden footer's 8 px under top chrome (D2)

Agent: `debugger` (opus, effort high), worktree `gdd-T1b`. Writes ONE file:
`plans/gantt-divergence-drive/diagnosis/xikovo.md`. No `src/` or test edit;
no fix. Commit: `docs(gdd): xikovo diagnosis artifact (T1b)`.
Read [../task-contract.md](../task-contract.md) and `~/.claude/rules/diagnosis.md` first.

## What is known (planning probes, 2026-10-27)
Canvas heights jar / ours: title+`hide footbox` 90 / 82 (`xikovo-87-rosu902`,
authored `title-hide-footbox`); header+hide 51 / 43 (`header-hide-footbox`);
title-only 98 / 98; hide-only 55 / 55; caption+hide 49 / 49; the order of
the two lines does not matter. The body elements are byte-identical in every
case. The jar is additive: `GanttLayout.java:103` total = rows + footer where
footer is 0 under `hide footbox` (`:102`), and `DiagramChromeFactory.java:363`
`addTitle` / `:402` `addHeaderAndFooter` stack the block on top. Ours loses
exactly the 8 px `TimeHeader#getTimeFooterHeight` would add, only when a top
chrome block exists. `GanttLayout.ts` and `GanttDiagramMainBlock.ts:141-146`
mirror the Java line for line, so the loss is in the chrome seam.

## Read-set
`src/diagrams/gantt/index.ts:222-281` (`exportTextBlock`, `rawTextBlock`:
`dim`, `background` pass, `drawBodyAt`, `exportMargin`);
`src/core/annotations/chrome-export.ts`; `src/core/annotations/chrome.ts:330-421`
(`frameInkOf`, `height: fragment.preChromeHeight ?? fragment.height`, the slot stacking);
`src/core/annotations/body-ink.ts`; `src/core/document-margin.ts`;
`src/core/TextBlockExporter.ts:380-400`; `src/index.ts:160-205`;
the wbs/salt twins `src/diagrams/wbs/index.ts:264-` and `src/diagrams/salt/index.ts:235-`.
Java: `core/DiagramChromeFactory.java:120-135, 363-420`,
`core/TextBlockExporter.java:159-209`, `UgDiagram.java:123-131`,
`gantt/GanttDiagramMainBlock.java:152-158`, `gantt/draw/header/TimeHeader.java`
(`getTimeFooterHeight`, `getTimeHeaderHeight`).

## Method
Instrument (temporary logging in the worktree, reverted before commit): for
`title-hide-footbox` and `caption-hide-footbox`, print the gantt fragment's
`dim`/`height`/`exportMargin`, the chrome's `initial.height`, the ink box, and
the final canvas height at each hop. Find the hop where 8 px disappears in
the title case and not the caption case. Confirm against the Java: which
height the jar's `addTitle` stacks on (`original.calculateDimension`, never
an ink extent).

## Deliverable: `diagnosis/xikovo.md`
- **Mechanism** (1–2 sentences) · **Origin** `file:line` · **Causal chain**
  from origin to `svg/@height` · **Ruled out** with evidence (at least: the
  gantt layout, the document margin, the footer height itself) ·
  **Proposed write-set** (files, and whether core — stop 14 boundary) ·
  **Expected movers** in other engines if core (which engines hand a `dim`
  taller than their ink with top chrome).

## Acceptance
- Given the artifact, then its origin is one line in `src/core/annotations/`, `src/core/TextBlockExporter.ts`, `src/core/document-margin.ts` or `src/diagrams/gantt/index.ts` (else stop 14), and it explains why caption+hide does not lose height.
- Given the worktree at commit, then `git diff 01fe0c79b -- src tests` is empty.

Observability: N/A. Rollback: Reversible.

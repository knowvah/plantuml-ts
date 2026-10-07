# T1a — label + translate census (diagnosis only, D1/D2)

Agent: typescript-pro, worktree `add3-T1a`. Rules: [../common-rules.md](../common-rules.md). NO `src/` edits.

## Task
1. Enumerate every live `Snake.withLabel(…)` call under
   `activitydiagram3/ftile/**` (skip `gtile/`, `Gtile.USE_GTILE=false`): class,
   file:line, alignment argument (`VerticalAlignment.BOTTOM/CENTER`, or
   `arrowHorizontalAlignment()` — read what that returns and from which style),
   and our push site (file:line) or MISSING. ~30 sites (planning grep).
2. Enumerate every live `drawTranslate` (cross-swimlane connection) and its
   counterpart: an existing `LoopTranslate` kind (`layout/swimlane-loop-translate*.ts`)
   or MISSING.
3. Oracle mini-cases (`scripts/oracle-render.sh`) in `measurements/label-cases/`
   for each `getTextBlockPosition` branch (`Snake.java:244-267`: BOTTOM, CENTER,
   zigzag DLD/DRD with CENTER and RIGHT, RD, LD, default) and for a coloured
   label (does the jar draw any background pill? our `renderer.ts:82-111` does);
   record jar text x/y vs ours.
4. Confirm how label boxes reach the canvas extent (`Snake.getMaxX`,
   `Snake.java:234-242`, and LimitFinder on `drawU`).

## Interface (consumed by T1b/T1c)
`label-census.md`: tables `javaClass | file:line | alignment | ourSite` and
`javaClass | file:line | drawTranslate | ourKind (or MISSING)`; per-case jar vs ours.

Acceptance: every live site has a row; every case has jar + ours recorded.
Observability: N/A. Rollback: Reversible.

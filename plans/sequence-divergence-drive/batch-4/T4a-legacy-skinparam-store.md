# T4a — the legacy `SkinParam#params` store for command-time colour reads

Agent: `typescript-pro`, worktree `sdd1-T4a`. Seeded at the b3 close from
T3f item 3 (journal rows 50-51). One commit per step.
**Read [../batch-2/family-contract.md](../batch-2/family-contract.md) first —
it is part of this prompt.**

## Mechanism
`skinparam sequenceGroupBodyBackgroundColor` is a LEGACY ColorParam, read at
the group command, not a Style property: `SequenceDiagram.java:418-419`
calls `getSkinParam().getHtmlColor(ColorParam.sequenceGroupBodyBackground,
null, false)`. That reads `SkinParam#params`, which `setParam` fills
(`SkinParam.java:205,227-234`), through `getValue` (`:326-340`),
`getHtmlColor` (`:371-396`), `getParamName` (`:424-432`) and
`HColorSet#getColorOrWhite` (`HColorSet.java:58-63`); the ColorParam is
`ColorParam.java:60`. The value applies to the command's `backColorGeneral`
when the command gives no colour. Fixtures use colours without `#`
(`40112233`, `00FF0040`), so parse as `getColorOrWhite` does. Nine fixtures
miss their band: cabeve, darupa, koleji, murori-42, nofegi, padomu, xebixi,
xeneru, xuzedu.

The sequence dispatch (`sequence-skin-param.ts`) replays skinparams per line
(T1e) into the style `SkinParam` from `mindmap-style-builder.ts`, which has
no `params`/`getValue`. Precedent for a sequence-local store:
`src/diagrams/wbs/wbs-skin-param.ts:92-136` (a ported `params` map,
`setParam`'s params half, `getValue`). Do NOT edit `src/core/style/**`.

## Task
1. Tests first: each of the nine fixtures' band fill equals the jar's; a
   `sequenceGroupBodyBackgroundColor` placed AFTER a group reaches only later
   groups (it is read at the command, at its line — jar-verify).
2. Add a positioned `params` store to the sequence dispatch: every skinparam
   assignment executes at its own line (T1e's `skinparamAssignments`) into
   both the style path (as today) and the store (`cleanForKeySlow` keys,
   `trin` values, as wbs does). Expose `getValue`/`getHtmlColor` reads the
   group command can call at its line.
3. `command-grouping.ts`: opener and else take that colour as
   `backColorGeneral` when the command has none (`SequenceDiagram.java:
   418-419`, `GroupingLeaf`/`GroupingStart` constructors).
4. Report any OTHER `getHtmlColor(ColorParam.…)` read in
   `sequencediagram/**` that the store now makes reachable (grep the Java);
   port it only if it is one call and in your write-set, else list it.

## Write-set
`src/diagrams/sequence/{sequence-skin-param,command-grouping,parser,
sequence-parse-helpers}.ts`, a new `sequence-legacy-params.ts` if the
500-line hook forces a split, their tests under `tests/unit/sequence/`.

## Acceptance
- The nine fixtures' band fill diffs are gone (report each row's ws).
- Every riser vs your start has a mechanism; all pinned goldens stay
  byte-equal.

Quality bar and boundaries: per `family-contract.md`. Observability: N/A.
Rollback: Reversible.

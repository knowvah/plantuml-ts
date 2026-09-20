# T0 — classify the 22 rows and read the dispatch

**Agent:** debugger · **Depends on:** — · Read-only on `src/`.

## Context

Faithful TypeScript port of PlantUML; the Java is the spec. Read
[`../README.md`](../README.md) and [`../decisions.md`](../decisions.md)
(the quoted mechanism, D5, D8, D9). The filing claimed 22 "laned loop rows";
three declare no swimlane (`../fixtures.md`). Prior observations that bear
on this task: `plans/activity-loop-tile-port/stop-11-complex1.md` (which
repeat rows reach `Complex1`), `.agent-notes/altp-T4.md`,
`.agent-notes/aitp-T7.md` (measure before stating a mechanism).

## Task

1. Baseline: `npx tsx ../tools/render-all.mts` -> `../measurements/base.json`
   (268 rows), `../tools/diag-scan.mts` -> diagonal count (expect 0), and the
   aggregate `weightedScore` from `oracle/goldens/svg-activity/diff-baseline.json`.
   Journal all three.
2. For each of the 22 slugs: `npx tsx scripts/activity-probe.ts --align <slug>`,
   `--dump <slug>`, `--lanes <slug>`. From the dump, name which loop
   connectors cross a lane (walker lane pair differs) and which Java class
   each maps to: `while-back` (`FtileWhile.ConnectionBackSimple`),
   `repeat-out`, `simple1`, `simple2`, `complex1` (`FtileRepeat`), or `none`.
   Fill `../fixtures.md`'s three T0 columns. Save each probe output under
   `../measurements/<slug>.txt`.
3. For `camavo`, `vupuse`, `zepima`: state the mechanism the probe shows
   (not a translate shape) and append a re-filing line under the
   `activity-loop-lane-translate` entry in `planning/next-missions.md` (D8).
4. Read `ftile/vcompact/UGraphicInterceptorOneSwimlane.java` (whole file)
   and `Swimlanes.java:318-356`. Journal, with `file:line`: what the per-lane
   pass does with a connection whose `tile1.getSwimlaneOut() !=
   tile2.getSwimlaneIn()` that is NOT `ConnectionTranslatable` — drawn in
   lane 1, in lane 2, or dropped. This resolves D5; a third outcome is stop 9.
   Name a baseline row that exercises it if one exists (`FtileWhile`'s
   `ConnectionBackEmpty`/`ConnectionOut` crossing lanes).
5. D9 gate: for the 14 break rows named in `../fixtures.md`, record whether
   any is a `base.json` mover candidate or shares a connector with a
   classified row; journal "T5 confirmed" or "T5 struck" with the evidence.
6. `.agent-notes/allt-T0.md`: anything non-obvious about the probe, the
   dump, or the Java that a later task would otherwise re-derive.

## Read-set

`../fixtures.md`; `scripts/activity-probe.ts:1-80` (flags, output shape);
`src/diagrams/activity/layout/swimlane-placement.ts:60-96,354-388`;
`src/diagrams/activity/layout/walk-while-branch.ts:153-218`;
`src/diagrams/activity/layout/walk-repeat.ts:219-346`;
`ftile/ConnectionCross.java:40-80`; `ftile/Swimlanes.java:318-356` and the
`Cross` inner class; `ftile/vcompact/UGraphicInterceptorOneSwimlane.java`;
`ftile/vcompact/FtileWhile.java:171-230,277-308`;
`ftile/vcompact/FtileRepeat.java:221-260,275-331,333-404,537-676`.

## Write-set

`plans/activity-loop-lane-translate/fixtures.md`, `…/measurements/*`,
`…/decision-journal.md`, `.agent-notes/allt-T0.md`,
`planning/next-missions.md` (append-only, re-filings). Nothing under `src/`
or `tests/`.

## Interface out (consumed by T2, T3, T4)

`fixtures.md` rows: `{ slug, classes: ('while-back'|'repeat-out'|'simple1'|
'simple2'|'complex1'|'none')[], alignBefore: 'n/m', note }`;
`measurements/base.json` as `render-all.mts` writes it.

## Acceptance criteria

- Given each of the 22 slugs, when the probes run, then `fixtures.md` has all
  three T0 columns filled and `measurements/<slug>.txt` exists
- Given `camavo`/`vupuse`/`zepima`, when classified, then each carries a
  named mechanism and a re-filing line in `next-missions.md`
- Given `UGraphicInterceptorOneSwimlane` is read, then the journal names the
  non-translatable cross-lane outcome with `file:line`, and it is one of D5's two
- Given the 14 break rows, then the journal says "T5 confirmed" or "T5 struck"
- Given `git diff --name-only`, then only the write-set changed

## Observability / rollback

N/A — no new observable operations; the gates are the SLIs. Reversible
(revert the commit; no data, no migration).

## Quality bar

`npm test` (JSON-reporter collected count = on-disk count), `npm run
typecheck`, `npm run lint`, `npm run build` all green before the commit. One
commit, `<type>(allt-TN): …` per `~/.claude/rules/commits.md`, body says
why. `git diff --name-only HEAD~1` = this write-set only.

## Boundaries

Always: read the Java method body before stating why anything differs;
every constant carries its `file:line`. Ask first (halt + journal): any
stop condition in `../README.md`. Never: refactor while porting; fit a
value; delete an assertion; touch `layout.old.ts` or `compress-geometry.ts`.

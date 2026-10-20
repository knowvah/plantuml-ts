# sdd1 — architecture decisions (locked 2026-10-19)

Approved by the user as recommended. Amending one is stop 3: amend here,
journal it, halt.

| ID | Decision (one line) |
|---|---|
| D1 | Port the `StyleBuilder` seam first, then migrate component families; a migrated component reads ONLY `Style`. All families finish in sdd1. |
| D2 | Capture the builder per event at its command line (replay declarations before each command), as upstream and wbs do. |
| D3 | `parseSequence(source: UmlSource, options)`; plugin and `render-fixture-sequence.ts` change in the same commit. |
| D4 | Reuse `src/core/style/mindmap-style-builder.ts` unchanged; any edit under `src/core/style/**` is stop 8. **Amended 2026-10-19 (Amendment 1): `Style#mergeNestedChildOver` is unported — ruling pending.** |
| D5 | Delete a family's `theme.colors.*` / `theme.sequence.*` reads in the commit that migrates it; delete a theme field when its last reader goes. |
| D6 | Pin = zero-diff ratchet render; survey measured each close; disagreements journaled; re-pin once per close after adjudication. |
| D7 | b0 is the reference; all-engine survey each close; every numeric change cites upstream `file:line`. |
| D8 | No accepted divergences signed; the 13 error rows and the latex/math rows are out of scope. |
| D9 | Worktrees per task, no Serena edits or `git stash` in agents, orchestrator gates and merges; never push. |
| D10 | Target ≥ 250 pins; a miss is acceptable only if every unpinned paint-only row has a named mechanism filed for sdd2. |

## D1 — seam first, then families

**Context.** The sequence engine (66 files, ~16k lines) resolves style from
hard-coded constants and `theme.colors` / `theme.sequence` — e.g.
`renderer-lifeline.ts:215` strokes at `theme.scaleK`, so the jar's 0.5 never
appears. Mindmap, wbs and salt already run on the ported `StyleBuilder` and
are at or near 100% conformant. Upstream `Rose` components take a `Style`
(`ComponentRoseParticipant.java:68-71`).
**Decision.** Batch 1/1b land the seam with no output change; batches 2–3
move one family per task; batch 3b deletes what is left of the theme path.
**Consequences.** Never two paths for one component. Corrected constants
(option C) were rejected: CLAUDE.md treats a structural divergence as the bug,
and constants break on the next `<style>`/`!theme` fixture.

## D2 — per-event capture

**Context.** Some upstream events merge their style in the constructor
(`Delay.java:61`, `Divider.java:61`, `AbstractMessage.java:68`); others keep
the builder and merge at use time with stereotype/colors
(`Participant.java:82-91`, `Note.java:71-79`, `Doll.java:103-108`).
**Decision.** AST events and participants carry the `StyleBuilder` current
at their command line; each family resolves its `Style` exactly where its
Java class does (constructor-time or use-time). The dispatch copies
`WBSDiagramFactory.ts#createStyleDispatch` / `executeDeclarationsBefore`.
**Consequences.** A mid-diagram `skinparam` or `<style>` reaches only later
events, as upstream. A single post-parse builder was rejected: it fits today's
corpus and is wrong in principle.

## D3 — `UmlSource` entry seam

**Context.** `parseSequence(lines, options)` (`parser.ts:389`) never sees
`styleSource` / `stylePositions`. wbs takes the `UmlSource`
(`parseWbs(source, …)`, `WBSDiagramFactory.ts:266`).
**Decision.** Change the internal signature; tests reach it through a new
`tests/helpers/sequence-source.ts#sequenceSource(lines)`.
**Consequences.** ~30 call sites in one task (T1b). The harness must change
with production or the ratchet measures a path production does not take
(memory `conformance-harness-mirrors-index-ts`).

## D4 — shared builder, unchanged

**Decision.** Import `buildMindmapStyleBuilder`, `createMindmapSkinParam`,
`positionedDeclarationsOf`, `executeDeclaration` from
`src/core/style/mindmap-style-builder.ts` as they are. No rename (CLAUDE.md:
preserve names, no refactor while porting).
**Consequences.** A Style read the ported `Style` class lacks is a halt, not a
patch. `Style` already has `value`, `getStroke`, `getPadding`, `getMargin`,
`getShadowing`, `getFontConfiguration`, `getUFont`,
`getHorizontalAlignment` (`Style.ts:150-310`).

**Amendment 1 (2026-10-19, T1a, halt pending ruling).** The premise "Style
already has every read sdd1 needs" is false for one method:
`Style#mergeNestedChildOver` (`Style.java:158-173`) is listed as not ported
(`src/core/style/Style.ts:117-120`). Upstream calls it for the non-partition
group header (`Grouping.java:83-96`, `computeStyleHeader`) and for every
reference header (`Reference.java:85-97`), both T3a. T1a did not patch:
`groupingStyle(b, 'START'|'ELSE', true)` and `referenceStyle(b, true)`
throw `unported: Style#mergeNestedChildOver` (pinned by a test). Nothing in
batches 1b–2 reads those two styles. Ruling needed: (a) lift stop 8 for a
narrow port of that one method into `Style.ts` (with its own test, citing
`Style.java:158-173`) before T3a, or (b) leave group/reference headers open
→ sdd2. Also not ported but NOT blocking: `Style#getSymbolContext`
(`Style.java:270-286`), rebuilt in `paintOf` from ported reads;
`Stereotype#getStyles` (`Stereotype.java:185-193`, outside `core/style/`)
inlined privately in `sequence-skin-param.ts`, as `sequence-shadowing.ts`
already does.

## D5 — retire the theme path per family

**Decision.** A family task deletes its own theme reads. T3c deletes fields
left without a reader and audits for stragglers. Fields still read by another
engine stay. Chrome (title/legend/header/footer/caption) keeps its
annotations path — out of scope.
**Consequences.** `Theme` is not re-exported from `src/index.ts` today; T3c
still runs the stop-11 check before deleting any field.

## D6 — conformance and pins

**Decision.** A pin requires a zero-diff `renderFixtureSequence` render
(`DeterministicMeasurer`, `fixtureIncludeStore()`) against the cached
`in.svg` — the existing `sequence.golden.ratchet.test.ts`. The `renderSync`
survey is taken at every close; a fixture where the two disagree is
journaled with its mechanism (stop 13 if not isolated). Baselines re-pin once
per close, after adjudication (precedent: `sequence-coordinate-convergence`
D5). Falls are adopted; every rise needs its own mechanism line.

## D7 — reference and loss gate

**Decision.** b0 (batch 0) is the reference. Every close surveys every
engine into `$M/bN-eng/` and diffs against the previous close. No fitting:
every numeric change carries its upstream `file:line` in the same commit.

## D8 — scope boundary

**Decision.** Nothing is signed into `oracle/accepted-divergences.json`. Out
of scope: the 13 `error` rows (CommandUrl, CommandLinkAnchor,
CommandActivate2, CommandStyleImport, YAML front-matter, URL notes, `hide`
stereotype gender, one `!includedef` harness gap) and latex/math (KaTeX,
permanent — memory `latex-math-is-permanent-divergence`).

## D9 — execution

**Decision.** `$M/mkwt.sh <Tn>` worktrees; agents: targeted vitest +
typecheck + eslint, no Serena edit tools, no `git stash`; orchestrator: four
gates + full conformance set at `--maxWorkers=4` before every merge
(memories `gate-merges-on-full-set-and-typecheck`,
`vitest-timeouts-under-agent-load`). Branch `feat/sequence-divergence-drive`,
merge commit, unsigned commits, never push.

## D10 — target

**Decision.** ≥ 250 pins. 338 rows are paint-only at planning; some carry
paint diffs not owned by the style path (e.g. text `@fill` from creole
color). A miss is acceptable only if every unpinned paint-only row has a
named mechanism and an sdd2 owner in `fixtures.md`.

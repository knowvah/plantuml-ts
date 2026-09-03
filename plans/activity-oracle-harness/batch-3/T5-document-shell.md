# T5 — Route activity through the klimt document shell

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`feat/activity-oracle-harness`. **Activity is the last engine still emitting
a bare `svg` root via the generic `svgRoot`.** class, state, description,
json and sequence all route through `src/core/klimt/document-shell.ts`.
Sequence was moved by SI34 (`plans/sequence-root-chrome`), whose T3 dropped
803 of 1010 fixtures from this exact 12-path diff set to a 5-path set.

**Entry gate:** T4 returned `isChrome: true` for both extra `g` children.
If it did not, stop — you are not authorized to run.

## Task
Make `renderActivity` produce a jar-shaped document.

1. **Root attributes.** The jar emits `xmlns:xlink`, `version="1.1"`,
   `data-diagram-type="ACTIVITY"`, `style="width:...;height:...;background:...;"`,
   `preserveAspectRatio`, `zoomAndPan="magnify"`, `contentStyleType`. Ours
   emits none of them. Use `assembleDocumentShell` — do **not** hand-add
   attributes; the shell is THE one definition of that markup.
2. **The defs element.** The jar emits it EMPTY. Ours carries 12 `marker`
   children that `svgRoot` injects automatically from `ALL_ARROW_TYPES`
   (`src/core/svg-markers.ts`). Activity already draws its arrowheads as
   inline polygons (`src/diagrams/activity/renderer.ts:44`), so those markers
   are unreferenced. **No arrowhead port is needed** ([D6]) — this is the
   whole difference from SI34's equivalent task.
3. **The root group.** Remove **only** what T4 licensed, and nothing else.
   `document-shell.ts` requires the caller to hand it a body already wrapped
   the way it should appear in the root group slot — read that contract
   before wiring.
4. If T1's helper needs adjusting because shell assembly moved inside
   `renderActivity`, adjust it. Do not restructure it beyond what the move
   requires.

**Do not refactor while porting.** Redundant-looking branches in this
renderer handle cases the corpus surfaces months later. Touch the chrome
path; leave the rest.

**Every constant carries an upstream `file:line`.** If you need a value and
cannot cite where it comes from, that is stop condition 8 — never fit a
value, especially not one that shrinks the error.

## Expected ratchet behavior
T2's gate will report `[IMPROVED]` on essentially every fixture, and may
report a RISEN `diffCount` on some. Per [D2] a risen `diffCount` beside a
fallen `weightedScore` is the expected artefact of collapsing a
short-circuit into real comparison — not a failure. **Do not re-pin the
baseline here**; that is T6, deliberately separate ([D5]).

## Write-set
- `src/diagrams/activity/renderer.ts`
- `tests/oracle/svg-conformance/render-fixture-activity.ts` (only if the
  shell move requires it)

**Not** `activity-renderer-shapes.ts` ([D6]). **Not** `diff-baseline.json`
([D5]). **Not** `render-manifest-baseline.json` ([D10] — that is T6).

## Read-set
- `plans/activity-oracle-harness/decisions.md` — D2, D5, D6, D7, D10
- `.agent-notes/aoh-T4-g-children.md` — **what you are allowed to remove**
- `src/core/klimt/document-shell.ts` — the shell contract; read the
  `ShellFragment` doc comment on body wrapping
- `src/diagrams/sequence/renderer.ts:415-460` — the closest precedent
- `src/diagrams/state/renderer.ts:295-320` — the background-rect precedent
- `src/diagrams/activity/renderer.ts:196-227` — what you are changing
- `plans/sequence-root-chrome/README.md` — what SI34 achieved and did not

## Architecture decisions
[D6] shell, no arrowhead port · [D7] remove only what T4 licensed ·
[D5] do not re-pin here · [D2] a risen `diffCount` is not a regression.

## Interface contracts
`renderFixtureActivity(markup, measurer)` keeps its signature. Consumed
by T6.

## Acceptance criteria
- Given any activity fixture, when rendered, then the root carries all seven
  jar attributes including `data-diagram-type="ACTIVITY"`, and the defs
  element is EMPTY.
- Given the same fixture, then the root group's child count equals the jar's.
- Given the T2 ratchet, then no fixture's `weightedScore` rises without T6
  later naming a mechanism for it.
- Given `git diff --name-only`, then only the declared write-set changed.
- Given the four gates, then all green.

## Observability
The output-shape change is user-visible in `renderSync`. Record it in the
commit message body. plantuml-ts has no consumers, so no compatibility
handling is required — see `decisions.md` "Not applicable".

## Rollback
**Reversible.** One commit against one source file; `git revert` restores the
prior output shape. No data migration.

## Quality bar
All four gates green. Complexity hook satisfied. Report the wall-clock.

## Commit
`feat(aoh-T5): route activity through the klimt document shell`

Body: why the root shape changed, that the defs markers were unreferenced
(activity draws inline polygons), and which `g` children T4 licensed
removing.

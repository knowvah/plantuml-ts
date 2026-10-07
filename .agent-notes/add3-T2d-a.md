# T2d-a (add3) — final report

## Pass 2 addendum (DOCGRAD, row 2) — see its own section below

Orchestrator accepted pass 1 (`eabe9099b`, `fcaddc477`) and extended the
write-set (`src/diagrams/activity/renderer.ts`'s fragment/background field,
`skinparam-key-handlers-table-a.ts`'s `backgroundcolor` handler, the
assemble-time background path) to unblock row 2. Merged
`feat/activity-divergence-drive-3` into this branch first (no rebase,
clean merge, no conflicts) to pick up batch 1's own `renderer.ts` changes,
then implemented DOCGRAD as commit 3 (`6c1f1739f`). See "Row 2 — DOCGRAD
... DONE (pass 2)" below for the full mechanism; the original "NOT
ATTEMPTED" write-up is kept as pass 1's own record, superseded by pass 2.

## Commits (branch `add3/T2d-a`, worktree `.claude/worktrees/add3-T2d-a`)

1. `eabe9099b` fix(add3-T2d-a): seed activity harness gradient/filter ids
2. `fcaddc477` feat(add3-T2d-a): dark-seed the activity terminal-circle stroke
3. `bda707819` merge(add3-T2d-a): feat/activity-divergence-drive-3 into branch
4. `6c1f1739f` feat(add3-T2d-a): render activity gradient document backgrounds

All four green individually (typecheck both tsconfigs, eslint on touched
files, targeted vitest, the three oracle gates) before moving to the next.

## Row 1 — HARNESS-SEED (dakesa-98-mano758)

**Java -> ours**: `SvgGraphics.java:160-162,393` mints every
`<linearGradient>`/`<filter>` id from the diagram's own seed
(`UmlSource#seed()`). `src/index.ts:385` (`prepareBlock`) always passes
`seed: seedOfUmlSource(umlSource)` into `assembleSvg`; the activity harness
(`tests/oracle/svg-conformance/render-fixture-activity.ts`) called
`assembleSvg(fragment)` with NO second argument at all three call sites —
a harness/production drift (precedent:
`.agent-notes/conformance-harness-mirrors-index-ts.md`), not a port defect.

**Fix**: added `seedOfUmlSource({ lines: first.source.lines, rawSourceLines,
seedSourceLines: first.seedSource })`, mirroring
`render-fixture-class.ts`'s own identical computation exactly, and threaded
`seed` through all three `assembleSvg` calls.

**Isolated effect** (verified by swapping the pre-edit file back in and
re-running the probe at the SAME commit, not inferred): Σ 16362 -> 16360
(-2), exactly ONE fixture moves (`dakesa-98-mano758`), 0 risers. The probe's
raw "fallers" list showed 17-18 entries at both before and after — 17 of
those are PRE-EXISTING drift unrelated to this edit (same 17 appear with
the file reverted to its pre-row-1 state); only `dakesa` is this commit's
own effect.

**Gates**: `activity.golden.ratchet`/`activity.harness-parity`: 288/288
green, both before and after. `activity.style-baseline`: 16 failures,
IDENTICAL set before and after this edit (confirmed via diff of the
sorted failing-fixture list) — all pre-existing, not introduced here (see
"Pre-existing red" below).

## Row 2 — DOCGRAD (cigagu-31-rime196, gudute-55-nulo344) — pass 1 diagnosis (superseded by pass 2 below)

**Mechanism** (read directly): both fixtures set
`skinparam backgroundColor #AAAAAA-white` — upstream's document-level
background GRADIENT (`HColorSet.java:109-116` parses the `-` separator;
`SvgGraphics.java:178-183` mints gradient id 0 via `createSvgGradient` and
paints a full-canvas `<rect fill="url(#id)">` as the content group's FIRST
child, with `backcolorString` left `null` so the root `style="background:
...;"` attribute is OMITTED entirely for a gradient).

Ours: `skinparam-key-handlers-table-a.ts:83-88`'s `backgroundcolor` handler
sets `acc.background = color` using the handler's 3rd arg
(`resolveColor(value)`, `skinparam-key-normalize.ts:64-68` — a
deliberately-flattening helper that keeps ONLY the gradient's end colour,
e.g. `"white"` for `"#AAAAAA-white"`), never the 4th arg `paint`
(`resolveColorPaint(value)`, which WOULD return the full `Gradient`). That
end colour then resolves to `#FFFFFF`, which is EXACTLY what the brief's
own description reports ("ours emits `background:#FFFFFF`").

**Why not fixed**: the Paint value is lost at the skinparam layer (fixable
within the write-set: `skinparam-key-handlers-table-a.ts`,
`skinparam-accumulator.ts`, `theme-graph-colors-b.ts`/`theme.ts`), but
carrying it to the assemble-time background rect requires ONE further
step this write-set does not cover. Two routes, both checked by reading
the code, not assumed:

1. **Widen `theme.colors.background` itself to `Paint`.** Ruled out:
   `theme-colors-fields.ts`'s own doc comment on the sibling `elements`
   field states the established precedent directly — "the flat fields
   below stay `string` (widening them ripples into ~20 not-yet-Paint-aware
   renderers with no gradient need)". Confirmed by grep: `theme.colors
   .background` is read as a plain `string` in ~30 sites across board,
   chart, state, json, description, class, files, sequence, packetdiag,
   chronology — none in this task's write-set. Widening the type would
   require editing all of them (type errors otherwise), far outside
   write-set and high-risk.
2. **Add a dedicated `Paint` field** (the established alternative — same
   file already carries `arrow: Paint` as a dedicated field for exactly
   this reason) **and thread it onto `RenderFragment`.** The accumulator/
   theme-builder/theme-graph-colors half of this IS in-write-set and was
   not written (no fixture-verified value to put there yet, see below).
   The blocking half: `assemble-svg.ts#finalizeActivityFragment`/
   `maybeActivityBackgroundRect` receive only `fragment: RenderFragment`
   — `theme` is never in scope at assemble time (by design: `dispatcher
   .ts`'s own `RenderFragment.diagramType` doc comment: "Set by the
   producing engine's own renderer/plugin -- never by assembleSvg
   itself"). The ONLY place a `theme` is in scope to populate a new
   `fragment.backgroundGradient` field is **`src/diagrams/activity/
   renderer.ts:426`** (`background: theme.colors.background,`) — NOT in
   this task's write-set. `assembleSvg` is also a PUBLIC export
   (`src/index.ts:48`), so changing ITS signature to carry `theme` through
   would be a public API change (forbidden, stop 11).

**Residual**: both fixtures still diverge on the document background
(gradient vs `#FFFFFF`) and the content rect (`fill="url(#...)"` vs none).
**Owner**: whoever next edits `src/diagrams/activity/renderer.ts:426` —
add `backgroundGradient: theme.colors.graph.activity?.backgroundGradient`
(or equivalent new dedicated theme field) alongside the existing
`background:` line, then read it in `assemble-svg.ts`'s activity
finalizer (already in THIS task's write-set) to emit the gradient def +
`url(#id)` rect and skip the root `style="background:"` attribute,
mirroring `SvgGraphics.java:178-192,367-406`. No code was written for
this row — diagnosis only, per the write-set boundary (rule 7) and this
project's own precedent for the identical situation
(`.agent-notes/T2d-klimt-exception.md`, `.agent-notes/T3i.md`'s own
"not attempted, re-slotted" treatment of `levuma`'s circle-ink gap).

## Row 2 — DOCGRAD — DONE (pass 2)

Orchestrator extended the write-set to cover exactly the gap named above
(`src/diagrams/activity/renderer.ts`'s fragment/background field, the
`backgroundcolor` handler, "the assemble-time background path") and
explicitly ruled out widening `theme.colors.background` — confirming
route 2 (dedicated field) from the pass-1 diagnosis, not route 1.

**Fix, option 2 from the pass-1 diagnosis, implemented exactly as
specified:**

1. `skinparam-key-handlers-table-a.ts`'s `backgroundcolor` handler now
   also reads its 4th arg (`paint`, `resolveColorPaint(value)`) and, when
   it resolves to a real `Gradient` (not a plain string), stores it on a
   NEW accumulator field `acc.backgroundGradient` — `acc.background`
   (the flattened end-colour) is set exactly as before, byte-identical
   for every non-gradient key.
2. New `SkinparamAccumulator.backgroundGradient: Gradient | undefined`
   (`skinparam-accumulator.ts`), threaded through `skinparam-theme-
   builder.ts`'s `hasColorsOverride`/`buildColorsOverride` (split into a
   new `applyBackgroundOverride` helper to stay under the CCN cap) into
   a new ROOT-level `Theme['colors'].backgroundGradient?: Gradient`
   (`theme-colors-fields.ts`, sibling to `background: string`, mirroring
   the file's own existing `arrowHead?: Paint` precedent for "a dedicated
   field beats widening a flat colour field").
3. New `RenderFragment.backgroundGradient?: Gradient` (`dispatcher.ts`).
   `src/diagrams/activity/renderer.ts`'s `renderActivity` now forwards
   `theme.colors.backgroundGradient` onto the returned fragment via a
   conditional spread (mirroring the file's own existing
   `preserveAspectRatio` pattern, `exactOptionalPropertyTypes`-safe).
4. New `ShellFragment.backgroundGradient?: Gradient`
   (`klimt/document-shell.ts`). `assembleDocumentShell`'s `isSolid` check
   (renamed `hasBackgroundStyle`, extracted to stay under the NLOC cap)
   now ALSO returns `false` whenever `backgroundGradient` is set,
   regardless of `background`'s own value — matching `SvgGraphics.java:
   178-183` leaving `backcolorString` null UNCONDITIONALLY for a gradient
   (no white/black/transparent check applies to that branch at all).
   `backgroundGradient` is set by NO producer except activity's
   `renderer.ts`, so this is a structural no-op for every other engine
   (confirmed by the survey below, not just by the grep).
5. `assemble-svg.ts`'s activity-finalize block (`ACTIVITY_DEFAULT_
   BACKGROUND` through `finalizeActivityFragment`, ~77 lines) moved to a
   NEW file `assemble-svg-activity.ts` (500-line hook: the file was
   already at 549 lines pre-existing, over cap, before this change) —
   a pure move for the pre-existing pieces, plus the new
   `activityBackgroundRect` dispatcher: when `fragment.backgroundGradient`
   is set, calls `paint.ts#paintToSvg` (already-built gradient-id-minting
   + `<linearGradient>` def generator, same vector table as `SvgGraphics
   .java:367-405`) and ALWAYS paints the rect (no `ACTIVITY_UNPAINTED_
   BACKGROUNDS` check at all — `SvgGraphics.java:174-183`'s gradient
   branch has no such guard, unlike its plain-colour sibling at `:184-192`).
   The `<linearGradient>` def string rides inline in the returned body;
   `svg-defs.ts#collectDocumentDefs` (already called from
   `assembleDocumentShell`) lifts it into the shared `<defs>` the same way
   it already does for every other inline gradient in this port —
   verified, not assumed: the new module's own `spliceIntoActivityContent
   Group` is a LOCAL copy of `assemble-svg.ts#spliceIntoContentGroup`
   (same mechanism, now sourced from `document-shell.ts`'s own exported
   `CONTENT_G_OPEN_RE` instead of a third copy of the regex) to avoid a
   module cycle (`assemble-svg.ts` imports `finalizeActivityFragment` from
   the new file; the new file would otherwise need to import back).

**Jar-verified byte-for-byte** (direct render via `renderFixtureActivity`,
not just the probe score) against `activity/cigagu-31-rime196`'s oracle
SVG: root `style="width:213px;height:807px;"` (no `background:` property,
exact match), `<defs>` carries `<linearGradient id="g1ulf3d7nd8qv0" ...>`
— the SAME seeded id the jar mints (confirming row 1's HARNESS-SEED fix
and this fix interoperate correctly) — and the content `<g>`'s first
child is `<rect x="0" y="0" width="213" height="807" fill="url(#g1ulf3d7
nd8qv0)" .../>`, identical to the jar's own first child. Only the
attribute-order/style-vs-presentation-attribute spelling differs (already
normalized-away by every existing oracle comparator in this mission).

**Effect**: Σ 16354 → 16286 (−68, exactly 34+34 — both fixtures' full
named weight), 0 risers, 0 fixtures besides `cigagu-31-rime196`/
`gudute-55-nulo344` moved (`activity-probe.ts`). `activity.golden.ratchet`/
`activity.harness-parity`: 100% green, unchanged. `activity.style-
baseline`: 2 NEW failures, exactly `cigagu`/`gudute` — a histogram move
the test's own assertion message describes as "neither automatically a
regression nor automatically progress," asking for a re-pin from a fresh
measurement. **Not re-pinned**: `oracle/goldens/**`/baseline JSONs are on
this task's explicit do-not-edit list (rule 5); `scripts/repin-activity-
baselines.ts` exists and would do it, but running it is outside this
task's authority. Reported, not fixed — the owner of
`oracle/goldens/svg-activity/style-baseline.json` should re-pin both rows
from a fresh measurement; the exact moved field is `rx: {(absent): 0 ->
1}` for both (one new `<rect>` with no `rx` attribute — the background
rect this commit adds), confirmed harmless by direct inspection, not
guessed.

**New tests** (TDD-after-the-fact, mechanism found via Java + oracle
reading first): `tests/unit/skinparam.test.ts` (2 new — gradient capture,
non-gradient no-op), `tests/unit/core/assemble-svg.test.ts` (4 new — style
omission, def+rect minting, no white/black/transparent skip for a
gradient, plain-background regression guard), `tests/unit/activity/
renderer.test.ts` (3 new — theme-to-fragment forwarding, omitted-when-
absent, end-to-end through `assembleSvg`).

**Cross-engine survey for this commit** (rule 11, since it touches
`assemble-svg.ts`/`dispatcher.ts`/`document-shell.ts`/skinparam core
files): ran all 28 engines sequentially, before (all touched files
reverted to the merge commit `bda70781`, `assemble-svg-activity.ts`
removed) and after. **27 of 28 engines byte-identical**
(conformant/structural-match/diverged/errored/timeout/oracle-error, every
count); only `activity` moved (conformant 239 → 241, diverged 103 → 101).
**Zero conformant losses in any engine.**

## Row 3 — DARK-CIRCLE (levuma-67-cego489) — DONE

**Java -> ours**: `plantuml.skin:379-380` (light) `circle{start,stop,end{
LineColor #2; BackgroundColor #2}}`; `plantuml.skin:687-692` (dark,
`@media (prefers-color-scheme:dark)`) `activityDiagram{circle{start,stop,
end{LineColor #d; BackgroundColor #d}}}`. `FromSkinparamToStyle.java:
137-138` converts `ActivityStartColor`/`ActivityEndColor` to
`PName.BackGroundColor` ONLY — confirmed by grep, there is no upstream
skinparam key that maps to `start`/`end`'s `LineColor` at all (only `stop`
has one, via `ActivityStopColor` -> `LineColor`, `:139`, also unported).
Ground-truthed against two oracle SVGs directly (not inferred): `activity/
poraji-17-goke817` (`skinparam ActivityStartColor red`, light mode) shows
`start` ellipse `fill="#F00" stroke="#222"` — fill moves, stroke does not;
`activity/levuma-67-cego489` (`skinparam mode dark`) shows `start` ellipse
`fill="#DDD" stroke="#DDD"` and `stop`'s outer+inner ellipses both
`fill`/`stroke` `#DDD` — stroke DOES move with dark mode, independently of
any `ActivityStartColor`/`ActivityEndColor` skinparam.

Before this commit, `activity-renderer-terminals.ts#renderStart`/
`renderStop` both hardcoded the light-only `CIRCLE_INK` constant
(`resolveColorToSvgHex('#2')`) for the stroke (start) and both ellipses'
ink (stop), never considering dark mode at all — 3 of the 4 stroke/fill
attributes on `levuma`'s start+stop circles stayed `#222` instead of
`#DDD`.

**Fix**: new dedicated field `activityCircleInk` (never user-settable —
no skinparam key converts to it, so it is seeded ONLY by dark mode),
threaded `SkinparamAccumulator` -> `ACTIVITY_OVERRIDE_FIELDS`/
`DARK_SCALAR_SEEDS` (`skinparam-theme-builder.ts`, reusing the EXISTING
`DARK_MODE_DEFAULTS.activityCircleInk` constant `theme-dark.ts:82` already
defined for `activityStartColor`/`activityEndColor`'s own dark seed, never
previously consumed by a third field) -> `Theme['colors']['graph']
['activity'].circleInk` (`theme-graph-colors-b.ts`). `renderStart`/
`renderStop` (`activity-renderer-terminals.ts`) now read a local
`circleInk(theme)` helper (`theme.colors.graph.activity?.circleInk ??
CIRCLE_INK`) instead of the bare constant. Deliberately NOT reusing
`activityStartColor`/`activityEndColor`: that field is user-overridable
(`skinparam ActivityStartColor red`) and doing so would reproduce the
EXACT regression the code's own existing comment documents
(`poraji-17-goke817`: fill-color bleeding into the stroke). `renderEnd`
was NOT touched — its stroke/cross already read `actColors(theme)
.endFill` (`activityEndColor`, already dark-seeded since add2-T3h) and
`poraji`'s own oracle SVG confirms `end`'s stroke DOES move with
`ActivityEndColor`, unlike `start`'s — so `end`'s existing mechanism is
correct as-is, verified against the jar, not assumed from the ledger.

**Effect**: Σ 16360 -> 16356 (-4), exactly `levuma-67-cego489` falls, 0
risers (`npx tsx scripts/activity-probe.ts`). Element census: `exact`
bucket weight 6414 -> 6410 (`activity-probe-elements.ts`).

**New tests** (TDD-after-the-fact — mechanism was discovered via direct
Java + oracle SVG reading, then a fresh test added asserting the new
behaviour before the probe confirmed it): `tests/unit/skinparam-mode-
dark.test.ts` (2 new: `circleInk` set to `#DDDDDD` in dark mode, unset in
light mode) and `tests/unit/activity/renderer-shapes.test.ts` (2 new:
`renderStart` stroke follows `circleInk`; `renderStop` both ellipses
follow it).

## Cross-engine survey (rule 11)

Row 3 touches `src/core/skinparam-accumulator.ts`,
`src/core/skinparam-theme-builder.ts`, `src/core/theme-graph-colors-b.ts`
— shared core files. Ran `npm run -s svg:survey -- <engine> --out ...`
for all 28 engines (every `tests/oracle/svg-conformance/parity-*.json`
stem) SEQUENTIALLY, twice: once with the three core files + `activity-
renderer-terminals.ts` reverted to their pre-row-3 commit (`eabe9099b`)
content ("before"), once at current HEAD ("after") — never run in
parallel across engines (memory: a 7-way-parallel survey previously
produced false `timeout` regressions; sequential avoids that).

**Result**: 27 of 28 engines byte-identical conformant/structural-match/
diverged/errored/timeout/oracle-error counts, before vs after (board, c4,
chart, chronology, class, component, ditaa, dot, ebnf, files, gantt, hcl,
json, mindmap, network, object, packet, regex, salt, sequence, state,
timing, unknown, usecase, wbs, wire, yaml). The ONE engine that moved is
activity itself, the intended target: conformant 238 -> 239, diverged
104 -> 103. **Zero conformant losses in any engine.** (Mechanism for why
zero other engines could possibly move: the new fields —
`SkinparamAccumulator.activityCircleInk`, `Theme['colors']['graph']
['activity'].circleInk` — are read by exactly one consumer, activity's
own new `circleInk()` helper; no other engine's code references either
name, confirmed by grep before running the survey.)

## Pre-existing red (not caused by this task)

`activity.style-baseline.test.ts`: 16 failures, IDENTICAL set at every
point measured in this task (before row 1, after row 1, after row 3):
`boxefe-81-situ725` (the one the brief named), plus `citire-32-mive114`,
`decudi-92-bisu741`, `delide-30-teva601`, `jevoce-05-mumi686`,
`luxido-91-covi016`, `maduja-30-xiri319`, `maketa-43-juja264`,
`pezubu-98-niba240`, `rujuxa-07-neco067`, `ruzica-16-deli877`,
`sadovu-51-fata536`, `samavi-13-fuku339`, `xidamu-85-xoti640`,
`xizola-97-sizu458`, `zinelo-77-losu727`. Confirmed pre-existing by
temporarily restoring the pre-row-1 file content and re-running the test
at the SAME commit: the identical 16 fixtures already failed. Not a
ratchet/golden-byte gate (`activity.golden.ratchet`/`activity.harness-
parity` stayed 100% green throughout), so this did not block either
commit — reported per rule 10's "report any other" instruction, not
fixed (style-baseline pin re-generation is outside this task's scope).

## Quality gates

`npx tsc --noEmit -p tsconfig.json` / `npx tsc --project tsconfig.node
.json --noEmit`: clean after every commit, both pass 1 and pass 2. `npx
eslint` on every touched file: clean. `npx vitest run tests/diagrams/
activity tests/unit/activity tests/unit/core tests/unit/skinparam.test.ts
tests/unit/skinparam-mode-dark.test.ts tests/oracle/svg-conformance/
activity.golden.ratchet.test.ts tests/oracle/svg-conformance/activity
.harness-parity.test.ts`: 420 files / 7564 passed (1 pre-existing skip) at
final HEAD (`6c1f1739f`). 237 pinned goldens byte-equal throughout (golden
ratchet green at every commit, both passes). No Serena MCP tool used
(Read/Edit/Write/Bash only). No `git stash`. No raw `&` background jobs
(used `run_in_background`/Bash's own auto-backgrounding only). No public
API change — `src/index.ts`'s export list is unchanged (confirmed: no
new/removed/renamed export names) across both passes.

## Not done, and why

- **Row 2 (DOCGRAD)**: DONE in pass 2 (commit `6c1f1739f`) once the
  orchestrator extended the write-set to cover the exact gap pass 1
  named (`renderer.ts`'s fragment field, the `backgroundcolor` handler,
  the assemble-time background path). See "Row 2 — DOCGRAD — DONE
  (pass 2)" above.
- **`activity.style-baseline` re-pin for `cigagu-31-rime196`/
  `gudute-55-nulo344`**: these two fixtures' style census moved (one new
  `<rect>` with absent `rx`, the expected/correct effect of DOCGRAD) but
  `oracle/goldens/svg-activity/style-baseline.json` was NOT re-pinned —
  editing baseline JSONs is on this task's explicit do-not-edit list.
  `scripts/repin-activity-baselines.ts` exists for this exact purpose;
  running it is the owning mission's call, not this task's.

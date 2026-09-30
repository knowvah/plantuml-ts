# T3b: mainframe-svek-normalization

Return only the structured report: commit sha(s), files changed, per-row
render-diff structural/numeric before → after, residuals with mechanisms (Java +
port `file:line`), write-set extensions, test counts. No preamble.

## Context
plantuml-ts is a faithful TypeScript port of PlantUML. The Java at `~/git/plantuml`
(branch `dot-output`, upstream `97a5992`) is the specification. Read `CLAUDE.md`
first ("READ THE JAVA FIRST", "Never fit a value", "Do not refactor while porting",
"Preserve upstream names"). The oracle is the 1.2026.8beta1 jar; caches at
`test-results/dot-cache/<tree>/<slug>/in.svg`. Row mechanisms: `fixtures.md`
(cdd5 + T0d columns) and `diagnosis/verify.md`.

## Task (TDD)
With `mainframe M`, the jar draws class `a` at body-local (1, 8) where the port uses
(7, 7): `SvekResult.calculateDimension` is the only caller of
`clusterManager.moveDelta(6 - minX, 6 - minY)` (`svek/SvekResult.java:130-135`), and
the mainframe path (`core/DiagramChromeFactory.java:278-337`,
`klimt/shape/BigFrame.java:80-90`) bypasses it. Port the normalization per T0d's
verified mechanism (cdd5 S4 `mainframe-svek-unnormalized`, controlled jar experiment).

**Added at the b2 close (journal row 47) — the ensureVisible canvas channel.** The
jar's canvas is the union of LimitFinder ink AND `SvgGraphics#ensureVisible` on every
real draw (`SvgGraphics.java:129-133,981-982,1033-1034`); a description-label `{{ }}`
embed draws NOTHING in the ink pass (`LimitFinder.java:99-100` matchesProperty false →
`EmbeddedDiagram.java:169,180,191-193`) and reaches the canvas only through
ensureVisible. The port derives the whole canvas from the ink walk
(`layout-ink-extent.ts#computeClassDocumentDims`); `EntityImageDescriptionEmbed.ts`
draws unconditionally so the embed enters the ink instead. T2b tried and reverted two
fixes (row 47: gating the embed out of the ink pass collapses embed-only leaves to an
empty MinMax → Infinity canvas; a UEmpty reservation is off by the UImage x+w-1
rule). Build a real-draw extent beside the ink extent — T2c's
`MeasuredClassifier.ensureVisibleInk` (row 43) is the precedent — fed by the drawn
embed corner (`x + w`, `y + h`, then `(int)(v+1)`), and union it into the canvas.
Rows: rojida (canvas 475x382 vs 382x393 today → after T2b 0/4 canvas-only), tefeco
(a) (267 vs 279), rozugu (136 vs 149). Verify gubeca/jixibu do not move.

## Rows
- `unknown/rojida-14-fuli428` (desc-embed-ink-missing; canvas channel, row 47)
- `unknown/tefeco-12-rato895` (desc-embed-ink-missing; (a) canvas; (b) open -> cdd7)
- `unknown/rozugu-82-pera583` (embedded-block-skinparam-leak; canvas residual)
- `unknown/miveni-64-rexo238` (mainframe-svek-unnormalized)
- `unknown/rivino-95-midu088` (mainframe-svek-unnormalized)
- `unknown/soseka-43-riru110` (mainframe-svek-unnormalized)

T0d VERIFIED (`diagnosis/verify.md` "mainframe svek not normalized"): rivino's
jar numbers (body 11,43; frame height 204) are reproduced exactly from the raw svek
coordinates a(0,8) b(0,116) with NO moveDelta, style `mainframe { Padding 1 5;
LineThickness 1.5; Margin 10 5 }` (`plantuml.skin:85-89`), title height 14, and
`BigFrame.java:80,88` (`ww = minX >= 0 ? maxX : width`) over raw LimitFinder extents
with `computeDelta` (`DiagramChromeFactory.java:332-337`). Port `big-frame.ts:165-174`
takes the ink-normalized `svekDimension` (+15) as `ww`/`hh` and asserts delta away
(`:70-77`). Hand BigFrame the raw, un-shifted class geometry and extents.

## Write-set
- `src/core/klimt/shape/big-frame.ts`
- `src/core/annotations/chrome.ts`
- `src/diagrams/class/layout-ink-extent.ts` (T2b touches it in batch 2; build on that)
- `src/index.ts`
- `src/diagrams/class/layout.ts` (added at T0e: only if the raw geometry must be handed off from the class layout)
- `src/core/svek/image/EntityImageDescriptionEmbed.ts`, `src/diagrams/class/class-ink-box.ts` (added at b2, row 47)
- their unit tests under `tests/`

## Read-set
cdd5 S4 diagnosis family note (`plans/class-divergence-drive-5/diagnosis/S4-style.md`); `diagnosis/verify.md`.

## Interface contracts
none (no public API change: stop 12).

## Acceptance
- Given miveni, rivino, soseka, then each is conformant or its residual is stated.
- Given every engine's ratchet, then mainframe fixtures in other engines are reported (chrome is shared).
## Architecture decisions (locked)
`decisions.md` D1–D12; this task leans on D7. dot-engine is off limits.

## Quality bar
TDD (failing test first, specific values). Targeted `npx vitest run` over the tests
covering changed modules plus: `tests/unit/class/`, `tests/oracle/svg-conformance/class.golden.ratchet.test.ts`, `tests/oracle/class-dot-parity.test.ts`, `description.golden.ratchet.test.ts`, `state.golden.ratchet.test.ts`, `object.golden.ratchet.test.ts`, `sequence.diff-baseline.ratchet.test.ts`, `activity.diff-baseline.ratchet.test.ts`, `activity.style-baseline.test.ts`, `activity.text-baseline.test.ts` (non-class movement: report it with the mechanism, never re-pin) (report the collected file count). `npm run
typecheck`; `npx eslint <changed files>`. No full `npm test`. New src module ⇒
`npm run catalog` and commit `docs/catalog.md`. Complexity hook: ≤30 NLOC per
function, CCN ≤10, ≤5 params, ≤500-line files. Worktree rules: README "Execution
rules" (absolute worktree paths; no Serena edit tools; no `git stash`).

## Boundaries
- Always: quote the Java before claiming parity; cite `file:line` on every ported
  symbol (`@see`) and constant.
- Stop and report (do not edit): a needed file outside the write-set (beyond a pure
  type/file-cap move), or Java that contradicts the stated mechanism.
- Never: fit a value, touch the oracle or dot-engine, push.

## Commit
`fix(<scope>): <what, lowercase, ≤72 chars>`, one per family; body with mechanism,
upstream citation, rows moved. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible.

# T2b: ink-walk-reuses-draw

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

## Task (TDD, D5)
1. `leaf-sizing-entity.ts`'s ink walk rebuilds its own `EntityImageDescription`;
   cdd5 T5e measured the embed at (52.04, 24) in the walk vs (17, 31) in the real
   draw (gubeca; canvas 253 vs the jar's 211). Make the walk measure the draw-time
   construction (same parameters, same embed position), mirroring
   `klimt/drawing/LimitFinder.java` over what `EntityImageDescription#drawU` draws.
2. Folder/package leaves (cepedu, fipezo, rojida) are excluded from description ink
   (`class-layout-description-leaf-ink.ts:102`) because `measureFolderLeaf` builds
   different geometry; give them their own walk mirroring its `mergeTB`/`getMargin`
   (`leaf-sizing-folder.ts`, `USymbolFolder.java`).
3. rojida (T0d, `diagnosis/verify.md` "(+3,+1) shift"): three mechanisms, not a
   shift. (1) package leaves take `addRectInk`'s (x-1, y-1) where the jar bounds the
   folder outline itself (`USymbolFolder.java:104-123`, `LimitFinder.java:164-166`);
   (2) `leaf-sizing-folder.ts:82` measures a `{{ }}` label as text lines where the jar
   sizes the embed 42x42 (`EmbeddedDiagram.java:126-152` catch, reached via
   `EntityImageDescription.java:188-191`) — route the folder label through the same
   embed sizing T4d used, do not hard-code 42; (3) the drawn label embed never
   reaches the canvas (`SvgGraphics.java:1033-1034` ensureVisible on the image
   corner, `:129-131` `(int)(v+1)`), which also is tefeco's Δ12 (see 5).
4. json 1px (bizasu, meramo, momada; T0d amended, re-slotted from T3a): a primitive
   json leaf draws only `URectangle` + text, so `LimitFinder.java:184-186` bounds it
   at `x + w - 1` (`EntityImageJson.java:192`); `class-ink-box.ts:273` falls through
   to `addRectInk`'s `x + w`. Object bodies / multi-element arrays draw `hline`s to
   `x + w` (`TextBlockCucaJSon.java:168,174,215-220`) — dispatch per body shape.
5. tefeco (a): the drawn label embed enters our LimitFinder ink
   (`EntityImageDescriptionDelegates.ts:150` draws unconditionally; measured
   `symbolInk` maxX 217) where the jar's ink pass draws nothing
   (`EmbeddedDiagram.java:180,191`; `LimitFinder.java:99-100` matchesProperty false)
   and the canvas comes from ensureVisible. Exclude the embed from ink; add the
   ensureVisible image-corner max to the class canvas (`layout-ink-extent.ts`).
   tefeco (b), the nested description note not being opale, is `open -> cdd7`
   (description-wide); state it as the residual. josebu moved to T3e/T2c (T0d).

## Rows
- `unknown/gubeca-19-lemu434` (desc-embed-ink-missing)
- `unknown/jixibu-01-xave465` (desc-embed-ink-missing)
- `unknown/rojida-14-fuli428` (desc-embed-ink-missing; T0d: three mechanisms)
- `unknown/tefeco-12-rato895` (desc-embed-ink-missing; (a) only, (b) open -> cdd7)
- `unknown/cepedu-19-namu934` (folder-tab-ink)
- `unknown/fipezo-93-zimi512` (folder-tab-ink)
- `unknown/bizasu-70-vaxa243` (json-canvas-width-1px; re-slotted from T3a at T0e)
- `unknown/meramo-02-vasu175` (json-canvas-width-1px; re-slotted from T3a at T0e)
- `unknown/momada-03-zeka599` (json-canvas-width-1px; re-slotted from T3a at T0e)

## Write-set
- `src/core/svek/image/leaf-sizing-entity.ts`
- `src/diagrams/class/class-layout-description-leaf-ink.ts`
- `src/diagrams/class/class-ink-box.ts`
- `src/core/svek/image/leaf-sizing-folder.ts`
- `src/diagrams/class/class-ink-shapes.ts` (added at T0e: json body-shape ink rule)
- `src/diagrams/class/layout-ink-extent.ts` (added at T0e: ensureVisible canvas channel for drawn label embeds; T3b builds on it in batch 3)
- `src/core/svek/image/EntityImageDescriptionDelegates.ts` (added at T0e: embed excluded from the ink pass; T1b's batch-1 edits land first)
- their unit tests under `tests/`

## Read-set
cdd5 journal rows 76, 84; `.agent-notes/cdd5-T4d.md`; `diagnosis/verify.md` (rojida).

## Interface contracts
none.

## Acceptance
- Given gubeca, then the ink embed position equals the drawn one and the canvas is 211 wide.
- Given cepedu and fipezo, then the folder ink equals the jar's canvas.
- Given the class ratchet, then no pin is lost.
## Architecture decisions (locked)
`decisions.md` D1–D12; this task leans on D5. dot-engine is off limits.

## Quality bar
TDD (failing test first, specific values). Targeted `npx vitest run` over the tests
covering changed modules plus: `tests/unit/class/`, `tests/oracle/svg-conformance/class.golden.ratchet.test.ts`, `tests/oracle/class-dot-parity.test.ts` (report the collected file count). `npm run
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

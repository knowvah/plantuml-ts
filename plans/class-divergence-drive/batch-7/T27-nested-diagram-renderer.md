# T27 — nested `{{ }}` diagram renderer

**Agent:** typescript-pro (sonnet) · **Depends on:** — · Worktree.

## Context

D9 / `diagnosis/A2b-entity-groups.md` §E7 (HIGH): the jar rasterises a
`{{ … }}` embedded sub-diagram and emits one `<image
xlink:href="data:image/svg+xml;base64,…">`
(`EmbeddedDiagram.java:75,97-115,126-195`, entry point `klimt/creole/
legacy/CreoleParser.java:152-154`). This port's `src/core/
EmbeddedDiagram.ts` is a full port of the collection algorithm, gated
behind an injected `NestedDiagramRenderer` (`interface
NestedDiagramRenderer { render(source, skinParam): TextBlock }`,
`EmbeddedDiagram.ts:195-197`) that is threaded all the way through
`MethodsOrFieldsAreaConfig` → `BodyEnhanced1Config`/`Style` →
`BodyEnhanced1` → `BodyFactory` → `BodierLikeClassOrObject`, but NO
production call site ever populates it — `MethodsOrFieldsArea.ts:134-140`
throws `'MethodsOrFieldsAreaConfig.nestedDiagramRenderer was not
supplied'` the moment it meets one. The class engine's own parse-side
plumbing (`class-embedded-block.ts#scanEmbeddedElementBlock`, consumed by
`class-multiline-element.ts:41`) only SCANS a block so the outer multi-line
command does not terminate early on the block's interior `]`/`"` — it does
not render anything. Two fixture families: class-BODY embeds
(`moxobo-16-tipo829`, `zikabo-17-gugi332`, `gadufu-56-votu808` — these
reach `MethodsOrFieldsArea` directly) and LEGEND embeds (`bixogo-47-
xulu385`, `roxosu-00-pini153` — these are chrome text, T28's parallel
task). The report is a lead: re-read the cited bodies before editing.

## Task

1. TDD: write failing tests for `moxobo-16-tipo829`, `zikabo-17-gugi332`,
   `gadufu-56-votu808` (class body) against `test-results/dot-cache/
   class/<slug>/in.svg`; add a self-embedding-block fixture
   (`class C {\n{{\nclass C {\n{{\n...`) to prove the recursion guard.
2. Implement a `NestedDiagramRenderer` in the class engine's own code
   (never inside `EmbeddedDiagram.ts` itself, which stays diagram-type-
   agnostic per its own doc comment) that calls `renderSync`
   (`src/index.ts:394`) recursively on the block's joined source lines and
   wraps the result as a `data:image/svg+xml;base64` `<image>` with the
   jar's own emitted dimensions, returned as a `TextBlock`.
3. Add a recursion guard: a block embedding itself (directly or via a
   cycle) throws a named `EmbeddedDiagramDepthError` rather than
   recursing unboundedly. Comment it: `// on-call: if a block embeds
   itself, renderSync throws EmbeddedDiagramDepthError rather than
   recursing; no runbook — fix the fixture.`
4. Wire the renderer into `MethodsOrFieldsArea.ts`'s config-supply path so
   a class-body embed reaches it (the throw at `:134-140` should now never
   fire for a body member list); do not touch `EmbeddedDiagram.ts`'s
   ported algorithm itself beyond what construction/wiring needs.
5. `DIVERGENCES.md`: add an entry for the base64 SVG payload bytes,
   mirroring the existing "Sprite and `img` rasters" entry's shape — jar
   re-encodes a rasterized image, this port emits the recursively-rendered
   SVG source directly; geometry/dimensions are the target, payload bytes
   are not.
6. `npx tsx tools/render-diff.mts` on the three named fixtures; record
   before/after in `.agent-notes/cdd-T27.md`. If bixogo/roxosu (legend
   cases) do not fully conform because T28 has not yet merged the
   chrome-creole routing that recognizes `{{ }}` in legend text, journal
   that explicitly — do not attempt to fix legend text from this task's
   write-set (stop 1).

## Read-set

`EmbeddedDiagram.java:75,97-115,126-195`; `klimt/creole/legacy/
CreoleParser.java:152-154`; `src/core/EmbeddedDiagram.ts` (whole file,
esp. the `NestedDiagramRenderer` interface and `createAndSkip`); `src/core/
cucadiagram/MethodsOrFieldsArea.ts:100-145`; `src/core/cucadiagram/
MethodsOrFieldsAreaConfig.ts`; `src/diagrams/class/
class-embedded-block.ts` (whole file); `src/diagrams/class/
class-multiline-element.ts:1-45`; `src/index.ts:355-400` (`renderSync`);
`diagnosis/A2b-entity-groups.md` §E7; `DIVERGENCES.md`'s "Sprite and `img`
rasters" entry (precedent for the new one).

## Write-set

`src/core/EmbeddedDiagram.ts` (wiring only), `src/core/cucadiagram/
MethodsOrFieldsArea.ts` (config supply), `src/diagrams/class/
class-embedded-block.ts`, `class-multiline-element.ts`, `DIVERGENCES.md`
(new entry, append-only), test files, `.agent-notes/cdd-T27.md`,
`plans/class-divergence-drive/decision-journal.md` (append-only).

## Interface out (consumed by T28, once merged)

`NestedDiagramRenderer` remains `EmbeddedDiagram.ts:195`'s existing
interface, unchanged in shape — any other chrome/legend caller (T28) can
construct and pass its own instance, or reuse the one this task builds if
it is exported from a shared location inside the write-set above.

## Acceptance criteria

- Given `moxobo-16-tipo829`/`zikabo-17-gugi332`/`gadufu-56-votu808`, when
  rendered, then each class-body `{{ }}` block becomes one `<image>` with
  the jar's width/height, replacing the literal text rows
- Given a self-embedding block fixture, when rendered, then it throws
  `EmbeddedDiagramDepthError` rather than recursing
- Given `bixogo-47-xulu385`/`roxosu-00-pini153`, when re-measured after
  this task alone, then the journal records the actual verdict (may still
  diverge pending T28) rather than a false conformant claim

## Observability

`// on-call: if a block embeds itself, renderSync throws
EmbeddedDiagramDepthError rather than recursing; no runbook — fix the
fixture.`

## Rollback

Reversible — revert the task's commits; pins are committed with the code.

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build`; `npx tsx
tools/render-diff.mts` on the three class-body fixtures before/after;
hooks: ≤500-line files, ≤30 NLOC functions, CCN ≤10, ≤5 params.

## Boundaries

Always: keep `EmbeddedDiagram.ts` diagram-type-agnostic; guard recursion.
Ask first: any README stop condition; if the renderer cannot be bounded or
needs an async path, that is stop 10 — halt and journal, do not force a
sync workaround. Never: rebuild the oracle cache (D12); claim bixogo/roxosu
conformant before T28 lands; fit a constant without a citation.

## Commit

`feat(cdd-T27): wire a recursive NestedDiagramRenderer for class bodies`

Body: cites the wiring path (Config → BodyEnhanced1 → BodyFactory →
BodierLikeClassOrObject); states the recursion-guard behavior; notes
bixogo/roxosu's pending-on-T28 status.

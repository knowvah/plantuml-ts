# T32 — stdlib `!include` misdispatch + error-page root formatter

**Agent:** debugger (step 1, diagnosis artifact required before any
edit) → typescript-pro (sonnet) (steps 2+, fix) · **Depends on:** —
· parallel with T31/T33 (worktrees). **GATE: every engine's suite**
(`dispatcher.ts` is shared, stop 4).

## Context

Two independent, real bugs (A6 §5a/§5b), not oracle-side.

**§5a.** `@startuml\n!include <tupadr3/font-awesome/star>\nclass Foo {}\n
@enduml` (no options) renders SEQUENCE arrow-marker `<defs>`
(`arrow-sync`/`arrow-async`/…) and drops `class Foo`. `src/index.ts:
367-369`'s includeStore guard is ruled OUT — it only throws when
`options.includeStore` is undefined AND the raw source matches
`/^!include\s/m`; its catch routes to `errorSvg()`
(`error-diagrams.ts:78-97`), which never emits sequence markers.
Leading hypothesis (UNVERIFIED — confirm by instrumenting, do not
assume): `DiagramRegistry.resolve` (`src/core/dispatcher.ts:317-327`)
tries plugins in registration order (`src/index.ts:107-108`:
`sequencePlugin` before `classPlugin`) and returns the FIRST that does
not refuse; for a bare `@startuml`, `source.types` (`block-extractor.ts:
396-399` `candidateTypes`) is the broad multi-type set `findStartTypes`
returns for the ambiguous suffix, which includes both `sequence` and
`class`, so neither is skipped at `dispatcher.ts:320`. Upstream's own
dispatch (`PSystemBuilder.java:255-268`) is the SAME shape — first
non-error factory in registration order wins — so the divergence is not
in the dispatch loop itself; it is that our `parseSequence`
(`src/diagrams/sequence/parser.ts`, called from `sequence/index.ts:
19-26`) does not return a `ParseRefusal` for this content where
upstream's sequence factory would refuse it (no arrow lines, an
`!include` line, a `class` keyword). `scripts/svg-parity-survey.ts:
268-271` calls `renderSync(markup, { measurer, assetStore })` with no
`includeStore`, so the survey hits the identical path.

**§5b.** `sadamo-18-siva346` errors on both sides (a ~9500-char run of
backticks) but our error page's SVG root is wrong. `error-renderer.ts:
312` (`renderPSystemError`) builds its root via `core/svg.ts:522-553`
(`svgRoot`), which emits ONLY `xmlns`/`width`/`height`/`viewBox`. Every
OTHER diagram type's root goes through `src/core/klimt/drawing/svg/
svg-graphics-core.ts`'s `SvgGraphics`-equivalent — its constructor sets
`xmlns:xlink`/`version="1.1"` (`:296-298`) and `finalizeRootAttributes`
(`:459-480`, the exact TS port of `SvgGraphics.java:800-813`, already
cited in A5 M7) sets `viewBox`/`zoomAndPan`/`preserveAspectRatio`/
`contentStyleType`/the `background:` style term — confirmed present in
every jar oracle root, e.g. `test-results/dot-cache/class/cicovi-23-
zipe215/in.svg`'s `<svg …>` tag. `error-renderer.ts` never uses this
class at all; it is a parallel, incomplete root builder. Also: 12
default arrowhead-marker defs (jar 0 — `svgRoot`'s `ALL_ARROW_TYPES.map
(arrowHead...)` at `svg.ts:531` always emits every marker; the real
`SvgGraphics` path only emits markers actually referenced); `font-weight
bold` vs jar's `700`; text/rect geometry off 1.4-8.8 px (measurer choice
on the error path). The version-identity string (`$version$`/
`$git.commit.id$` placeholders in the jar vs. this port's real version)
is a DECLARED divergence — add a `DIVERGENCES.md` line only if one is
not already there. The report is a lead: re-read the cited bodies
before editing.

## Task

1. **Diagnosis phase (debugger).** Instrument `DiagramRegistry.resolve`
   and `parseSequence` directly (a small script under the mission's
   scratch area, not committed) on the §5a repro. Confirm or refute:
   does `parseSequence` return an AST or a `ParseRefusal`? What does
   `source.types` actually contain? Write the diagnosis artifact
   (mechanism / origin file:line / causal chain / ruled out) to
   `decision-journal.md` before any fix.
2. Tests first for both halves.
3. §5a fix: whichever the instrumentation shows — either make
   `parseSequence` refuse content with no sequence-shaped statements
   (arrows/participants) so `class`'s plugin gets its turn, or (if the
   AST comes back non-refusing but structurally empty) tighten the
   registry's win condition. Do not special-case `!include` — the fix
   must generalize to any `!include <bundle/...>` with no sequence
   content (A6's "reach likely wider than the 4 named fixtures").
4. §5b fix: route `renderPSystemError`'s root emission through the same
   `SvgGraphics`-equivalent (`svg-graphics-core.ts`) or
   `document-shell.ts` wrapper every other diagram type uses, instead of
   `core/svg.ts#svgRoot`. Only emit markers actually referenced by the
   error page's content (drop the unconditional `ALL_ARROW_TYPES` emit
   for this path). Fix `font-weight` to `700`.
5. `.agent-notes/cdd-T32.md`: the confirmed (not hypothesized) §5a
   mechanism; whether `svgRoot` has other callers that need the same
   fix or are intentionally lightweight (check callers before touching
   its signature).

## Read-set

`src/index.ts:355-400`; `src/core/dispatcher.ts:295-346`;
`src/core/block-extractor.ts:390-400`; `src/diagrams/sequence/index.ts:
19-26`; `src/diagrams/sequence/parser.ts` (entry point, whole);
`src/core/error/error-diagrams.ts:78-97`; `src/core/error/
error-renderer.ts:186-330`; `src/core/svg.ts:522-553`; `src/core/klimt/
drawing/svg/svg-graphics-core.ts:290-300,455-490`; `scripts/
svg-parity-survey.ts:255-280`. Java: `PSystemBuilder.java:230-300`
(`createPSystem`, `isOk`); `klimt/drawing/svg/SvgGraphics.java:129-135,
143,800-813`. Diagnosis: `diagnosis/A6-oracle.md` §5a, §5b.

## Write-set

`src/core/dispatcher.ts`, `src/diagrams/sequence/parser.ts` (only if
§5a's fix lands there — otherwise `src/core/dispatcher.ts` alone),
`src/core/error/error-renderer.ts`, `src/core/error/error-diagrams.ts`,
`DIVERGENCES.md` (version-string line, only if absent), their
`*.test.ts` files, `.agent-notes/cdd-T32.md`, `decision-journal.md`
(diagnosis artifact + fix summary).

## Acceptance criteria

- Given the minimal repro, when rendered, then the SVG carries
  `data-diagram-type="CLASS"` and a drawn `Foo` box, not sequence
  markers
- Given `bidusa-22-jutu505`, `cuzoga-39-tufu259`, `jevuvi-65-dipo437`,
  `ruliki-78-biji661`, when surveyed, then each renders its class
  content (verdict moves off `diverged`, or the residual is a NAMED
  class-renderer mechanism, not the dispatch bug)
- Given `sadamo-18-siva346`, when rendered, then the error page's `<svg>`
  root carries `background`, `contentStyleType`, `preserveAspectRatio`,
  `version`, `xmlns:xlink`, `zoomAndPan`, `<defs>` is empty, and
  `font-weight="700"`
- Given the full test suite, then no OTHER engine's dispatch/error-page
  fixture regresses (stop 4)

## Observability

N/A — no new observable operations.

## Rollback

Reversible — revert the task's commits; pins are committed with the
code.

## Quality bar

`npm test` (every engine, not a path filter), `npm run typecheck`,
`npm run lint`, `npm run build` all green. `npx tsx tools/render-diff.mts
bidusa-22-jutu505 cuzoga-39-tufu259 jevuvi-65-dipo437 ruliki-78-biji661
sadamo-18-siva346` before/after. Files ≤500 lines, functions ≤30 NLOC,
CCN ≤10, ≤5 params.

## Boundaries

Always: produce the diagnosis artifact (mechanism/origin/causal
chain/ruled out) before touching `dispatcher.ts` or the sequence
parser — this is diagnosis mode, not a guess-and-check loop. Ask first:
any stop condition in `../README.md`; any fix that changes
`DiagramRegistry.resolve`'s public contract. Never: special-case the
`tupadr3` bundle name; special-case `sadamo`'s specific error text;
touch `document-shell.ts`'s chrome logic beyond what root-attribute
reuse requires.

## Commit

`fix(cdd-T32): stdlib include dispatch + error-page root attributes`

Body: why — two independently-caused bugs shared one investigation (the
survey's own render path); the dispatch bug is a real misdispatch (not
an oracle-side quirk) and the error page never used this port's own
`SvgGraphics` root builder.

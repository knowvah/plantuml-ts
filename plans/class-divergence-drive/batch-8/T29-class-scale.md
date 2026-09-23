# T29 — class `scale`

**Agent:** typescript-pro (sonnet) · **Depends on:** — (no deps; may start
immediately, but T30 depends on this task and runs after it).

## Context

D4 / `diagnosis/A4-text.md` §1 (HIGH): upstream resolves `scale` at
serialization only — `core/TextBlockExporter.java:205-209`
(`computeScaleFactor`), `klimt/drawing/svg/SvgGraphics.java:466-472`
(`format(double)` multiplies every emitted numeric: coordinates, font
sizes `:695`, stroke widths `:557 setStrokeWidth`); layout runs entirely
UNSCALED (`UgDiagram.java:138` passes scale only to the exporter). This
port's `src/core/scale-command.ts#resolveScaleFactor` already computes the
correct clamped factor from a `ScaleSpec` + unscaled document dimension
(header comment: numerically verified against `component`/`sequence`
fixtures) but class never calls it — `class-command-directives.ts:41-47`
matches `/^(skinparam|scale\b)/i` and no-ops it as "global/structurally
inert". `src/diagrams/sequence/scale-geo.ts` is the precedent to mirror:
it scales `SequenceGeometry`, `Theme.fontSize`, and `HeadGeometry` as PURE
DATA at the layout→render boundary, leaving the shared `svg.ts#svgRoot`
untouched (ten engines share it) — do NOT add a scale parameter there. The
report is a lead: re-read `scale-command.ts`'s full header and
`scale-geo.ts`'s full header (already read for this task) before coding.

## Task

1. TDD: write failing tests for `cagace-55-libu760` (`scale max 50
   width`), `corine-48-pemu761` (`scale .5`), `jiramo-39-xuze087` (`scale
   2.0`), `kujiji-68-cujo036` (`scale 900 width`), `nadaba-37-zaku242`
   (`scale max 50 height`), `koxoco-29-moke425` (`scale 0.8`),
   `vebini-34-gapu710` (`scale 2`) against `test-results/dot-cache/
   class/<slug>/in.svg`.
2. Capture the `scale` line into `ClassDiagramAST` (new optional `scale?:
   ScaleSpec` field, matching `json/ast.ts`'s precedent) in
   `class-command-directives.ts` — remove `scale\b` from the no-op regex
   at `:41-47`, parse it with `matchScaleCommand` (`core/
   scale-command.ts`), keep `skinparam` lines no-op'd (dpi is T30's job,
   not this task's).
3. New `src/diagrams/class/class-scale-geo.ts`, modeled on `sequence/
   scale-geo.ts`: pure functions multiplying every numeric field of
   `ClassGeometry` (node/edge coordinates, font sizes, stroke widths,
   textLength, canvas width/height) by a resolved factor `k`. No
   `Date.now()`/`Math.random()`; no DOM/Node built-ins (repo-wide `src/`
   constraint).
4. Wire it into `layoutClass` (`layout.ts:482`): after the existing
   unscaled layout completes, resolve `k = resolveScaleFactor(ast.scale,
   geo.totalWidth, geo.totalHeight)` from the FINAL unscaled document
   dimension (never a partial/intermediate one — same contract
   `resolveScaleFactor`'s own doc comment states), then return
   `scaleClassGeometry(geo, k)` when `k !== 1`. `index.ts`'s existing
   `layoutClass`/`renderClass` call sites need no change — `renderClass`
   already renders whatever `ClassGeometry` it is given.
5. `npx tsx tools/render-diff.mts` on all seven named fixtures; record
   before/after in `.agent-notes/cdd-T29.md`.

## Read-set

`core/TextBlockExporter.java:205-209,497`; `klimt/drawing/svg/
SvgGraphics.java:466-472,557,695,705`; `UgDiagram.java:138`; `src/core/
scale-command.ts` (whole file, already read — the factor-resolution
contract); `src/diagrams/sequence/scale-geo.ts` (whole header, already
read — the pattern to mirror); `src/diagrams/class/ast.ts:320-345`
(`ClassDiagramAST`); `src/diagrams/class/layout.ts:482` (`layoutClass`);
`src/diagrams/class/class-command-directives.ts:30-55`; `src/diagrams/
class/index.ts:40-80` (confirms `renderClass` needs no change).

## Write-set

`src/diagrams/class/class-command-directives.ts`, `ast.ts`, `layout.ts`,
new `class-scale-geo.ts`, their test files, `.agent-notes/cdd-T29.md`,
`plans/class-divergence-drive/decision-journal.md` (append-only).

## Interface out (consumed by T30)

`ClassDiagramAST.scale?: ScaleSpec` (from `core/scale-command.ts`) — T30's
new `dpi` term composes with this task's already-correct `scale` factor at
the SAME `resolveScaleFactor` call inside `layoutClass`; T30 does not
re-derive or duplicate the class-side wiring this task lands.

## Acceptance criteria

- Given `corine-48-pemu761` (`scale .5`), when rendered, then every
  numeric attribute is exactly 0.5x its unscaled value
- Given `jiramo-39-xuze087` (`scale 2.0`), then every numeric attribute is
  exactly 2.0x
- Given `cagace-55-libu760` (`scale max 50 width`), then the final width is
  50
- Given `kujiji-68-cujo036` (`scale 900 width`), then the final width is
  900
- Given `nadaba-37-zaku242` (`scale max 50 height`), then the final height
  is 50
- Given all seven named fixtures, then each is survey-conformant

## Observability

N/A — no new observable operations.

## Rollback

Reversible — revert the task's commits; pins are committed with the code.

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build`; `npx tsx
tools/render-diff.mts` on all seven named fixtures before/after; hooks:
≤500-line files, ≤30 NLOC functions, CCN ≤10, ≤5 params.

## Boundaries

Always: multiply resolved geometry, never re-derive layout; keep
`svgRoot`/`svg.ts` untouched. Ask first: any README stop condition. Never:
rebuild the oracle cache (D12); add a scale parameter to the shared
`svgRoot`; touch `skinparam dpi` (T30's scope, not this task's); fit a
constant without an upstream citation.

## Commit

`feat(cdd-T29): apply class scale factor at the layout->render boundary`

Body: cites `TextBlockExporter.java`/`SvgGraphics.java` line ranges; notes
`class-scale-geo.ts` mirrors `sequence/scale-geo.ts`'s pattern.

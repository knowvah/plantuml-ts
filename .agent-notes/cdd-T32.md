# cdd-T32 — stdlib `!include` misdispatch + error-page root formatter

Status: **executed + closed**, worktree `cdd-t32` (branch `cdd/t32`, based
on `4626ccec`). Full gate green: `npm test` 802 passed / 1 skipped (803
test files, matches on-disk `find` count), coverage 96.4/91.9/97.42/97.41
(all ≥90), typecheck (both tsconfigs)/lint/build clean, `docs/catalog.md`
regenerated. `git status --short`: `error-renderer.ts`,
`klimt/document-shell.ts` (extended, flagged below), new
`klimt/document-shell-fragment.ts` (pure-move split), `dispatcher.test.ts`,
`docs/catalog.md`.

## §5a — CONFIRMED mechanism (NOT the brief's leading hypothesis)

**`DiagramRegistry.resolve` and `parseSequence` have no bug.** Verified by
direct instrumentation: `renderSync('@startuml\n!include <tupadr3/font-
awesome/star>\nclass Foo {}\n@enduml', { includeStore })` with a
RESOLVABLE `includeStore` (`withStdlib(new MapIncludeStore(),
buildStdlibAssetsStore())`, the same pattern `scripts/dot-sync-report.ts:
146-150` already uses for `component`/`usecase`) dispatches to CLASS
immediately and correctly: `data-diagram-type="CLASS"`, a drawn `Foo` box,
zero arrow markers. `dispatcher.ts:317-327`'s plugin loop and
`sequence/parser.ts:377-403`'s refusal shape are both already correct;
`sequencePlugin`'s registration-order priority over `classPlugin` never
matters here because `parseSequence` DOES refuse (no participants) once it
actually runs, and in the real misdispatch-shaped repro it never gets that
far anyway (see below).

The real mechanism: `renderSync`'s own documented `!include` guard
(`src/index.ts:399-404`, "renderSync cannot fetch") throws BEFORE
`registry.resolve` is ever called, whenever no `includeStore`/
`stdlibRegistry` is supplied — which is exactly what `scripts/
svg-parity-survey.ts:268-271` and this mission's own `plans/
class-divergence-drive/tools/render-diff.mts:57-58` do (both call
`renderSync(markup, { measurer, assetStore })`, no `includeStore`). The
throw is caught by `renderPagesSync`'s own `catch`, routed to
`errorSvg()` (`error-diagrams.ts:78-97`) → `renderPSystemError()`
(`error-renderer.ts`). THAT page's root builder (`core/svg.ts#svgRoot`,
pre-fix) unconditionally maps `ALL_ARROW_TYPES` into `<defs>` (§5b) —
`arrow-sync`/`arrow-async`/… are literally in that 12-marker set, which is
what a diff/grep-level read of the SVG mistakes for "dispatched to
sequence." The error page's source LISTING contains the literal text
`class Foo {}` (waved, in error green) — not "dropped," just rendered as
a listing line rather than an entity box, because this IS (correctly) an
error page for an unresolved include.

**This is not novel** — `scripts/dot-sync-report.ts:134-146`'s own
pre-existing doc comment already documents the identical mechanism and
names `bidusa-22-jutu505`/`ruliki-78-biji661` explicitly (`class`/`object`/
`state` are deliberately excluded from `STDLIB_WIRED_TYPES`, "our side
currently errors before layout" is a prior, considered decision from an
earlier mission, not this task's bug to fix by touching the dispatcher).
`routing-conformance.test.ts`/`refusal-coverage.test.ts` (via
`tests/helpers/fixture-include-store.ts`, WHICH DOES supply a resolvable
includeStore for every fixture) already pin all four named fixtures
`ourType: CLASS, status: agree` and `weErrored: false` — this task's own
measurement reproduces that pin exactly, unchanged. Their own doc comments
state the mechanism near-verbatim ("Rendering without [an include store]
makes renderSync throw on any !include and return errorSvg... so a
RESOLUTION failure reads as a routing answer of NONE").

**Fix applied:** none to `dispatcher.ts`/`sequence/parser.ts` — a fix
there would be a no-op (nothing is broken) and risks the "special-case
!include" trap the brief explicitly forbids. Instead: a regression test
(`tests/unit/dispatcher.test.ts`, new describe block) pins BOTH halves —
(a) production dispatch is correct once the include resolves, (b) without
an includeStore the SAME source is a (now correctly-shaped) error page,
not a sequence render — so a future regression in either direction is
caught.

**Residual for the 4 named fixtures**, per the acceptance criteria's own
escape hatch ("or the residual is a NAMED class-renderer mechanism, not
the dispatch bug"): `render-diff.mts`/`svg-parity-survey.ts` still omit an
`includeStore` for class-type fixtures (a pre-existing, deliberate
survey/tooling scoping gap, not in this task's write-set — fixing it would
require touching `scripts/svg-parity-survey.ts` and/or `plans/
class-divergence-drive/tools/render-diff.mts`, neither of which T32 owns).
After this task's §5b fix those 4 fixtures fall from 8+4 to 2+4
(residual: `svg/@background` — error-page black vs the jar's real class
white, and `g[1][childCount]` — error-page text/rect count vs one class
entity group — both are "we render a correctly-shaped error page, jar
renders the real diagram" content differences, not attribute-shape bugs).
Named as a follow-on: wire `includeStore`/`stdlibRegistry` into the
survey/render-diff tooling for `class` (mirroring `dot-sync-report.ts`'s
`STDLIB_WIRED_TYPES` pattern) as its own task.

## §5b — CONFIRMED and FIXED

`renderPSystemError`/`renderPSystemUnsupported`/`renderPSystemWelcome`
(`error-renderer.ts`) now route their root through `core/klimt/
document-shell.ts#assembleDocumentShell` — the SAME shared root-attribute/
prolog/defs shell every other diagram type uses via `core/assemble-svg.ts
:505` — instead of the generic `core/svg.ts#svgRoot`. `svgRoot` is
untouched (still correct for its OTHER callers — see below).

Fixed: `xmlns:xlink`/`version="1.1"`/`zoomAndPan="magnify"`/
`preserveAspectRatio="none"`/`contentStyleType="text/css"` and the
`<?plantuml $version$?>` PI (all previously absent); `<defs>` now reflects
only what's actually referenced (empty for the error page, since it draws
no markers) instead of the unconditional 12-entry `ALL_ARROW_TYPES` dump;
`font-weight` emits `"700"` (never `"bold"`) and `font-weight`/
`font-style` are OMITTED for the normal/non-italic case (jar-verified: a
normal-weight `<text>` on every cached Welcome-screen golden carries
neither attribute) — a real, adjacent fix beyond the literal acceptance
criteria, cheap and safely local to `error-renderer.ts#drawRun`. The
`[From … ]` band rect gained `strokeWidth: 1`, matching the jar's own
`style="stroke:...;stroke-width:1;"` band exactly.

**Single-block canvas background (verified against the real oracle):** a
LONE block's own background is folded into the root `style` with ZERO
explicit rect (`sadamo-18-siva346`'s real golden: root
`style="...background:#000000;"`, and the `<g>` opens directly on the
version-banner `<text>` — no background rect at all). Deliberately NOT
extended to the >1-block case (Welcome stacked over an error, or the
standalone Welcome/Unsupported screen): that path keeps its EXISTING
per-block rect-drawing exactly as before (still no `stroke-width`, a
pre-existing, separate gap — jar's own Welcome-screen rect DOES carry
`stroke-width:1`, e.g. `test-results/dot-cache/gantt/papava-92-geve698/
in.svg`) and the canvas stays the historical `WHITE` default. This is a
deliberate scope boundary, not an oversight: fixing the multi-block rect
shape touches EVERY engine's Welcome/error/Unsupported output (reachable
far beyond the 5 named fixtures), and neither this task's acceptance
criteria nor its write-set covers it. Filed as a follow-on.

`sadamo-18-siva346`: 43+19 → 11+19. Every acceptance-criteria attribute
(`background`, `contentStyleType`, `preserveAspectRatio`, `version`,
`xmlns:xlink`, `zoomAndPan`, empty `<defs>`, `font-weight="700"`) now
matches exactly. Residual (all pre-existing, named, out of this task's
scope, per the spec's own text): `textLength` (never emitted — a
measurer-choice gap the spec explicitly declares out of scope), the
`PlantUML version $version$/$git.commit.id$` vs `plantuml-ts version
0.1.0/unknown` text (DIVERGENCES.md already carries this exact line,
"The error diagram omits the raster decorations, and prints this port's
own version" — no edit needed, confirmed present), `[From in.puml (line
8) ]` vs `[From string (line 8) ]` (a pre-existing, unrelated source-name
divergence), and small y/height/width deltas (line-advance-ratio/measurer
geometry, same declared-out-of-scope bucket).

## `document-shell.ts` write-set extension (flagged, Stop-1-pattern)

Widening `assembleDocumentShell`'s `diagramType: string` parameter to
`diagramType?: string` (omitting `data-diagram-type` entirely when
`undefined` — verified: the jar's own error page carries no such
attribute) is a change to `core/klimt/document-shell.ts`, which is NOT in
T32's literal write-set list — but the task's OWN Boundaries section
anticipates exactly this ("Never: touch document-shell.ts's chrome logic
beyond what root-attribute reuse requires" implicitly permits a
root-attribute-only touch). Treated as within scope, mirroring T29/T30's
own "Stop-1 pre-authorised" extensions this same batch already used for
comparable single-purpose widenings. The ONLY existing call site
(`core/assemble-svg.ts:505`) always passes a defined string, so every
other caller (class/state/sequence/description) is behaviorally
unchanged — confirmed by the full green suite.

This widening initially LOOKED like a one-line change but pushed
`document-shell.ts` from 505 to 509+ lines (it was ALREADY at the 500-line
cap before this task touched it) — pre-authorised split (same precedent
as `class-geo-types.ts`/`class-scale-geo.ts`'s own prior splits): the
"disassembly" half (SVG-fragment extraction + per-drawable klimt
emission — `extractViewBoxDims`, `extractDefs`, `extractBody`,
`unwrapContentG`, `extractFlatContent`, `renderDrawableToFragment`,
`mergeFragmentDefs`, and their two interfaces) moved to a NEW
`document-shell-fragment.ts`, pure move, RE-EXPORTED from
`document-shell.ts` unchanged — so none of the dozen existing importers
of `document-shell.js` needed their import path touched. `document-shell.
ts` landed at 242 lines; `document-shell-fragment.ts` at ~285.

A real bug caught by the regression test during this split: the FIRST
attempt widened the parameter's TYPE but forgot to make the emission
CONDITIONAL — `diagramType` string-concatenated straight through even
when `undefined`, emitting the literal `data-diagram-type="undefined"` on
every error/Welcome page. Caught by
`tests/unit/dispatcher.test.ts`'s own new "without an includeStore..."
assertion (`not.toContain('data-diagram-type')`) before this task closed
— fixed by extracting a small `diagramTypeAttrOf` helper (also needed to
keep `assembleDocumentShell`'s own CCN under the hook's "worsened" gate).

## Other `svgRoot` callers — confirmed unaffected, not touched

`svgRoot` (`core/svg.ts:451-487`) is untouched and still correct for its
remaining callers: `core/assemble-svg.ts#assembleDocument`'s
`fragment.diagramType === undefined` branch (genuinely non-klimt-shaped
engines: `@startdot` passthrough, chart's inline error path, and any
`RenderFragment` with no `diagramType` at all — these are intentionally
lightweight, not a second instance of this task's bug, since NONE of them
draw arrowhead markers either and their own root-attribute gap, if any,
is a separate, un-diagnosed item outside T32's scope).

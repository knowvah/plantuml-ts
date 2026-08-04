# SI15 Architecture Decisions (locked)

## ADR-1: Optional raster dims on `UImage` + `ResolvedAtomImage`; guarded fallback in `Footprint`

**Context.** `UImage.ts` deliberately collapsed upstream's two notions
(declared/scaled placement size vs native raster pixel count) onto one pair
of numbers (documented T7 scope reduction). `Footprint.MyUGraphic.drawImage`
needs the raster notion; everything else (Sea cursor advance, layout, SVG
placement) correctly needs the declared notion.

**Decision.** Add optional `rasterWidth`/`rasterHeight` to `UImage` (and to
`ResolvedAtomImage`'s `image` variant so resolvers can carry them to every
`UImage.build` call site). Populate them only where a real raster backs the
image: `resolveSpriteAtom` (monochrome sprite → the sprite's native grid
dims, e.g. 3×2 — the PNG raster is one pixel per grid cell; scale stretches
only the SVG placement attrs) and `resolveImgAtom` (the data URI's IHDR
dims, already parsed at `creole-atoms.ts:358`). `Footprint.drawImage` uses
`raster − 1` **when present** and the declared dims **unchanged** otherwise.

**Explicitly NOT the diagnosis note's `(rasterWidth ?? width) - 1`:** a
blanket `−1` would silently shrink the latex (KaTeX) path and any future
rasterless `UImage` by 1px — a behaviour change nobody measured. The
fallback preserves current behaviour bit-for-bit for rasterless images; the
latex divergence stays where `DIVERGENCES.md:260-285` documents it.

**Consequences.** The class usecase fit reproduces the jar's rx/ry (proven
by T6's substitution). The description engine's `Footprint` sizing also
changes for monochrome-sprite labels — deliberate, jar-aligned, guarded by
the size-deltas gate (`widened 0`; the sprite bucket of 5 may improve).
SVG sprites are untouched (they route `drawPath`/ink-box, not `drawImage` —
verified: `footprint-parity.test.ts` uses an SVG sprite).

## ADR-2: Emission rounding lives in `driver-image-svg.ts`, gated on raster-backed-ness, jar-verified per atom kind

**Context.** D9 Amendment 1 (`plans/si5b-stdlib/decisions.md`): the jar
MEASURES raw scaled dims but EMITS `Math.round(natural × scale)` for
rasterized sprites; rounding must live at the `<image>` **emission** site,
never in resolvers (rounding the resolver corrupts the cursor-advance width
the following text run reuses). Commit `1406e139` fixed the class-engine
emission site (`renderer-classifier-rows.ts`) and explicitly flagged the
description-engine site (klimt's shared driver) as needing its own
verification pass because it also serves `<img>` atoms. SI14 T4 made that
unrounded path reachable from class diagrams (`image/@width` 3.2308 vs 3).

**Decision.** Round the emitted `<image>` width/height in
`driver-image-svg.ts` **only when the `UImage` carries raster dims**
(ADR-1's field doubles as the "raster-backed" signal; latex stays exempt).
Before enabling for `<img>` atoms, T3 must jar-verify `<img>` emission
rounding with an authored fixture + generated oracle. If the jar does NOT
round `<img>` emission, narrow the gate to sprite-origin only (a discrete
flag on `ResolvedAtomImage`/`UImage`) — that outcome is in-scope, not a stop;
stop only if the jar's `<img>` behaviour fits neither shape (stop 7).

**Consequences.** `image/@width`/`@height` on `class-usecase-inline-sprite`
clear to 3×2. Description-engine sprite emission changes identically —
covered by the same golden suite and size-deltas gate.

## ADR-3: The T5 sweep deletes `atomsWidth` and the fallback label closure together, after a reachability proof

**Context.** SI14 T5 kept `ClassGeometry.rows[].atomsWidth` as a
documented-dead field because its sole reader is `tryRenderUSymbol`'s
pre-T4 `renderLabel` closure (`renderer.ts:101-107`), which is itself only
reachable when `geo.measurer === undefined` (hand-built test fixtures; the
real `layoutSync` and the conformance harness always set it). Deleting one
without the other leaves either a dead field or a broken read.

**Decision.** Delete both in one task: the `atomsWidth` field
(`class-geo-types.ts:78-93`), the `atoms`/`atomsWidth`/`renderLabel` closure
in `tryRenderUSymbol`, and `renderRowAtoms` IF the grep proves it thereby
loses its last caller. Precondition inside the task: grep-prove no
production path and no test constructs a usecase/actor geo that depends on
the closure; update hand-built fixtures rather than preserve dead code.
`tryRenderUSymbol` itself and the `measurer === undefined` box fallback for
OTHER usymbol kinds stay — only the atom-label closure dies.

**Consequences.** Class geo narrows; no rendering change on any real path
(the closure is unreachable from `layoutSync` output). Any test that
exercised it moves to the faithful path or asserts the new behaviour.

## ADR-4: T4 re-measures the ink-offset ordering divergence AFTER T1, as a diagnosis task

**Context.** SI14 T2 journaled a ~0.9px divergence between the retired
data-based fit and the object-based fit for a SYNTHETIC ink-offset sprite in
`text+sprite` ordering only (real stdlib sprites reproduce the jar exactly;
not one of the seven jar-verified shapes). T1's raster-dims change alters
exactly the mechanism that was suspected.

**Decision.** T4 is diagnosis-only under `~/.claude/rules/diagnosis.md`:
re-measure the synthetic case against a fresh jar oracle after T1 lands. If
the divergence is gone, record closure with the measurement. If not, produce
the full mechanism artifact and file it (GH issue + mission-index row) — no
inline fix, no source changes.

**Consequences.** The observation stops living only in SI14's journal;
either closed with evidence or tracked as its own mission.

# SI14 decisions (maintainer-approved 2026-08-03)

## The finding these rest on

Verified in `~/git/plantuml` this session. Upstream shares measurement two ways,
and **neither is passing a number across a boundary**:

1. **The object.** `IEntityImage extends TextBlock` — one interface carrying both
   `calculateDimension(StringBounder)` and `drawU(UGraphic)`.
   `SvekNode.java:73` holds `private final IEntityImage image`; `:116` sizes it;
   `:367` hands the *same instance* to `SvekResult.java:86` to draw. Internal fit
   state is constructor-computed and stored:

   ```java
   // TextBlockInEllipse.java
   private final ContainingEllipse ellipse;
   public TextBlockInEllipse(TextBlock text, StringBounder stringBounder) {
       ...
       ellipse = footprint.getEllipse(text, alpha);   // once
   }
   public void drawU(UGraphic ug) {
       final XPoint2D center = ellipse.getCenter();   // free at draw time
   ```

2. **The measurer, via the UGraphic.** `ug.getStringBounder()` is the draw-time
   injection seam, so a draw-time reconstruction measures identically to the
   sizer.

The port already implements both, in the description engine
(`renderer-entity.ts:387`, whose doc comment at :363-375 names
`ug.getStringBounder()` as "the single render-phase injection seam"). The class
engine implements neither.

---

## ADR-1 — the class renderer gets a **measurer**, carried on the geo

**Context.** `SyncPlugin.render(geo, theme)` (`core/dispatcher.ts:153`) receives
no measurer and no sprite registry, so `renderClass` cannot construct anything
that measures.

**Decision.** Carry `StringMeasurer` (+ optional `SpriteRegistry`) on
`ClassGeometry` and reconstruct the `EntityImageDescription` at draw time.

**Rejected.** Carrying the constructed object itself (geo is plain data today,
and live objects in it would be a larger change than the problem warrants);
changing the `SyncPlugin` contract (a shared-contract change affecting every
plugin, for one leaf type).

**Why this one.** It is exactly what `renderer-entity.ts:387` already does, and
`class/index.ts:68-71` already carries `errors` from the AST onto the geo for
this identical reason, documenting it as such. Reconstruction is safe because
construction is pure given the same params and bounder.

**Consequences.** Geo grows a non-serialisable field. Construction happens
twice per usecase/actor node (once to size, once to draw) — the same redundancy
the description engine already accepts.

---

## ADR-2 — per-node `UGraphicSvg`, unwrapped to a fragment

**Context.** The class renderer emits SVG by string concatenation. klimt's
emitter has **no fragment mode**: `SvgGraphicsCore#createXml` unconditionally
roots a `<svg>` document via `getRootNode`. The sanctioned workaround is
`description/renderer.ts#unwrapKlimtSvg` (:271), a string-level unwrap.

**Decision.** Draw each usecase/actor node into its own `UGraphicSvg`, then
unwrap to `{ body, extraDefs?, width, height }` and splice into the class
renderer's string output, merging `extraDefs` across nodes.

**Rejected.** Adding a real fragment-emission mode to `SvgGraphicsCore` — a
prior mission made touching that emission behavior an explicit STOP, and it is
retained as stop condition 5. Converting the class renderer to `UGraphic`
wholesale — genuinely large and separable; if this mission shows it is the right
end state, it becomes its own tracked mission, not a silent expansion.

**Consequences.** N small documents per diagram. The real risk is **element-id
collision across per-node documents**; `svg-seed.ts` and the existing `uid`
parameter make this controllable, and T1 must prove it rather than assume it.

---

## ADR-3 — retire `usecase-footprint.ts` by switching mechanism, not path

**Context.** The port has **two faithful ports of the same fit**:

| | mechanism | callers |
|---|---|---|
| `core/svek/image/Footprint.ts` | object-based — `MyUGraphic` collects points by **drawing** the TextBlock (upstream's actual mechanism) | `TextBlockInEllipse` |
| `description/usecase-footprint.ts` | data-based — callers hand it precomputed `FootprintBox`es; `textFootprintBox` reproduces `Footprint#drawText`'s `-(h - 1.5)` shift by formula | `leaf-sizing.ts:318-319`, `leaf-sizing-text.ts:347` |

The second is not an approximation — its header records jar verification on
seven shapes to 5e-4 px. Its only remaining reason to exist is the `<latex>`
route through `measureUsecase`.

**Decision.** Have that route build a real TextBlock and call
`Footprint#getEllipse`, then delete `usecase-footprint.ts`.

**Hard boundary.** This changes **which implementation computes the fit**, never
**which measurement path a latex display takes**. `<latex>` is a permanent
documented divergence (`DIVERGENCES.md:260-285` — KaTeX, not JLaTeXMath), and
SI10 measured routing it onto the faithful path as `widened 2`.

**Fallback, if the mechanisms cannot be shown numerically identical.** Delete
only the duplicated circle solver, keep the box-computing entry points, and file
the remainder as tracked work. A partial retirement gets recorded as such — it
is not written up as complete.

---

## ADR-4 — delete `measureActor`

Zero live callers in `src/`: SI10 changed `class-layout-leaf-shapes.ts:14` to
import only `measureUsecaseOrActorLeaf`. The comment at `leaf-sizing.ts:18-21`
still claiming "class-layout-leaf-shapes.ts imports both unconditionally … why
`usecase-footprint.ts`/`footprintBoxes` survive too" is **stale** and must be
corrected in the same commit, not repeated.

`measureUsecase` **stays** — the `<latex>` route still needs it.

---

## Operational readiness

Library and build tooling. Observability **N/A** — the quality gates are the
instruments; no runtime services, no dashboards, no alert thresholds. Rollback
is **Reversible**: revert the merge. No persisted state, no data migration. The
public API is unchanged — `renderSync`'s signature is untouched and no
`SyncPlugin` contract field moves (ADR-1 carries the measurer on the geo
precisely to avoid that). No scalability envelope and no on-call story apply.

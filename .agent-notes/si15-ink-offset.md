## Observation: `text+sprite` ink-offset ellipse-fit divergence — PERSISTS post-T1

- **Context**: SI15 T4, diagnosis-only task (ADR-4). SI14 T2 journaled a
  ~0.9px divergence between the retired data-based ellipse fit and the
  object-based `Footprint#getEllipse` fit for a SYNTHETIC 16×16 declared
  monochrome sprite whose ink is an offset rectangle, `text+sprite` label
  ordering only. T1 (this mission, landed before this task) changed
  `Footprint.MyUGraphic.drawImage` to use `rasterWidth/rasterHeight − 1`
  when a `UImage` carries raster dims (ADR-1). This task re-measures with
  T1 applied.

  Tree state for these measurements: `git log --oneline -1` = `4e931781`
  ("docs: journal SI15 batch 1 …"), `git status --short` shows T3's
  concurrent in-flight edits (`src/core/klimt/drawing/svg/driver-image-svg.ts`,
  `tests/oracle/svg-conformance/class-usecase-actor.test.ts`, two new
  untracked files under `oracle/goldens/svg-class/class-usecase-inline-img/`
  and `tests/unit/core/klimt/`). None of those files are on this task's
  measurement path (T3 touches SVG *emission*; this task's subject is
  `Footprint`/`leaf-sizing*` *sizing*), confirmed by grep — no overlap.

- **Probe**: `sprite $inkbox [16x16/16] { … }`, a 16×16 grid, all `0`
  except an 8×8 rectangle of `F` at rows/cols 4–11 (offset from every
  edge — "ink offset rectangle"), rendered on two usecases: `U1
  "<$inkbox>\ninkbox"` (sprite+text) and `U2 "inkbox\n<$inkbox>"`
  (text+sprite). Probe file:
  `/private/tmp/claude-501/-Users-scottseely-git-plantuml-ts/821b38e7-33f7-438d-9db0-8183b33d6c72/scratchpad/si15-t4-ink-offset.puml`.
  Fresh jar oracle: `java -DPLANTUML_DETERMINISTIC_TEXT=true -jar
  oracle/dist/plantuml-oracle.jar -tsvg <file>` → `si15-t4-ink-offset.svg`
  (same directory).

- **Measured numbers (post-T1) vs fresh jar oracle**:

  | Ordering | jar (rx, ry → 2·rx, 2·ry) | our fit (width, height) | Δwidth | Δheight |
  |---|---|---|---|---|
  | sprite+text (U1) | rx=28.1092, ry=22.3565 → 56.2184, 44.7130 | 56.218410949747806, 44.71298003104001 | ~1e-4 | ~1e-4 |
  | text+sprite (U2) | rx=29.066, ry=23.0941 → 58.132, 46.1882 | 59.350581350229234, 47.12754568284826 | **1.2186** | **0.9394** |

  `sprite+text` matches to jar's own stated precision (closed, unchanged
  from pre-T1). `text+sprite` still diverges by ~0.94–1.22px — the
  magnitude and ordering-specificity T2 originally reported both
  reproduce. **Verdict: PERSISTS.**

- **Mechanism**: the SIZING path that feeds this ellipse fit
  (`measureUsecaseOrActorLeaf` → `measureEntityLeaf` →
  `EntityImageDescription.calculateDimensionSlow` → `TextBlockInEllipse`
  → `Footprint#getEllipse`) never populates `rasterWidth`/`rasterHeight`
  on the `ResolvedAtomImage` for a monochrome sprite, so T1's new
  `rasterWidth !== undefined` branch in `Footprint.drawImage` is
  unreachable on this path — the footprint fit still uses the full
  DECLARED (scaled) box, exactly as before T1. T1 is real and correct
  code; it simply never executes for this call path.

- **Origin**: `src/diagrams/description/leaf-sizing-entity.ts:61-72`
  (`sizingAtomImageResolverFor`). Line 66-69 only special-cases an
  SVG-backed sprite (`reg?.svg !== undefined` → `resolveSvgSpriteAtom`,
  which returns `kind: 'drawable'`, not an image, so raster fields don't
  even apply there). Line 70 is the monochrome/unresolved fallback:
  `return { kind: 'image', href: '', width: dims.width, height:
  dims.height };` — no `rasterWidth`/`rasterHeight` keys. This is a
  DELIBERATE prior decision, documented in the same function's doc
  comment (lines 38-60): "monochrome/unresolved sprites keep today's
  `href: ''` declared-box fallback" because rasterizing a PNG at sizing
  time would cost CPU for a value sizing has no other use for. The gap
  this creates for `Footprint`'s footprint-based ellipse fit (as opposed
  to cursor-advance sizing, which is unaffected) was not in scope when
  that decision was made — it predates T1/ADR-1 by a different mission.

  `spriteDimsLookupFor` (`src/core/sprite-commands.ts:151-169`) confirms
  the same asymmetry one layer down: an SVG sprite's lookup entry carries
  `svg`/`inkX`/`inkY`/`inkWidth`/`inkHeight`; a monochrome sprite's entry
  is `{ width, height }` only (line 166) — there is no raster-dims
  channel between the registry and the sizing resolver for monochrome
  sprites at all.

- **Causal chain (arithmetic reaching both numbers)**: instrumented the
  raw `Footprint`/`ContainingEllipse.append` points for both orderings
  (monkey-patch probe, no source changed). Image-atom corners in both
  cases span the full declared box `17.230769×17.230769` (= `16 ×
  14/13`, the `spriteScale` factor — unaffected by T1, confirming
  `rasterWidth`/`rasterHeight` are indeed `undefined` on this path).

  For `sprite+text` (U1), the 8-point set's minimal-enclosing-circle
  diameter pair is the image's TOP-LEFT corner (position-only, size-
  independent — Sea's assigned `(x, y)`, not `x+width, y+height`) paired
  with the text box's far corner: the declared-vs-raster box-size error
  therefore never enters the diameter calculation, so this ordering
  matches jar exactly regardless of the bug — the SAME "2-point-diameter
  selectivity" `.agent-notes/si14-ry-delta.md` established for the
  `class-usecase-inline-sprite` `rx`/`ry` residual (there too, only one
  of several possible extremal-pair choices was size-sensitive).

  For `text+sprite` (U2), the diameter pair instead includes the image's
  BOTTOM-RIGHT corner (`top-left + width, top-left + height`) — a
  size-dependent point — so the declared-box overshoot leaks directly
  into the fitted `rx`/`ry`. **Controlled experiment**: monkey-patched
  `UImage.prototype.getRasterWidth`/`getRasterHeight` (probe-only, no
  source file modified) to unconditionally return `17` (the jar's own
  actual rasterized PNG dimension for this exact sprite+scale, decoded
  from the emitted `<image>` base64 IHDR — `16 × 14/13 = 17.230769` →
  upstream's AWT-resampled PNG rounds to `17×17`, not the raw `16×16`
  grid), making T1's `raster − 1 = 16` branch reachable on the sizing
  path for both atoms. Result: `sprite+text` unchanged (56.218411 vs
  jar 56.2184, still exact — expected, that ordering was never
  size-sensitive); `text+sprite` moved from `59.350581 / 47.127546` to
  `58.131950 / 46.188112` vs jar's `58.132 / 46.1882` — matches to
  ~1e-3px. This isolates the variable: supplying raster dims on the
  sizing path, and nothing else, closes the `text+sprite` gap.

- **Ruled out** (with evidence):
  1. **T1's `Footprint.drawImage` arithmetic itself being wrong** — ruled
     out by the control experiment above: once raster dims are reachable
     (forced via monkey-patch), T1's actual, unmodified `raster − 1`
     code reproduces jar to ~1e-3px on both orderings. T1 is correct;
     it's unreached.
  2. **Text-metric / alpha / `Sea` composition mechanisms** (the classes
     of cause `si14-ry-delta.md` already eliminated for the sibling
     `rx`/`ry` residual) — not re-litigated in depth here since
     `sprite+text` (U1), which uses the identical text atom and the
     identical `Sea` composition code, matches jar exactly; a text/alpha/
     composition bug would show up in BOTH orderings symmetrically, not
     one only.
  3. **Stale/regenerated jar oracle** — the SVG above was generated fresh
     in this session (`-DPLANTUML_DETERMINISTIC_TEXT=true`, single-file
     invocation) against this task's own probe `.puml`, not reused from
     any prior session.
  4. **T3's concurrent emission-rounding edits perturbing this
     measurement** — ruled out structurally: T3's write-set
     (`driver-image-svg.ts`, SVG `<image>` emission rounding) sits
     strictly downstream of `Footprint`'s in-memory sizing fit (same
     disjointness `si14-ry-delta.md` ruled-out item 7 established for
     the analogous D9-rounding call site); this task's numbers come
     entirely from `measureUsecaseOrActorLeaf`, which never reaches
     the renderer/emission layer at all.
  5. **The registry's raster-dims *value* itself (`sprite.width`/
     `sprite.height`, T1's chosen source in `render-atoms.ts:285`) being
     the wrong number even when reachable** — investigated as a
     tangential finding, NOT the cause of this divergence (sizing never
     reaches that code at all, so its value is moot here), but worth
     recording: `sprite-raster.ts`'s own doc comment (lines ~163-186)
     already discloses that this port's `spriteToPngDataUri` emits the
     PNG at NATURAL (grid) size while upstream resamples to the
     scaled+rounded size via an AWT bilinear filter — a pre-existing,
     already-documented divergence, independent of this task's subject.
     For this 16×16/scale-1.0769 sprite the two would differ (grid=16 vs
     upstream's resampled 17), which is why the control experiment above
     used `17` (jar's true value) rather than `16` (registry's `sprite.width`)
     to isolate the SIZING-reachability variable cleanly.

- **Classification**: plantuml-ts defect — a real, reproducible gap in
  this port's own architecture (not an upstream/AWT-platform
  irreducibility; the sizing-time box size is fully computable without
  rasterizing a PNG). Scope: every monochrome-sprite-bearing usecase/
  actor label whose enclosing-ellipse fit happens to pick a
  size-sensitive corner as its diameter pair — ordering-dependent, so
  real stdlib sprites in the SEVEN jar-verified `footprint-parity.test.ts`
  shapes never triggered it (their corpus never included a case where
  the size-sensitive corner was extremal), matching T2's original
  finding that this needs a purpose-built synthetic case to observe.

  **Proposed fix shape (NOT applied — diagnosis-only task)**: extend
  `sizingAtomImageResolverFor` (`leaf-sizing-entity.ts:61-72`) to also
  populate `rasterWidth`/`rasterHeight` for a monochrome sprite, sourced
  from the SAME registry lookup the render path already uses
  (`sprites?.get(atom.name)` returning grid `width`/`height` today) —
  cheap (no PNG rasterization needed at sizing time; only the grid
  dimensions, already resident in `SpriteDimsLookup`, are required) so
  the doc comment's CPU-cost objection (which was about rasterizing a
  PNG, not about reading `width`/`height`) does not apply to raster-dims
  alone. This would need `SpriteDimsLookup.get()`
  (`sprite-commands.ts:151-169`) to expose grid `width`/`height` for
  monochrome entries under a name distinguishable from the SVG ink
  fields already there (it already does — `{width, height}` is returned
  for monochrome names today, just not read by the sizing resolver).
  Given ruled-out item 5, a full fix should also decide whether the
  raster-dims SOURCE for sizing should be `sprite.width`/`sprite.height`
  (native grid, matching T1's current `render-atoms.ts:285` choice — and
  therefore this port's own actual PNG raster) or the jar's true
  resampled-and-rounded raster (`round(dims.width)`/`round(dims.height)`)
  — the two diverge whenever `scale × gridDim` crosses a rounding
  boundary (as demonstrated here: `16 × 14/13 = 17.230769` → jar rounds
  to 17, registry says 16). Follow-up task, own write-set
  (`leaf-sizing-entity.ts` + possibly `sprite-commands.ts`), should
  jar-verify which source is correct before landing either.

- **Confidence**: High. The persisting divergence is measured directly
  against a freshly-generated jar oracle (not inferred); the mechanism
  (unreachability) is proven structurally (grep of the sizing resolver)
  AND by a controlled experiment that closes the gap to ~1e-3px by
  toggling exactly the one variable (raster-dims availability) the
  mechanism claims is missing.

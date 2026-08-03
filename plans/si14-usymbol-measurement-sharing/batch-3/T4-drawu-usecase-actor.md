# T4 — draw usecase/actor through `EntityImageDescription.drawU`

## Context

**Project.** `plantuml-ts`, a TypeScript port of PlantUML. `~/git/plantuml` is
the spec. `src/` is browser-safe. Tests are vitest.

**The defect.** The class engine **sizes** its `usecase`/`actor` leaves with the
faithful `EntityImageDescription` tree (SI10) and then **draws** them with a
hand-rolled ellipse:

```ts
// src/core/usymbol-shapes.ts#renderUseCaseIcon
const cx = node.x + node.width / 2;
const cy = node.y + node.height / 2;
const oval = ellipse(cx, cy, node.width / 2, node.height / 2, {...});
return oval + drawLabel(node, node.display, cx, cy - 2 + theme.fontSize / 3, theme);
```

`cy - 2 + fontSize/3` is the constant `cy + 2.6667`. The jar's offset is
**content-dependent**: `cy + 3.2713` for a sprite-bearing label, `cy + 3.5005`
for text-only. The label is also centred here, while the jar left-aligns it at
the fitted ellipse's own `dx`.

**The mechanism, from upstream.** `TextBlockInEllipse.drawU` translates the text
block by `(dx, dy - 2)` where `dx = sh.getWidth()/2 - center.getX()` and
`dy = sh.getHeight()/2 - center.getY()`, with `center` coming from the fit
computed **once in the constructor** and stored in a `final` field. The class
engine has no access to that centre because it keeps only `{width, height}`.

Since the class engine's node box **is** `TextBlockInEllipse.calculateDimension`
(= fitted + 6), `sh.getWidth() === node.width` and `sh.getHeight() === node.height`.
So the only genuinely missing input is the centre — and the correct fix is not
to plumb the centre out, but to **let the object draw itself**.

## Task

Replace the hand-rolled usecase/actor drawing with a real `drawU`:

1. In `renderer.ts#tryRenderUSymbol` (:91), build the same
   `EntityImageDescription` params the sizer builds and construct it, using the
   measurer and sprite registry T3 put on the geo.
2. Draw it into a fragment via T1's seam, translated to the node's position.
3. Splice the fragment body into the class renderer's string output and merge
   its `extraDefs`.
4. Remove the now-superseded label centring from `renderUseCaseIcon` /
   `renderActorIcon` in `src/core/usymbol-shapes.ts`.
5. Re-pin the three authored fixtures in
   `tests/oracle/svg-conformance/class-usecase-actor.test.ts`.

`src/diagrams/description/renderer-entity.ts:376-388` (`drawEntity`) is the
working reference for steps 1-2 — read it before writing anything. Its doc
comment explains why no measurer parameter is needed at draw time: the
`TextBlock`s read the bounder from `ug.getStringBounder()`.

## Write-set

- `src/diagrams/class/renderer.ts`
- `src/core/usymbol-shapes.ts`
- `tests/oracle/svg-conformance/class-usecase-actor.test.ts`

`renderUSymbolIcon`'s other symbols (database, component) are drawn by the same
dispatcher — leave their behaviour untouched.

## Read-set

- `src/diagrams/class/renderer.ts:88-115` — `tryRenderUSymbol`,
  `renderClassifier`
- `src/core/usymbol-shapes.ts:129-204` — `renderActorIcon`,
  `renderUseCaseIcon`, `drawLabel`, `renderUSymbolIcon`
- `src/diagrams/description/renderer-entity.ts:355-390` — **the reference
  implementation**
- `src/diagrams/description/leaf-sizing-entity.ts:110-190` — how the sizer
  assembles `EntityImageDescriptionParams`, so the draw-side params match
- `src/core/klimt/shape/TextBlockInEllipse.ts` — the centring being inherited
- `src/core/decoration/symbol/USymbolUsecase.ts:150-175` — `asSmall`
- `../batch-1/T1-klimt-fragment-emission.md#interface-contract`
- `../batch-2/T3-class-geo-measurer.md#interface-contract`
- `../decisions.md#adr-1`, `#adr-2`
- `~/git/plantuml/.../klimt/shape/TextBlockInEllipse.java`

## Architecture decisions (locked)

- **ADR-1.** The measurer comes off the geo (T3). Do not change the
  `SyncPlugin` contract.
- **ADR-2.** Draw into a per-node `UGraphicSvg` and unwrap via T1's seam. Do
  **not** modify `svg-graphics-core.ts` (stop condition 5).
- **Scope.** usecase/actor leaves only. The generic classifier box, namespace
  folder, and lollipop stay string-based. Converting the class renderer to
  `UGraphic` wholesale is explicitly a separate, larger mission — if this task
  concludes that is the right end state, **journal it, do not do it**.

## Acceptance criteria

1. **Given** `class-usecase-inline-sprite`, **when** rendered, **then**
   `text/@x` and `image/@x` both reach delta 0 against the jar (today both
   2.003).
2. **Given** a text-only usecase and a sprite-bearing usecase, **when**
   rendered, **then** their label baselines **differ** — the offset is
   content-dependent, not the constant `cy + 2.6667`.
3. **Given** the 312 class goldens, 24 object, 59 state and 54 description
   ratchets, **when** run, **then** all are byte-identical. None contains a
   usecase, actor or sprite, so any movement means the change reached too far.
4. **Given** the three authored fixtures, **when** re-pinned, **then** each
   pinned diff array is *smaller* than before, and every remaining entry is
   labelled with the mechanism it characterises.
5. **Given** a diagram with two usecase nodes, **when** rendered, **then** the
   output contains no duplicate element `id` and no dangling `url(#…)`.

Criterion 4 means: re-pinning is allowed here **only** because these three
fixtures are already characterisation guards with explicitly pinned diffs
(SI10/ADR-4). Re-pinning any other golden is stop condition 2.

## Explicitly out of scope

The ellipse `ry` delta (13.4846 vs 13.0625 on `class-usecase-inline-sprite`) is
a **second, adjacent mechanism in the fit itself**, not the centring. It is
expected to survive this task. T6 diagnoses it. Do not chase it, and do not
describe this task's result as "the fixture is clean" — state the residual.

## Observability

N/A — no new observable operations.

## Rollback

**Reversible** — revert the commit.

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build` exit 0.
Size-delta gate **320/351, widened 0**. `npx jiti scripts/vendor-stdlib.ts
--verify` 34,587 files verbatim.

Verify the jar oracle **one file at a time** —
`java -DPLANTUML_DETERMINISTIC_TEXT=true -jar oracle/dist/plantuml-oracle.jar
-tsvg <one.puml>`. A multi-file invocation returns PlantUML's welcome/error page
and is easy to misread in both directions.

## Boundaries

**Always:** state the residual deltas honestly, including ones this task did not
fix.
**Ask first:** any file outside the write-set; any golden re-pin beyond the
three authored fixtures.
**Never:** widen scope to other USymbols or to a wholesale `UGraphic`
conversion; weaken a test to make it pass; run git mutations.

## Commit

One commit: `fix(T4): draw use-case and actor labels from the fitted ellipse`
Body: why the constant offset was wrong, and that the centring now comes from
the same object that sized the node.

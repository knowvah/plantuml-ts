# Architecture Decisions — svg-sprite-nanoparser

All five approved by the maintainer 2026-07-30. **Treat every decision here
as locked.** If you discover a conflicting constraint, STOP and log it to
`decision-journal.md` — do not silently override.

Maintainer rulings that frame all five: **DOT parity is the gate** (no new
SVG goldens authored in this mission), and **port the full `SvgNanoParser`
class** (not the `<path>` subset the corpus happens to exercise).

## ADR-1 — `SvgPath` is the single `d` → `UPath` parser

**Context.** Upstream's `SvgNanoParser.drawPath` constructs
`new SvgPath(tmp, UTranslate.none())` (`SvgNanoParser.java:373`) — it owns no
path reader. This port has three partial ones: `svg-path-bbox.ts` (folds to a
bbox, discards segments), `openiconic-glyphs.ts` (emits a `d` string), and
nothing at all on the render path.

**Decision.** Port `openiconic/SvgPath.java` as `d` → `UPath`; re-express
`pathBBox` over `UPath.getMinX/getMaxX/getMinY/getMaxY`; leave
`openiconic-glyphs.ts` untouched.

**Why this is provable, not hopeful.** `src/core/klimt/shape/UPath.ts:141-149`
already implements the exact `addInternal` rule that
`svg-path-bbox.ts:1-32` documents as load-bearing for the ±0.01pt bar:
`SEG_ARCTO` contributes ONLY its endpoint (`coord[5], coord[6]`), every other
segment contributes every coordinate pair including Bézier control points.
Same rule ⇒ same numbers. **Keeping `pathBBox`'s existing test suite green IS
the proof** — do not assume the equivalence, demonstrate it.

**Rejected.** (B) Give `SvgNanoParser` its own path reader — a third parser,
i.e. more of the divergence this mission exists to close. (C) Also migrate
`openiconic-glyphs.ts` — 459 lines byte-verified against 5 jar fixtures, out
of this fix's path. Future convergence, not this mission. **Touching it is a
STOP.**

## ADR-2 — Two channels, structurally unable to recollapse

**Context.** `AtomImageResolver` (`src/core/creole-atoms.ts:133`) is today
`(atom) => {href, width, height} | undefined` — one opaque channel. Ink and
layout are forced through it together, which is the bug.

**Decision.** Discriminated union:

```ts
| { kind: 'image';    href: string;      width: number; height: number }
| { kind: 'drawable'; primitives: UPath[]; width: number; height: number }
```

`width`/`height` remain the **DECLARED** box in both variants. Ink exists
ONLY inside `primitives`. This mirrors upstream's structure — different
objects, different method calls — rather than reproducing its numbers.

**Explicit non-goal — read this before proposing anything to this type.**
This is **NOT** re-adding the `inkX`/`inkY`/`inkWidth`/`inkHeight` fields that
`sizer-footprint-parity` T2/ADR-2 deleted as a dead duplicate channel. Those
were a MEASUREMENT side channel; these are DRAW-TIME primitives. Any task
proposing measurement ink on `AtomImageResolver` is contradicting an
architecture decision → **STOP**.

**Rejected.** (B) optional `primitives?` beside `href` — a caller could still
read ink off the dimension field, which is the current bug's exact shape.
(C) always primitives — forces monochrome PNG sprites and `<img>` through a
path model they do not have.

## ADR-3 — Retire `fitToInk` in this mission, in its own gated commit

**Context.** `src/diagrams/description/leaf-sizing.ts:360-376`
(`sizingAtomImageResolverFor`'s `fitToInk` branch) substitutes a sprite's INK
box for its whole resolved dimension. After ADR-2 lands it is the last
ink-in-layout path.

**Decision.** Retire it as T10, one gated commit. Acceptance is
`bootstrap-0` and `ruziru-69-xixo434` at **widened 0**
(`npx tsx scripts/measure-description-size-deltas.ts` exits 0).

**Out of scope, stated so no task wanders in.** The analytic substitute
cannot be retired here: `usecase-footprint.ts` → `footprintBoxes` →
`measureUsecase` is called UNCONDITIONALLY from the CLASS engine
(`src/diagrams/class/class-layout-leaf-shapes.ts:14,27`), predating the guard
mechanism. That is class-engine work for a separate mission. **Touching it is
a STOP.**

## ADR-4 — Port all four classes (option A)

**Context.** The handoff's "~1,148 lines across six classes" did not survive a
second-level trace. Two genuinely-absent dependencies were invisible at level
one, both under `emoji/`.

| Class | Lines | Status |
|---|---|---|
| `svg/parser/SvgNanoParser.java` | 522 | New |
| `openiconic/SvgPath.java` | 255 | New |
| `emoji/UGraphicWithScale.java` | 128 | New — under `emoji/`, NOT `svg/parser/` |
| `emoji/ColorResolver.java` | 77 | New — same |

**982 lines across four.** Dropped from the handoff's six as already-ported or
not needed: `Footprint` (189 → `usecase-footprint.ts`), `SpriteSvg`
(71 → ported), `AtomSprite` (83 → our atom pipeline).

**Decision.** Port all four. `drawEllipse` IS ported despite 0 corpus reach,
and `drawText` despite only 6 occurrences — CLAUDE.md: the corpus is a
starting point, not a ceiling; the long tail is the deliverable.

**stdlib census grounding the scope** (all of `assets/stdlib`):

| Feature | Occurrences |
|---|---|
| `<g ` | 19,416 |
| `transform=` | 18,241 |
| `<circle>` | 12 |
| `<text>` | 6 (awslib20, edgy, ibm) |
| `style=` | 2 |
| `<ellipse>` | 0 |
| `font-family` | 0 |

The group + transform stack is core, not optional — that is why
`UGraphicWithScale` is required rather than nice-to-have.

**Rejected.** (B) defer `drawText` — leaves a hole in a class scoped as full.

## ADR-5 — Unit-level coverage under a DOT-only gate

**Context.** DOT parity is the gate (maintainer ruling), and **no SVG golden
contains a sprite**. So the `<image>` → `<path>` output change ships with zero
golden coverage.

**Decision.** No golden suite. Instead a unit test (T11) asserting `bi-globe`'s
decomposed primitives reproduce `getMinX`/`getMaxX` = the jar's `rx=34.729`,
and that `bi-bootstrap-fill` — identical declared 16×16 — differs at
`rx=37.4784`. Two inputs, because one input cannot distinguish "correct" from
"channels still collapsed".

**Consequence, accepted deliberately.** The 390 SVG goldens are held
byte-identical (stop condition 3), strict enough that even a legitimate
tidying of emitted `<path>` output trips it. Under a DOT-only gate they are
the only thing standing between this mission and an unnoticed regression in
the shared renderer. Brittle-and-overridden beats permissive.

## Rollback classification

**Reversible** — revert the commits. No persisted state, no migration, no
public API change (`AtomImageResolver` is internal; `src/index.ts` exports 9
symbols, none of them it).

One caveat: `oracle/goldens/description/size-backlog.json` holds 112
shrink-only pins. If a task re-pinned a fixture, a plain revert would leave
the pin re-based and the guard silently weaker. **Hence: no re-pinning**
(stop condition 5).

## User-visible output change

The `<image href="data:image/svg+xml;base64,…">` → `<path>` change IS
observable to anyone diffing our SVG for sprite diagrams. Not a semver break
(SVG output is not a typed contract), but a rendering change: record it in
the commit message and the mission summary.

It needs **no `DIVERGENCES.md` entry** — it moves toward upstream, removing a
divergence rather than creating one. Per CLAUDE.md's test, a long-time
PlantUML user's surprise here is reduced friction, not changed meaning.

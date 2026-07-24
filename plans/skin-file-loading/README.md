# Skin-file loading (`skin <name>`) + shadow rendering

## Status: DRAFT (for review) — 2026-07-23

Drafted at the close of G8, which surfaced the dependency. Not yet
authorized for execution. Review D1–D4 and the batch split, then run
`/plan-mission` to expand into full `batch-N/TN-*.md` task files, or
adjust here first.

## Objective

Make the `skin <name>` directive actually load PlantUML's bundled skin
stylesheets (`rose`, `debug`, `reddress`, `sonyxperiadev`, `strictuml`)
and resolve their colors, fonts, corners, and **Shadowing** into the
theme cascade. Today `skin <name>` is **silently swallowed** — verified:
a `skin rose` state diagram renders the port's default `#F1F1F1` fill,
not rose's `#FEFECE`/`#A80036` + drop shadow. This mission also lands the
**shadow rendering** the value unblocks (draw the drop-shadow filter and
reserve its ink), which is where G8 hit the wall.

Success: `skin rose`/`skin debug` diagrams render upstream-faithful
colors and shadows; the G8-tracked `nimana-36-veco708` size-backlog entry
returns to ≤ 0.090278 (its skin-rose `Shadowing 4.0` drop-shadow ink,
2×4 = 8px, becomes reachable); `niveno-60-tiro789`/`sumiri-68-suvo696`
(`skin debug`) render faithfully.

## Verified findings (do NOT re-discover — established at G8 close + brief review)

- `skin <name>` is a no-op: it is not matched by `preprocessor.ts`'s
  skinparam/`<style>` collectors (`RE_SKINPARAM_LINE` etc.), so it
  falls through to the diagram body and is skipped. Renders identically
  to no directive. (Repro: `skin rose\nstate "NO" as no` → default
  `#F1F1F1`, not rose's `#FEFECE`.) **Dispatch seam: add a
  `RE_SKIN_DIRECTIVE` to `preprocessor.ts` alongside the skinparam
  collectors.**
- **The 5 bundled skins split into TWO grammars** (verified by parsing
  each through `parseStyleBlock`):
  - **`<style>`-block skins — `rose`, `debug`, `strictuml`** (`root {}`,
    `element { Shadowing 4.0 }`, nested `document { header {} }`).
    `parseStyleBlock` (`src/core/skinparam.ts`) parses these directly
    (rose → 100 selectors, its `element` Shadowing 4.0 captured). **All
    three harness-affected fixtures — nimana-36 `skin rose`,
    niveno-60/sumiri-68 `skin debug` — are on this path.**
    → MVP target.
  - **Preprocessor+skinparam skins — `reddress`, `sonyxperiadev`**
    (`!ifndef`/`!define`/`!ifdef` macros + bare `skinparam` lines, NOT
    style blocks). These need the existing preprocessor macro engine +
    `resolveSkinparam`, NOT `parseStyleBlock`. No harness fixture uses
    them → a later increment, not the MVP.
- **Merge hook exists (but does NOT yet carry Shadowing)**:
  `applyStyleMap(styleMap, base): Theme` (`src/core/style-map-theme.ts`)
  applies a parsed `StyleMap` onto a `Theme` via `deepMergeTheme`. BUT
  it aliases only RoundCorner/BackgroundColor/LineColor/FontColor —
  **it has zero `Shadowing` handling, and `Theme` has no shadowing
  field** (both verified). Resolving the shadow value requires (a) a
  `shadowing` field on `Theme`, (b) `applyStyleMap` mapping the parsed
  `Shadowing`/`element {}` selector onto it. This is Batch-1 resolution
  work, a prerequisite to Batch-2 rendering — NOT free once colors
  resolve.
- **No pinned fixture uses a bare `skin` directive** (state, class,
  object, description all checked) → implementing this cannot break an
  existing byte-exact pin.
- **Registry analog exists**: `BUILTIN_THEMES: Record<string,
  ThemeOverride>` (`src/core/themes-builtin.ts`) is the pattern for
  `!theme <name>`; `skin <name>` wants the same shape backed by the
  embedded `.skin` contents.
- **Shadow infra exists**: `svg-graphics-shadow.ts#buildShadowFilter`
  emits jar's EXACT filter (byte-verified vs nimana's canonical SVG).
  The svek Cluster path draws shadows (`Cluster.ts:319` →
  `decoration.drawU(…, style.shadowing, …)`) — but its one call site
  (`description/renderer-cluster.ts:110`) hardcodes `shadowing: 0`. The
  state render path (`renderer-composite-box.ts`, bespoke string
  emission) never wired shadowing in at all.
- **Jar refs**: `EntityImageState.java:145` / `InnerStateAutonom.java:93,
  140` — `style.getShadowing()` → the box draw. Ink rule
  (`LimitFinder#drawRectangle`, documented at
  `class/layout-ink-extent.ts:255`): `addPoint(x-1,y-1);
  addPoint(x+w-1+2*shadow, y+h-1+2*shadow)`.
- **Affected harness fixtures**: `nimana-36-veco708` (`skin rose`,
  Shadowing 4.0), `niveno-60-tiro789` + `sumiri-68-suvo696`
  (`skin debug`). Corpus-wide, any `skin <name>` diagram across all
  types.
- Related planned work: mission-guide `Phase 4i — Full skinparam` notes
  "the mission is wiring, not building from scratch."

## Batches (draft — strictly serial)

Scope note: the MVP is the `<style>`-grammar skins (`rose`, `debug`,
`strictuml`) — they close all three harness fixtures. The
preprocessor+skinparam skins (`reddress`, `sonyxperiadev`) are Batch 4,
a self-contained later increment.

| Batch | Scope | Done |
|-------|-------|------|
| 1 | **`<style>`-skin loading + resolution.** Embed rose/debug/strictuml as browser-safe string constants; add `RE_SKIN_DIRECTIVE` dispatch in `preprocessor.ts`; `parseStyleBlock` → `applyStyleMap` into the theme AS THE BASE cascade (below skinparam/inline `<style>` — see D6). **Extend `Theme` with a `shadowing` field + `applyStyleMap` to map `Shadowing`/`element {}` onto it** (the resolution half of shadow — see finding above). Verify rose/debug **colors AND the resolved Shadowing value** land (nimana resolves `#FEFECE`/`#A80036` + shadowing 4.0). | [ ] |
| 2 | **Shadow rendering + ink** (consumes Batch 1's resolved value). Thread `theme.shadowing` onto entity geo for ALL diagram types (fix `renderer-cluster.ts:110`'s hardcoded `shadowing: 0` AND wire the state bespoke render path); draw the existing `svg-graphics-shadow.ts` filter when shadow > 0; reserve `2×shadow` ink in `layout-ink-extent.ts`. Verify nimana's shadow matches jar (id-normalized) and its box size. | [ ] |
| 3 | **Corpus sweep + G8 close-out.** Verify all `<style>`-skin fixtures across diagram types render faithfully (colors + shadow); re-check class/description parity+census (the feature touches them via D3); **remove/lower `nimana-36-veco708`** from the state size-backlog (returns to ≤ 0.090278); tighten niveno/sumiri; docs. | [ ] |
| 4 | **Preprocessor+skinparam skins** (`reddress`, `sonyxperiadev`) — later increment: route these through the preprocessor macro engine + `resolveSkinparam` instead of `parseStyleBlock`. No harness fixture depends on it; do only if the corpus later needs it. | [ ] |

## Quality gates (after every task that lands code)

```
- npm test            (full suite green; state/class/description parity + pins hold)
- npm run typecheck
- npm run lint
- npm run build
- npx tsx scripts/measure-state-size-deltas.ts   (widened=0; nimana improves)
```

Pins-must-hold bar: the 57 (post-G8: 57 + T3 additions) byte-exact SVG
pins stay byte-identical EXCEPT any that legitimately gain a skin's
colors/shadow — those re-verify against jar and re-baseline deliberately,
never blindly. Shadow-OFF fixtures (`shadowing 0/false`) must stay
byte-identical.

## Stop conditions

1. A `.skin` file uses grammar `parseStyleBlock` can't handle — report
   the construct; extend the parser deliberately, don't hack around it.
2. Resolving a skin's colors regresses a non-skin fixture (the cascade
   merge leaked) — the merge is mis-scoped; stop.
3. Shadowing rendering changes a `shadowing 0/false` fixture — the
   resolution defaults wrong; stop.
4. The shadow filter can't match jar's SVG (id-normalized) — a real
   rendering divergence; file `docs/graphviz-issues/` only if it's a
   library issue, else fix at origin.

## Follow-ups this closes

- **G8's tracked `nimana-36-veco708` exception** (the whole reason this
  mission exists) — Batch 3 returns its backlog entry to ≤ 0.090278.
- The `Cluster.ts:110` hardcoded `shadowing: 0` (class/description
  shadows never render today) — Batch 2 fixes it as a general feature.

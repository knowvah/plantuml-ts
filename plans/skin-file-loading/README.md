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

## Verified findings (do NOT re-discover — established at G8 close)

- `skin <name>` is a no-op: dispatched through the generic
  "unrecognized line" skip; renders identically to no directive.
  (Repro: render `skin rose\nstate "NO" as no` → default colors.)
- **`.skin` files use the `<style>`-block grammar** (`root { … }`,
  `document { header { … } }`, `element { Shadowing 4.0 }`), which
  `parseStyleBlock` (`src/core/skinparam.ts`) already parses. No new
  parser needed.
- **Merge hook exists**: `applyStyleMap(styleMap, base): Theme`
  (`src/core/style-map-theme.ts`) applies a parsed `StyleMap` onto a
  `Theme` via `deepMergeTheme` (`src/core/theme.ts`).
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

| Batch | Scope | Done |
|-------|-------|------|
| 1 | Skin registry + resolution: embed the 5 `.skin` files as browser-safe string constants; dispatch `skin <name>` in the command/preproc layer; `parseStyleBlock` → `applyStyleMap` into the theme. Verify rose/debug **colors** resolve (nimana renders `#FEFECE`/`#A80036`). | [ ] |
| 2 | Shadowing resolution + rendering: thread the resolved `Shadowing` value onto entity geo (all diagram types — fix the `Cluster.ts` call site's hardcoded 0 AND wire the state render path); draw the (existing) shadow filter when shadow > 0; reserve `2×shadow` ink (`layout-ink-extent.ts`). Verify nimana's shadow matches jar (id-normalized) and its box size. | [ ] |
| 3 | Corpus sweep + close-out: verify all `skin <name>` fixtures across diagram types render faithfully; **remove/lower `nimana-36-veco708`** from the state size-backlog (returns to ≤ 0.090278); tighten `niveno`/`sumiri`; update the SVG-conformance census + docs. | [ ] |

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

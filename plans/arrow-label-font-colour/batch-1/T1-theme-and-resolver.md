# T1 — Theme fields, skinparam path, resolver

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification. Read the Java method body
before acting; every constant carries its upstream `file:line`. **Never fit a
value.** Pure SVG; vitest. SI24 (`plans/edge-label-box-followups/`, D3) built
`src/core/arrow-label-font.ts#resolveArrowLabelFont(theme): FontSpec` — the ONE
reader of `theme.colors.graph.arrowFontFamily/Size/Style` — fed by a skinparam
path (`skinparam-key-handlers.ts:102-118` → `skinparam-theme-builder.ts:85-88`
`GRAPH_OVERRIDE_FIELDS`) and a `<style>` path (`style-cascade-class.ts
#computeArrowFontOverride` → `style-map-theme.ts:91-94`). Colour was left out.
Upstream carries it on the SAME `FontConfiguration` (`svek/GraphvizImageBuilder
.java:234-241`); precedence is last-declared-wins (`decisions.md#d4`, oracle
experiments a/b/g/h/j in `decisions.md`).

## Task

1. **Fields (D1):** `theme-graph-colors-a.ts:218-236` — add `arrowFontColor?:
   string` (resolved hex) with a JSDoc citing `FromSkinparamToStyle.java:149,
   424-429` and `plantuml.skin:9`. `theme.ts` — add `cardinalityFontColor?:
   string` beside `cardinalityFontSize/Family` (`:21-22`, the two theme
   literals `:255-256`/`:330-331`, the override type `:383-384`, and
   `OPTIONAL_SCALAR_KEYS` `:476`). No default value in the theme literals —
   absent means "fall back", exactly like `arrowFontSize`.
2. **Skinparam (D4):** `skinparam-key-handlers.ts` — `[['arrowfontcolor'],
   (acc, _v, color) => { acc.arrowFontColor = color; }]` beside `arrowfontsize`
   (`:105-118`); the existing `fontcolor`/`defaultfontcolor` handler (`:102`)
   ALSO sets `acc.arrowFontColor = color` (`FromSkinparamToStyle.java:157`:
   `defaultFontColor` → root FontColor, which the arrow signature inherits;
   source-order overwrite reproduces b/g). `skinparam-theme-builder.ts:85-88`
   — add `['arrowFontColor', (acc) => acc.arrowFontColor]`. Add `arrowFontColor: string | undefined` to the accumulator
   (`skinparam-accumulator.ts:73` + its key list `:134`).
   Do NOT add a `cardinalityfontcolor` skinparam unless `FromSkinparamToStyle
   .java` registers one — grep it and journal the answer.
3. **Resolver (D2, D3):** `arrow-label-font.ts` — `resolveArrowLabelFont`
   returns `FontSpec & { color: string }`, `color = graph.arrowFontColor ??
   ARROW_LABEL_DEFAULT_COLOR` where the new constant is `'#000000'` citing
   `plantuml.skin:9`. Add `export function resolveCardinalityFontColor(theme):
   string` = `theme.cardinalityFontColor ?? resolveArrowLabelFont(theme).color`
   (D5, `GraphvizImageBuilder.java:124-126`). Update the file header: this
   remains the ONE reader.
4. **`xenusu` (stop 10):** check whether `skinparam arrow<<bluebold>> { … }`
   reaches the accumulator at all (grep the skinparam parser for stereotype
   handling). If it does, nothing extra is needed here; if not, journal it as
   named-out-of-scope — do not touch the parser.
5. Tests: the acceptance criteria below, in the three listed test files,
   each citing its oracle experiment id.

## Write-set

- `src/core/theme-graph-colors-a.ts` (420), `src/core/skinparam-accumulator.ts`,
  `src/core/theme.ts` (564 —
  already over the hook cap: the edit must not grow it; trim doc prose if
  needed, never a citation), `src/core/skinparam-key-handlers.ts` (404),
  `src/core/skinparam-theme-builder.ts` (178), `src/core/arrow-label-font.ts`
  (57)
- `tests/unit/skinparam.test.ts`, `tests/unit/core/arrow-label-font.test.ts`,
  `tests/unit/core/theme.test.ts`

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/FromSkinparamToStyle.java:140-160,420-431`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleStorage.java:102-116`,
  `style/DarkString.java:50-60`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/GraphvizImageBuilder.java:120-130,230-242`
- `~/git/plantuml/src/main/resources/skin/plantuml.skin:1-12,306-310`
- `src/core/arrow-label-font.ts` (whole), `src/core/skinparam-key-handlers.ts:95-125`,
  `src/core/skinparam-theme-builder.ts:60-90,120-170`, `src/core/theme.ts:15-30,250-260,325-335,380-386,470-480`,
  `src/core/theme-graph-colors-a.ts:210-240`, `src/core/skinparam-key-normalize.ts:30-60`
- `decisions.md` D1–D5 + the experiments table; `tests/unit/skinparam.test.ts:255-280`
  (the existing `arrowfont*` test to extend)

## Architecture decisions

D1–D5 as written. `FontSpec` (`src/core/measurer.ts`) is NOT touched.

## Interface contract (consumed by T2–T5)

```ts
// theme
colors.graph.arrowFontColor?: string;   // resolved hex, e.g. '#008000'
cardinalityFontColor?: string;          // resolved hex
// src/core/arrow-label-font.ts
export const ARROW_LABEL_DEFAULT_COLOR = '#000000';        // plantuml.skin:9
export function resolveArrowLabelFont(theme: Theme): FontSpec & { color: string };
export function resolveCardinalityFontColor(theme: Theme): string;
```

## Acceptance criteria

- **Given** `defaultTheme` (no override), **then** `resolveArrowLabelFont`
  returns `color === '#000000'` and family/size/weight/style deep-equal the
  pre-T1 result (pin the whole object).
- **Given** `skinparam ArrowFontColor green`, **then** `colors.graph
  .arrowFontColor === '#008000'` and `resolveCardinalityFontColor` returns the
  same (h).
- **Given** `skinparam ArrowFontColor green` THEN `skinparam defaultFontColor
  red`, **then** arrow colour `'#FF0000'`; the reverse order → `'#008000'`
  (b/g).
- **Given** `skinparam classFontColor red`, **then** arrow colour stays
  `'#000000'` (j).
- **Given** `theme.cardinalityFontColor = '#FF0000'` and no arrow colour,
  **then** `resolveCardinalityFontColor` returns `'#FF0000'` and the main
  label stays `'#000000'`.
- **Given** the full suite, **then** every SVG ratchet and dump is byte-
  identical (no renderer reads the colour yet).

## Quality bar

Four gates; DOT EQUAL unchanged for all five types.

## Observability

N/A — no new observable operations.

## Rollback

Reversible — one commit.

## Boundaries

- **Never** fall back to `theme.colors.text` (D3).
- **Never** touch a renderer or `src/core/measurer.ts`.
- **Stop** on stops 1, 3, 9 (as applied to `theme.ts`), 10.

## Commit

`feat(T1): arrow-label font colour — theme fields, skinparam path, resolver`

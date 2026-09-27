# T7b — route executed theme state; retire the summary (D3)

**Task.**
1. Using T7a's journaled measurement, find every renderer field that is fed
   by the summary (`Theme.colors.*`, `fontFamily`, `diagramMargin`, the
   hand-carried aws-orange entries in `compile-themes.py` MANUAL).
2. For each field, confirm that the executed skinparam/style reaches the
   same consumer the jar's does. Quote the Java consumer. Route it where it
   does not.
3. When all 25 `!theme` fixtures are no worse in every engine, delete the
   summary path (`themes-builtin*`, `compile-themes.py`, the resolve call)
   and remove DIVERGENCE 2 from `TContext.ts`. If some fixture is worse,
   keep the summary for that field only, with a comment citing the
   mechanism, and journal it.
4. Survey every engine; mizupo is the target. Stop 9 is waived (D3);
   every mover needs a mechanism.

**Acceptance.**
- Given mizupo, then conformant (gradient header, dpi 100 scale, `$PRIMARY`
  colours), or a residual with a mechanism.
- Given the 25 `!theme` fixtures, then 0 conformant losses.
- Given `src/`, if the summary was retired, then nothing references
  `BUILTIN_THEMES`.

**Observability** N/A. **Rollback** Reversible.

## Inputs from T7a (merged `3a93dced`, journal row 9)

- **Ordering.** Upstream `TContext.java:737-743`: the theme's lines run
  at the `!theme` directive's position, so later document lines win.
  T7a's `ThemeExecutor` currently WITHHOLDS the theme's plain output from
  the collector (`extractFromResultList(mark)`), and the summary stays the
  styling source.
- **T7a experiment** (output sent to the collector, summary off): mizupo
  23 → 271, because `aws-orange.puml:73` `    !assume transparent light`
  reaches the class parser still indented. `class-command-directives.ts:196`
  `/^!assume.../` rejects it, but upstream trims first
  (`SingleLineCommand2.java:71`). Other movers: vasibu 128.9 → 573.2,
  lunike 12 → 79, vakasu 445.8 → 470.8, vijito/vitusu/xalafa 380 → 388,
  zuravu 146 → 148.7 worse; reroca 4.49 → 2.27, fonulu 7 → 5.0 better.
  Diagnose every "worse" mover before retiring anything.
  Data: `/tmp/cdd4-T7a/{before,after,exp}/parity-*.json`.
- **Field map** (summary field → executed source → jar consumer):
  - `fontFamily` → `aws-orange.puml:195` → `FromSkinparamToStyle.java:156`
  - `fontSize` → `:196` → `:91`
  - `colors.background` → `:44`/`:21` → `:180`
  - `colors.arrow` #FF9900 → `:201` `ArrowColor $DARK` (#4E5D6C) → `:151`.
    #FF9900 is a hand-entered value in `compile-themes.py`; it does not
    come from the theme.
  - `colors.border` → class `$primary_scheme()` `:158-166` → `:183`
  - `colors.text` → no counterpart in the theme
  - `graph.classAttributeFontSize` → `:446` → `:190`
  - mizupo's firstDiff: `:442` `HeaderBackgroundColor
    $PRIMARY_LIGHT-$PRIMARY` → `FromSkinparamToStyle.java:196` (the jar's
    `<defs>` linearGradient)
  - the `<style>` block (`:555+`)
- **Write-set additions:**
  - `src/diagrams/class/class-command-directives.ts`: trim before matching,
    per `SingleLineCommand2.java:71`. Check the other engines' directive
    parsers for the same untrimmed match and journal them.
  - `src/core/tim/ThemeExecutor.ts`
  - `src/core/tim/builtin/GetCurrentTheme.ts`: read
    `TContext#getThemeMetadata` as upstream does.
  - `DIVERGENCES.md:652-661`: stale ("`!theme` records the name").
  - `src/core/include-resolver.ts`: prefetch `!theme X from <lib|url|dir>`
    targets for the async `render()` path.
- **Six `!theme` fixtures have no oracle cache**: finadu-74, nisifi-61,
  subdiagram-theme, taneno-85, vanadi-41, vaxule-47. Stop 8 forbids
  capturing them; journal them as unmeasurable.

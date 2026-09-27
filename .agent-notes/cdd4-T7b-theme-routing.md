# cdd4-T7b: routing the executed `!theme`

## Observation: the collector must read the substituted result, not addPlain input
- **Context**: letting a theme's lines reach the skinparam/`<style>` collector.
- **Finding**: the old `PlainLineFilter` sat at `TContext#addPlain` BEFORE
  substitution, so a procedure-call line was consumed unexecuted
  (`skinparam class { $primary_scheme() }`, aws-orange:158-166) and a mid-line
  call's `pendingAdd` prefix leaked into the diagram body as a bare line
  (aws-orange:645 `BackGroundColor $secondary_scheme()`), which is what made
  T7a's experiment render mizupo as a syntax error. The `!assume` line T7a
  blamed is accepted by the class parser (its lines are trimmed).
- **Impact**: the collector now runs in `preprocessor.ts#resultOf` over the
  finished result list; any future "filter while interpreting" seam repeats
  the bug.
- **Confidence**: High

## Observation: `split('\n')` is not `BufferedReader#readLine`
- **Context**: mizupo gradient id mismatch after routing.
- **Finding**: `readLines` produced a phantom empty last line for text ending
  in `\n`; the theme's extra blank line changed the `UmlSource#seed` and so
  every seeded SVG id. Verified with `java -jar ... -preproc` (diagnostic
  only, output in /tmp).
- **Impact**: any seed-derived id mismatch on an include/theme fixture: diff
  the port's dataLines against the jar's `-preproc` first.
- **Confidence**: High

## Observation: skinparam and `<style>` are ONE ordered stream upstream
- **Context**: zuravu-52 (`!theme crt-amber` + later `skinparam
  backgroundColor #000000`) lost the document's background.
- **Finding**: the port applied all skinparams, then all styles; upstream
  mutes one style store in declaration order (`SkinParam.java:227-234`).
  `style-skinparam-segments.ts` now carries the order; `buildTheme` and
  `resolveAnnotationStyles` (given a PreprocessorResult) apply runs in order.
  `render-fixture-class.ts` (sibling-owned at the time) still passes the
  bare skinparam map, i.e. the old two-stage order.
- **Impact**: a harness that copies `buildTheme` measures a path production
  no longer takes -- json/state/sequence harnesses now call it directly.
- **Confidence**: High

## Observation: survey maxDelta/firstDiff hides error pages
- **Context**: exp3 showed vasibu "better" (761 -> 656 units).
- **Finding**: it was an error page: sequence refused `!assume` (a common
  command every factory registers, `CommonCommands.java:65`); a Syntax Error
  diagram has fewer diff units than a wrong diagram. Grep outputs for the
  version banner before trusting a drop.
- **Impact**: sequence, activity, description, state, chart and packet lacked
  CommandAssumeTransparent; three bundled themes emit it.
- **Confidence**: High

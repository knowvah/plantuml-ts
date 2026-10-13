# ufp-T0e: generated utility data (D4, D5)

## Observation: 4 of the 10 DedicationSimple sentences are unreachable verbatim
- **Context**: rendering the 10 `DedicationSimple` sentences through `scripts/oracle-render.sh`
  to extract their PNGs.
- **Finding**: `Dedications.get` returns null for any line of 25 chars or fewer
  (`Dedications.java:89`, `if (line.length() > 25)`), so `linux_china`, `arkban`,
  `Ben and Jen 2020` and `baraye` never match when typed as-is. `DedicationSimple.same`
  (java:67-71) strips `[^\p{L}0-9]+` and compares case-insensitively, so padding the line
  with punctuation reaches them. Padding with `.` does NOT work: `arkban.....` is claimed
  earlier by the description engine as a `..` link (jar draws two entities). `!` works:
  `arkban !!!!!!!!!!!!!!!!!!!` renders the dedication image.
- **Impact**: T1h's port of `Dedications.get` must keep the length gate; authored fixtures for
  the short sentences need `!` padding (see `dedicationInputLine` in the generator).
- **Confidence**: High (jar renders, both paddings).

## Observation: the jar writes a whitespace-only text line as `&#160;`
- **Context**: checking the vendored stdlib catalog against the jar `stdlib` render.
- **Finding**: the `" "` separator lines `Stdlib.addInfoVersion` adds (java:328) appear in the
  SVG as `<text>&#160;</text>` (U+00A0), not a space.
- **Impact**: any test that string-compares jar text lines must normalise U+00A0 or drop
  blank lines.
- **Confidence**: High (byte dump of the govuca-53-mili511 oracle).

## Observation: `BackgroundColor` IS a skinparameter key
- **Context**: writing the SKINPARAMETER_NAMES test.
- **Finding**: the literal is commented out (`SkinParam.java:570`) but the ColorParam loop
  (java:631-634) re-adds it from `ColorParam.background`. 478 keys total; the jar render and a
  direct `SkinParam.getPossibleValues()` call against the oracle jar agree line for line.
- **Impact**: none beyond the test; do not "fix" the list.
- **Confidence**: High.

## Observation: a `.mts` file under `scripts/` breaks `npm run lint` and is never type-checked
- **Context**: the brief named the generator `scripts/generate-utility-data.mts`.
- **Finding**: `tseslint.configs.recommendedTypeChecked` matches `**/*.mts`, but typed
  `parserOptions` are only configured for `scripts/**/*.ts` (eslint.config.ts), so ESLint throws
  "rule requires type information" on the file; `tsconfig.node.json` includes only
  `scripts/**/*.ts`. No other `.mts` exists under `scripts/` (the `.mts` precedent is
  `plans/*/tools`, which neither lint nor typecheck reads).
- **Impact**: generator landed as `scripts/generate-utility-data.ts` (brief correction). Any later
  brief naming a `scripts/*.mts` file hits the same wall.
- **Confidence**: High (eslint error reproduced on the `.mts` path).

## Observation: lizard misparses nested template literals with escaped backticks
- **Context**: complexity check of the generator.
- **Finding**: a template literal containing `${f(`... \`x\` ...`)}` made lizard run one
  function on through the next two (reported 46 NLOC for a 10-line function). Hoisting the inner
  template out removed the false positive.
- **Impact**: the PostToolUse hook would block a later Edit on a false NLOC; keep nested
  templates with escaped backticks out of hook-checked files.
- **Confidence**: High.

## Observation: dedication PNGs total 5.5 MB; nothing ships them yet
- **Context**: D4 / stop 12 sizing.
- **Finding**: jar-embedded PNG bytes: charlie 12.6 KB; the 10 dedications 5,588,738 B
  (boundaries 1.68 MB, friends 1.10 MB, ben 860 KB). Charlie is inline in the core module; the
  dedications are files under `assets/dedication/<resource>.png` keyed `dedication:<resource>.png`.
  No `packages/*` copies them and no core reader exists (the emoji pattern has both:
  `packages/emoji/` + `src/core/internal-emoji-store.ts`).
- **Impact**: T1h (or a packaging follow-on) owns getting the bytes to an `AssetStore`;
  conformance only compares `<image>` width/height (href bytes exempt), which the core module
  already carries.
- **Confidence**: High.

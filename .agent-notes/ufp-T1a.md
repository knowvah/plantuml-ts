# ufp-T1a — PSystemOpenIconic + PSystemListOpenIconic

## Observation: svg-format `javaFixedN` drops leading fraction zeros when it rounds up
- **Context**: first draft of `PSystemOpenIconic` turned `buildOpenIconicPathD(name, 1, 0, 0)` back into a `UPath`. The jar draws `euro` with `L5.01,11`; the draft drew `L5.1,11`.
- **Finding**: `src/core/svg-format.ts:65` does `(BigInt(digits) + 1n).toString()`. That drops the leading zeros of `intPart + keep` (`"0" + "009"`). Lines 69-70 then `slice(-decimals)` fewer than `decimals` digits, so the fraction shifts left. Measured: `fmt(0.009999999999999953)` = `0.1` (jar `0.01`), `fmt(0.0049)` = `0.5`, `fmt(-0.0049)` = `-0.5`. `fmt(1.0049)` = `1.005` is correct. Only |x| < 0.01 values that round up are affected; `formatDecimal`, `fmt` and the two `trimZeros(javaFixedN(...))` callers (svg-format.ts:190, :200) all share the defect.
- **Impact**: any emitted SVG number in (0, 0.01) that rounds up prints 10x-100x too large. `buildOpenIconicPathD` (origin 0) hits it for `euro`. `PSystemOpenIconic` avoids it: it builds its `UPath` through the klimt `SvgPath` port and never formats the intermediate value. The fix (pad `digits` back to its pre-increment length) is outside T1a's write-set.
- **Confidence**: High (measured)

## Observation: the openiconic listing's donors import trips the layering fitness test
- **Context**: `PSystemListOpenIconic` imports `getCols` from `src/diagrams/donors/PSystemDonors.ts`, where the batch-0 contract (D3) put it. Upstream does the same: `PSystemListOpenIconic.java:47` imports `donors.PSystemDonors`, and java:74 calls it.
- **Finding**: `tests/architecture/layering.test.ts`'s rule 2 (diagrams/X → diagrams/Y) flags `src/diagrams/openiconic/PSystemListOpenIconic.ts → src/diagrams/donors/PSystemDonors.ts`. It is not in the ALLOWLIST.
- **Impact**: the test needs an ALLOWLIST entry from the orchestrator (outside T1a's write-set). T1d's archimate listing (`src/core/klimt/sprite/`) will trip rule 1 (core → diagrams) on the same import.
- **Confidence**: High (measured)

## Observation: an unknown `openiconic <name>` is a jar crash page, not a syntax error
- **Context**: jar probes `openiconic foo`, `openiconic  lightbulb` and `openiconic lightbulb `.
- **Finding**: the factory accepts all three. The name after the first raw space (` lightbulb`, `lightbulb `) has no resource, so `OpenIconic.retrieve` returns null. `icon.asTextBlock` then throws an NPE, which the jar draws as its "Fatal crash error" page. ` openiconic lightbulb`, `openiconic\tlightbulb` and bare `openiconic` are `Syntax Error?` pages instead.
- **Impact**: the port's constructor throws, and `renderSync` turns that into its error page. Both sides error, which is conformant under the error-page rule.
- **Confidence**: High (jar probes)

## Observation: the port's sequence and class plugins do not claim either line
- **Context**: registry tests with `sequencePlugin` and `classPlugin` registered before the openiconic plugins (PSystemBuilder.java:144-152 order).
- **Finding**: neither plugin claims `openiconic lightbulb` or `listopeniconic`; the openiconic plugins own both corpus rows. Not checked against the other `@startuml` engines (description, activity, ...).
- **Impact**: T2a must still run the full registry when it registers them.
- **Confidence**: High (measured for those two plugins only)

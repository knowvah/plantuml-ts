# ufp-T1f — version/ (license, about/authors, stdlib)

## Observation: PLANTUML_DETERMINISTIC_TEXT does not make the `version` page deterministic
- **Context**: the brief asked to mirror what `-DPLANTUML_DETERMINISTIC_TEXT=true` makes the oracle print on the `version` page.
- **Finding**: the flag only swaps the string bounder (`FileFormat.java:185-192`). `PSystemVersion.createShowVersion` (java:172-202) prints the real `dot` status (`GraphvizUtils.addDotStatus`: `dot - graphviz version 16.1.0 (20260904.0139)`, `Installation seems OK...`), JVM properties (`OptionPrint.interestingProperties`: Java Runtime, JVM, Default Encoding, Language, Country) and `PLANTUML_LIMIT_SIZE: 4096` (an env var). These are the oracle host's values.
- **Impact**: `version` is a stop-14 (host-only) page; the port does not accept the line. Any jar probe of `version` changes with the host's graphviz/JDK.
- **Confidence**: High

## Observation: the jar license page is 518 x 842, not 834
- **Context**: probing `@startuml\nlicense\n@enduml` through `scripts/oracle-render.sh`.
- **Finding**: the root is 518 x 842. The last text baseline is 833.333, so 842 is consistent with the 5px margin and the `+1` truncation. The qrcode line puts 111px between the baselines on either side of it (182.333 -> 293.333). That is 99px more than one 12px text row. The three images are 99x99 at y=185, x=31.4/183.2/335. The T0c note's 834 figure is wrong.
- **Impact**: once the `<qrcode:>` atom is ported, expect 518 x 842 and three 99x99 images.
- **Confidence**: High (measured)

## Observation: without the qrcode atom, the license line renders as creole text
- **Context**: rendering `license` through the port.
- **Finding**: line 16 is drawn as 5 text runs (`<qrcode:https:` plus an italic `//...` span, the creole `//` italic). The runs sit at the jar's tab stops (31.4, ...). The page is 680 x 755. Every later row is 87px higher than the jar's.
- **Impact**: `compareSvg` gives 51 diffs on the license probe, all from this one line.
- **Confidence**: High

## Observation: core/version.ts VERSION lags package.json
- **Context**: printing this port's version on `about`.
- **Finding**: `src/core/version.ts` VERSION is `'0.1.0'` ("kept in step with package.json#version"), but package.json is `0.2.0`.
- **Impact**: `about` and the error banner print 0.1.0. Fixing it is outside T1f's write-set.
- **Confidence**: High

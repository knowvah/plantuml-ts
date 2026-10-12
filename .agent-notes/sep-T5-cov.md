# sep-T5-cov: authored salt fixtures

## Observation: the jar's three-popup menu order varies on every run
- **Context**: `tests/fixtures/salt/cov-menu-three-popups.puml` (`{* File | Edit | View | Help` + three popup rows), five consecutive `scripts/oracle-render.sh` runs.
- **Finding**: popup draw orders seen: File/View/Edit, View/Edit/File, File/View/Edit, Edit/View/File, Edit/File/View (the committed `.svg` is the last). `ElementMenuBar#drawU` iterates `popups.entrySet()` of a `HashMap` keyed by `ElementMenuEntry`, which hashes by identity (`salt/element/ElementMenuBar.java:54,123`). The port's insertion order (File/Edit/View) was not among the five; its sorted-element multiset equals all five jar renders exactly. Row is `jar-flake` in `authored-baseline.json`.
- **Impact**: a byte-exact gate on any multi-popup salt row is a coin toss against the jar; only an order-insensitive comparison can gate it.
- **Confidence**: High

## Observation: jar crash-page oracles are not reproducible
- **Context**: re-rendering the 13 T4a probes to check oracle staleness.
- **Finding**: 11 re-render byte-identical; `mode-line-is-data` and `no-factory-ready` (both `PSystemSalt.java:215` IAE crash pages) differ only in the crash page's random quote text and so the canvas width (653 vs 673, 723 vs 664). The committed oracle is fixed, so the weighted score against it is stable.
- **Impact**: never re-capture a crash-page oracle and read a score change as a port change; the quote alone moves `svg/@width` and the text.
- **Confidence**: High

## Observation: `@startuml` + `salt` is checkBasicError's hint page, unported in core
- **Context**: `cov-startuml-salt-keyword.puml`.
- **Finding**: the jar renders "This looks like a salt diagram. Please use @startsalt instead of @startuml. (Assumed diagram type: sequence)" from `PSystemErrorUtils#checkBasicError` (`error/PSystemErrorUtils.java:81-87`, called at `PSystemBuilder.java:252`, keyed off the SECOND source line); the port renders "Syntax Error? (Assumed diagram type: class)" at line 2. `src/core/error/PSystemErrorUtils.ts:12-17` records checkBasicError as an unported gap (dot/ditaa/salt/nwdiag hints).
- **Impact**: both error, so conformant under the 2026-10-10 rule; the message text is a core gap, not salt.
- **Confidence**: High

## Observation: local `!include` needs a store layer the shared fixture store lacks
- **Context**: `cov-include-procedure.puml` includes the sibling `cov-include-fragment.iuml`.
- **Finding**: `tests/helpers/fixture-include-store.ts` resolves only `<bundle/thing>` (its base store is empty); the jar resolves a relative include from the `.puml`'s directory. `render-fixture-salt.ts#authoredSaltIncludeStore` reads relative targets from the authored root and falls through to `fixtureIncludeStore()` for everything else. The include target uses `.iuml` so the "rows = `.puml` on disk" invariant does not count it.
- **Confidence**: High

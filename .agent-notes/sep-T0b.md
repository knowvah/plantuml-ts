# sep-T0b: salt oracle harness

## Observation: stock-error-pages.json nests rows under `.errors`
- **Context**: classifying the 3 error-text salt oracles (T0a §5) and seeding the salt diff-baseline.
- **Finding**: `oracle/goldens/stock-error-pages.json` is `{ upstreamSha, plantumlVersion, errors: { "<type>/<slug>": { line, message } } }`; the rows are NOT top-level keys. `salt/lakari-33-mone874` is present with `line: null, message: ""` (a crash page, not a syntax error).
- **Impact**: a membership check must look in `.errors`; a top-level lookup silently says "not a stock error".
- **Confidence**: High

## Observation: the cdd tools vitest config cannot collect tests outside `tools/`
- **Context**: running `plans/salt-engine-port/measurements/pin-salt.test.mts`.
- **Finding**: `plans/class-divergence-drive/tools/vitest.config.mts` pins `root` to its own directory, so a test path outside it collects 0 files (and exits 0). The root `vitest.config` does not collect `*.test.mts` either. `pin-salt.test.mts` therefore has its own `plans/salt-engine-port/measurements/vitest.config.mts`; run it with `npx vitest run --config plans/salt-engine-port/measurements/vitest.config.mts`.
- **Impact**: a mission that colocates `.mts` tests under `measurements/` needs its own config; "passed" from the wrong config means nothing ran (memory: a vitest filter can collect nothing).
- **Confidence**: High

## Observation: lakari-33-mone874's jar crash mechanism
- **Context**: the one jar-error row in the salt tree.
- **Finding**: `{* A | B / C | * }` — `ElementFactoryMenu.java:74` calls `result.addSubEntry(subentry, s)`; `ElementMenuBar#addSubEntry` (`:68`) → `getElementMenuEntry` (`:87`) throws `IllegalArgumentException` when no entry text matches. Line numbers match the jar's stack trace in the cached `in.svg`.
- **Impact**: D5 covers only `PSystemSalt#createElement`'s IAE; this crash is a second IAE site inside the menu-bar factory that T3c/T4a must mirror as a thrown refusal for the row to be conformant under the 2026-10-10 error-page rule.
- **Confidence**: High

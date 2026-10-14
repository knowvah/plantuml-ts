# Batch 3: residual drive (written at the batch-2 close) + authored fixtures

T3a–T3d were written at the b1 close from families known by then (journal row 34; D14/D15 pre-approve their core work); further families found at the b2 close get specs then. The orchestrator writes one task spec per residual family at the batch-2 close
(`../close-procedure.md` "Batch-2 extras"), with disjoint write-sets. A family whose mechanism
lives in `src/core/` is a stop-10 report that waits for maintainer approval before it runs.
T3-cov runs in the last wave, after every residual fix has merged.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T3a](T3a-sprite-image.md) | F1: SpriteImage — internal PNG sprites drawn (xucoma-93) | typescript-pro (opus) | see spec | — (D15) | [x] |
| [T3b](T3b-qrcode-license-mit.md) | F2: `<qrcode:>` under MIT + License MIT branches (license page) | typescript-pro (opus) | see spec | — (D13, D15) | [x] |
| [T3c](T3c-automagic.md) | F3: HColorAutomagic + `automatic` branch (`colors automatic`) | typescript-pro (sonnet) | see spec | — (D15) | [x] |
| [T3d](T3d-version-page.md) | F4: `version` page with the port's own values + DIVERGENCES entry | typescript-pro (opus) | see spec | — (D14) | [x] |
| [T3-cov](T3-cov-authored-fixtures.md) | authored fixtures + jar oracles for every factory without a corpus row; harness walks `tests/fixtures/utility/` | typescript-pro (opus) | `tests/fixtures/utility/**`, `oracle/goldens/svg-utility/authored-baseline.json`, the utility harness files, utility package dirs (mechanism fixes, except files a parallel task owns) | T2a + the residual tasks | [ ] |

Target: D11.

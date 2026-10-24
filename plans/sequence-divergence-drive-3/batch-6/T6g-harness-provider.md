# T6g — harness provider for fifasu-62-pipo979

Agent: `typescript-pro` (sonnet), worktree `sdd3-T6g`. Commit:
`test(sequence): serve fifasu remote svg bytes from the golden`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism
The jar fetched `http://beta.plantuml.net/foo1.svg` (`in.puml:4`) over the
network and embedded the SVG text as `data:image/svg+xml;base64,…`
(`AtomImg.java:223-233` -> `AtomImgSvg`; `decodeSvgDataImage` is the existing
port of the embed). The sync conformance harness must not touch the network,
so it serves those exact bytes through the asset-store seam under T6b's key
`remote-image:http://beta.plantuml.net/foo1.svg`. The bytes are recovered
from the golden `test-results/dot-cache/sequence/fifasu-62-pipo979/in.svg`
(one `data:image/svg+xml;base64,` occurrence): decode it once and commit the
SVG as a fixture asset — the cache dir is gitignored and must not be a
runtime dependency. Do NOT fetch and do NOT assert that the embedded text equals a live
fetch: T5b measured the golden payload at 2753 B against a 2995 B live
fetch (the jar re-serialised the SVG, `diagnosis/leftovers.md` M4, journal
row 72). The only equality to assert is re-encoding the committed asset back
to the golden string.

## Targets
fifasu-62-pipo979 (ws 57, 44 sites): the remote image draws as in the jar.

## Write-set
`tests/oracle/svg-conformance/fixtures/remote-images/foo1.svg` (new, decoded
from the golden), `tests/oracle/svg-conformance/remote-image-fixtures.ts`
(new: `remoteImageFixtureStore(): AssetStore`, keyed via T6b's
`remoteImageKey`), `tests/oracle/svg-conformance/render-fixture-sequence.ts`
(`sequenceFixtureOptions` combines it into `assetStore`; coordinate with T6f's
edit to the same function — T6f merges first, rebase on it), a unit test
`tests/unit/remote-image-fixtures.test.ts`.

## Read-set
`test-results/dot-cache/sequence/fifasu-62-pipo979/{in.puml,in.svg}`;
`remote-image-store.ts` (T6b); `render-fixture-sequence.ts:90-100`;
`render-fixture-utility.ts:75` (`surveyAssetStore`, shared with other engines
— do NOT edit it).

## Interface contracts
Store `get('remote-image:http://beta.plantuml.net/foo1.svg')` ->
`{ bytes, mimeType: 'image/svg+xml' }`; every other key `undefined`.

## Acceptance
- Given the fixture store, then the base64 of its bytes equals the golden's
  data-URI payload exactly.
- Given `diff-one fifasu-62-pipo979`, then ws is 0 or every remaining diff has
  a named mechanism and owner (report, do not fit).
- Given the 1042 pins, then all stay byte-equal; the harness change moves no
  other sequence row; no conformant loss in any engine.

## Observability
N/A.

## Rollback
Reversible.

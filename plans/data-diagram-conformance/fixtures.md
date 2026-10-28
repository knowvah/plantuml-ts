# ddc family + fixture ledger

Seeded at planning (2026-10-28) from `parity-{json,yaml,hcl,unknown}.json`
(surveys of 2026-10-22/24) and the planning probe over the 17 diverged
json/yaml rows. Each close adds a counts row and updates the family table.

## Counts per checkpoint

| checkpoint | json c/s/d | yaml c/s/d | hcl c/s/d | files c/s/d (corpus) | pins json/yaml/hcl/files | manifest clean + ceilings | authored (jar-equal or clean / total) |
|---|---|---|---|---|---|---|---|
| origin/main `10aa35c6b` | 13/24/13 | 7/28/4 | 1/2/0 | 0/0/1 (+8 in `unknown`) | 10/6/1/0 | 89 + 3 | 1 files row (diverged) |
| b0 close (`feat/data-diagram-conformance`, 2026-10-28) | 13/24/13 | 7/28/4 | 1/2/0 | 0/0/9 (bucket captured, T0c; 8 still in `unknown`) | 10/6/1/0 | 89 + 3 | 1 files row (diverged, now in `dot-cache/files` + `parity-files.json`) |
| b1 close (2026-10-28) | 13/36/1 (timafu ceiling) | 7/31/1 (bafemu, geometry: spline piece count) | 1/2/0 | 9/0/0 | 13/7/1/9 | 145 + 3 | json-family 56 clean / 65 (9 open → T2d); files 17 at 0 / 18 (`empty-diagram` 5, core → batch 2) |
| b2 close (2026-10-28) | 14/35/1 (timafu ceiling) | 7/31/1 (bafemu) | 1/2/0 | 9/0/0 | 14/7/1/9 | 150 + 3 | json-family 61 clean / 65 (4 open: json style engine); files 18 at 0 / 18 |

## Families

| family (firstDiff) | rows | mechanism | owner | state |
|---|---:|---|---|---|
| json/yaml `svg/g/path/@d` only (edge emission order) | json bogiku-88, civofu-04, devime-19, gejena-99, gibego-39, kidoki-70, mudumo-73, nofuvo-36, nopoku-31, tivuru-65, zasitu-09, zevaka-35; yaml bafemu-96, jozapu-14, poxedu-72, xubife-72 | CONFIRMED + FIXED c841f2a9e (T1a, `diagnosis/edge-order.md`): `buildJsonDotEdges` built edges in `walkTree` pre-order; now the `manageOneNode` recursion (`SmetanaForJson.java:139-141`). 15/16 rows `structural-match`; bafemu keeps 1 survey diff — same edge, jar spline 3 cubic pieces vs dot-engine 2 (geometry residue, journal row 20) | T1a | closed (bafemu = geometry residue, needs a user-signed ceiling to leave `diverged`) |
| json timafu-94 `scale max` rounding (`stroke-width`, `font-size`, `textLength`) | timafu-94 | ADR-2b ceiling (a5 M7): the scale factor is computed from the Smetana envelope (193.087 vs 192.85) | — | accepted ceiling, stays |
| yaml najoba-05 / tadari-70 width 183 → 184 | 2 | ADR-2b ceiling: Smetana integer node sizing | — | accepted ceiling, stays |
| files `svg/@background` / `text/@dominant-baseline` (whole engine) | dobido-76, xeseve-00, tezofo-39, tadabe-21, kibilo-60, zixuta-02, nixaro-94, nojeru-23, authored `files-directory-tree-with-note` | PORTED 18ccd35cd (T1b): `FilesDiagram`/`FilesListing`/`FEntry` over klimt, `files-skin-param.ts` added, chrome not drawn (`FilesDiagram.java:80-86`). 9/9 corpus rows byte-exact and pinned (`svg-files/ratchet.json`), 17/18 authored at 0; harness given the Twemoji store (journal row 22) | T1b | closed; T2c scope = `empty-diagram` only if its fix is files-side (it is core: `isBlockEmpty`) |
| conformant but unpinned | json 3, yaml 1 | pinned at the b1 close: json bitepo-72, dapinu-10, nujuke-14; yaml bedega-54 | close 1 | closed |
| S2b title chrome offset — CLOSED 6c96702de (T2a): babico-87 pinned byte-exact, tadari-70 25 → 24 (ceiling only) | corpus babico-87, tadari-70 (+5 unwind-U1 title fixtures, 10 raw diffs each, 0 structural) | PORT-CONTROLLED (T1c, `diagnosis/title-chrome.md`): `renderer.ts:457-462` bakes the document margin into the canvas before chrome, no `preChromeWidth/Height`/`documentMargin` declared; jar adds chrome to the bare block then translates (`TextBlockExporter.java:173,199-203`). yaml same; hcl n/a. Separate: `scale`×`title` needs core (next-missions) | T1c ✓ → T2a ✓ | closed; `scale`×`title` → next-missions |
| S2b highlight through duplicated keys | 5 scratch constructs (one missing highlight `<rect>` each; yaml/hcl unaffected) | PORT-CONTROLLED (T1d, `diagnosis/highlight-dup-keys.md`): `json-layout-prep.ts:126-131` one-to-one `Map` keyed `parentId/key`, jar passes `upOneLevel(key)` to every member (`SmetanaForJson.java:136-142`, `Highlighted.java:92`); plus `** / a / b` and first-vs-last `#highlight` class in the same function | T1d ✓ → T2b ✓ (694d31efa: `Highlighted`/`isHighlighted` ported, all 3 divergences) | closed |
| lengthadjust files rows (`files-default/glyphs/none/onechar`) emit no `textLength` | 4 (`oracle/goldens/svg-lengthadjust/authored-baseline.json:212-245`) | T1b hand-back: all 4 at 0 raw diffs with the Twemoji store; baseline rows still carry the old counts | T2e ✓ (0edcf1796: all 4 → 0) | closed |

## Authored fixtures

Filled by T1e (json/yaml/hcl) and T1f (files): one row per `.puml` with its
construct, the Java it exercises, and its state at each close.

| slug | type | construct | state |
|---|---|---|---|

### b1 close — json/yaml/hcl authored rows not clean (T2d queue, structural diffs) — b2 state

| slug | diffs b1 → b2 | firstDiff / mechanism |
|---|---|---|
| json/number-forms | 3 → 0 | `JsonParser.ts`/`JsonNumber.ts` ported (T2d): the literal text is kept (`JsonNumber.java:32-44`) |
| json/scalar-negative-float | 4 → 0 | same |
| json/scalar-string-escapes | 4 → 0 | cell lines through the shared `splitDisplayLines` (`Display.java:310-312`) |
| json/malformed-trailing-comma | 4 → 0 | the ported parser rejects `{ "a": 1, }` (`JsonParser.java:234-236`) |
| hcl/scale-factor | 1 → 0 | failure-page font scaled (`JsonDiagram.java:90-99`) |
| json/highlight-stereotype | 2 → 2 | OPEN: json styling is a hand-keyed `StyleMap` projection (`src/core/style-map-json-diagram.ts`), not the Style engine; `jsondiagram..warn` unread (journal row 33) |
| json/style-highlight-block | 7 → 7 | OPEN: `jsondiagram.highlight` unread (same mechanism) |
| json/style-header-separator-arrow | 13 → 13 | OPEN: `jsondiagram.header`/`.separator` unread, no header-FontColor field (same mechanism) |
| json/theme-cerulean | 29 → 29 | OPEN: theme `root {…}`/`node { roundcorner; gradient }` never reach json (same mechanism) |

The four OPEN rows are one mission: move the json family onto the real `Style`/`StyleSignatureBasic` engine (as files/mindmap/wbs/salt are) — `planning/next-missions.md`, user decision.

### b1 close — files authored rows (18, `oracle/goldens/svg-files/authored-baseline.json`)

b1: 17 at `diffCount 0`, `empty-diagram` 5. b2: 18 at 0 — T2g (394af9e09) applies the empty-source test only in the factory bases that have it (`PSystemCommandFactory.java:117-122` vs `PSystemAbstractFactory.java:50-79`).

## Authored fixtures (per T1e / T1f hand-backs)

json (32), yaml (15), hcl (18), files (18): one construct per slug, slug = construct, oracles via `scripts/oracle-render.sh`. The per-slug Java mapping is in the T1e/T1f hand-backs (journal rows 16, 18) and in each fixture's `.puml`; the state per slug is the structural manifest `clean` list (json family) and `authored-baseline.json` (files).

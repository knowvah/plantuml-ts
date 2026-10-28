# ddc family + fixture ledger

Seeded at planning (2026-10-28) from `parity-{json,yaml,hcl,unknown}.json`
(surveys of 2026-10-22/24) and the planning probe over the 17 diverged
json/yaml rows. Each close adds a counts row and updates the family table.

## Counts per checkpoint

| checkpoint | json c/s/d | yaml c/s/d | hcl c/s/d | files c/s/d (corpus) | pins json/yaml/hcl/files | manifest clean + ceilings | authored (jar-equal or clean / total) |
|---|---|---|---|---|---|---|---|
| origin/main `10aa35c6b` | 13/24/13 | 7/28/4 | 1/2/0 | 0/0/1 (+8 in `unknown`) | 10/6/1/0 | 89 + 3 | 1 files row (diverged) |
| b0 close (`feat/data-diagram-conformance`, 2026-10-28) | 13/24/13 | 7/28/4 | 1/2/0 | 0/0/9 (bucket captured, T0c; 8 still in `unknown`) | 10/6/1/0 | 89 + 3 | 1 files row (diverged, now in `dot-cache/files` + `parity-files.json`) |

## Families

| family (firstDiff) | rows | mechanism | owner | state |
|---|---:|---|---|---|
| json/yaml `svg/g/path/@d` only (edge emission order) | json bogiku-88, civofu-04, devime-19, gejena-99, gibego-39, kidoki-70, mudumo-73, nofuvo-36, nopoku-31, tivuru-65, zasitu-09, zevaka-35; yaml bafemu-96, jozapu-14, poxedu-72, xubife-72 | HYPOTHESIS (probe 2026-10-28): ours `path[k]` ≈ jar `path[k-2]`; we emit edges in `walkTree` pre-order (`json-layout-prep.ts:73`, `layout.ts:319,436`), the jar in `manageOneNode` post-order (`SmetanaForJson.java:139-141`) | T1a | open |
| json timafu-94 `scale max` rounding (`stroke-width`, `font-size`, `textLength`) | timafu-94 | ADR-2b ceiling (a5 M7): the scale factor is computed from the Smetana envelope (193.087 vs 192.85) | — | accepted ceiling, stays |
| yaml najoba-05 / tadari-70 width 183 → 184 | 2 | ADR-2b ceiling: Smetana integer node sizing | — | accepted ceiling, stays |
| files `svg/@background` / `text/@dominant-baseline` (whole engine) | dobido-76, xeseve-00, tezofo-39, tadabe-21, kibilo-60, zixuta-02, nixaro-94, nojeru-23, authored `files-directory-tree-with-note` | `src/diagrams/files/` is not a port: text-glyph emoji, `ROW_HEIGHT 22`, own note box, `dominant-baseline: hanging`, no `textLength`; jar = `FEntry`/`FilesListing` through creole (D3). b0 survey (615c04af2): 9/9 `diverged`, firstDiff `text/@dominant-baseline` ×8, `svg/@background` ×1 (nixaro-94) | T0c ✓ → T1b → T2c | open (bucket captured) |
| conformant but unpinned | json 3, yaml 1 | none — pin at the batch-1 close | close 1 | open |
| S2b title chrome offset | TBD by T1c | unknown — diagnosis first (D6) | T1c → T2a | open |
| S2b highlight through duplicated keys | TBD by T1d | unknown — diagnosis first (D6) | T1d → T2b | open |
| lengthadjust files rows (`files-default/glyphs/none/onechar`) emit no `textLength` | 4 (`oracle/goldens/svg-lengthadjust/authored-baseline.json:212-245`) | same mechanism as the files family; re-pinned after T1b | T2e | open |

## Authored fixtures

Filled by T1e (json/yaml/hcl) and T1f (files): one row per `.puml` with its
construct, the Java it exercises, and its state at each close.

| slug | type | construct | state |
|---|---|---|---|

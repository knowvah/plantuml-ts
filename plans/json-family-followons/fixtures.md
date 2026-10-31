# Fixtures

## Authored rows T0b creates (`tests/fixtures/<type>/<slug>.{puml,svg}`)

| # | slug | type | source shape | planning probe vs jar (2026-10-30) | why |
|---|---|---|---|---|---|
| 1 | `title-scale` | json | `title …` + `scale 1.5` | 54 diffs; canvas 185×122 vs 277×139; title font 14 vs 21 | the defect (D1) |
| 2 | `title-scale` | yaml | `title T` + `scale 2` | 11 diffs, all title/offset; height 115 vs 150 | the defect, body otherwise exact |
| 3 | `title-scale` | hcl | `title …` + `scale 1.5` | conformant | the third parser; the jar draws no hcl title (`HclDiagramFactory.java:88-90`, journal row 7) |
| 4 | `title-scale-max-width` | json | `title …` + `scale max 200 width` | not probed | factor read over the CHROMED width (`ScaleMaxWidth`) |
| 5 | `caption-scale` | json | `caption …` + `scale 2` | conformant (error page) | premise false: `StyleExtractor` keeps no caption, the jar draws its "not JSON" error page, scaled (journal row 6) |
| 6 | `title-handwritten` | json | `title …` + `skinparam handwritten true` | sub-px jiggle only (Smetana) | handwritten not double-wrapped by `exportTo` |
| 7 | `title-narrow` | json | `title T`, wide body | sub-px only (U-REC 0.275) | title narrower than body |
| 8 | `style-root-fontcolor` | yaml | `<style> root { FontColor red }` | sub-px only (U-REC 0.338) | json has `root-fontcolor`; yaml did not |

Probe sources and jar renders: the planning session's scratchpad
(`jff-probe/`); T0b re-authors them in-tree and re-renders through
`scripts/oracle-render.sh`. Slugs are proposals — T0b may rename to match
`tests/fixtures/<type>/` naming, journaling the final list.

## Regression rows (no title, scale set — must not rise)

json/timafu-94-bixe774 (`scale max 100*100`, manifest ceiling 37),
yaml/nuzaje-74-kenu009 (`scale 2`), `tests/fixtures/json/scale-factor`,
`tests/fixtures/json/scale-max-width`, `tests/fixtures/yaml/scale-factor`;
handwritten: `tests/fixtures/{json/handwritten-nested,yaml/handwritten,hcl/handwritten}`;
titled without scale: `tests/fixtures/json/title-caption-both`, `tests/fixtures/hcl/title-header`,
yaml/tadari-70-nare798.

## Counts per checkpoint

| checkpoint | json c/n | yaml c/n | hcl c/n | pins | manifest | positional rows | positional Σ node / path / canvas |
|---|---|---|---|---|---|---|---|
| main `b9b309894` | 14/36 | 7/32 | 1/2 | 14/7/1 | 167 + 3 | 70 | 457.355 / 546.207 / 85 (66 aligned) |
| b0close | 14/36 | 7/32 | 1/2 | 14/7/1 | 172 + 6 (5 authored clean, 3 D1 ceilings 2/2/1) | 70 corpus + 8 authored | 457.918 / 550.847 / 85 (71 aligned; authored adds 0.563 / 4.640 / 0) |
| b1 | 14/36 | 7/32 | 1/2 | 14/7/1 | 172 + 6 | 70 corpus + 8 authored | 457.918 / 550.847 / 85 (unchanged; 0 movers in 28 engines) |
| b2 | 14/36 | 7/32 | 1/2 | 14/7/1 | 175 + 3 (D1 ceilings retired) | 70 corpus + 8 authored | 458.847 / 554.708 / 85 (74 aligned; corpus rows unchanged; the Σ rises only because 3 authored rows went aligned:false → aligned and now carry body residue 0.254/1.861, 0.675/2.0, 0/0) |

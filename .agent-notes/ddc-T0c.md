## Observation: tests/visual/data manifests are not pure classifier output
- **Context**: ddc T0c added `startfiles: 'files'` to `scripts/classify-corpus.ts` and re-ran `npx jiti scripts/classify-corpus.ts` to produce `tests/visual/data/files.json`.
- **Finding**: the run rewrote 11 manifests, not 1. `dot.json` went 62 → 2 (60 hand-authored visual fixtures such as `lr-sm-nolabel` are committed in the manifest but do not exist in ~/git/pdiff); activity 771→777, class 768→783, component 384→387, gantt 265→274, sequence 1271→1273, state 278→287, usecase 351→353, wbs 204→205 reflect pdiff growth since the manifests were last regenerated; unknown 825→817 = the 8 files slugs moving out.
- **Impact**: never commit a blanket classifier run. Keep only the manifest the task owns and `git checkout` the rest (ddc journal row 7). A manifest refresh for the other types is its own task and must preserve the hand-authored rows.
- **Confidence**: High

## Observation: the files engine already agrees on routing
- **Context**: `scripts/pin-corpus-tree.ts files` dry run over the 9 `dot-cache/files` rows.
- **Finding**: all 9 measure `routing=agree refusal=ok`; the authored row's committed `known-misroute` pin (ourType NONE, 2026-09-20) was stale since lad batch 2 (62575c888) stamped `data-diagram-type="FILES"`. `pin-corpus-tree.ts` is append-only and cannot repair a stale row; `repin-files-routing.mts` (in-place) does.
- **Impact**: pin a NEW tree from a scratch copy that excludes already-pinned slugs, or the tool appends duplicates.
- **Confidence**: High

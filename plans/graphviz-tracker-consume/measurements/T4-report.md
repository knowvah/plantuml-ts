# T4 report

Commit: see `git log -1` on fix/graphviz-tracker-consume (unsigned). Files: layout-geo-post.ts, parse-state.ts,
parser.ts, renderer-draw-sequence.ts (comment), tests/unit/description/{gtc-t4-note-on-cluster.test.ts (new),
parser.test.ts, description-svek-wrappers.test.ts, fixtures/dur-t2-no-url.svg}. Write-set extended by coordinator ruling.

## Premise correction
The jar's repoge order is cluster ent0001, ent0002..0006, ent0008, link lnk9 (== ours). The brief's "ent0002 first" was
a positional-diff artifact. Real differences: (1) ent0008 opalised, (2) lnk9 missing, (3) link id `tempSensor-__note_0`.

## Row: component/repoge-41-demu604 render-diff 37/16 -> 0/0 (pass=true). sokevu-87-toce485 (class): 0/0, unchanged.

## Diagnosis 1: note on a cluster opalised
- Mechanism: Java opalises only `if (other != null)` (GraphvizImageBuilder.java:245-259); `other = Bibliotekon#getNode`
  (Bibliotekon.java:120-122, nodeMap = leaf nodes only), so a group yields null; note -> `drawNormal`
  (EntityImageNote.java:239, 272-286), link drawn (SvekEdge.java:833; dashed per CommandFactoryNoteOnEntity.java:340).
- Origin (port): layout-geo-post.ts `applyOpaleNote` guarded only `symbol === 'note'`; geoIndex includes containers.
- Chain: consumedByOpaleNote set -> renderer skipped the edge and drew the opale polygon.
- Fix: `if (otherNode.children.length > 0) return;` with the Java citation.
- Ruled out: draw order (identical), layout (numeric 0), bezier-count check SvekEdge.java:804 (irrelevant when other==null;
  raw dot edge is 1 bezier), "link drawn as entity" (shifted note).

## Diagnosis 2: note name GMN<n>
- Mechanism: CommandFactoryNoteOnEntity.java:327 `getUniqueSequence("GMN")` draws the shared counter; quark name `GMN<n>`;
  link path id `<from>-<to>`.
- Origin (port): parse-state.ts:456 `__note_${noteCounter++}`.
- Fix: `GMN${state.uidCounter + 1}` (the value emitGeneratedNoteLeaf draws next); `noteCounter` removed from
  parse-state.ts and parser.ts.
- Interleaving verified against the jar (scripts/oracle-render.sh, /private/tmp/claude-501/gtc-T4/or/a.puml; two notes on
  different entities, notes before/after other declarations, a note on a cluster, a note after a link, a note on a leaf
  inside a cluster): quark names GMN2, GMN7, GMN12, GMN16 with leaf uids ent0003/0008/0013/0017 (n = uid-1 in every case),
  link `C-GMN12` (lnk14), link `A to B` lnk15, cluster C ent0010. Ours matches all ids; pinned in the new test.

## Tests
- New failing-first: gtc-t4-note-on-cluster.test.ts (2 tests; repoge exact note polygon, exact link path, ids ent0001-0006,
  ent0008, lnk9; interleaved ids/GMN names/`C-GMN12`).
- Updated: parser.test.ts:2587 (`GMN2`), description-svek-wrappers.test.ts:202, fixtures/dur-t2-no-url.svg (own golden:
  only `__note_0` -> `GMN3` in name, comment and link id differ, verified by diff).
- Run: `vitest run --testTimeout=60000 --maxWorkers=4 tests/unit/description tests/architecture
  tests/oracle/svg-conformance/description.*.test.ts`: 90 files collected, 90 passed, 1601 tests passed.
  typecheck, eslint, prettier clean. `npm run catalog`: no change.

## Surveys before -> after (/private/tmp/claude-501/gtc-T4/<tree>-{before,after2}.json; no timeout rows)
- component 198/11/57 -> 203/12/51; usecase 65/2/26 (+1 oracle-error) -> 65/3/25 (+1); unknown 495/16/314 -> 496/16/313.
- Losses: 0. Movers: conformant: component gurive-62-ricu497, josoxo-49-taci997, repite-70-vabe533, ziniso-08-damu446,
  repoge-41-demu604; unknown bujosa-00-toro940 (all firstDiff `path/@id` = diagnosis 2; repoge also diagnosis 1).
  structural-match (diverged -> structural-match; id mechanism fixed, residual remains):
  component tuliba-37-liza126 (rect rx/ry 12.5 vs 2.5, 4 numeric: rounded-rect corner radius on two entities);
  usecase zotiru-33-legi180 (7 numeric: path/line x offset 218.787 on g[3]). Residual mechanisms not diagnosed (out of T4).

## Residuals / follow-ups
- Orchestrator: re-pin gurive, josoxo, repite, ziniso, repoge, bujosa (D6); decision-journal.md has an uncommitted
  orchestrator edit that I left untouched.
- `onlyOneLink` (GraphvizImageBuilder.java:313) ignores invisible links; the port's `touchingLinks` counts all links
  (unchanged, not investigated).

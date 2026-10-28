# Architecture decisions (pre-made, user-approved 2026-10-28)

Each decision quotes the Java it rests on. A finding that contradicts one is
stop 3: amend here (dated), then halt.

## D1 — The bar per engine
json/yaml/hcl: the structural gate (`tests/oracle/svg-conformance/json-family-structural.test.ts`,
manifest `oracle/goldens/json-family-structural.json`) 100% clean — every
corpus and authored row `conformant` or `structural-match`; the 3 named
ADR-2b ceilings (json/timafu-94 scale-max rounding, yaml/najoba-05 and
yaml/tadari-70 integer-boundary width) stay the ONLY manifest entries — plus
every byte-conformant row pinned in `oracle/goldens/svg-{json,yaml,hcl}/ratchet.json`.
Byte-exactness is NOT the json/yaml/hcl target (CLAUDE.md "One layout engine",
ruling 2026-08-09; `plans/a5-json-family-conformance/ledger.md` ADR-2b).
files: byte-exact on all 9 corpus rows and every authored row, pinned in the
new `oracle/goldens/svg-files/`. Rejected: byte-exact everywhere (Smetana),
structural-only with no new pins (pins are what stops regressions).

## D2 — Edge order mirrors `manageOneNode`, not the renderer
`SmetanaForJson.java:128-145`: `nodes.add` before the loop (pre-order nodes);
inside the loop `manageOneNode(child)` (`:139`) returns before
`edges.add(edge)` (`:141`), so the edge list is post-order; `drawMe`
(`:172-176`) draws all nodes, then every edge in list order. Fix in
`src/diagrams/json/layout.ts` (`buildJsonDotEdges`, `:319`, consumed at
`:436`) by building `dotInput.edges` in that order and keeping
`buildJsonEdgeGeometries` in input order (verify dot-engine preserves it; if
not, map back by tail/head id). Rejected: sorting at render time
(`renderer.ts:443`) — two orders in flight. Diagnosis artifact first (stop 12).

## D3 — files is a faithful klimt port, not a patch
`FilesDiagram.java:62-86`: `styleExtractor.applyStyles(skinParam)`, font from
`root.element.filesDiagram` (`:72-78`), lines starting `/` →
`list.addRawEntry(line.substring(1))`, `<note>`…`</note>` → `addNote`.
`FilesListing.java`: dimension = max width / sum heights over root children;
`drawU` folds `ent.drawAndMove(ug, fc, skinParam, 0)`; `addNote` attaches to
`lastCreated.getParent()` or root when `lastCreated == null` (and
`FEntry.addRawEntry` returns null for a trailing-slash path, `FEntry.java:82-94`).
`FEntry.java:124-161`: emoticon `<:1f4c2:>` / `<:1f4c4:>`; text block
`Display.getWithNewlines(pragma, emoticon + name).create7(fc, LEFT, skinParam, NO_CREOLE)`;
row advance `height + 2`; child indent `deltax + 21`; note =
`Opale(shadowing, LineColor, BackGroundColor, SheetBlock1(sheet, NONE, padding), false, stroke)`
under `root.element.filesDiagram.note` (`:165-182`), sheet from
`skinParam.sheet(fc, defaultTextAlignment(LEFT), FULL).createSheet(Display.create(note))`.
Port keeps the upstream names (`FEntry`, `FilesListing`, `FilesDiagram`,
`FilesType`), draws through the existing `Display`/`SheetBlock1`/`Opale`
ports, takes the emoji store the way json's parser does
(`src/diagrams/json/parser.ts:69-72`, `internalEmojiStoreFrom`). Keeps
`files-style-input.ts` (lad D9) and the annotations/sprites parse.
Consequence: `<style> filesDiagram { … }` is JAR behaviour (the font config
is read from that style), not an extension — T2e re-measures the DIVERGENCES
Extensions files rows. The skin has no `filesDiagram` block (root defaults
apply); adding one is stop 16.

## D4 — files corpus bucket
`scripts/classify-corpus.ts` `START_KEYWORD_MAP` gains `startfiles: 'files'`;
classify; capture the 8 pdiff rows into `test-results/dot-cache/files/`; pin
routing/refusal with `scripts/pin-corpus-tree.ts files --tree … --ledger …`
BEFORE the capture commit (memory `new-corpus-tree-trips-two-gates`). The 8
rows stay in `unknown` as well (hcl's 3 already do; moving them re-pins the
unknown baseline for no gain). Harness copies the wbs/salt pattern:
`render-fixture-files.ts` (thin `renderSync` wrapper, jar-compatible style
input exactly as `scripts/svg-parity-survey.ts:307`), `files.golden.ratchet.test.ts`,
`files.authored.ratchet.test.ts`, goldens in `oracle/goldens/svg-files/`.

## D5 — Survey and comparator untouched
After D2 the 16 rows become `structural-match` on their own; no change to
`scripts/svg-parity-survey.ts` or `compare.ts`. The structural manifest stays
shrink-only; the authored root is added to the gate (T1e), never a new verdict.

## D6 — S2b items are diagnosis-gated
"json/yaml title chrome offset" and "highlight paths through duplicated keys"
(`planning/next-missions.md` S2b) each get a diagnosis task (T1c, T1d:
mechanism, origin `file:line`, causal chain, ruled out) before a fix task
(T2a, T2b). A fix touching `src/core/` triggers the all-engine chain with 0
conformant losses (stop 4) and no json-only branch in core (stop 14). A
Smetana-geometry finding closes the item with the Java quote, no code.

## D7 — Authored coverage before pinning
Fixtures are authored from upstream features the corpus does not exercise
(see `batch-1/T1e-*.md`, `T1f-*.md`), oracles via `scripts/oracle-render.sh`,
tracked by per-engine authored baselines (json family: the structural gate's
authored root; files: `oracle/goldens/svg-files/authored-baseline.json`). A
new json-family row enters the manifest `clean` list only when clean.

## D8 — Extension batch (optional, last)
Honour `skinparam defaultFontColor` (json/yaml/hcl) and
`defaultFontName`/`defaultFontSize`/`defaultFontColor`/`shadowing`/`lineColor`/
`handwritten` (files) in EXTENDED mode only, through the theme cascade
`defaultFontName` already uses, with the semantics
`FromSkinparamToStyle.java` gives the same directive in a class diagram (read
first). Jar-compatible mode stays byte-identical (the full conformance set
proves it; stop 17). `<style> filesDiagram { node … }` is dropped: `node` is
not a files style element in the jar.

## D9 — Branch and merge mechanics (gdd pattern)
`feat/data-diagram-conformance` off `10aa35c6b`; per-task unsigned commits in
worktrees `ddc/<Tn>`, `--no-ff` merges; never push; squash per batch at the
end, tag `ddc/pre-squash`; the user signs with `rebase --force-rebase -S`.
d.ts byte-equality vs `$M/b0-plantuml-ts.d.ts`, plugin seam exempt.

## D10 — `plans/` is committed (project convention)
The skill asks for `plans/` in `.gitignore`; this repo commits every brief
(gdd, lad, sdd3 …) so the journal is reviewable in the PR. `.claude/` is
ignored. No `.gitignore` edit.

## Operational readiness (Phase 4, confirmed)
Observability N/A (library, no I/O): signals are the parity files,
`docs/parity-report.md`, the manifest count and the pin counts, journaled at
every close. Rollback: Reversible (one branch; the corpus capture is
committed files). Scalability: suite time only (conformance gates budget 10
min). Backwards compatibility: none; d.ts byte-identical.

## Pre-flight (Phase 8, 2026-10-28, on main `10aa35c6b`)
`npm test -- --maxWorkers=4`: 1867 files passed, 1 skipped; 35886 tests
passed, 6 expected-fail, 8 skipped, 6 todo; coverage thresholds met; exit 0.
`npm run lint` exit 0. `npm run typecheck` exit 0. Branch
`feat/data-diagram-conformance` absent locally and on origin. Tree clean apart
from the untracked brief. Every Modify write-set file and every Create parent
directory exists. No Irreversible change (nothing to acknowledge).

# sdd3 — architecture decisions (locked 2026-10-22)

Approved by the user in planning. A finding that contradicts one is stop 3:
amend here (dated "Amendment N"), then halt.

| ID | Decision (one line) |
|---|---|
| D1 | sdd2's rules carry forward: pins, reference/loss, no fitting, worktree execution |
| D2 | SAX sprite parser: full port; `@xmldom/xmldom` becomes the one new runtime dependency |
| D3 | Remote images through an injectable `ImageProvider`; the sync render path never fetches |
| D4 | `%filename()` through an optional `RenderOptions.filename` |
| D5 | Handwritten: sequence drawing moves to klimt `UGraphic` (pure move), then the wrapper |
| D6 | LaTeX `array`: port JLaTeXMath's matrix sizing rule; no JLaTeXMath port |
| D7 | Scale/chrome: re-mirror through core `UgDiagram`/`TextBlockExporter` |
| D8 | Core SVG driver fixes (alpha fill, fore==back strokeless) with every mover explained |
| D9 | Target: all 101 rows zero and pinned (1143); 0 losses; 0 unexplained rises |
| D10 | No accepted divergences; LaTeX stays a permanent byte divergence; approved API additions listed |
| D11 | Many commits while running; one per batch at the end; the user signs |

## D1 — sdd2 rules carry forward

Unchanged from `../sequence-divergence-drive-2/decisions.md` D1, D4, D6, D7:
- **Pins.** A pin needs a zero-diff `renderFixtureSequence` render
  (`DeterministicMeasurer`, `sequenceFixtureOptions()`) against the cached
  `in.svg`. Survey at every close; survey/ratchet disagreements get a journal
  row with the mechanism (stop 12). Baselines re-pin once per close; falls
  are adopted, every rise needs its own mechanism line.
- **Reference and loss.** b0 is the reference; every close surveys every
  engine into `$M/bN-eng/` and diffs against the previous close. Every numeric
  change carries its upstream `file:line` in the same commit.
- **Execution.** `$M/mkwt.sh <Tn>` worktrees; agents run targeted vitest +
  typecheck + eslint, no Serena edit tools, no `git stash`; the orchestrator
  runs the four gates + full conformance set at `--maxWorkers=4` before every
  merge, and the golden ratchet + classify after every merge.
- **Splits.** A file past 500 lines is split as a pure move (re-exports keep
  callers unchanged), hash-identical; never `complexity-ignore` a file we own.
- **Core in scope.** Core creole, preprocessor, SVG drivers, exporter: every
  core commit is followed by the all-engine survey (stop 4).
- **Diagnose first.** A row with no confirmed mechanism gets a diagnosis task
  (artifact: mechanism, origin `file:line`, causal chain, ruled out) before
  any fix; the orchestrator spawns the fix from the artifact.

## D2 — SAX sprite parser

**Context.** `!pragma svgparser sax` selects `svg/parser/SvgSaxParser.java`
(1429 lines; two passes: `DefsCollector`, then `RenderHandler`) through
`SvgSpriteParserFactory.java`; the port drops the pragma
(`sequence/command-common.ts`) and has only the nano parser. 30 sequence rows
and 1 unknown-engine row use it. **Decision.** Port both classes into
`src/core/klimt/sprite/`, split along upstream sections (event adapter, defs
pass, shapes, text/image/use, gradients/style/transform), each file with
`@see` to its Java origin. XML events come from `@xmldom/xmldom` (MIT, pure
JS; promoted from devDependency to dependency), walked in document order to
emit `startElement`/`endElement`/`characters`; parse errors throw (SAX is
strict), DOCTYPE is refused (`SvgSaxParser.java:159-166` XXE settings). Nano
stays the default. The parser is chosen when a sprite is **defined**, from the
pragma in force at that line (`CommandSpriteSvg.java:81-82`,
`CommandSpriteSvgMultiline.java:103`; stdlib/emoji/image sprites always nano):
the port stamps it on `SpriteSvg` in `core/sprite-commands.ts`. **Consequence.**
The only new runtime dependency (stop 18).

## D3 — remote images through an injectable ImageProvider

**Context.** `AtomImg.java:165-169` fetches `<img:http(s)://…>`: an `.svg`
URL's source text is embedded as `data:image/svg+xml;base64` (`buildSvgFromUrl`
→ `AtomImgSvg`), a raster is decoded and re-encoded. The render core is
sync, DOM-free and network-free. Browser facts (MDN, verified 2026-10-22):
a cross-origin `<img>` drawn to a canvas taints it (`toDataURL`/`getImageData`
throw) and never exposes SVG source, so a hidden `<img>` cannot supply bytes;
JS cannot read a header-delivered CSP (a `<meta>` CSP is readable; the
`securitypolicyviolation` event reports blocks after the fact).
**Decision.**
- `ImageProvider` interface: `fetch(url) → Promise<{ bytes: Uint8Array;
  mimeType: string } | { blocked: string } | { failed: string }>`, passed as
  `RenderOptions.imageProvider` (approved public API addition).
- `render()` (async) pre-scans the preprocessed source for `<img:http(s)…>`,
  resolves each unique URL through the provider (gated by the ported
  `SecurityProfile`/`SURL` rules) into the asset-store seam; the sync pipeline
  reads them there. `renderSync` never fetches; without supplied bytes it
  draws the jar's own `(Cannot decode SVG: <url>)` / `(Cannot decode: <url>)`.
- Providers live in a separate entry, `src/image-providers/`, exported via a
  new `package.json` `exports` subpath:
  - **network**: global `fetch` GET, configurable timeout (default 5 s), size
    cap, no retries.
  - **browser**: `fetch()` with CORS. Before fetching, check the origin
    against the readable policy (`<meta http-equiv="Content-Security-Policy">`
    plus an optional `cspPolicy` option for a header policy): `connect-src`,
    falling back to `default-src`. A blocked origin is skipped with one
    `console.warn` naming the origin, the directive and the fix (add the
    origin to `connect-src`); a `securitypolicyviolation` listener reports
    blocks only the header knew about.
- Harness: a fixture provider/asset entry serving the bytes recovered from
  the golden (fifasu-62).
The remote `<img>` span is built in `core/creole-atoms.ts#buildImgSpan`
(`cannotDecodeText`), not in the image resolver; the asset store reaches it the
way emoji and `jar:` sprites do. **Consequence.** No DOM/network/async in the
sync path (stop 17). Without a DOM only PNG (and SVG text) decode; a remote
JPEG/GIF falls to `(Cannot decode: <url>)` where the jar decodes any ImageIO
format — no fixture exercises it; file it at exit as a known gap.

## D4 — `%filename()`

`Defines.overrideFilename` sets env `filename` (`Defines.java:89-93`); the
port passes none (`preprocessor.ts`). **Decision.** Optional
`RenderOptions.filename`, threaded into the preprocessor env; the harness
passes `in.puml`. `%dirpath()` stays environment-dependent.

## D5 — handwritten through UGraphic

**Context.** `TextBlockExporter.java:174-175` wraps the whole graphic in
`UGraphicHandwritten`, whose RNG reseeds on every `apply`
(`UGraphicHandwritten.java:54,114-116`); sequence emits SVG strings from ~14
renderer modules, so nothing reaches the wrapper. Core has `UGraphic` and
`UGraphicHandwritten` (used by json, salt, mindmap, wbs). **Decision.** First
a pure move of each renderer group to draw through klimt `UGraphic`, mirroring
the teoz/rose component `drawU` and its apply-chain topology (all 1143 rows
hash-identical, stop 7); then enable the wrapper for `handwritten true`.
Replaying emitted SVG through the wrapper is rejected (wrong RNG topology).

## D6 — LaTeX array

`src/core/latex-metrics/` sizes KaTeX's parse tree with JLaTeXMath 1.0.7's
box rules over Computer Modern metrics; `array` (from a `<math>` matrix) has
no handler (`nodes.ts:103`): 38×28 vs the jar's 150×56. **Decision.** Port the
`MatrixAtom`/`ArrayOfAtoms` sizing (decompiled from
`~/.gradle/caches/modules-2/files-2.1/org.scilab.forge/jlatexmath/1.0.7/*/
jlatexmath-1.0.7.jar`). No full port; KaTeX parsing and drawing unchanged.
The cross-engine LaTeX diagnosis is a separate next-missions item.

## D7 — scale/chrome re-mirror

The jar applies the export scale to the chromed block, the factor taken from
the chromed dimension (`TextBlockExporter.java:160-177,205-208`,
`UgDiagram.java:123-145`, `addChrome` at :128); sequence scales its body (`renderer.ts:331`,
`scale-geo.ts`) and `index.ts` adds chrome at 1x. **Decision.** Route sequence
through core `UgDiagram.ts`/`TextBlockExporter.ts` as mindmap/wbs/salt do,
after T3a's diagnosis. Other engines' output must not move.

**Amendment 1 (2026-10-22, T3a, journal row 52 — stop 3, awaiting the user).**
T3a (`diagnosis/scale-chrome.md`, merged `2e654466a`) measured that the named
route cannot carry sequence as it stands: `core/UgDiagram.ts` is the
NON-titled arm (`UgDiagram.java:138-139` sends a `TitledDiagram` through
`builder.styled`, and sequence is one, `SequenceDiagram.java:84`), and
`core/TextBlockExporter.ts:288` `finalizeTitledDiagramFragment` scales an
already-formatted body, which double-rounds `textLength` (M3:
`SvgGraphics#format` multiplies then rounds once, `SvgGraphics.java:466-475`;
12 of the 15 rows keep 1–18 `@textLength` diffs without deferred numbers).
The jar's ORDER is unchanged and is the target: chrome, backcolor, margin,
then the factor from the chromed dimension (`TextBlockExporter.java:159-177,
205-209`), drawn with numbers deferred. Two routes satisfy it; the user picks:
(i) T3a's proposal — a sequence-keyed `finalizeSequenceFragment` in
`core/assemble-svg-sequence.ts` using the activity/description precedent
(`withDeferredFormat` + `scaleActivityBody`), write-set `sequence/renderer.ts`,
`sequence/renderer-document.ts`, `core/assemble-svg-sequence.ts`,
`core/assemble-svg.ts` (2 lines) + 4 test rewrites; prototype zeroes all 15,
22 scaled pins byte-equal, 1 explained riser (gepuce, A1 below);
(ii) extend `core/TextBlockExporter.ts#finalizeTitledDiagramFragment` to
deferred-format string bodies so sequence AND activity share the one exporter
(upstream has one `TextBlockExporter`; CLAUDE.md "re-mirror rather than
patch"), write-set (i) + `core/TextBlockExporter.ts` + the activity exit
path, all-engine gated (mindmap/wbs/salt route through it and must not move).
Orchestrator's recommendation: (ii), as the structural mirror; (i) is the
measured, lower-risk fix and is what the prototype proved.

## D8 — core SVG driver fixes

`SvgGraphics#fillMe` splits `#RRGGBBAA` into fill + fill-opacity
(`SvgGraphics.java:880-887`); `DriverPathSvg` draws a fore==back path with
stroke width 0 (`:65-68`). **Decision.** Port both in the core drivers
(`svg-shapes*`, `svg-graphics-core*`, split in T0b). Every mover in every
engine is explained row by row (stop 13).

## D9 — target

All 101 rows zero and pinned (1143 pins); 0 conformant losses in any engine;
0 unexplained rises. A miss is acceptable only with a named mechanism and an
owner in `fixtures.md`.

## D10 — divergences

Nothing is signed into `oracle/accepted-divergences.json` (stop 9). LaTeX
stays a permanent byte divergence (DIVERGENCES.md); D6 only fixes sizing.
**Approved API additions (user, 2026-10-22):** `RenderOptions.imageProvider`,
`RenderOptions.filename`, the `ImageProvider` type and the `image-providers`
entry (D3, D4); an optional `lengthAdjust` field on the internal `Theme`
interface for T2c (not exported by name; additive). Anything else is stop 10.

## D11 — branch and commits

Branch `feat/sequence-divergence-drive-3`; one unsigned commit per task,
Conventional Commits, no attribution; `--no-ff` task merges; never push; main
is not merged into the branch mid-drive. The squash batch rebuilds one commit
per batch with `git commit-tree` from the close trees (tree-identical; never
`rebase -r`), tags the working history `sdd3/pre-squash`, and hands the user
`git rebase --force-rebase -S <merge-base>` (a plain `rebase -S` on an
unchanged base is a no-op and signs nothing — PR #87, 2026-10-22).

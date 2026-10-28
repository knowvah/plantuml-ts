# T1b — `@startfiles` as a port of `FilesDiagram`/`FilesListing`/`FEntry` (D3)

Agent: `typescript-pro` (sonnet, effort high), worktree `ddc-T1b`. Commit:
`feat(files): port FilesDiagram, FilesListing and FEntry over klimt (T1b)`.
Read [../task-contract.md](../task-contract.md) and
[../decisions.md#d3](../decisions.md) first. Rewriting a never-faithful
file is allowed (CLAUDE.md "Porting discipline"); keep `files-style-input.ts`
and the annotations/sprites parse untouched in behaviour.

## Context
`src/diagrams/files/` draws its own picture: emoji as text glyphs (`'📂 '`),
`ROW_HEIGHT 22`, `INDENT 20`, a hand-made note box, `dominant-baseline:
hanging`, no `textLength`, `FILES_MIN_WIDTH 200`. None of it is in the Java.
The jar (`filesdiagram/`) builds an `FEntry` tree and draws it through
creole: the 9 corpus/authored rows differ from the first element on. Every
klimt piece the port needs already exists — `Display.getWithNewlines` /
`create7` (`src/core/klimt/creole/Display.ts:188-204,459`), `SheetBlock1`
(`:83`), `Opale` (`src/core/svek/image/Opale.ts:391-478`), the emoji store
(`src/core/internal-emoji-store.ts`, threaded from `assetStore` exactly as
`src/diagrams/json/parser.ts:69-72` does), `StyleSignatureBasic.of(...)
.getMergedStyle` (used by `src/diagrams/gantt/draw/AbstractTaskDraw.ts:44-45,
139-140`, which also builds an `Opale` note with the emoji store — the live
template for the note). The document shell (`TextBlockExporter`) already
takes a `TextBlock` fragment from the plugin seam (see how
`src/diagrams/gantt/index.ts` or `src/diagrams/wbs/index.ts` hands theirs).

## Task (mirror, file for file)
- `ast.ts`: `FilesType = 'FOLDER' | 'DATA' | 'NOTE'`; `FEntry` (`parent`,
  `note`, `name`, `type`, `children`; `createRoot()`, `addRawEntry(raw)`
  `FEntry.java:82-94` incl. the `return null` for a trailing slash,
  `getOrCreateFolder` `:101-109`, `addNote` `:96-99`, `getEmoticon` `:124-129`);
  keep `annotations`/`sprites` on `FilesDiagramAST`.
- `parser.ts`: `FilesDiagram` constructor loop `FilesDiagram.java:80-86`
  (`/`-lines → `addRawEntry(line.substring(1))`, `<note>` → `getNote`
  `:90-99`, everything else falls to the existing annotation/sprite matchers
  — note the jar silently ignores any other line; so do we). `FilesListing`
  `addRawEntry`/`addNote` with `lastCreated` (`FilesListing.java:81-91`).
  Emoji store from `options.assetStore` as json does.
- `layout.ts` + `renderer.ts`: `FilesListing.calculateDimensionSlow` /
  `drawU` (`:60-78`) and `FEntry.drawAndMove` / `calculateDimension` /
  `getTextBlock` / `createOpale` (`FEntry.java:131-182`) over a klimt
  `UGraphic`; the font configuration from
  `root.element.filesDiagram` (`FilesDiagram.java:72-78`), the note style
  from `root.element.filesDiagram.note` (`:165-171`). Replace every local
  constant with the Java's (`+ 2`, `+ 21`, `Opale` margins); delete
  `ROW_HEIGHT`, `INDENT`, `PADDING`, `NOTE_*`, `FILES_MIN_WIDTH`,
  `dominantBaseline`. If `src/core/svg.ts` exported `NOTE_Y_OFFSET` for the
  files renderer (CLAUDE.md "Architecture"), grep its consumers before
  removing it.
- `index.ts`: the plugin hands the listing as the fragment the document
  shell exports (`data-diagram-type="FILES"`, `font-family="sans-serif"
  lengthAdjust="spacing"` root as the jar's).
- Tests (first): `tests/unit/files/parser.test.ts` (tree shapes: nested
  paths, duplicate folders merged, trailing-slash folder sets
  `lastCreated` null so the next note goes to root, note after a file goes
  to its parent — each cited to `FEntry.java`/`FilesListing.java` lines);
  `layout.test.ts` (dimension arithmetic `height + 2`, `max(width)`,
  `deltax + 21`); `renderer.test.ts` (folder row emits the `1f4c2` emoji
  paths, file row `1f4c4`, note is an `Opale` path with the style's colours);
  keep `annotations.test.ts` and `lengthadjust-lad-t2f.test.ts` green
  (update expectations only where the jar oracle says so).

## Write-set
`src/diagrams/files/{ast,parser,layout,renderer,index}.ts`,
`tests/unit/files/*.test.ts`. (A 500-line split inside `src/diagrams/files/`
is allowed; journal it.) NOT `files-style-input.ts`, NOT `src/core/**`
(a needed core change is stop 1 — report it), NOT any golden/baseline.

## Read-set
`~/git/plantuml/src/main/java/net/sourceforge/plantuml/filesdiagram/{FilesDiagram,FilesListing,FEntry,FilesType,FilesDiagramFactory}.java`,
`svek/image/Opale.java:60-120`, `src/core/svek/image/Opale.ts:380-480`,
`src/core/klimt/creole/Display.ts:180-210,450-470`, `src/core/klimt/creole/SheetBlock1.ts:60-120`,
`src/core/klimt/creole/DisplayCreole.ts:155-195`,
`src/diagrams/gantt/draw/AbstractTaskDraw.ts:36-70,250-300`,
`src/diagrams/json/parser.ts:55-80`, `src/diagrams/wbs/index.ts`,
`src/core/internal-emoji-store.ts`, `tests/oracle/svg-conformance/render-fixture-files.ts` (T0b),
`test-results/dot-cache/files/*/in.svg` (the 8 oracles),
`tests/fixtures/lengthadjust/files-*.svg`, `tests/architecture/layering.test.ts`
(files → json import is forbidden; stop 16).

## Interface out (T2c, T1f)
`FilesDiagramAST { root: FEntry; annotations?; sprites? }`,
`FEntry { readonly type: FilesType; readonly name: string; readonly note: readonly string[] | null; readonly children: readonly FEntry[]; getParent(): FEntry | null }`.

## Acceptance
- Given `/a/b.txt` then `<note>` lines, when parsed, then the note is a child of folder `a` (`FilesListing.java:88-91`); given `/a/` then a note, then it is a child of root (`:88-89`, `FEntry.java:91-93`).
- Given a folder row, when rendered with `DeterministicMeasurer`, then the output contains the Twemoji `1f4c2` path data (`fill="#269"`), the row text at `x = deltax + <emoji width>` and the next row `height + 2` lower (`FEntry.java:133-134`); a child row is `21` further right (`:136`).
- Given the 8 corpus rows + `files-directory-tree-with-note`, when `npx tsx $T/diff-one.mts files <slug>` runs, then each reports 0 diffs (or the hand-back names the residual family per slug, with the Java line it traces to — T2c's input).
- `npx vitest run tests/unit/files tests/oracle/svg-conformance/files.*.ratchet.test.ts tests/oracle/svg-conformance/extensions.ratchet.test.ts tests/architecture --maxWorkers=2 --coverage.enabled=false` green; `lengthadjust` rows that still fail are listed in the hand-back (T2e re-pins them).

Observability: N/A. Rollback: Reversible.

# T3 — leaf-sizing family → `core/svek/image/`

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML (`~/git/plantuml`
is the spec; read the Java before acting; never fit a value). Pure SVG,
vitest, 500-line cap. The class engine imports leaf sizing from the
description engine ×4 (`class-geo-types.ts:6`, `class-layout-leaf-shapes.ts:
14`, `class-layout-generic-classifier.ts:25-26`, `class-layout-helpers.ts:28`)
— `measureLeafNode`, `measureUsecaseOrActorLeaf(Ink)`, `LeafSymbolInk`, and
the description AST type `DescriptiveNode`. Upstream this is
`svek/image/EntityImageDescription` (+ `EntityImageUseCase`, `EntityImage
Actor`…) — SHARED `svek/image` territory, and `core/svek/image/` already holds
the faithful `EntityImageDescription.ts` family the sizer calls into. The
description-side family is 7 files: `leaf-sizing.ts` (433), `leaf-sizing-
consts.ts` (252), `leaf-sizing-entity.ts` (364), `leaf-sizing-folder.ts` (124),
`leaf-sizing-folder-title.ts` (271), `leaf-sizing-legacy-fallback.ts` (119),
`leaf-sizing-text.ts` (307); internally coupled (see import graph in
Read-set), so it moves as ONE unit — piecemeal would create transient
core→description imports. T2 already moved the helpers this family imports
(`renderer-symbol`, `makeAtomImageResolverFor`) to core; this task must NOT
run before T2 lands.

## Task

1. Read the seven files' headers and every `import` line. Confirm they import
   only `../../core/**` and each other after T2 (grep). Any remaining
   `./`-import of a description file that is NOT in the family (e.g. `./ast.js`
   for `DescriptiveNode`, `./layout-helpers-types.js`) is exactly what step 2
   removes — list them.
2. `src/core/svek/image/LeafSizingSubject.ts` (D3): the structural interface
   = the fields the family READS from `DescriptiveNode` (walk `node.` uses in
   all seven files; list them in the doc with the reading site). Doc names
   the eventual `abel/Entity` convergence (SI-1) and says why not now. Replace
   every `DescriptiveNode` parameter/type in the family with
   `LeafSizingSubject`. `DescriptiveNode` must remain assignable (no cast) —
   `tsc` proves it at every description call site. Class's synthesized node
   (`class-layout-generic-classifier.ts:25-26` builds one) becomes a
   `LeafSizingSubject` literal.
3. `git mv` the seven files to `src/core/svek/image/` (same basenames);
   fix relative imports; keep every doc comment/`@see`/mission history. If a
   moved file must also import something description-only that is not in
   this write-set: STOP (README stop 1) — the family is larger than mapped.
4. Rewire callers: description `layout-helpers.ts`, `layout-types.ts`,
   `link-note-box.ts`, `renderer-entity.ts`; class `class-geo-types.ts`,
   `class-layout-leaf-shapes.ts`, `class-layout-generic-classifier.ts`,
   `class-layout-helpers.ts`. Move the family's colocated tests.
5. Manifest: EMPTY, full run (class + component + usecase + object all use
   this).

## Write-set

`src/core/svek/image/{leaf-sizing,leaf-sizing-consts,leaf-sizing-entity,leaf-
sizing-folder,leaf-sizing-folder-title,leaf-sizing-legacy-fallback,leaf-
sizing-text}.ts` (moved), `src/core/svek/image/LeafSizingSubject.ts` (new),
`src/diagrams/description/leaf-sizing*.ts` (deleted), `src/diagrams/
description/{layout-helpers,layout-types,link-note-box,renderer-entity}.ts`,
`src/diagrams/class/{class-geo-types,class-layout-leaf-shapes,class-layout-
generic-classifier,class-layout-helpers}.ts`, moved tests.

## Read-set

- Family import graph (2026-08-17): `leaf-sizing` → consts, entity, folder,
  legacy-fallback (+ `./ast` DescriptiveNode); `folder` → folder-title, text,
  consts; `folder-title` → entity, consts; `legacy-fallback` → text, consts;
  `entity` → consts (+ T2's moved helpers); `text` (+ T2's).
- `src/diagrams/description/leaf-sizing.ts:1-60,100-120` (header + `measure
  LeafNode` signature), `:405-433`; `src/diagrams/class/class-layout-generic-
  classifier.ts:20-40` (the synthesized node), `class-layout-leaf-shapes.ts:
  10-20`, `class-geo-types.ts:1-10`, `class-layout-helpers.ts:25-30`
- `src/diagrams/description/ast.ts` (`DescriptiveNode` fields)
- `src/core/svek/image/EntityImageDescription.ts:1-40` (import style)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageDescription.java`
  (constructor — the fields it reads from `Entity`; cite in `LeafSizingSubject`)
- `decisions.md#d3`, `#d1`; `planning/mission-guide.md` Track SI-1 paragraph

## Architecture decisions

D1, D3 (structural `LeafSizingSubject`; no AST moves; no `abel/Entity`
retarget). D8: basenames unchanged.

## Interface contract

`core/svek/image/leaf-sizing.js` exports unchanged names; parameter type
`LeafSizingSubject` from `core/svek/image/LeafSizingSubject.js`.

## Acceptance criteria

- Given `src/diagrams/class/**`, then no file imports `../description/`.
- Given `src/core/**`, then the identifier `DescriptiveNode` appears nowhere.
- Given every description call site, then `DescriptiveNode` values pass to
  the family without a cast (`tsc` green).
- Given the full baseline manifest, then `0 fixtures differ`.

## Quality bar

4 gates + full manifest + dot-sync green. Commit
`refactor(T3): move leaf-sizing family to core/svek/image; LeafSizingSubject`
(body: the field list and the reason the family moves as one).

## Observability

N/A.

## Rollback

Reversible.

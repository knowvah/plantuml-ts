# T3b — files extensions in extended mode (D8)

Agent: `typescript-pro` (sonnet), worktree `ddc-T3b`. Commit:
`feat(files): honour default font, shadowing, lineColor, handwritten as extensions (T3b)`.
Read [../task-contract.md](../task-contract.md) and
[../decisions.md#d8](../decisions.md) first.

## Context
After T1b the files engine resolves its font from `root.element.filesDiagram`
and the note from `…filesDiagram.note` (jar behaviour). `files-style-input.ts`
empties the skinparam map in jar-compatible mode; in extended mode the map
is full, so each directive below is honoured by letting the theme cascade
see it the way a class diagram would (`FromSkinparamToStyle.java` — read
and quote the mapping per directive): `defaultFontName`, `defaultFontSize`,
`defaultFontColor` (entry text), `shadowing` (the Opale note's shadow),
`lineColor` (the note border), `handwritten true` (wrap the graphic in the
handwritten `UGraphic` the json family already uses — find it via
`docs/catalog.md`, `src/diagrams/json/` handwritten path). `<style>
filesDiagram { node … }` is OUT (not a jar style element).

## Task
- Tests first (`tests/unit/files/extensions.test.ts`): per directive, an
  extended render differs in the named attribute and a jar-compatible render
  is byte-identical to the directive-free render.
- New fixtures `tests/fixtures/extensions/files-<directive>.puml` for each
  of the six (the ratchet's `MIN_EXAMPLES.files` can rise to 10 — that
  constant is in `extensions.ratchet.test.ts`, orchestrator-owned; say so
  in the hand-back rather than editing it).
- Hand back the six `DIVERGENCES.md` Extensions rows.

## Write-set
`src/diagrams/files/*` (style resolution only; no layout arithmetic
changes), `tests/unit/files/extensions.test.ts`,
`tests/fixtures/extensions/files-{defaultfontname,defaultfontsize,defaultfontcolor,shadowing,linecolor,handwritten}.puml`.

## Acceptance
- Given each directive in extended mode, then the named attribute changes as the mapping says; in jar-compatible mode the svg is byte-identical to the directive-free render.
- Given every svg-files golden and authored row, then unchanged (`npx vitest run tests/unit/files tests/oracle/svg-conformance/files.*.ratchet.test.ts tests/oracle/svg-conformance/extensions.ratchet.test.ts --maxWorkers=2 --coverage.enabled=false` green).

Observability: N/A. Rollback: Reversible.

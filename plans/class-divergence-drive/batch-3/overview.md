# Batch 3 — B5 notes

T8 first (fixes the shared note-path builder every later note consumer
reuses); T9 and T10 then run in parallel worktrees — disjoint write-sets
(T9: `note-layout-groups.ts`, `renderer.ts`; T10: a new `renderer-note-
lines.ts` it alone owns, consuming T8's exported builder from
`renderer-note.ts` only through that new file, never editing
`renderer-note.ts` itself). Batch 2's T7 rendered link-embedded notes
(`lipazi`) against the PRE-T8 builder; T8's fix corrects those vertices
too — re-verify `lipazi` at this batch's close. Partly layout-moving: T9's
connector-as-own-link-group adds a new `<g class="link">`, shifting
positional indices after it in any fixture with a plain note (E6's own
risk note).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T8 | Note body+fold: correct vertex order, two-path shape, paint | typescript-pro (sonnet) | `renderer-note.ts`, tests | — | [x] |
| T9 | Note connector as its own link group; group-not-opale guard | typescript-pro (sonnet) | `note-layout-groups.ts`, `renderer.ts`, tests | T8 | [x] |
| T10 | Creole `----` rule + tables in notes/labels | typescript-pro (sonnet) | `renderer-note-lines.ts` (new), `src/core/klimt/creole/*` (new), tests | T8 | [x] |

T9 and T10 run in parallel (disjoint write-sets, both depend only on T8).

Specs: [`T8-note-body-fold.md`](T8-note-body-fold.md),
[`T9-note-connector-link.md`](T9-note-connector-link.md),
[`T10-creole-rule-table.md`](T10-creole-rule-table.md).
Batch close: [`close.md`](close.md).

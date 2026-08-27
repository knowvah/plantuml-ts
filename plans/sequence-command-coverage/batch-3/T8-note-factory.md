# T8 — `FactorySequenceNoteCommand`: the four unported groups

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical spec. Upstream builds its sequence note
commands from `FactorySequenceNoteCommand`, whose regex carries groups this
port does not implement. **~24 corpus fixtures** are pinned on them, each
naming the group and its `file:line`.

## Task

Port the four unported groups in `command-note-factory.ts`:

- **PARTICIPANT** `(?:of[%s]+)?(...)` — the `of` is **optional**, plus the
  trailing color/stereotype run (`FactorySequenceNoteCommand.java:79-98`).
  ~10 fixtures.
- **VMERGE** `(/)?` — the `/` that merges a note vertically with the one above
  (`:79,96`). ~8 fixtures.
- **STYLE** `(note|hnote|rnote)` — only `note` is ported (`:81,98`).
  ~3 fixtures.
- **PARALLEL** `(&[%s]*)?` (`:78,95`) and **StereotypePattern**
  (`note <<stereo>> left`, `:81-83`). ~5 fixtures.

Populate the `NoteEvent` fields T6 declared. Per D4, `parallel` is **stored and
not drawn** — every upstream consumer of `isParallel()` is under
`sequencediagram/teoz/` (`teoz/NoteTile.java:91`), and the classic renderer
reads none of them. That is upstream's behavior, not a divergence, so do **not**
add a `DIVERGENCES.md` entry for it.

`hnote` and `rnote` change the drawn shape (hexagon / rectangle). If rendering
them is larger than parsing them, parse in this task and journal the render
residual for D6's census — but measure before deciding, and say so in the
journal.

## Write-set

- `src/diagrams/sequence/command-note-factory.ts`
- `tests/unit/sequence/command-note-factory.test.ts` (new)

Not `ast.ts`, not `parser.ts`, not `docs/catalog.md`.

## Read-set

- `~/git/plantuml/.../command/FactorySequenceNoteCommand.java:70-110` — the
  regex build and `executeArg`. **Read the method bodies.**
- `.../command/FactorySequenceNoteOverSeveralCommand.java`,
  `FactorySequenceNoteAcrossCommand.java` — the siblings registered beside it
  (`SequenceDiagramFactory.java:116-122`)
- `~/git/plantuml/.../stereo/StereotypePattern.java`
- `src/diagrams/sequence/ast.ts` — the T6 `NoteEvent` contract
- `src/diagrams/sequence/parser.ts:48-90` — `handlePendingNote` /
  `handlePendingRef`, for how multi-line bodies accumulate today
- `../decisions.md#d4`

## Architecture decisions in force

D4 (locked): PARALLEL is parsed, stored, not drawn; no divergence entry.
D2 (locked): registration order frozen.

## Interface contracts

Consumes T6's `NoteEvent`. Produces no new interface.

## Acceptance criteria

- Given `note over Bob : x` and `note Bob : x` (no `of`), then both parse and
  attach to Bob.
- Given `/ note over Bob : x`, then the note carries VMERGE and does not refuse.
- Given `hnote over Bob : x` and `rnote over Bob : x`, then both parse with the
  right `style`.
- Given `note <<stereo>> left : x`, then the stereotype is captured.
- Given the ~24 pinned fixtures, then none refuses and all route `SEQUENCE`.

## Observability

N/A beyond the gates.

## Rollback

**Reversible.** Single command module.

## Quality bar

All four gates green; 90/90/90. Author `.puml` fixtures with
`scripts/oracle-render.sh` where a branch has no corpus fixture — never a
hand-typed `java -jar`, which omits `-DPLANTUML_DETERMINISTIC_TEXT=true`.

## Boundaries

- **Always**: read the Java method body; cite `file:line`.
- **Never**: fit a pattern; never edit `ast.ts`; never write a divergence entry
  for teoz-only behavior.
- **Ask first**: before deferring `hnote`/`rnote` rendering — the deferral needs
  a measured cost, not a difficulty claim.

## Commit

`feat(T8): port FactorySequenceNoteCommand's of/vmerge/style/parallel groups`

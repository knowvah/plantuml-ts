# T11 — Inline sprite, `EmbeddedDiagram`, `%newline()`

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical spec. Three unported items account for
**~6 corpus fixtures**. They are grouped here because each touches a **shared
or preprocessor seam**, not because they are related.

**This is the task most likely to hit a stop condition.** Read the stop
conditions below before starting, not after.

## Task

- **Inline sprite** (~3 fixtures) — `CommonCommands`' `CommandCreoleSprite` /
  inline sprite data (`CommonCommands.java:58`). The sequence parser already
  runs `matchSpriteCommand` for `sprite $name { ... }` blocks
  (`parser.ts:112-120`); what is missing is the inline/creole form. A
  `SpriteRegistry` is already built onto the AST by the sequence parser
  (`sequence/parser.ts:121` region) — **no interface change is needed**, and a
  prior mission nearly bought a deferral on the false belief that one was.
- **`EmbeddedDiagram`** (~2 fixtures) — the `{{` / `}}` block inside a note body
  (`EmbeddedDiagram.java:77-78`). Today it is unconsumed, so the inner
  `end note` closes the outer note and the rest of the source misparses.
- **`%newline()`** (~1 fixture) — the preprocessor builtin
  (`tim/builtin/Newline.java:51`). Its expansion splits a message into lines
  this port then cannot parse.

## Write-set

- `src/diagrams/sequence/command-sprite.ts` (new)
- `src/diagrams/sequence/parser.ts` — note-body block consumption
- `tests/unit/sequence/` — test files

**Not** `command-misc.ts` (T10 owns it), **not** `command-note-factory.ts`
(T8 owns it), not `ast.ts`, not `docs/catalog.md`.

## Read-set

- `~/git/plantuml/.../command/CommonCommands.java:40-70`
- `~/git/plantuml/.../EmbeddedDiagram.java:60-100`
- `~/git/plantuml/.../tim/builtin/Newline.java:40-60`
- `src/diagrams/sequence/parser.ts:48-90,100-125`
- `src/core/sprite-commands.ts` — `matchSpriteCommand`'s existing contract
- `../constraints.md` — stop conditions 5 and 7

## Prior observation — bears directly on this write-set

`sequence-participant-badge-glyph`'s stated blocker was "the shared plugin seam
carries no `SpriteRegistry`". That was **wrong**: registries are not threaded
through that seam at all — the parser builds one onto the AST, and the sequence
parser was already doing it. No interface change was needed. Recorded because
the wrong reason nearly bought a deferral the work did not need. **Verify the
seam yourself before claiming anything about it.**

## Architecture decisions in force

D2 (registration order frozen), D6 (coverage is the deliverable). Locked.

## Stop conditions that apply specifically here

- **Stop 7 — `EmbeddedDiagram`.** If it needs nested-diagram infrastructure,
  **stop and file it as its own mission** rather than building it inline. The
  deferral must carry a **fixture-level cost**, measured. A difficulty claim is
  not sufficient; per CLAUDE.md, "hard" and "out of scope" are triggers to
  VERIFY, not to skip. Only "genuinely large AND separable" earns a deferral.
- **Stop 5 — `%newline()`.** This lives in `src/core/`'s preprocessor, outside
  the sequence engine. If the fix requires touching core, **journal it and
  stop** — a shared-seam change moves every engine at once, which is exactly
  how three engines moved together in `dispatch-by-parse-attempt`.

## Interface contracts

Consumes the existing `SpriteRegistry` on the AST. Produces no new interface.
If you conclude one is needed, that is a signal to re-read the seam, not to add
one.

## Acceptance criteria

- Given a source with inline sprite data, then it parses and the sprite is
  registered — with no change to `matchSpriteCommand`'s signature.
- Given a note body containing `{{ ... }}`, then the inner block is consumed and
  the outer `end note` closes the outer note.
- Given each of the ~6 pinned fixtures, then either it parses and routes
  `SEQUENCE`, **or** it carries a journaled, measured deferral naming the
  follow-on mission.

## Observability

N/A beyond the gates.

## Rollback

**Reversible.** New module plus a parser edit.

## Quality bar

All four gates green; 90/90/90.

## Boundaries

- **Always**: verify a seam claim against the code before repeating it.
- **Never**: fit a pattern; never edit `ast.ts`, `command-misc.ts` or
  `command-note-factory.ts`.
- **Ask first**: any change under `src/core/`. Journal and stop.

## Commit

`feat(T11): port inline sprite and consume embedded-diagram note blocks`

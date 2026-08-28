# T2 — Capture the group colours

## Context

`plantuml-ts` is a faithful port; the Java at `~/git/plantuml` is the spec.
**Open the method body.** Sequence lives under `sequencediagram/teoz/`;
`sequencediagram/graphic/` is DEAD.

`command-grouping.ts` already MATCHES both colour groups and throws them away.
Its own comment says so: *"captured so the label group doesn't absorb them, but
not modelled on `FrameGeo`"*. T1 has now modelled them.

Read `../README.md` and `../decisions.md` first.

## Task

In `src/diagrams/sequence/command-grouping.ts`:

1. `groupingCommand` — stop discarding `match[3]` and `match[4]`. Put them on
   the `FrameEvent` as `backColorElement` and `backColorGeneral` respectively.
   **Check the mapping against the Java, do not trust this sentence**:
   `CommandGrouping.getRegexConcat` names the group `COLORS` with
   `((?<!else)(?<!also)(?<!end)#\w+)?(?:[%s]+(#\w+))?`, and `executeArg` reads
   index 0 as `backColorElement`, index 1 as `backColorGeneral`.
2. `elseCommand` — capture its `#color`. Note the negative lookaheads: `else`
   can only carry the SECOND group, so `else#red` is not a colour but
   `else #red cond` is. Store it index-aligned with `branchLabels`.
3. Port `TRAILING_BRACKET_CONTENT_PATTERN` (`CommandGrouping.java:76-77`,
   applied at `:137-146`): for `group` with a non-empty comment, if the comment
   matches `^(.*\[\[.*\]\].*?|.*?)\[(.*)\]$` then type := group 1 and comment
   := group 2. This is what makes `group Alpha [beta]` put "Alpha" in the tab
   and "[beta]" beside it, and it feeds T1's `groupingHeaderDisplay`.
   Also mirror `:139-140`: an EMPTY comment on `group` becomes the literal
   `"group"`.

## Read-set

- `src/diagrams/sequence/command-grouping.ts:66-105` (the three commands)
- `~/git/plantuml/.../sequencediagram/command/CommandGrouping.java:64-73`
  (the regex), `:129-159` (`executeArg`), `:76-77` (the bracket pattern)
- `../batch-1/T1-frame-contract.md#interface-contract`

## Interface contract

Consumes T1's `FrameEvent.backColorElement` / `.backColorGeneral` and the
per-branch colour slot. Produces `FrameEvent`s carrying them; T5 reads them.

## Architecture decisions (locked)

- Colours are stored as **RAW source tokens** (`'#ffa'`), not resolved here.
  Resolution happens at SVG-emission time via
  `core/klimt/color/HColorSet.ts#resolveColorToSvgHex` + `svg-format.ts
  #shortenColor` — the port's documented "stored verbatim, interpreted late"
  design.
- **Do not refactor while porting.** Redundant-looking branches handle cases
  the corpus surfaces months later.

## Acceptance criteria

- Given `group #ffa G1`, then `backColorGeneral === '#ffa'` and
  `backColorElement === undefined`.
- Given `group#ffa G1` (no space), then `backColorElement === '#ffa'`.
- Given `else #eee other case`, then that branch carries
  `backColorGeneral === '#eee'` and its label is `'other case'`.
- Given `group Alpha [beta]`, then the frame's title is `'Alpha'` and its
  comment is `'beta'`.
- Given a bare `group` with no comment, then the comment is the literal
  `'group'` (`CommandGrouping.java:139-140`).

## Observability

N/A — no new observable operations.

## Rollback

Reversible. Parser-only; reverting restores prior behaviour exactly.

## Quality bar

The four gates exit 0. 90/90/90 on the changed lines. No Prettier.

## Commit

`feat(T2): capture group and else background colours`

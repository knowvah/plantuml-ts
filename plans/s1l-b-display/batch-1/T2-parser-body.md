# T2 — Parser: accumulate `[ … ]` body as node display

## Context
`CommandCreateElementMultilines` in PlantUML: `<keyword> <code> [ body ]` — the
`[ … ]` text is the element's label. `tryElementBlock` in
`src/diagrams/description/parser.ts` currently emits the node with
`display = code` and **discards** every body line (a shortcut from when sizes
were tolerant). The open regex `ELEMENT_MULTILINE_OPEN_RE`
(`parse-helpers.ts`) captures keyword + code only.

**This is substantially done on branch `feat/s1l-b-display-expansion`** — reuse
that commit's `tryElementBlock`/`pushElementBody`/`finishElementBlock` and the
`ParseState.elementBlockNode`/`elementBlockBody` fields. Port it, don't re-invent.

## Task
Accumulate the `[ … ]` body lines and set the node's `display` to the joined,
finalized body when the block closes. `emitNode` pushes the mutable node object,
so hold the reference and set `node.display` at close.

## Read-set
- `git show feat/s1l-b-display-expansion:src/diagrams/description/parser.ts` —
  the reference implementation (tryElementBlock + helpers).
- `git show feat/s1l-b-display-expansion:src/diagrams/description/parse-state.ts`
  — the `elementBlockNode`/`elementBlockBody` fields (typed `| undefined` for
  exactOptionalPropertyTypes).
- `src/diagrams/description/parse-helpers.ts#finalizeDisplay` — apply per body
  line (resolves `\t`/escapes/newlines) exactly like single-line displays.

## Write-set
- `src/diagrams/description/parser.ts`
- `src/diagrams/description/parse-state.ts`
- `tests/unit/description/element-body.test.ts` (new)

## Quality bar
`npm run typecheck` clean; new unit tests pass; complexity hook non-block (the
reference already factors `pushElementBody`/`finishElementBlock` to keep CCN
low). Structure must stay EQUAL (`display` is a size-only field — does not change
node/edge/cluster counts).

## Acceptance criteria (Given/When/Then)
- Given `node n [\nfoo1\n====\nfoo2\n]`, when parsed, then `node.display ===
  "foo1\n====\nfoo2"`.
- Given `component c [ desc ]` (one-line form), when parsed, then `node.id ===
  "c"` and `node.display === "desc"`.
- Given a body line containing `\t` or an escape, when parsed, then it is
  finalized (per `finalizeDisplay`) like a single-line display.
- Given an element with an empty body `[]`, when parsed, then `display` stays the
  code (no empty-string label).

## Commit
`feat(description): parse [ … ] element body as the node display (S1L-b T2)`.

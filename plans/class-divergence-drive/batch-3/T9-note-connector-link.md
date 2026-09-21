# T9 — note connector as its own link group; group-not-opale guard

**Agent:** typescript-pro (sonnet) · **Depends on:** T8

## Context

Two independent E6 mechanisms. (a) A plain note's dashed connector belongs
to the diagram's ordinary link layer — a top-level `<g class="link">`
(`<!--link GMN2 to dummy-->`) — not to the note's own entity group;
`renderer-note.ts:354-363` currently pushes the connector path into the
note's `parts` array. (b) `GraphvizImageBuilder` only opalises a note when
the OTHER end resolves to a `SvekNode` (`GraphvizImageBuilder.java:
245-259`, guarded by `Bibliotekon#getNode`, which is `null` for a package/
namespace — `Bibliotekon.java:120-122`, populated only by `createNode` at
`:72-77`, never called for a group); `note top of <package>` must therefore
always draw as a real link edge, never opalise. The `strictuml` half of
this guard is already ported (`note-layout-tip.ts:151-173`); the group half
is not (`note-layout-groups.ts:37-64` only branches on `targetPort !==
undefined`). Mechanism: `diagnosis/A2b-entity-groups.md` E6. Re-read
`GraphvizImageBuilder.java`/`Bibliotekon.java` before editing — the report
is a lead. Depends on T8 for `renderPlainNote`'s `{ entityParts, connector
}` return shape.

## Task

1. Tests first: a plain `note as N` with a dashed connector, and `note top
   of <package>`.
2. `renderer.ts`: when `renderPlainNote` returns a `connector`, emit it as
   its own `<g class="link">` via whichever link-emission call `renderer.
   ts` already uses for ordinary edges (match that call, don't invent a new
   wrapper) instead of folding it into the note's entity group.
3. `note-layout-groups.ts` (`:37-64`): add the "other end is a package/
   namespace ⇒ never opalisable" guard alongside the existing `strictuml`/
   `targetPort` checks — mirror `Bibliotekon#getNode`'s null-for-a-group
   behavior (a group was never registered as a `SvekNode`).
4. Verify emission ORDER matches the jar: the new link group's position in
   the root child sequence must land where `GraphvizImageBuilder` would
   place it relative to batch 1's edge order (`ORD2`/`sameConnections`,
   already ported) — don't just append it last.
5. `.agent-notes/cdd-T9.md`: where in `renderer.ts`'s emission sequence the
   new link group had to be inserted to match jar order.

## Read-set

`net/sourceforge/plantuml/svek/GraphvizImageBuilder.java:133-148,245-259`;
`net/sourceforge/plantuml/svek/Bibliotekon.java:72-77,120-122`;
`src/diagrams/class/renderer-note.ts:354-363` (post-T8, for the new return
shape — read-only, this task calls it, never edits it); `note-layout-
tip.ts:151-173`; `note-layout-groups.ts:37-64`; `src/diagrams/class/
renderer.ts` (whole — find the existing edge-emission call to match).

## Write-set

`src/diagrams/class/note-layout-groups.ts`, `renderer.ts`, their
`.test.ts` files, `.agent-notes/cdd-T9.md`,
`plans/class-divergence-drive/decision-journal.md` (append-only).

## Interface in (from T8)

`renderPlainNote(...) => { entityParts: string[]; connector?: string }`.

## Acceptance criteria

- Given `fogexa-30-zupo141` (`skinparam style strictuml`, `note top of
  dummy`), when rendered, then the root has a `<g class="link">` for `GMN2
  to dummy` and the note's entity group no longer contains the connector
- Given `pecabi-95-demu756`, `sanixi-31-nofa193`, `zepeki-75-pifo352`
  (`note top of <package>`), when rendered, then each emits the jar's
  `<!--link GMN… to …-->` comment and is survey-conformant or names its
  residual mechanism
- Given the new link group's position, when compared against the jar, then
  it matches batch 1's edge-order convention (not appended last by default)

## Observability

N/A — no new observable operation.

## Rollback

Reversible — revert the task's commits; pins are committed with the code.

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build` all green.
`render-diff.mts` on all 4 AC slugs before/after; also check the 6 PARTIAL
E6 reach slugs (`lejoga`, `vudepo`, `pejone`, `xonamo`, `temise`, `fomofi`)
for count-only improvement — they carry other mechanisms too, full
conformance not expected here.

## Boundaries

Always: match the jar's link emission order, don't append last as a
shortcut. Ask first: any stop condition in `../README.md`, especially if
order-matching needs a change outside this write-set. Never: touch
`renderer-note.ts` (T8's write-set) or create `renderer-note-lines.ts`
(T10's write-set).

## Commit

`fix(cdd-T9): note connector as its own link group; groups never opalise`

Body: cites `GraphvizImageBuilder.java:133-148,245-259`,
`Bibliotekon.java:72-77,120-122`; the two independent mechanisms (a)+(b).

# T6 — edge geometry: direction, visibility icon, note box, constraint, quantifier split

**Agent:** typescript-pro (opus) · **Depends on:** T5

## Context

Five geometry-layer gaps, each capable of moving DOT reservations if done
carelessly: the A5 M5 direction flip (`normalizeEdgePoints` falls back to a
bare `dotSwap` instead of the distance-based verdict upstream always
applies), A2a M2's visibility-icon strip+anchor (measurement is right, the
render anchor is missing), M4's dashed-body carry from T5's new
`Relationship.dashedBody`, M5's note-box field shape (mirror the state
engine's already-correct `state-transition-label.ts:334-339`), M9's
constraint line position (`SvekEdge.java:993-1011`), and M10's quantifier
line split (measurement already right at `edge-label-box.ts:427-434`, only
the render anchor is raw). The M5 direction trigger is **MEDIUM-LOW
confidence** — instrument before touching the fallback; diagnosis mode
forbids a fix before a stated mechanism. Report: `diagnosis/A5-geometry.md`
M5; `diagnosis/A2a-link-groups.md` M2, M4, M5, M9, M10. Re-read the cited
bodies; the report is a lead.

## Task

1. **Instrument M5 first.** In `class-edge-geo.ts#normalizeEdgePoints`
   (`:346-379`), temporarily log `(dotSwap, c1 === undefined, c2 ===
   undefined, normal, inversed)` for `delano-03-xino845`'s two inheritance
   edges (`npx tsx tools/render-diff.mts delano-03-xino845`). Journal the
   mechanism, origin (`file:line`), causal chain and what this rules out
   (namespace-qualified `nodeCenter` lookup vs. the fallback branch itself)
   in `decision-journal.md` BEFORE writing the fix.
2. Fix `normalizeEdgePoints` per the instrumented mechanism so it always
   applies the `normal`/`inversed` distance verdict (`SvekEdge.java:
   643-655`), removing or correcting the `dotSwap` fallback path.
3. Add `EdgeGeo.visibilityIcon?: {x, y, modifier}` computed alongside the
   existing measurement call (`edge-label-box.ts:168-190,347`); strip the
   leading visibility char from the emitted label text per `Display.java:
   415-416` — the measurement box is unchanged, the width is already
   reserved.
4. Carry `rel.dashedBody` (T5) into `EdgeGeo.dashed`, replacing/confirming
   the `rel.dashed ?? decor.dashed` fallback at `:420`. Measure DOT
   `style=dashed` emission (`:286`) before/after on every currently
   conformant B2/B3 fixture — no unnamed style flip.
5. Port the `noteBoxFields` shape from `state-transition-label.ts:334-339`
   into `class-geo-types.ts` (`EdgeGeo.noteBox`) and wire the merge
   (`edge-label-box-note-merge.ts`, `class-layout-edge-labels.ts:
   192,200-232`) to populate it — reservation math is already correct
   (`SvekEdge.java:307-327,440-445`), this only carries the fields forward.
6. Add `EdgeGeo.constraint?: {line, text}` — compute the bezier-sampled
   position (`SvekEdge.java:993-1011`) from `rel.linkConstraint.text` (T5).
7. `class-edge-label-anchor.ts#attachPortLabels` (`:305-321`): split the
   quantifier string with the same `splitDisplayLines` the measurement side
   already calls; emit `EdgeGeo.quantifierLines: {text,x,y}[][]` (one array
   per end) stacked at `font.size` per line (`SvekEdge.java:330-340`).
8. `.agent-notes/cdd-T6.md`: the M5 instrumentation result and anything
   about `nodeCenter`'s namespace-qualified lookup a later task would
   otherwise re-derive.

## Read-set

`net/sourceforge/plantuml/svek/SvekEdge.java:302,307-327,330-340,363-374,
440-445,643-655,993-1011`; `net/sourceforge/plantuml/klimt/creole/
Display.java:415-416`; `src/diagrams/class/class-edge-geo.ts:111-131,
346-379,420`; `class-geo-types.ts` (whole); `class-edge-label-anchor.ts:
305-321`; `src/core/edge-label-box.ts:168-190,347,427-434`;
`src/core/edge-label-box-note-merge.ts` (whole); `class-layout-edge-
labels.ts:192,200-232,370-375`; `src/diagrams/state/state-transition-
label.ts:334-339` (the `noteBoxFields` shape to mirror).

## Write-set

`src/diagrams/class/class-edge-geo.ts`, `class-geo-types.ts`,
`class-edge-label-anchor.ts`, their `.test.ts` files,
`.agent-notes/cdd-T6.md`,
`plans/class-divergence-drive/decision-journal.md` (append-only).

## Interface in (from T5)

`Relationship.{ url, dashedBody, hidden, linkConstraint, middleDecor,
sourceDecor, targetDecor }`.

## Interface out (consumed by T7)

```ts
interface EdgeGeo {
  visibilityIcon?: { x: number; y: number; modifier: string }
  noteBox?: NoteBoxFields // mirrors state-transition-label.ts:334-339
  constraint?: { line: { x1: number; y1: number; x2: number; y2: number }; text: string }
  quantifierLines: { text: string; x: number; y: number }[][]
  dashed: boolean // now sourced from rel.dashedBody
}
```

## Acceptance criteria

- Given `delano-03-xino845`, `faxoga-34-moja699`, `fexedu-26-dira713`,
  `jabeme-35-logi109`, `jinema-90-laga721`, `mefaca-83-lebu193`,
  `zogari-39-ziza794`, when re-rendered, then `render-diff.mts` reports
  0 structural / 0 numeric diffs for each
- Given `canuti-20-jotu614`, when rendered, then the label text is
  `entries` (not `-entries`) positioned at x `168.32`
- Given `camuna-58-veca254`, when rendered, then the quantifier emits two
  anchors, one at y `228.853` and one at y `238.853`
- Given `npx jiti scripts/dot-sync-report.ts class`, then the DOT-equal
  fraction is still 710/711 and no currently-conformant fixture's
  `style=dashed` attribute changed (measured, not assumed)

## Observability

N/A — no new observable operation.

## Rollback

Reversible — revert the task's commits; pins are committed with the code.

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build` all green.
`render-diff.mts` on the AC's 7 direction fixtures plus `canuti`/`camuna`
before/after. `class-geo-types.ts` (497 lines) and `class-layout-edge-
labels.ts` (500 lines) are already at the hook cap — a split re-export is
pre-authorised (stop 1) if a new field pushes either over.

## Boundaries

Always: journal the M5 instrumentation artifact (mechanism, origin, causal
chain, ruled out) before writing the fix — diagnosis mode, not greenfield.
Ask first: any stop condition in `../README.md`, especially stop 11 if
M5's trigger turns out to be `nodeCenter` rather than the fallback branch.
Never: touch `class-relationship-*.ts` (T5's write-set, already merged) or
`renderer-edge.ts`/`renderer-arrowhead.ts` (T7's write-set).

## Commit

`fix(cdd-T6): direction, visibility icon, note box, constraint, quantifier`

Body: cites the instrumented M5 mechanism with its `file:line`; why the
other four fields are additive (reservation unchanged, carry-only).

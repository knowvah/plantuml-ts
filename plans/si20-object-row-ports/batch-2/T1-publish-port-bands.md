# T1 — publish `portMemberSections` for object leaves (inert, NOT wired)

## Prior observations — established, do NOT re-derive

- SI17 added `MeasuredClassifier.portMemberSections`
  (`class-layout-helpers.ts`) as a **publish-only** field and populated it in
  `buildNormalClassifierResult` (`class-layout-generic-classifier.ts`), the
  one site where the header height and per-member heights are simultaneously
  live. Object leaves never reach that function — `class-layout-helpers.ts`
  routes `kind === 'object'` to `measureObjectClassifier` instead. That is
  the entire gap this task closes.
- The object path already computes both terms and discards them:
  `measureObjectFields` builds one `buildObjectMemberRow` per member (each
  with its own `.height`), and `buildFieldBasedObjectGeo` holds
  `title.height`.
- **The header value is not yours to choose.** T0 resolved it. Read its
  journal entry.

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is canonical. Object diagrams have no separate engine.

**Read the Java first**; cite `file:line` for every constant; never fit a
value.

## Task

Populate `portMemberSections` for object leaves, from
`buildFieldBasedObjectGeo` in `src/diagrams/class/class-object-sizing.ts`
(relocated there by S1).

Use T0's resolved `headerHeight` and `margin` — **do not** assume the class
values, and do not re-derive them from `rozuxo` (that fixture cannot separate
them; see [ADR-1](../decisions.md)).

**Publish-only.** Surface terms that are already computed. Do **not**
re-measure, do not call a measurement function, and do not change the value
of any existing field. If you find yourself adding a measurement call, that
is off-spec — stop.

Mirror SI17's suppression semantics: a **suppressed** compartment is
**omitted**, not passed as an empty one (an omitted compartment contributes
no margin floor at all). Object has a single fields compartment.

**Do not wire it.** `applyShapeAndPorts` keeps its current behavior, nothing
reads the field for objects yet, and every gate stays on its existing
numbers. Wiring is T2.

## Write-set

- `src/diagrams/class/class-object-sizing.ts`
- `tests/unit/class/` — a new or existing unit test file for the publish

If `MeasuredClassifier`'s type needs widening, it should not — SI17 already
declared the field as optional and kind-agnostic. If it genuinely does, STOP
and report rather than editing `class-layout-helpers.ts`.

## Read-set

- `../decision-journal.md` — **T0's entry. The header value is not yours to
  choose.**
- `src/diagrams/class/class-object-sizing.ts` — `buildFieldBasedObjectGeo`
  and `measureObjectFields` (post-S1 locations).
- `src/diagrams/class/class-layout-helpers.ts` — `MeasuredClassifier
  .portMemberSections`'s declaration and doc comment.
- `src/diagrams/class/class-layout-generic-classifier.ts` —
  `buildNormalClassifierResult`'s publish, as the model to mirror.
- `~/git/plantuml/.../svek/image/EntityImageObject.java:265-270`

## Architecture decisions in force

[ADR-1](../decisions.md) (resolved by T0 — obey it), ADR-3, ADR-6.

## Interface contract — consumed by T2

```ts
// MeasuredClassifier.portMemberSections, for an object leaf:
{
  headerHeight: number,        // T0's H, NOT H + margin
  fields?: FlatMemberRows,     // omitted when the field list is SUPPRESSED
}
```

`methods` is never present for an object.

## Acceptance criteria

- Given an object leaf with visible members, then `portMemberSections`
  carries T0's header value and each member's own `builds[].height` from
  `measureObjectFields`.
- Given a **suppressed** field list, then the compartment is **omitted**, not
  an empty one.
- Given an object leaf with an empty-but-shown field list, then the behavior
  matches whichever of the two empty states applies — these carry different
  ink rules upstream (`EntityImageObject.java:110-113` vs
  `BodierLikeClassOrObject.java:225-229`) and the existing code already
  distinguishes them; do not collapse them.
- Given all four gates and every DOT gate and census, then **every count is
  unmoved** — this task is inert by construction.

## Observability requirements

N/A — no new observable operations.

## Rollback

**Reversible.** Additive; nothing reads the field for objects yet.

## Quality bar

TDD: the failing unit test precedes the implementation. Every constant cites
its upstream `file:line`. Four gates green, unpiped. Watch the 500-line cap
on the new file.

## Boundaries

- **Always:** use T0's resolved values; keep it publish-only.
- **Ask first (STOP and report):** any file outside the write-set; any need to
  widen `MeasuredClassifier`.
- **Never:** wire the field in this task; add a measurement call; fit a value;
  run any state-mutating git command.

## Commit format

```
feat(T1): publish object port bands from the object sizer
```

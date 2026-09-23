# T23 — per-member `[[[url]]]` anchors

**Agent:** typescript-pro (sonnet) · **Depends on:** T18 (nominal —
render-only, no `Paint` dependency). Parallel with T19/T20/T21/T22.

## Context

The jar emits one `<a>` per url-bearing region inside a classifier's
`<g class="entity">`: the header bundle in the classifier's own `<a>`
(`EntityImageClass.java:143-158`), then one `<a>` per member row
carrying `[[[url]]]` (each member atom carries its own `Url`, opened/
closed separately — `cucadiagram/MethodsOrFieldsArea`). This port emits
a single `<a>` wrapping the entire entity body:
`renderer-url.ts`/`renderer-classifier-box.ts`'s `UrlTaggedPrimitive`
bundle collapses a run of primitives sharing a url into one `<a>`,
including across rows that have NO url — the header primitive's own
comment already names this ("the header never carries its own url … its
effective url is always the classifier's own fallback"). `cutasu-32-
zete658` shows the jar's entity holding nine `<a>` children where this
port emits one holding all 13 primitives. The report is a lead: re-read
the cited body before editing.

## Task

1. Tests first: `cutasu-32-zete658` and `xogixe-78-zuro619`, asserting
   the exact `<a>` count and nesting boundary per row.
2. `renderer-url.ts`: stop merging a run whose url is the classifier's
   OWN fallback with rows that carry a member url. Emit one `<a>` per
   member row that has its own `[[[url]]]`, and keep the header/no-url
   rows grouped under the classifier's fallback `<a>` as today — the
   change is where a run BREAKS, not whether a fallback `<a>` exists at
   all.
3. Confirm the header bundle's own `<a>` (classifier-level, no per-row
   url) is unaffected — only per-member-url rows split out.
4. Render every fixture in the corpus that currently uses `[[[url]]]`
   or a classifier `[[url]]` (grep `test-results/dot-cache/class/*/
   in.puml` for `\[\[\[` and `\[\[`) and confirm each either improves
   toward the jar's `<a>` nesting or is unchanged if it has no per-member
   url.
5. `.agent-notes/cdd-T23.md`: the exact run-break condition implemented,
   and the count of url-bearing fixtures re-verified in step 4.

## Read-set

`src/diagrams/class/renderer-url.ts` (whole, 97 lines);
`src/diagrams/class/renderer-classifier-box.ts:255,307-317`
(`UrlTaggedPrimitive` bundle, header-fallback comment). Java:
`svek/image/EntityImageClass.java:143-158`;
`cucadiagram/MethodsOrFieldsArea` (per-atom `Url`, locate exact lines via
grep — not yet cited by line in the diagnosis). Diagnosis:
`diagnosis/A2b-entity-groups.md` E10.

## Write-set

`src/diagrams/class/renderer-url.ts`, its `*.test.ts` file,
`.agent-notes/cdd-T23.md`, `decision-journal.md` (append-only).

## Acceptance criteria

- Given `cutasu-32-zete658`, when rendered, then the entity's `<a>`
  nesting (count and boundaries) equals the jar's nine-`<a>` structure
- Given `xogixe-78-zuro619`, when rendered, then the `<a>` nesting
  equals the jar's (50 `<a>` children)
- Given every currently-conformant url-bearing fixture (classifier-level
  `[[url]]`, no per-member url), when re-rendered, then output is
  byte-identical to before this task

## Observability

N/A — no new observable operations.

## Rollback

Reversible — revert the task's commits; pins are committed with the code.

## Quality bar

Four gates green. `npx tsx tools/render-diff.mts cutasu-32-zete658
xogixe-78-zuro619` before/after, plus a render-all pass restricted to
url-bearing fixtures to confirm zero regressions among currently
conformant ones. Files ≤500 lines, functions ≤30 NLOC, CCN ≤10, ≤5
params.

## Boundaries

Always: verify every existing conformant url fixture stays
byte-identical before committing (render-all, not just the two named
fixtures). Ask first: any stop condition in `../README.md`. Never: touch
`renderer-classifier-box.ts` (out of write-set — read-only for the
bundle shape); fit a value; edit outside the write-set (stop 1).

## Commit

`fix(cdd-T23): split member-url anchors from the classifier fallback`

Body: why — the url-primitive grouping collapsed rows with their own
`[[[url]]]` into the classifier's fallback `<a>` whenever they were
adjacent; this breaks the run at each member-owned url, matching the
jar's one-`<a>`-per-region structure without changing url-less fixtures.

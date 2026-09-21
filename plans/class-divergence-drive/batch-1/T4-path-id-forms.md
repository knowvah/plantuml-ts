# T4 — fix the couple half-edge decor inversion driving `path/@id`

**Agent:** typescript-pro (sonnet) · **Depends on:** T3

## Context

A1 SB8 (8 fixtures, HIGH that no ordering mechanism is involved): the
top-level `<g>` sequence is byte-identical to the jar; the only diffs are
on the edge `<path>`'s own `id`/`@codeLine` attributes. Upstream builds
that id in `abel/Link.java:105-113 idCommentForSvg()` — three forms,
`-backto-` when reverted, a bare `ent1-ent2` when
`looksLikeNoDecorAtAllSvg`, else `ent1-to-ent2` — de-duplicated by
`svek/SvekEdge.java:1093-1105 uniq(...)` and attached at `:944`. This port
already has the full mechanism ported: `renderer-edge.ts:81-108
linkIdForSvg` implements the same three-way branch over
`looksLikeRevertedForSvg`/`looksLikeNoDecorAtAllSvg`
(`src/core/svek/extremity/link-decor.ts`), falling back to
`.from`/`.to` + `.sourceDecor`/`.targetDecor` for relationships built
outside the arrow-token grammar — couples are exactly this fallback path
(`renderer-edge.ts:85-91`'s own comment names "couples/lollipop/map rows").

`pajoka-72-reju527` shows the two association-couple half-edges' decor
INVERTED: jar `Foo-apoint5` (no decor) / `apoint5-to-Bar` (decor); ours
`Foo-to-apoint5` (decor) / `apoint5-Bar` (no decor) — exactly swapped.
Reading `class-assoc-couple.ts:261-296` finds a live contradiction between
its own doc comment and its code: the comment (`:261-264`) states "NONE at
the circle end always, the original a/b-side decor at the classifier
end", but `aEdge` (`:267-275`, A→circle) sets `sourceDecor: 'none'` at the
A end and `targetDecor: subsumed.bSideDecor` at the circle end — decor at
the WRONG end, using the WRONG side's variable (`bSideDecor` on the
A-adjacent edge). `bEdge` (`:287-294`, circle→B) has the mirror error:
`sourceDecor: subsumed.aSideDecor` at the circle end, `targetDecor:
'none'` at the B end. This is a strong textual lead, not yet confirmed
against a live render — instrument per step 1 before changing anything
(CLAUDE.md: read the method, don't fit from a diff).

## Task

1. **Confirm before fixing.** Render `pajoka-72-reju527` with
   `../tools/render-diff.mts pajoka-72-reju527`; extract the two circle
   half-edges' `path/@id` from both `.ours.svg` and `.jar.svg`; verify they
   match the report's exact inversion (`Foo-apoint5`/`apoint5-to-Bar` jar
   vs `Foo-to-apoint5`/`apoint5-Bar` ours). If the live render disagrees
   with this description, stop 3 (halt, journal, re-diagnose) rather than
   patching to match a stale reading.
2. TDD — a failing test in `class-assoc-couple.test.ts` (or wherever its
   existing tests live) asserting `aEdge.sourceDecor === (subsumed.aSideDecor
   ?? 'none')`, `aEdge.targetDecor === 'none'`, `bEdge.sourceDecor ===
   'none'`, `bEdge.targetDecor === (subsumed.bSideDecor ?? 'none')` — i.e.
   the doc comment's stated intent, not the current code.
3. Fix `class-assoc-couple.ts:267-296`: swap `aEdge`'s
   `sourceDecor`/`targetDecor` values (decor at the A end via
   `aSideDecor`, none at the circle end) and `bEdge`'s mirror (none at the
   circle end, decor at the B end via `bSideDecor`). Do not touch
   `renderer-edge.ts`'s `linkIdForSvg` — the classification logic is
   correct; only the decor VALUES fed into it were wrong.
4. Re-render the 8 SB8 fixtures
   (`cenubi-27-xova754, filoxo-23-fafi328, givofi-11-xumu978,
   popesa-39-sobe866, rakopi-21-sufa571, pajoka-72-reju527,
   tunelu-64-xica833, vonago-16-zime449`); confirm every `path/@id` and
   `@codeLine` matches the jar. Note: `cenubi` also carries `ORD8, GEO4`
   per `fixtures.md` (GEO4 is a separate B2 mechanism, out of scope here —
   don't chase its residual numeric diff).
5. **Invisible-to-the-gate findings** (A1's list of 3: link comment
   endpoint name/order, classifier comment always says "class", `apoint`
   name in comments vs `__assoc0`) do not move the survey score
   (`normalize.ts` drops comments) but are real faithfulness gaps. Fix
   ONLY if the change is zero-risk and falls out of this task's own
   write-set naturally (e.g. if fixing decor assignment also touches a
   comment-building call site already in scope); otherwise leave them and
   append one `planning/next-missions.md` line per finding, citing
   `abel/Link.java:115-120 commentForSvg()` and the affected fixture
   counts (~44 and 28 respectively) — do not expand this task's write-set
   to chase them.

## Read-set

`diagnosis/A1-order.md` SB8 section (whole, lines 280-330), "Invisible-
to-the-gate findings" section (whole, lines 312-329). Java:
`~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/Link.java:
100-140`; `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/
SvekEdge.java:940-950,1090-1110`; `~/git/plantuml/src/main/java/net/
sourceforge/plantuml/objectdiagram/AbstractClassOrObjectDiagram.java:
226-273` (`entity1ToPoint`/`pointToEntity2`, the split-edge construction
this port's `class-assoc-couple.ts` mirrors). TS: `src/diagrams/class/
class-assoc-couple.ts:255-300` (the exact contradiction); `src/diagrams/
class/renderer-edge.ts:60-108` (`linkIdForSvg`, unchanged by this task —
read to confirm no change needed there).

## Write-set

`src/diagrams/class/class-assoc-couple.ts`, its existing test file,
`plans/class-divergence-drive/measurements/t4.json`,
`plans/class-divergence-drive/decision-journal.md`, `.agent-notes/
cdd-T4.md`, `planning/next-missions.md` (append-only, invisible-finding
re-filings only, per step 5).

## Interface in (from T3)

None functionally — T3's phantom-uid fixes for the couple's `apoint`
NAME ticks (SB3) must already be numbering `pibifa`/`begico`/`besepi`
correctly before this task's fixtures are re-verified, since a wrong uid
elsewhere in the same document would otherwise mask or fake a decor-fix
result on couple fixtures.

## Acceptance criteria

- Given `pajoka-72-reju527`, when rendered, then both half-edges'
  `path/@id` match the jar exactly (`Foo-apoint5`, `apoint5-to-Bar`)
- Given `filoxo-23-fafi328, givofi-11-xumu978, popesa-39-sobe866`, then
  every `path/@id` and `@codeLine` in each matches the jar
- Given the `class-assoc-couple.test.ts` case from step 2, then it passes
  against the fixed code and would have failed against the pre-fix code
- Given `render-all.mts`, then every verdict mover is one of the 8 SB8
  slugs (or SB8 slugs move to `structural-match`/`conformant` only if
  their OTHER mechanism, e.g. `cenubi`'s GEO4, is also already resolved —
  otherwise they remain `diverged` on the unrelated residual, which is
  expected and not a regression)

## Observability

N/A — no new observable operation; SVG attribute correctness only.

## Rollback

Reversible — revert the task's commit; no persisted state.

## Quality bar

Four gates green. `npx tsx ../tools/render-diff.mts pajoka-72-reju527
filoxo-23-fafi328 givofi-11-xumu978 popesa-39-sobe866` before/after counts
pasted into the commit body. Complexity hooks apply to
`class-assoc-couple.ts`.

## Boundaries

Always: confirm the live render matches this description before patching
(step 1); cite the doc-comment/code contradiction exactly as found. Ask
first: fixing invisible-to-the-gate findings beyond what falls out of this
task's own edit. Never: touch `renderer-edge.ts`'s classification logic
(correct — only the decor VALUES were wrong); expand into ENT5/GEO4/other
mechanisms riding the same fixtures; rebuild the oracle cache (D12).

## Commit

`fix(cdd-T4): swap the couple half-edge decor assignment`

Body: quotes the doc-comment/code contradiction at
`class-assoc-couple.ts:261-296`; notes the render-confirmed inversion on
`pajoka-72-reju527` before the fix.

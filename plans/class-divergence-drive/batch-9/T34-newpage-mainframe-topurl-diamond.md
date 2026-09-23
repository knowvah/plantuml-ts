# T34 — newpage, mainframe, topurl, `<>` n-ary diamond

**Agent:** typescript-pro (sonnet) · **Depends on:** T32 (`luzive-62-
zote562`'s refusal page reuses T32's error path). **GATE (mainframe
only): every engine's suite** — `core/annotations/chrome.ts` is shared
(stop 4).

## Context

Four independent E14 gaps (`diagnosis/A2b-entity-groups.md` E14 table),
each corrected/deepened past what E14 states below — re-read the cited
bodies before editing, this is a lead, not a spec.

**`newpage`.** `bufogi-69-naba929`/`gevuci-69-fafe469`: jar renders page
1 only; we stack every page vertically (`layout.ts:408-459
layoutMultiPage`, a DELIBERATE T7 adaptation, `CHANGELOG.md`'s "class
diagram newpage" entry — upstream's own CLI also only exports page 1).
`classPlugin` declares no `getNbPages`/`renderPage`/`pageAst` (the
`PaginatedPlugin` trio, `core/dispatcher.ts:194-198`), so
`src/index.ts:300-305 assemblePagesUnscoped` always calls `plugin
.render(geo)` with the full stacked geometry — the entire bug.
`sequencePlugin` already solved this shape: it implements the trio
(`sequence/index.ts`, backed by `sequence-page.ts#sequencePageCount`/
`paginateSequence`/`sequencePageAst`, `:281-380`), and `renderSequence`
is just `renderSequencePage(geo, theme, 0)` (`sequence/renderer.ts:
459-460`) — page 0 IS its default render. Class needs the same:
`layoutMultiPage` must record each page's start (a new `ClassGeometry`
field, e.g. `pageBoundaryYs`, mirroring sequence's newpage tiles) so
`renderPage`/`pageAst` can slice it. **This changes public behavior**:
`render()`/`renderSync()`/`renderAll()` will emit one image per page,
not the T7 stack — update `CHANGELOG.md`'s "Consumer impact" line in
the SAME commit (intended, D3's exit bar, not a silent reversal).

**`mainframe`.** `jakaja-15-faze022` (jar root 4 children, ours 1).
Already parsed for EVERY engine (`core/annotations/commands.ts:102
MAINFRAME_RE`) with style defaults (`annotation-defaults.ts:119-135`,
verbatim `plantuml.skin`) — but `applyChromeSlots`
(`core/annotations/chrome.ts`, own doc comment: "warnings-less,
**mainframe-less** half... `BigFrame` unported") never draws it. This
is a SHARED-SEAM gap, not class-only — port `klimt/shape/BigFrame.java`
to `core/klimt/shape/big-frame.ts` and add an `addMainframe` slot to
`applyChromeSlots`, mirroring `addHeaderAndFooter`. Upstream call site:
`core/DiagramChromeFactory.java:275-290`.

**`topurl`.** `jinoba-14-firi471`/`laluve-92-raxu863`: `topurl` is
parsed NOWHERE (grep negative). `class-url.ts`'s doc comment CLAIMS
"every class-diagram caller constructs `new UrlBuilder(topurl,
UrlMode.STRICT)`" — aspirational, not true: `core/url/UrlBuilder.ts`
(a COMPLETE port, including the `withTopUrl` prefix at `:190-191`,
`UrlBuilder.java:140-146`) is never imported under `src/diagrams/
class/`; `parseUrlBracket` re-implements the same grammar but returns
the raw url UNPREFIXED. Do not add a THIRD grammar copy — thread
`topurl` into `parseUrlBracket` (or a thin wrapper) and apply
`UrlBuilder.ts:190-191`'s one-line rule to the result's `url`.

**`<>` n-ary diamond.** `cukaze-78-zija070` already has real plumbing
(`class-command-containers.ts:142-148` rule 5c, `kind: 'association'`,
`class-layout-helpers.ts:324 measureAssociationDiamond`) yet is STILL
`diverged` — instrument before assuming a missing feature.
`luzive-62-zote562`'s `<> StationCrossing` collides with an
ALREADY-DECLARED `class StationCrossing`; the jar refuses it
(`PSystemError`, A6 §5c) but `ensureClassifier` today silently
overwrites its kind. Route the collision through T32's refusal path
instead — do not implement general n-ary support beyond what exists.

## Task

1. Tests first, one per fixture/mechanism.
2. `newpage`: add `pageBoundaryYs`/equivalent to `ClassGeometry`
   (`class-geo-types.ts`), implement `getNbPages`/`renderPage`/
   `pageAst` on `classPlugin`, change `renderClass`'s default page-0
   behavior to match sequence's precedent. Amend `CHANGELOG.md`.
3. `mainframe`: port `BigFrame.java` to `core/klimt/shape/big-frame.ts`
   (read the Java body first — do not guess the frame's geometry), wire
   an `addMainframe` slot into `applyChromeSlots`
   (`core/annotations/chrome.ts`). Run the FULL suite before committing
   — every engine's `mainframe` fixtures (if any) move together.
4. `topurl`: add a `topurl` skinparam-key handler
   (`skinparam-key-handlers-table-a/b.ts`) → `SkinparamAccumulator
   .topurl`; thread it to `parseUrlBracket`'s call sites in the class
   engine and apply the prefix rule.
5. `cukaze-78-zija070`: instrument first (render-diff, dump the actual
   vs. jar SVG) — name the REAL residual mechanism before touching
   `class-command-containers.ts`.
6. `luzive-62-zote562`: detect the name collision in the `<>` pattern
   handler (rule 5c) — if `match[1]` already names a classifier of a
   DIFFERENT kind, raise the same refusal T32's dispatch produces for a
   malformed source, instead of calling `ensureClassifier`.
7. `.agent-notes/cdd-T34.md`: cukaze's actual mechanism; confirm whether
   any non-class fixture exercises `mainframe` (full-suite check) and
   whether it moves toward or away from the jar.

## Read-set

`src/diagrams/class/layout.ts:340-465`; `src/diagrams/class/index.ts`
(plugin definition); `src/core/dispatcher.ts:194-228`;
`src/diagrams/sequence/index.ts:19-53`; `src/diagrams/sequence/
sequence-page.ts:260-380`; `src/diagrams/sequence/renderer.ts:419-461`;
`src/index.ts:284-310`; `src/core/annotations/chrome.ts` (whole,
especially `applyChromeSlots`/`applyChrome`); `src/core/annotations/
annotation-defaults.ts:100-140`; `src/core/annotations/
commands.ts:95-110`; `src/diagrams/class/class-url.ts` (whole);
`src/core/url/UrlBuilder.ts:144-192`; `src/diagrams/class/
class-command-containers.ts:130-150`; `src/diagrams/class/
class-layout-helpers.ts:315-330`. Java: `NewpagedDiagram.java:61-162`;
`core/DiagramChromeFactory.java:137-149,275-290`; `klimt/shape/
BigFrame.java` (whole); `classdiagram/command/
CommandCreateClass.java:219`; `url/UrlBuilder.java:99-146`;
`classdiagram/command/CommandDiamondAssociation.java` (whole).
Diagnosis: `diagnosis/A2b-entity-groups.md` E14.

## Write-set

`src/diagrams/class/renderer.ts`, `src/diagrams/class/layout.ts`,
`src/diagrams/class/index.ts`, `src/diagrams/class/class-geo-types.ts`
(page-boundary field only), `src/core/annotations/chrome.ts`, a new
`src/core/klimt/shape/big-frame.ts`, `src/core/skinparam-key-handlers-
table-a.ts` or `-table-b.ts` (`topurl` key only), `src/diagrams/class/
class-url.ts`, `src/diagrams/class/class-command-containers.ts`,
`CHANGELOG.md`, their `*.test.ts` files, `.agent-notes/cdd-T34.md`,
`decision-journal.md` (append-only), `planning/next-missions.md` (if
cukaze's residual is separable, append-only).

## Acceptance criteria

- Given `bufogi-69-naba929`, when rendered via `renderSync`, then it
  emits page 1 only (`class test`, not `test2`)
- Given `jakaja-15-faze022`, then the root has 4 children including the
  mainframe frame, drawn before the diagram body
- Given `jinoba-14-firi471`/`laluve-92-raxu863`, then every `href`
  matches the jar's (`http://www.google.com/search`, `http://
  www.yahoo.com{This is Dog}` unprefixed since it is already absolute)
- Given `cukaze-78-zija070`, then it is conformant OR the journal names
  its real mechanism (not "unimplemented n-ary diamond")
- Given `luzive-62-zote562`, then it renders the SAME refusal page as
  T32's fix, with `svg/@background = #000000`
- Given the full suite, then no non-class `mainframe`/`newpage` fixture
  regresses unjournaled (stop 4)

## Observability

N/A — no new observable operations.

## Rollback

Reversible — revert the task's commits; pins are committed with the
code.

## Quality bar

`npm test` (full suite, not filtered — chrome.ts is shared), `npm run
typecheck`, `npm run lint`, `npm run build` all green. `npx tsx
tools/render-diff.mts bufogi-69-naba929 gevuci-69-fafe469
jakaja-15-faze022 jinoba-14-firi471 laluve-92-raxu863 cukaze-78-zija070
luzive-62-zote562` before/after. Files ≤500 lines, functions ≤30 NLOC,
CCN ≤10, ≤5 params.

## Boundaries

Always: read `BigFrame.java` and `NewpagedDiagram.java` in full before
porting — both are cited as leads, not measured shapes. Ask first: any
stop condition in `../README.md`; changing `render()`'s default
behavior for multi-page sources (flagged above as intended, but
confirm before committing since it touches a mission-external
CHANGELOG entry). Never: re-implement `<> name` parsing that already
works; special-case `luzive`'s exact source text instead of the general
name-collision check; touch `UrlBuilder.ts` itself (it is already
correct — only WIRE it in).

## Commit

`fix(cdd-T34): newpage pagination, mainframe chrome, topurl, diamond refusal`

Body: why — four E14 fixtures shared one root cause each (an unwired
existing subsystem, in three of four cases: sequence's pagination
precedent, chrome's already-parsed-but-undrawn mainframe, and
`UrlBuilder`'s already-correct prefix rule); only the diamond
name-collision needed genuinely new logic. Note the `render()` default
behavior change for `newpage` class sources and the amended `CHANGELOG
.md` entry.

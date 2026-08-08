# T5b — Root `<g>` attributes across every shell, and its three consumers

**Agent:** typescript-pro · **Depends on:** T3, T5 · **Commit:** `fix(T5b): hoist root <g> text attributes across all document shells`

> **Added 2026-08-08 during batch-2a, not in the original decomposition.**
> T5 surfaced it; the orchestrator verified every claim against the jar and
> the code before writing this. Two defects, one cause.

## The verified facts — do not re-derive these

**1. The jar puts rule 3's attributes on the root `<g>`, for every diagram
type.** Captured fresh from the pinned jar (`-DPLANTUML_DETERMINISTIC_TEXT=true`):

| type | fixture | root element after `<defs>` |
|---|---|---|
| class | `svg-class/bajula-59-puxi485` | `<g font-family="sans-serif" lengthAdjust="spacing">` |
| state | `svg-state/mibabe-49-kexu237` | `<g font-family="sans-serif" lengthAdjust="spacing">` |
| object | `svg-object/lapato-45-neje847` | `<g font-family="sans-serif" lengthAdjust="spacing">` |
| description | `svg-description/mofuba-79-came821` | `<g font-family="sans-serif" lengthAdjust="spacing">` |

The committed goldens still show a bare `<g>` because they predate the
size-reduction commits. **~394 of the 445 pinned goldens are class/state/
object** — if their root `<g>` stays bare, regenerating goldens cannot make
them pass.

**2. T3 broke `unwrapContentG`.** `src/core/klimt/document-shell.ts:199`
requires the klimt body to start with a **bare** `<g>` and throws
`unwrapContentG: malformed klimt SVG output` otherwise. T3's root `g` now
carries attributes, so this throws today — visible as the
`extractTopGroup: no top-level <g>…</svg> found` failure family across
`core/decoration/symbols-*`, `core/svek/*`, `core/klimt/*`, and
`description/renderer`. **This is a structural break, not stale-golden
churn** — distinguish it from the expected ADR-5 redness.

**3. Two more consumers assume a bare marker.**
`src/diagrams/class/renderer-shell.ts:68` and `:107` both do
`const marker = '<g>'; … body.startsWith(marker) ? …` to splice in the
document background rect and the diagram border. Once the root `<g>` gains
attributes these silently no-op — no error, just a missing rect. Silent is
worse than throwing; make sure whatever you do here cannot fail quietly.

**4. `assembleSvg` (`src/index.ts:181-186`) has four paths**, and the root
`<g>` lives inside `fragment.body` for all of them:
`assembleKlimtShell`, `assembleClassShell`, `assembleStateShell`, and
`svgRoot` for every other engine.

**5. T5 put the attributes in the wrong place for the `svgRoot` path.**
`src/core/svg.ts#svgRoot` (~:472-475) emits them on the `<svg>` element.
The jar puts them on the root `<g>`. Attribute inheritance makes the
rendering equivalent, but byte comparison against a jar golden does not
care about equivalence.

## Read-set

- `src/core/klimt/document-shell.ts` — `unwrapContentG` (:199),
  `extractFlatContent` (:214), `assembleDocumentShell`
- `src/diagrams/class/renderer-shell.ts` — the two `'<g>'` markers,
  `assembleClassShell` (:114)
- `src/diagrams/state/renderer-shell.ts` — `assembleStateShell` (no `'<g>'`
  marker today; confirm)
- `src/index.ts:181-186` — the four-way dispatch
- `src/core/svg.ts` — `svgRoot`, `group`
- `.agent-notes/svg-output-size-reduction-measured.md` — rule 3

## Write-set

- `src/core/klimt/document-shell.ts`
- `src/diagrams/class/renderer-shell.ts`
- `src/diagrams/state/renderer-shell.ts`
- `src/core/svg.ts` — **only** the `svgRoot` root-attribute placement
- the corresponding test files

## Task

Make every one of the four `assembleSvg` paths emit a root `<g>` carrying
`font-family="sans-serif"` and `lengthAdjust="spacing"`, exactly as the jar
does, and fix the three consumers that assume the marker is bare.

Find the single place each path's root `<g>` is produced and put the
attributes there — **one definition of the root-`<g>` markup, referenced by
all four paths**, not four string literals that can drift. The two
attribute values already exist as constants in `src/core/svg.ts`
(`ROOT_FONT_FAMILY`, `ROOT_LENGTH_ADJUST`, added by T5); reuse them rather
than adding a second pair.

`unwrapContentG` must accept a root `<g>` **with** attributes while still
rejecting genuinely malformed input — do not relax it into something that
silently accepts anything. Its error message exists because a malformed
klimt document used to fail far downstream.

For the two `renderer-shell.ts` splice sites, prefer matching the root
`<g>` open tag structurally over a longer literal — a literal that has to
match an attribute list is the same trap one refactor later.

## Acceptance criteria

1. Given any class, state, object or description render, the assembled
   document's first element after `<defs>` is
   `<g font-family="sans-serif" lengthAdjust="spacing">`.
2. Given a klimt document whose root `<g>` carries attributes, when
   `unwrapContentG` runs, then it returns the inner markup; given input
   with no root `<g>` at all, then it still throws.
3. Given a class diagram with a document background color, then the
   background rect is still spliced in as the root `<g>`'s first child —
   prove this with a test that would have caught the silent no-op.
4. Given the same for the diagram border (`renderer-shell.ts:107`).
5. Given an `svgRoot`-path render, then `font-family`/`lengthAdjust` are on
   the root `<g>`, not on `<svg>`.

## Quality bar

```sh
npm run typecheck        # must pass
npm run lint             # must pass
```
Never pipe a gate. Cold-tree `npm test` is expected red until the goldens
are regenerated (ADR-5) — but the `extractTopGroup` / `unwrapContentG`
failure family must be **gone**, because that one is a real break, not
stale goldens. Report the failure count before and after your change.

Complexity limits are hook-enforced: file ≤500 lines, function ≤30 NLOC,
cyclomatic ≤10, ≤5 params. `svgRoot` is already at the 5-param cap — do not
add a parameter to it.

## Boundaries

- **Always:** match the jar's attribute order and spelling exactly
  (`font-family` then `lengthAdjust`); one shared definition of the root
  `<g>` markup.
- **STOP and report:** if a path's root `<g>` turns out to be produced
  somewhere outside this write-set.
- **Never:** touch `svg-graphics-core.ts` / `svg-graphics-elements.ts`
  (T3/T4 own them); regenerate goldens; run any `git` command.

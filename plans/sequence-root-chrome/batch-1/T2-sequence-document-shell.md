# T2 — route `SEQUENCE` through the klimt document shell

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is canonical. Read the Java method body before writing.

`assembleSvg` (`src/core/assemble-svg.ts:326-333`) already routes any
`RenderFragment` carrying `diagramType` to `assembleDocumentShell` — jar's
shared root-attribute/prolog/defs shell. Class, state, json, yaml and hcl use
it; sequence does not, so it falls through to the generic `svgRoot` and emits
a bare `<svg>` root with `<marker>` defs. This task opens the route. It does
**not** wire the renderer (T3) — the dispatch case is unreachable until then,
and that is expected.

`svgRoot` (`src/core/svg.ts:487-514`) is what supplies sequence's content
`<g>`, its markers and its background rect today. `assembleDocumentShell`
supplies none of those, and `withRootGroupAttributes`
(`document-shell.ts:103-107`) only upgrades a body that is *already* a bare
`<g>`. Without the finalize step below, a sequence document would ship with
no content group at all.

## Task

Add `DIAGRAM_TYPE_SEQUENCE` and `finalizeSequenceBody` to
`src/core/assemble-svg.ts`, dispatched from `finalizeShellFragment`
(`:298-309`), mirroring `finalizeStateBody` (`:196-199`) and
`maybeStateBackgroundRect` (`:186-194`) with a sequence-local default
background constant. Extend `tests/unit/core/assemble-svg.test.ts`.

Write the tests first (TDD).

## Read-set

- `src/core/assemble-svg.ts:157-199` — `finalizeClassBody`,
  `maybeStateBackgroundRect`, `finalizeStateBody` (the pattern to mirror)
- `src/core/assemble-svg.ts:298-333` — `finalizeShellFragment`, `assembleSvg`
- `src/core/klimt/document-shell.ts:80-170` — `withRootGroupAttributes`,
  `assembleDocumentShell`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/TextBlockExporter.java:292-294`
  — `withRootAttribute("data-diagram-type", ...)`
- `../decisions.md#d1`

## Interface contract — consumed by T3

`RenderFragment.diagramType === 'SEQUENCE'` is honoured by `assembleSvg`.
T3 must set that field and must **not** pre-wrap its body in a `<g>` —
`bodyWrapped` stays whatever `applyChrome` decided.

## Evidence for the background rule — verify, do not re-derive

The jar's three-way behaviour on sequence goldens, measured 2026-08-23,
is identical to state's. Confirm each against the cached oracle before
relying on it:

| Fixture | root `style` | content `<g>` first child |
|---|---|---|
| `dakake-85-nemi992` | `background:#FF0000;` | `<rect x="0" y="0" width="114" height="313" fill="#F00" style="stroke:none;"/>` |
| `bakire-18-peku988` | `background:#FFFFFF;` | none |
| `badoba-13-cuba151` | *(no `background:`)* | none |

Goldens live at `test-results/dot-cache/sequence/<slug>/in.svg`.

## Acceptance criteria

1. Given a fragment with `diagramType:'SEQUENCE'` and `bodyWrapped` unset,
   when `assembleSvg` runs, then the body is wrapped in one bare `<g>` which
   `withRootGroupAttributes` upgrades to `ROOT_GROUP_OPEN`
2. Given `background:'#FF0000'`, then a background `<rect>` matching
   `dakake-85-nemi992`'s is the content group's first child
3. Given the default white background, then no background rect is emitted
4. Given `background:'transparent'`, then no rect, and the root `style`
   omits `background:` entirely
5. Given `diagramType` of `'CLASS'`, `'STATE'`, `'JSON'`, `'YAML'`, `'HCL'`
   or `undefined`, then `assembleSvg`'s output is byte-identical to before
   this change

AC5 is the one that matters most — it is the unit-level half of the
cross-engine guard T5 completes at corpus scale.

## Quality bar

All four gates green. `src/core/assemble-svg.ts` is 331 lines against the
hook's 500-line cap, so there is room; the per-function limits (30 NLOC /
10 CCN / 5 params) still apply to what you add.

## Observability

N/A — no new observable operations.

## Rollback

Reversible. Additive dispatch case; unreachable until T3 sets the field.

## Boundaries

- **Always:** keep the change additive — a new case plus a new function
- **Never:** alter `finalizeClassBody`, `finalizeStateBody`,
  `finalizeJsonFragment`, or `assembleDocumentShell`; import anything from
  `src/diagrams/**` into this file (decisions.md D1 in the A5/T4 sense —
  core does not import engines)
- **Ask first:** if mirroring state's shape requires touching the shared
  helpers rather than adding beside them

## Commit

One commit: `feat(T2): route SEQUENCE through the klimt document shell`

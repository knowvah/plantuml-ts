# T8 — `assemble-svg`: one `diagramType`, no engine imports

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML (`~/git/plantuml`
is the spec). Pure SVG, vitest, 500-line cap. `src/core/assemble-svg.ts:10-13`
imports four engine shell assemblers and `:58-64` switches on four boolean/
string flags (`klimtShell`, `classShell`, `stateShell`, `jsonShell` —
`core/dispatcher.ts:68-125`). All four end in the SAME
`core/klimt/document-shell.ts:128#assembleDocumentShell(fragment,
diagramType)`; what differs per engine is body preparation done BEFORE the
shell (class: `renderer-shell.ts` background-rect + border-rect splice via
`layout-ink-extent`; json: colour canonicalisation + splice; state: `<g>`
wrap; description: nothing). Upstream: ONE exporter, `core/TextBlockExporter
.java:293` `withRootAttribute("data-diagram-type", diagramType.name())`; the
diagram supplies its `DiagramType`, nothing else. Decision D2.

## Task

1. `core/dispatcher.ts`: replace the four flags with `diagramType?: string`
   (doc: the `data-diagram-type` value; when set, core assembles via
   `assembleDocumentShell`; `@see TextBlockExporter.java:293`). Keep
   `bodyWrapped`, `preChromeWidth/Height`, `documentBackgroundRect`,
   `diagramBorderColor` ONLY if a producer still needs them after step 3;
   otherwise remove and journal each.
2. `core/assemble-svg.ts`: `completeSvg` → as is; `diagramType` set →
   `assembleDocumentShell(fragment, fragment.diagramType)`; else `svgRoot`.
   Delete the four imports. Keep the doc's history paragraphs but rewrite the
   mechanism paragraph.
3. Each engine prepares its own body then sets `diagramType`:
   - description `renderer.ts:275-276`: `diagramType: 'DESCRIPTION'` (check
     the constant `renderer.ts` already uses for `assembleKlimtShell`), delete
     `assembleKlimtShell`.
   - class `renderer.ts:483` (+ `renderer-edge.ts` if it reads a flag): call
     what `renderer-shell.ts#assembleClassShell` did to the BODY (background
     rect / border rect splice) inside `renderer.ts` (or keep `renderer-shell
     .ts` as a body-prep helper the ENGINE calls), then set `diagramType:
     'CLASS'`, `bodyWrapped: true` as needed for `assembleDocumentShell`.
   - state `renderer.ts:316`: same with `assembleStateShell`'s `<g>`/bg-rect
     logic; `diagramType: 'STATE'`.
   - json `index.ts:75`, yaml `index.ts:87`, hcl `index.ts:44`: body prep from
     `json/renderer-shell.ts#assembleJsonShell` (canonical colour + splice)
     moves into `json/renderer.ts`'s return or a json-side helper the three
     plugins call; `diagramType: DIAGRAM_TYPE_JSON|YAML|HCL`.
   `renderer-shell.ts` files become engine-side helpers (called by the
   engine) or are folded into the renderers — either way core does not import
   them.
4. Verify `src/index.ts` exports none of the removed flags (grep); `core/
   annotations/chrome.ts:279` comment mentions `assembleClassShell` — update
   the comment.
5. Tests: move the four shell tests to test the engine renderers' returned
   fragment (`diagramType` + prepared body) and one core test that
   `assembleSvg` routes `diagramType` to `assembleDocumentShell`.
6. Manifest: EMPTY across ALL engines (full run) — this task touches every
   shell.

## Write-set

`src/core/assemble-svg.ts`, `src/core/dispatcher.ts` (fragment type block),
`src/core/annotations/chrome.ts` (one comment), `src/diagrams/class/{renderer,
renderer-edge,renderer-shell}.ts`, `src/diagrams/description/renderer.ts`,
`src/diagrams/state/{renderer,renderer-shell}.ts`, `src/diagrams/json/
{renderer-shell,renderer,index}.ts`, `src/diagrams/yaml/index.ts`, `src/
diagrams/hcl/index.ts`, their tests.

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/TextBlockExporter.java:280-330`
- `src/core/assemble-svg.ts` (whole, 65), `src/core/dispatcher.ts:45-125,
  180-190`, `src/core/klimt/document-shell.ts:44-180`
- the four shell files (whole; 145/79/157 lines + `description/renderer.ts:
  260-298`), the seven producer sites listed in step 3
- `decisions.md#d2`

## Architecture decisions

D2 locked (field name `diagramType`; core does the shell; engines prep body).

## Interface contract

`RenderFragment.diagramType?: string`; producers set it; `assembleSvg`
consumes it. No other task depends on this.

## Acceptance criteria

- Given `core/assemble-svg.ts` and `core/dispatcher.ts`, then neither imports
  `../diagrams/**` and `klimtShell|classShell|stateShell|jsonShell` appear
  nowhere in `src/`.
- Given the full baseline manifest, then `0 fixtures differ` (every engine's
  root attributes, prolog, defs and body bytes unchanged).
- Given `oracle/goldens/svg-*` ratchets and `dot.golden.ratchet`, then all
  pins hold.

## Quality bar

4 gates + full manifest + ratchets green. Commit
`refactor(T8): assemble-svg dispatches on RenderFragment.diagramType`.

## Observability

N/A.

## Rollback

Reversible.

# T1 — ONE `Display.getWithNewlines` port

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML (`~/git/plantuml`
is the spec; read the Java method body before acting; every constant carries
its upstream `file:line`; never fit a value). Pure SVG, vitest, 500-line hook
cap. `klimt/creole/Display.java:262-343` `getWithNewlines(Pragma, String)`
(the `\n`/`\l`/`\r`/`\t`/`\\` escape scan that also sets the block's
`naturalHorizontalAlignment`) and `:233-258` `getWithNewlines3(CharSequence)`
(the pragma-free `\n`/`\t`/`\\` splitter) have **three** ports here:

| # | where | what |
|---|---|---|
| 1 | `src/core/klimt/creole/DisplayNewlines.ts:91` `getWithNewlines3`, `:281` `parseWithNewlines` (+ `Display.ts:193-213` static wrappers) | faithful, in the faithful place |
| 2 | `src/diagrams/class/class-edge-label-lines.ts:66` `resolveLabelEscape`, `:75` `splitEdgeLabelLines` (re-exported by `class-layout-edge-labels.ts:87-90`) | independent re-derivation of #1's escape scan returning `{lines, align}` |
| 3 | `src/core/edge-label-box.ts:34` `splitCreoleLines` = `text.split(/\\n|\n/)` | a third, simpler one (also splits on REAL newlines) |

`edge-label-box-backlog` T5 imported #2 from `core/edge-label-box.ts:22`, so
`src/core/` now depends on `src/diagrams/class/` for something #1 already
does. That inverted import is the defect this task removes; the mechanism is
retiring #2 and #3.

## Task

1. Read `Display.java:223-343` and both ports (#1 whole; #2 `class-edge-label-
   lines.ts:1-116`). List every behavioural difference between #2 and
   `parseWithNewlines` (alignment tracking, `\t`, `\\`, unknown escapes,
   trailing behaviour). If #2 is a strict subset of #1: retire it. If #2 does
   something #1 does not, the Java decides which is right — cite the line.
2. In `core/klimt/creole/` add ONE thin adapter (in `Display.ts` or
   `DisplayNewlines.ts` — whichever stays under 500 lines) exposing what the
   engines need without importing `Display`'s heavy deps: e.g.
   `splitDisplayLines(text): { lines: string[]; align: 'center'|'left'|'right' }`
   built on `parseWithNewlines(Pragma.createEmpty(), text)`, and re-export
   `getWithNewlines3`. Name and doc it as the ONE entry; `@see Display.java:
   262-343`.
3. For EVERY caller of #3 (`core/edge-label-box.ts:269`, `state/state-
   sizing.ts:40,57,178-310` and its re-export consumers `state-composite-
   {header,sizing,cluster}.ts`, `description/link-edge-attrs.ts:26`) open the
   upstream site that produces those strings and decide: `getWithNewlines`
   (pragma, alignment-aware) or `getWithNewlines3` (plain). Where our AST has
   ALREADY joined lines with a real `\n` (a port artefact, not upstream text),
   pre-split on real `\n` at the caller and say so in a comment; do not add
   real-newline splitting to the core port.
4. Rewire the #2 callers (`class-edge-geo.ts:16` via `class-layout-helpers`,
   `class-stereotype-layout.ts:12`, `class-magic-arrow.ts:46`, `class-layout-
   header-geo.ts:19`, `class-layout-edge-labels.ts:30,87-90,269`,
   `core/edge-label-box.ts:22,353`) to the core adapter. Delete
   `resolveLabelEscape`/`splitEdgeLabelLines`; keep `wrapPlainTextLine` (not
   a Display port) where it is. Delete `splitCreoleLines`.
5. Move/adapt the tests of #2 and #3 (`class-edge-label-lines.test.ts`,
   `edge-label-box.test.ts` cases) into the core adapter's test; keep every
   assertion.
6. Manifest: expected EMPTY. If a fixture differs, it must be one whose input
   carries an escape #3 mishandled (`\l`, `\r`, `\t`, `\\`) AND the new
   output must match/move toward `test-results/dot-cache/<type>/<slug>/in.svg`
   (jar) — journal it per fixture with the golden diff; otherwise STOP
   (README stop 4).

## Write-set

`src/core/klimt/creole/Display.ts` (499 — do not grow past 500),
`src/core/klimt/creole/DisplayNewlines.ts` (333), `src/core/edge-label-box.ts`,
`src/diagrams/class/class-edge-label-lines.ts`, `src/diagrams/class/class-
layout-edge-labels.ts`, `src/diagrams/class/{class-edge-geo,class-stereotype-
layout,class-magic-arrow,class-layout-header-geo,class-layout-helpers}.ts`,
`src/diagrams/state/{state-sizing,state-composite-header,state-composite-
sizing,state-composite-cluster}.ts`, `src/diagrams/description/link-edge-
attrs.ts`, and their `*.test.ts` (+ a new
`tests/unit/core/klimt/creole/display-lines.test.ts` if no colocated test
exists).

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/Display.java:223-343`
- Upstream producers of the strings each #3 caller splits — start from
  `statediagram/command/CommandCreateState.java`, `CommandAddField.java`
  (state description lines) and `svek/SvekEdge.java`/`GraphvizImageBuilder`
  label paths; cite what you find.
- `src/core/klimt/creole/DisplayNewlines.ts:85-310`, `Display.ts:180-215`
- `src/diagrams/class/class-edge-label-lines.ts:1-116`, `src/core/edge-label-
  box.ts:1-45,260-275,345-360`, `src/diagrams/state/state-sizing.ts:35-60`
- `decisions.md#d1`, `#d6`; `README.md` exit bar 2, stop 4

## Architecture decisions

D1 (core placement), D6 (manifest is the proof). `Pragma` handling: use
`Pragma.createEmpty()` exactly as `Display.java:224` does for the quark path
unless the caller already has a pragma.

## Interface contract

Core adapter signature (used later by T6/T9 tests only, no other task depends
on it): `splitDisplayLines(text: string): { lines: string[]; align:
'center' | 'left' | 'right' }` and `getWithNewlines3` re-export.

## Acceptance criteria

- Given the tree after T1, when grepping `src/`, then `splitEdgeLabelLines`,
  `resolveLabelEscape`, `splitCreoleLines` do not exist and no `src/core/**`
  file imports `src/diagrams/**` except `assemble-svg.ts` (T8's debt).
- Given `\\l`, `\\r`, `\\t`, `\\\\` and unknown-escape inputs, when the core
  adapter runs, then lines/align equal `Display.java:262-343`'s result (test
  cites the line for each case).
- Given the baseline manifest, when re-run (full), then `0 fixtures differ` —
  or each differing fixture is journalled jar-ward with its golden evidence.
- Given `dot-sync-report` ×5, then EQUAL counts unchanged.

## Quality bar

4 gates + manifest + dot-sync green. Commit
`refactor(T1): one Display.getWithNewlines port; retire class/core copies`
(body: the #2/#3 diff findings and each caller's upstream mapping).

## Observability

N/A — no new observable operations.

## Rollback

Reversible (revert commit).

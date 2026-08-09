# T4 — route the json family through the jar's document shell

## Context

Mission G1d unified the chrome DOM shape across "ALL diagram types" — one
top-level content `<g>`, annotations nested in jar stacking order, coordinates
baked rather than transformed. Measurement says json was not included: json
output is missing six root attributes the jar emits, carries a 13-child `<defs>`
the jar does not have, and puts `font-family`/`lengthAdjust` on the root `<g>`
where the jar has neither. Class fixtures show none of these.

The 13-child `<defs>` is `src/core/svg.ts#svgRoot` auto-embedding every
arrowhead marker. Mission D14 hit the identical symptom on `@startdot` — but
fixed it by ceasing to use the shell entirely, which is available to a
passthrough and **not** to json. json needs a shell; it needs the correct one.

## Task

Make json, yaml, and hcl emit the jar's document shell. Close as many of the
mechanisms T3 attributed to shell assembly as the write-set allows; carry the
rest forward with a named reason.

## Read-set

- `plans/a5-json-family-conformance/baseline.md` — **T3's output. Read this
  first**; it says which mechanisms are shell-shaped and which are not.
- `src/index.ts#assembleSvg` and `#applyAnnotationChrome` — the shell dispatch,
  including the `klimtShell` / class-shell branches that already exist per
  engine.
- `src/core/svg.ts#svgRoot` — the generic shell and its automatic `<defs>`.
- `src/diagrams/class/renderer-shell.ts#assembleClassShell` — the precedent for
  an engine supplying its own jar-faithful shell (G2 N1).
- `src/diagrams/json/renderer.ts` — what json emits today.
- `~/.../jsondiagram/TextBlockJson.java` and `JsonDiagram.java` — what the jar
  wraps json output in.
- One cached golden, e.g. `test-results/dot-cache/json/babico-87-soxo095/in.svg`
  — the target shape, read directly rather than inferred.

## Write-set

- `src/diagrams/json/renderer.ts`
- `src/index.ts` — **shell dispatch only.** This file is a pre-existing
  >500-line complexity-hook violation; keep the change minimal and additive.
  If your edit trips the hook, stop and log it rather than refactoring
  `src/index.ts` — that refactor is explicitly out of scope.
- `oracle/goldens/svg-{json,yaml,hcl}/ratchet.json` — pin any fixture that
  reaches zero diffs.
- `oracle/goldens/svg-{json,yaml,hcl}/<slug>/{in.puml,golden.svg}` for pinned
  fixtures.

Do **not** touch `src/diagrams/json/layout.ts` — that is Batch 3 (ADR-1), and
touching it here would confound the shell result with the layout rewrite.

## Architecture decisions (locked — see `decisions.md`)

- **ADR-4:** yaml and hcl are in scope for this task, not deferred. They share
  the renderer; verify all three.
- **ADR-1** is NOT yours to implement. If a shell diff appears to require the
  layout change, record it and stop — do not start Batch 3 early.

## Interface contracts

No new exported API. If json needs its own shell assembler, mirror the class
precedent exactly:

```ts
// src/diagrams/json/renderer-shell.ts  (only if measurement requires it)
export function assembleJsonShell(fragment: RenderFragment): string;
```

dispatched from `assembleSvg` by a discriminant on `RenderFragment`, the way
`klimtShell` and the class shell already are — not by a type check on the AST.

## Acceptance criteria

1. **Given** any cached json fixture, **when** rendered through
   `renderFixtureJson`, **then** the root element carries `version`,
   `contentStyleType`, `preserveAspectRatio`, `zoomAndPan`, `xmlns:xlink`, and
   the background the jar emits.
2. **Given** a json fixture with no arrowhead-consuming content, **when**
   rendered, **then** its `<defs>` child count matches the jar's rather than
   carrying 13 unused markers.
3. **Given** the same fixture, **when** compared to its golden, **then** the
   root `<g>` carries neither `font-family` nor `lengthAdjust` unless the jar's
   does.
4. **Given** yaml and hcl fixtures, **when** rendered, **then** they show the
   same shell improvements — verified by assertion, not assumed from sharing a
   renderer.
5. **Given** any fixture that reaches zero diffs, **when** the batch ends,
   **then** it is pinned in its type's `ratchet.json` with its golden committed.
6. **Given** the other five ratchets (description, class, object, state, dot),
   **when** the suite runs, **then** none regresses.

## Observability requirements

N/A — no new observable runtime operations; this is output-format work.

## Rollback

**Reversible.** Renderer and dispatch changes; revert the commit. Pinned
goldens revert with it. No data migration.

## Quality bar

- Four gates green, exit codes captured directly — **never pipe a gate.**
- Diagnose each mechanism to a `file:line` before editing. Never ship a fitted
  constant: if a number is needed, it comes from the Java or from a jar-verified
  measurement, and the source is named in a comment.
- Every ratchet addition is shrink-only — a pinned fixture never comes back out.

## Boundaries

- **Always:** state which of T3's mechanisms you closed and which you did not,
  with a reason per unclosed one.
- **Ask first:** before adding a new exported symbol to `src/index.ts`.
- **Never:** modify `src/diagrams/json/layout.ts`, `src/core/graph-layout.ts`,
  or any other engine's renderer.
- **Never:** run `git commit` or any state-mutating git command.

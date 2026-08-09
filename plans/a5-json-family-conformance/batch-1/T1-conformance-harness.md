# T1 — svg-json / yaml / hcl conformance harness

## Context

plantuml-ts is a faithful TypeScript port of PlantUML (Java). The Java at
`~/git/plantuml` is the spec. Tests are vitest; the repo holds a per-diagram-type
SVG-conformance harness that has been built four times already — for
description, class, object, and state — plus a fifth, simpler one for dot.

This task builds the fifth-and-sixth-and-seventh instance of that harness, for
the json family. It writes **no production code**: it is the measuring
instrument Batch 2 takes its baseline with.

## Task

Create the SVG-conformance harness for `json`, `yaml`, and `hcl`:

1. `render-fixture-json.ts` — a low-level render helper routing
   `parseJson → layoutJson → renderJson`, injecting ONE measurer instance into
   both the layout and render stages.
2. Three ratchet suites, one per type, each reading its own
   `oracle/goldens/svg-<type>/ratchet.json`.
3. Three goldens directories, each with a `README.md` and an **empty**
   `ratchet.json` (`{"fixtures": []}`).
4. A census dispatch arm so
   `npx tsx scripts/svg-conformance-census.ts json yaml hcl` works.

## Read-set

- `tests/oracle/svg-conformance/render-fixture-state.ts` — **the template.**
  Its doc comment explains exactly which class-specific steps carry over and
  which do not; do the same reasoning for json and write it down.
- `tests/oracle/svg-conformance/state.golden.ratchet.test.ts` — AC1/AC2/AC3
  structure and the graceful-skip-on-empty-manifest pattern.
- `tests/oracle/svg-conformance/dot.golden.ratchet.test.ts` — the precedent for
  a ratchet with **no** `parity-*.json` and no AC3. Read its doc comment before
  deciding what to omit here.
- `oracle/goldens/svg-dot/README.md` — the precedent for documenting a
  structural omission rather than silently leaving it out.
- `scripts/svg-conformance-census.ts:203-222` (`renderFixtureFor`) — the
  dispatch point.
- `src/diagrams/json/index.ts` — the plugin's parse/layout/render wiring.
- `src/diagrams/{yaml,hcl}/index.ts` — confirm both route to `layoutJson`.

## Write-set

Create:
- `tests/oracle/svg-conformance/render-fixture-json.ts`
- `tests/oracle/svg-conformance/json.golden.ratchet.test.ts`
- `tests/oracle/svg-conformance/yaml.golden.ratchet.test.ts`
- `tests/oracle/svg-conformance/hcl.golden.ratchet.test.ts`
- `oracle/goldens/svg-json/{README.md,ratchet.json}`
- `oracle/goldens/svg-yaml/{README.md,ratchet.json}`
- `oracle/goldens/svg-hcl/{README.md,ratchet.json}`

Modify:
- `scripts/svg-conformance-census.ts` — dispatch arm + usage line only.

Touch nothing else. In particular **do not** modify `src/diagrams/json/**` —
that is Batch 2/3 territory, and a change here would invalidate the baseline
this task exists to enable.

## Architecture decisions (locked — see `decisions.md`)

- **ADR-3:** SVG-only oracle. There is **no** `parity-json.json` and **no AC3
  eligibility gate** — the DOT-equal precondition the sibling suites gate on
  cannot exist for this family, because the jar emits no DOT for it. Follow
  `dot.golden.ratchet.test.ts`'s precedent: omit AC3 and say why in the doc
  comment. Do not invent an empty parity file to keep the shape symmetrical.
- **ADR-4:** all three types get their directories and suites now, not later.
- yaml and hcl share `layoutJson`, so `render-fixture-json.ts` must dispatch on
  the block type rather than hardcoding `parseJson`.

## Interface contracts

`render-fixture-json.ts` exports:

```ts
export function renderFixtureJson(
  markup: string,
  measurer: StringMeasurer,
  options?: { includeStore?: IncludeStore },
): string;
```

Returns a complete SVG string. Consumed by all three ratchet suites and by
`renderFixtureFor` in the census.

`ratchet.json` shape (identical to the existing five):

```json
{ "fixtures": [ { "slug": "…", "addedAt": "YYYY-MM-DD", "source": "…" } ] }
```

## Acceptance criteria

1. **Given** an empty `ratchet.json`, **when** the json/yaml/hcl ratchet suites
   run, **then** each skips gracefully with a documented placeholder assertion
   rather than failing.
2. **Given** a cached fixture, **when** `renderFixtureJson` runs with a
   `DeterministicMeasurer`, **then** it returns a complete SVG string and the
   same measurer instance reached both the layout and render stages.
3. **Given** `npx tsx scripts/svg-conformance-census.ts json yaml hcl`, **when**
   it runs, **then** it reports bucket counts for all three types without
   throwing.
4. **Given** a `yaml` or `hcl` fixture, **when** it goes through
   `renderFixtureJson`, **then** it is parsed by its own type's parser and laid
   out by `layoutJson` — verified by an assertion, not by inspection.
5. **Given** the whole repo, **when** the four gates run, **then** all four pass.

## Observability requirements

N/A — no new observable runtime operations. This is offline test
infrastructure.

## Rollback

**Reversible.** Test/oracle-only additions plus one script dispatch arm; revert
the commit.

## Quality bar

- Four gates green: `npm test`, `npm run typecheck`, `npm run lint`,
  `npm run build`. Capture exit codes directly — **never pipe a gate.**
- Every doc comment states what it does AND what it deliberately omits, in the
  style of the existing five. A reader who has not seen this mission should be
  able to tell why there is no AC3 here.

## Boundaries

- **Always:** mirror the existing harness's naming and file layout.
- **Never:** run `git commit`, `git checkout`, or any state-mutating git command
  — parallel agents share this worktree and the orchestrator commits.
- **Never:** modify `src/**`. If you believe production code must change to make
  the harness work, stop and log it — that is a finding for Batch 2, not a fix
  for here.

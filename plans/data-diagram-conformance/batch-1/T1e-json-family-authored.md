# T1e — json/yaml/hcl authored fixtures + the structural gate's authored root (D7)

Agent: `typescript-pro` (sonnet), worktree `ddc-T1e`. Commit:
`test(json): authored json/yaml/hcl fixtures under the structural gate (T1e)`.
Read [../task-contract.md](../task-contract.md) first.

## Context
The corpus is the work queue and not a ceiling. `oracle/goldens/json-family-structural.json`
gates only `test-results/dot-cache/<type>/` rows (`json-family-structural.ts:60-62,108-120`);
there is no authored root for this family (wbs has one:
`render-fixture-wbs.ts` `AUTHORED_WBS_ROOT`). Upstream features with no
corpus row must get fixtures and oracles.

## Task
1. Author under `tests/fixtures/{json,yaml,hcl}/<slug>.puml` (flat; oracle
   `<slug>.svg` from `scripts/oracle-render.sh <ABSOLUTE out-dir> <puml>`,
   never a hand-typed jar). One construct per fixture, slug = construct.
   json (≥ 18): scalar root (`"x"`, `42`, `true`, `null`), empty object,
   empty array, array root, nested arrays, `null`/`true`/`false` leaves
   (`TextBlockJson.getShortString` glyphs), unicode/CJK/emoji keys, key
   with `\n`, very long value (`MaximumWidth` via `<style>`), deep nesting
   (6 levels), duplicate keys (plain, no highlight), `#highlight` on an
   array index, `#highlight` with `<<stereotype>>`, `#highlight` on a
   nested path, `title` + `caption`, `header`/`footer`/`legend`, `scale 1.5`,
   `scale max 200 width`, `skinparam handwritten true`, `<style>` for
   `jsonDiagram { node { … } header { … } separator { … } highlight { … } arrow { … } }`,
   `!theme amiga`, malformed json ("Your data does not sound like JSON data").
   yaml (≥ 10): block scalars `|` and `>`, comments, list of maps, map of
   lists, quoted keys with `:`, empty values, `#highlight`, `title`,
   anchors/aliases if the jar parser accepts them (else drop with the Java
   reason), nested `{{yaml}}` stays OUT (accepted divergence).
   hcl (≥ 8): nested blocks, labelled blocks, arrays, maps, functions
   (`var.x`, `"${a}"`), heredoc, comments `#` and `//` and `/* */`,
   `title`, `<style>` (ignored by the jar: `HclDiagramFactory.java:86-92`).
2. `json-family-structural.ts`: add `AUTHORED_ROOT = tests/fixtures/<type>/`;
   `structuralDiffs(type, slug)` reads the cached pair when it exists, else
   the authored pair; export `listAuthoredSlugs(type)`; assert an authored
   slug never collides with a cached one. The test walks both roots:
   every clean row must be in the manifest `clean` list OR be reported
   (test output) as "clean, unpinned" — a clean authored row NOT in the
   manifest must not fail the gate (the orchestrator appends at the close).
   Manifest keys stay `<type>/<slug>`. Manifest file itself: untouched.
3. `fixtures.md`-ready hand-back: one line per slug — construct, Java it
   exercises, structural diff count, firstDiff.

## Write-set
`tests/fixtures/json/*`, `tests/fixtures/yaml/*`, `tests/fixtures/hcl/*`,
`tests/oracle/svg-conformance/json-family-structural.ts`,
`tests/oracle/svg-conformance/json-family-structural.test.ts`.

## Read-set
`json-family-structural.ts`, `json-family-structural.test.ts`,
`render-fixture-wbs.ts:1-80`, `render-fixture-json.ts:60-120`,
`~/git/plantuml/src/main/java/net/sourceforge/plantuml/jsondiagram/{JsonDiagram,TextBlockJson,JsonDiagramFactory}.java`,
`yaml/parser/YamlParser.java`, `hcl/HclParser.java`,
`tests/fixtures/unwind-U1/`, `tests/fixtures/unwind2-S2/` (existing json-family fixtures: do not duplicate them).

## Acceptance
- Given the fixture dirs, then ≥ 18 json, ≥ 10 yaml, ≥ 8 hcl `.puml` each with a `.svg` rendered by `oracle-render.sh` (the svg carries the jar's `data-diagram-type`); a jar error page is stop 13 after one fixture fix.
- Given the extended gate, when it runs on main's manifest, then every existing `clean`/`divergent` row behaves as before (no change in pass/fail) and each authored row is listed with its diff count.
- Given `isPositionalDiff`, then it is unchanged (byte-diff the function).
- `npx vitest run tests/oracle/svg-conformance/json-family-structural.test.ts --maxWorkers=2 --coverage.enabled=false` green.

Observability: N/A. Rollback: Reversible.

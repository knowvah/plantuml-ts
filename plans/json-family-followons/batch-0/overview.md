# Batch 0 — branch, tooling, authored fixtures + pins

Serial: T0a (branch + tooling + b0 baseline), then T0b in a worktree. The close
seeds the authored rows into both gates (D4) at their PRE-fix values and
rewords the three stale manifest notes (item 6). Pin files are
orchestrator-owned, so the seeding is the close's, not T0b's.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T0a](T0a-branch-and-tooling.md) | branch, brief commit, tooling copied from jfp, b0 gates + chain + d.ts snapshot + extended baseline | orchestrator | `plans/json-family-followons/{measurements,tools}/*` (copies), `.claude/settings.autonomous.json` | — | [x] |
| [T0b](T0b-authored-fixtures.md) | 8 authored fixtures + jar oracles; positional measure extended to authored rows | typescript-pro (sonnet, effort high), jff-T0b | `tests/fixtures/{json,yaml,hcl}/<new>.{puml,svg}`, `tests/oracle/svg-conformance/json-family-positional{.ts,.test.ts}`, `json-family-structural.ts` (vapoda JSDoc only), `tests/unit/oracle/json-family-positional.test.ts`, `plans/json-family-followons/tools/residue.mts` | T0a | [x] |
| close | merge T0b; seed authored rows in `json-family-positional.json` + `json-family-structural.json`; reword najoba/tadari/vapoda notes; gates `b0close`; `fixtures.md` b0 row | orchestrator | per close-procedure | T0b | [x] |

## Interface (T0b → close, B2, exit)
```ts
// tests/oracle/svg-conformance/json-family-positional.ts — existing shape, wider universe
export type JsonFamilyType = 'json' | 'yaml' | 'hcl';
// Row key: corpus `${type}/${slug}` (unchanged); authored `authored:${type}/${slug}`,
// read from tests/fixtures/<type>/<slug>.{puml,svg} (AUTHORED_ROOT, json-family-structural.ts:62-63).
export function measureResidue(type: JsonFamilyType, slug: string, source?: 'corpus' | 'authored'): PositionalResidue;
```
`PositionalResidue` (`aligned`, `nodeMax`, `pathMax`, `canvas{dw,dh}`, `byAttr`) is unchanged.

## Close specifics
- `npx tsx $T/residue.mts --all --json $M/b0close-residue.json`; add every authored row at its measured value (never above — stop 11); corpus pins must be byte-identical to main's file.
- Manifest: each new row `clean`, or a ceiling with a cited json-family mechanism (push-forward). Reword the `yaml/najoba-05-nino350` and `yaml/tadari-70-nare798` ceiling reasons (vapoda's note is test code — T0b's): the mechanism is U-REC (`shapes__c.java:1807-1808` record POINTS rounding with no PAD vs graphviz `INCH2PS`, `shapes.c:3688-3689`; jfp ledger `plans/json-family-parity/diagnosis/ledger.md`), not dot-engine / `shapes__c.java:253-254`; drop tadari's stale "title 5 px" sentence (jfp T1c: residue equals najoba's). Numbers in the notes unchanged. `json/timafu-94-bixe774`'s reason makes the same "dot-engine places the child" claim: reword it only if `plans/json-family-parity/diagnosis/json-large.md` shows real `dot` places it identically; otherwise leave it and journal why.
- Add the authored rows to `merge-one.sh`'s positional gate (it already runs `json-family-positional.test.ts`).
- If `merge-one.sh`'s structural or positional gate goes red only because the new authored rows are not yet in the pin files, that is this close's seeding step, not a regression: seed, then rerun the gates before the close commit. Any other red is a halt.

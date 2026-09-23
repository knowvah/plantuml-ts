# T30 — `skinparam dpi` core reader

**Agent:** typescript-pro (sonnet) · **Depends on:** T29 (class must be a
`resolveScaleFactor` consumer before this task widens that function and
gates the full suite over every consumer, including class's new one).

## Context

`core/TextBlockExporter.java:205-209`: `computeScaleFactor = scale.getScale
(dim.width, dim.height) * dpi/96.0` — the `dpi` term is a SEPARATE
multiplier applied AFTER the strategy-specific factor is already computed
and clamped by `ScaleProtected#getScale` (`ScaleProtected.java:42-51`,
`<=0→1`, `>4→4`). `src/core/scale-command.ts`'s own header states this
term does not exist in the port: "`dpi` is always 96 in this port — no
`skinparam dpi` wiring exists anywhere, confirmed by grep, so the `*dpi/96`
term is always exactly 1 and is not reproduced here." No engine has a
`skinparam dpi` capture. `resolveScaleFactor(spec, width, height)`
currently returns ONLY the clamped strategy factor; it needs a fourth
parameter (dpi, default 96) applied as a POST-clamp multiplier, matching
upstream's order of operations exactly (multiply AFTER `getScale`'s own
clamp, not before). Existing call sites: `src/diagrams/json/
renderer.ts:482`, `description/renderer.ts:203`, `sequence/renderer.ts:
466` (covers json/yaml/hcl via the shared json renderer, description, and
sequence), plus T29's new class call site inside `layoutClass`.
`activity/node-dispatch.ts#tryScale` matches and DISCARDS `scale` by
design (its own comment: "a separate, unscoped follow-on") — it has no
`resolveScaleFactor` call to widen; do not add one here, that is out of
this task's scope. The report is a lead: re-grep call sites yourself
before trusting this list — it may drift as T29 lands.

## Task

1. TDD: write failing tests for `paluca-39-desa696`, `ziparo-17-joku307`,
   `fuxoju-95-xuko052` (class, `skinparam dpi 300`), `bavoxa-34-keje375`
   (class, `skinparam dpi 200`), `kicuna-39-riki626` (class, `skinparam
   dpi 300` + `skinparam svek true`) against `test-results/dot-cache/
   class/<slug>/in.svg`; author one new `skinparam dpi 300` sequence
   fixture under `tests/` proving the SAME dpi math applies identically
   across engines.
2. Add a `dpi` key to `src/core/skinparam-key-handlers*.ts` (grep the
   existing table-file split for where a bare numeric skinparam key is
   registered; follow that precedent) that stores the parsed value on the
   diagram's skinparam state, default 96 when absent.
3. Widen `resolveScaleFactor` (`scale-command.ts:184`) with a `dpi:
   number = 96` parameter, applied as `clampedStrategyFactor * (dpi /
   96)` — AFTER the existing per-`ScaleSpec.kind` clamp, never before
   (upstream's `ScaleProtected` clamp runs inside `getScale`, then
   `TextBlockExporter` multiplies by `dpi/96` on the ALREADY-clamped
   result). Update the module's own header comment: the "`dpi` is always
   96" claim becomes false once this lands.
4. Re-grep `resolveScaleFactor(` call sites (`grep -rn
   "resolveScaleFactor(" src`) and update EVERY one — `json/renderer.ts`,
   `description/renderer.ts`, `sequence/renderer.ts`, T29's class call
   site — to read the diagram's own `dpi` skinparam and pass it through.
5. GATE: run the FULL `npm test` (json, yaml, hcl, description, sequence,
   class) after step 4 — any mover outside class needs a
   `decision-journal.md` row naming its mechanism before acceptance (stop
   4); an un-mechanised mover is stop 5.
6. `npx tsx tools/render-diff.mts` on all five named class fixtures;
   record before/after in `.agent-notes/cdd-T30.md`.

## Read-set

`core/TextBlockExporter.java:205-209`; `src/core/scale-command.ts` (whole
file, esp. `resolveScaleFactor` and `clampScale`); `src/diagrams/json/
renderer.ts:475-490`; `src/diagrams/description/renderer.ts:195-210`;
`src/diagrams/sequence/renderer.ts:460-470`; `src/diagrams/activity/
node-dispatch.ts:386-397` (`tryScale`'s documented out-of-scope
disposition — confirm it, do not wire it); `src/core/
skinparam-key-handlers-table-a.ts` (or wherever a bare-numeric skinparam
key is already registered — read to find the pattern); T29's `layoutClass`
call site (once merged).

## Write-set

`src/core/skinparam-key-handlers*.ts` (new `dpi` key only), `src/core/
scale-command.ts` (the `dpi` term), the `resolveScaleFactor` call sites in
`src/diagrams/json/renderer.ts`, `description/renderer.ts`,
`sequence/renderer.ts`, and T29's class call site, their test files, one
new `tests/` sequence `skinparam dpi 300` fixture, `.agent-notes/
cdd-T30.md`, `plans/class-divergence-drive/decision-journal.md`
(append-only).

## Interface in (from T29)

`ClassDiagramAST.scale?: ScaleSpec` and the `resolveScaleFactor` call
inside `layoutClass` — this task widens that SAME call with the `dpi`
argument rather than adding a second scale-resolution path.

## Acceptance criteria

- Given `paluca-39-desa696` (`skinparam dpi 300`), when rendered, then
  font-size is 43.75 and stroke widths are ×3.125 their unscaled value
- Given `ziparo-17-joku307`, `fuxoju-95-xuko052`, then each is
  survey-conformant
- Given `bavoxa-34-keje375` (`skinparam dpi 200`), then every numeric is
  ×2.083(3) its unscaled value
- Given `kicuna-39-riki626`, then it is survey-conformant
- Given json/yaml/hcl/description/sequence suites, when re-run, then each
  is unmoved OR every mover carries a journaled mechanism
- Given the new sequence `skinparam dpi 300` fixture, then it scales
  identically to the class dpi fixtures (same `dpi/96` factor applied
  post-clamp)

## Observability

N/A — no new observable operations.

## Rollback

Reversible — revert the task's commits; pins are committed with the code.

## Quality bar

`npm test` (every engine, not a path filter), `npm run typecheck`, `npm
run lint`, `npm run build`; `npx tsx tools/render-diff.mts` on the five
named class fixtures before/after; hooks: ≤500-line files, ≤30 NLOC
functions, CCN ≤10, ≤5 params.

## Boundaries

Always: apply `dpi` AFTER the strategy clamp, never before; re-grep call
sites rather than trusting this file's list. Ask first: any README stop
condition; wiring `activity`'s `tryScale` (explicitly out of scope — a
separate, unscoped follow-on per its own existing comment). Never: rebuild
the oracle cache (D12); fit a constant without a citation; touch
`svgRoot`/`svg.ts`.

## Commit

`feat(cdd-T30): add a dpi term to resolveScaleFactor, wire every engine`

Body: cites `TextBlockExporter.java:205-209`; lists every call site
updated and confirms activity's `tryScale` was deliberately left as-is;
lists any non-class mover and its journaled mechanism, or states none.

# Batch 8 — B8 scale / dpi

D4: upstream scales at serialization only — `core/TextBlockExporter.java:
205-209` (`computeScaleFactor = scale.getScale(width, height) * dpi/96.0`)
— never at layout. `src/core/scale-command.ts#resolveScaleFactor` already
resolves the strategy-specific factor correctly (numerically verified
against `component`/`sequence` fixtures) but has NO `dpi` term (its own
header states this explicitly: "`dpi` is always 96 in this port … the
`*dpi/96` term is always exactly 1 and is not reproduced here") and class
never calls it at all (`class-command-directives.ts:41-47` discards
`scale`/`skinparam` lines as a blanket no-op). T29 wires `scale` into the
class engine, following `src/diagrams/sequence/scale-geo.ts`'s precedent
(multiply resolved geometry, not re-derive layout) — zero cross-engine
blast radius, no dependency. T30 then widens `resolveScaleFactor` itself
with the missing `dpi` term and a new `skinparam dpi` core reader, wiring
every existing call site (`json/renderer.ts:482`, `description/
renderer.ts:203`, `sequence/renderer.ts:466`, plus T29's new class call)
— this DOES touch a function every other engine already calls, so T30
depends on T29 (both to avoid a second widening of the same function in
the same batch, and so its full-suite gate covers class's new consumer
too) and runs strictly after it, not in parallel.

`activity/node-dispatch.ts#tryScale` matches and discards `scale` entirely
today (documented in its own comment as "a separate, unscoped follow-on")
— it has NO `resolveScaleFactor` call site to widen and is explicitly OUT
OF SCOPE for T30; do not wire it.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T29 | Class `scale` — capture into AST, multiply resolved geometry before `renderClass` (A4 1, D4) | typescript-pro (sonnet) | `class-command-directives.ts`, `ast.ts`, `layout.ts`, new `class-scale-geo.ts`, tests | — | [x] |
| T30 | `skinparam dpi` core reader — new `dpi` term in `resolveScaleFactor`, wired at every existing call site | typescript-pro (sonnet) | `skinparam-key-handlers*.ts` (new `dpi` key), `scale-command.ts` (dpi term), `json/renderer.ts`, `description/renderer.ts`, `sequence/renderer.ts` call sites, tests | T29 | [x] |

Specs: [`T29-class-scale.md`](T29-class-scale.md),
[`T30-dpi-core-reader.md`](T30-dpi-core-reader.md). Batch close:
[`close.md`](close.md).

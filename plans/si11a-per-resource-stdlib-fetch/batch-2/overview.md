# Batch 2 — Registry resource path; regenerate packages; public exports

Three tasks, all parallel. Disjoint write-sets, no shared output.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T2 | Registry gains `resolveResource`; recognises remote modules | typescript-pro | `src/core/tim/StdlibRegistry.ts`, `tests/unit/stdlib-registry.test.ts` | T1 | [x] |
| T6 | Regenerate the two packages; add the packaging gate | typescript-pro | `packages/stdlib-aws/**`, `packages/stdlib-tupadr3/**`, `tests/unit/stdlib-package-files.test.ts` | T5 | [x] |
| T7 | Public exports + consumer recipe | typescript-pro | `src/index.ts`, `docs/stdlib-remote.md` | T1 | [x] |

**Two follow-ups landed after the batch.** T6 needed `PACK_CEILINGS` raised
(18 MB / 45 MB) and the pack tests' timeout raised (30 s → 120 s) in
`tests/unit/stdlib-packages.test.ts` — T5's write-set, so no escalation was
required. T7's docs then needed `fix(T7)`: they imported from a package name
that does not exist (`@plantuml-ts/core`) and showed a registry literal that
T2's new required `resolveResource` member had invalidated.

## Why these three are independent

T2 is one `src/core/tim/` file, T7 is `src/index.ts`, T6 is generated output
under `packages/` plus its own new test. No two write the same file. T7 only
re-exports T1's symbols, so it does not need T2's work.

## Batch exit criteria

- All quality gates green, including `npx tsx scripts/vendor-stdlib.ts --verify`
- The eager path is provably unchanged: existing `stdlibRegistry` behavior and
  the generated eager modules are byte-identical
- The new symbols appear in `dist/plantuml-ts.d.ts`
- 389 svg goldens byte-identical; 54-fixture ratchet zero-diff

## The trap in T6

A package whose `files` array omits the new assets **passes every local test and
404s for every consumer after publish.** That failure is invisible in-repo,
which is why T6 carries an explicit packaging assertion rather than relying on
review. See T6's acceptance criterion 2.

## Sequencing note for the orchestrator

All three can move `npm test`. Run gates after all three return and attribute any
failure before committing — commit per task, not per batch.

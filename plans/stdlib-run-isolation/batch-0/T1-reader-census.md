# T1 — Census every reader of the canonical tree

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/stdlib-run-isolation`. **You write no `src/`** — stop 2. This task
writes one note and no code.

SI34's close-out states that relocating `packages/<pkg>/generated/` was
declined because "`tests/integration/stdlib-remote-e2e.test.ts:49,51` import
fixed absolute paths, and each package's `package.json`/`prepack` references
`generated/`". The orchestrator found **at least six** test files reading the
canonical tree while drafting this brief, not two. A design decision was
justified against an under-count, and T2's ADR cannot be trusted unless the
real number is established.

**Establish it independently. Do not copy the orchestrator's list** — it is
withheld here on purpose so your census is a genuine second measurement.

## Task
1. Enumerate every consumer of `packages/<pkg>/generated/` — tests, scripts,
   package manifests, and anything under `src/` (expected: none; confirm).
   Prefer `ast-grep` or Serena symbol search over grep where structure
   matters; grep is fine for manifest and string references.
2. For each consumer record: path, `file:line`, **read or write**, whether it
   runs **inside a vitest worker** (i.e. is a concurrent reader) or outside,
   and whether it could resolve the tree through a **seam** or genuinely
   requires the canonical path.
3. Flag every consumer that requires the canonical path and say why. `npm
   pack` resolution is the known hard case (D3) — find any others.
4. Separately record what the four packages **publish**: `main`, `types`,
   every `exports` subpath, and `files`. This is the surface D2 protects.
5. Write `.agent-notes/sri-T1.md` as a table plus a short summary: total
   consumers, how many are concurrent readers, how many are seam-eligible,
   how many are immovable.

Read-only git only; no commits. Change no file other than your note.

## Write-set
- `.agent-notes/sri-T1.md`

## Read-set
- `packages/*/package.json`, `packages/*/scripts/copy-assets.mjs`
- `tests/**` — whatever your search surfaces
- `scripts/build-stdlib-packages.ts`
- `plans/stdlib-run-isolation/decisions.md` — D2, D3

## Interface contracts
Report `{ totalConsumers: number, concurrentReaders: number,
seamEligible: number, requiresCanonicalPath: string[] }`. T2's ADR is
built directly on these numbers.

## Acceptance
- Given the census, then every consumer carries a `file:line` and a
  read/write classification.
- Given each consumer, then it is marked seam-eligible or immovable **with a
  reason**, not a guess.
- Given the published surface, then `main`, `types`, `exports` and `files`
  are recorded verbatim for all four packages.
- Given your total, then it is your own count. If it differs from the "at
  least six" this brief claims, say so and show your working — a
  disagreement here is valuable, not a problem.

## Quality bar
Four gates green (a note-only change should move nothing). `npm test` under
60.3 s on a settled machine, with the load reading.

## Boundaries
- **Always:** cite `file:line`; justify every seam-eligible/immovable call.
- **Never:** touch `src/`; modify any file but your note; run git write
  commands.

## Report (<=300 tokens)
The interface contract, the immovable list with reasons, and any consumer
that surprised you.

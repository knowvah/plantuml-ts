# Batch 1b — `com.plantuml.ubrex` (D11, Amendment 1)

Serial chain in ONE worktree `gep-T1d` (branch `gep/T1d`): T1d → T1e → T1f,
one commit each, each task a fresh agent that reads the previous commits
(ubrex's core is one dependency cycle; see decisions.md Amendment 1). T1d and
T1e each end typecheck-clean (their file sets are closed under imports). The
chain merges once. No engine uses ubrex yet: the close expects 0 movers in all
28 engines. Standard close as `b1b`.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T1d](T1d-ubrex-core-data.md) | navigator, challenge/result/capture, char classes, matcher (16 files, 1327 lines) | typescript-pro (sonnet) | `src/core/ubrex/` ×16 + tests | B1 | [x] |
| [T1e](T1e-ubrex-challenges-parser.md) | every `Challenge*`, composites, `AtomicParser`, `UnicodeBracketedExpression` + upstream engine tests (18 files, 1576 lines) | typescript-pro (sonnet) | `src/core/ubrex/` ×18 + tests | T1d | [x] |
| [T1f](T1f-ubrex-builder-adapters.md) | `builder/`, `RegexResult`/`RegexPartialMatch`, `CommandControl`, `UBrexSingleLineCommand2`, `UbrexUrlBuilder` (14 files, 1126 lines) | typescript-pro (sonnet) | see spec | T1e | [x] |
| close | merge `gep/T1d` once, gates, chain vs b1 (0 movers) | orchestrator | per close-procedure | T1f | [x] |

## Chain rules
- Same contract as every task ([../task-contract.md](../task-contract.md)),
  with `src/core/ubrex/**` in place of `src/diagrams/gantt/**` and tests under
  `tests/unit/core/ubrex/` (mirroring `builder/`).
- Upstream tests at `~/git/plantuml/src/test/java/com/plantuml/ubrex/` (28
  files) are ported as vitest files `tests/unit/core/ubrex/upstream/<Name>.test.ts`,
  every assertion kept; they are the oracle for the engine's semantics.
- Stop 14 applies to this chain: T1d or T1e not typecheck-clean at its end, or
  a file outside the chain's 48 files (+ their tests and `docs/catalog.md`).

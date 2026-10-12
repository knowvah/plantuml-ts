# T1b: class `!pragma layout elk`

Prepend [task-preamble.md](task-preamble.md).

## Task (TDD)
Upstream's `CommandPragma#executeArg` (`CommandPragma.java:104-117`) calls
`system.setUseElk(true)` for `layout elk`. Both the name and the value are
case-insensitive. Mirror that the same way `!pragma layout smetana` is mirrored
at `src/diagrams/class/class-command-directives.ts:134-152`:

1. Widen `ClassDiagramAST.layoutEngine` (`ast.ts:397`) to `'smetana' | 'elk'` and
   update its JSDoc. Cite `CucaDiagram.java:478-479` for the maker swap.
2. Add a directive entry `/^!pragma\s+layout\s+elk\s*$/i` that sets
   `layoutEngine = 'elk'`. Place it before the general `!pragma` no-op, and update
   the comment at :143-145, which still says "no port".
3. In `src/diagrams/class/index.ts`, implement T1a's hook,
   `requiresElk: (ast) => ast.layoutEngine === 'elk'`. `layoutSync` keeps today's
   path for now; T3a routes it. If `services?.elk` is absent while `requiresElk` is
   true, `layoutSync` must not silently run dot-engine. Throw the same message
   T1a's renderSync guard uses.

Every existing `ast.layoutEngine === 'smetana'` reader stays as it is
(`class-edge-geo.ts:381`, `renderer-edge.ts:352`).

## Write-set
`src/diagrams/class/class-command-directives.ts`, `src/diagrams/class/ast.ts`,
`src/diagrams/class/index.ts`, and their tests under `tests/unit/class/`.

## Read-set
`CommandPragma.java:90-120`; `class-command-directives.ts:120-175`; `ast.ts:370-400`;
`src/diagrams/class/index.ts:50-90`; T1a's interface contract
([T1a](T1a-elk-backend-seam.md#interface-contract-output-consumed-by-t1b-t2at2d-t3a-t3b)).

## Acceptance
- Given `!pragma layout elk` (any case), when parsed, then `ast.layoutEngine === 'elk'`.
- Given `!pragma layout smetana`, then it is still `'smetana'` (regression).
- Given the 7 class ELK fixtures, when surveyed with no backend, then each renders the
  "options.elk" error page. None of them silently falls back to dot-engine.

## Architecture decisions (locked)
D2b, D3.

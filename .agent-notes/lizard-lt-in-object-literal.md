## Observation: a bare `<` in an object-literal VALUE desyncs lizard and swallows the rest of the file

- **Context**: Writing `scripts/measure-composite-declared-size.ts`
  (state-composite-inner-canvas T1). The complexity hook blocked with
  `axisRows has 77 NLOC, 15 CCN, 88 length` for a function that is 20 lines
  long with a CCN of 2.

- **Finding**: `lizard`'s TypeScript reader treats `<` as the opening of a
  generic type-argument list. In an object-literal property value —

  ```ts
  rows.push({
    match: Math.abs(mine - jar) < EXACT_EPSILON,
  });
  ```

  — it never finds a closing `>`, stays in that state, and swallows
  everything to EOF into the enclosing function. The symptom is a wildly
  inflated NLOC/CCN/length on ONE function plus **every later function
  missing from lizard's output entirely** (run `lizard` directly and count:
  that absence is the tell, and the hook does not show it to you).

  Reduced to a 18-line repro and confirmed by a single-line change:
  replacing the comparison with a named predicate call made the following
  function reappear at its correct line range, all metrics correct.

  **A `<` in a `for` condition does NOT trigger it** — the same file's
  `for (let i = 0; i < Math.min(o.length, c.length); i++)` parses fine and
  survived the fix unchanged. It is the object-literal-value position
  specifically. (Not exhaustively bisected beyond these two positions; other
  expression positions may or may not trigger it.)

- **Impact**: The reported metrics are fiction, so "refactor until it
  passes" is the wrong response and will not converge — the number does not
  respond to the function actually getting smaller. Extract the comparison
  into a named predicate (`isExact(a, b)`) instead; it reads better anyway.
  Worth checking whenever the hook reports a length far larger than the
  function you are looking at.

  This is a THIRD distinct lizard desync in this repo, alongside
  `.agent-notes/N16-lizard-forgive-nested-closures.md` (nested closures
  reset the `forgive` flag; regex literals with parens desync) and
  `.agent-notes/T8-lizard-forgive-switch-template-literal.md`
  (switch + template literal). All three share a shape: the tokenizer's
  bracket/state tracking is not TypeScript-aware, and the metric-specific
  `// #lizard forgives(...)` form is the documented escape hatch — but here
  a genuine one-line extraction was cleaner than suppression, and it also
  surfaced a REAL violation the desync had been hiding (`main` at 39 NLOC
  against the 30 cap, invisible while the file was being swallowed).

- **Confidence**: High — isolated repro, single-variable change, verified
  directly through `~/.claude/hooks/.venv/bin/lizard -C 10`.

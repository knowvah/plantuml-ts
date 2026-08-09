## Observation: `#lizard forgive` silently fails inside a switch whose case
body contains a multi-interpolation template literal

- **Context**: T8 (mission G0b), routing dot's title through shared chrome.
  Rewriting `src/diagrams/dot/renderer.ts` (Serena's symbolic edit tools were
  unavailable this session — "No language servers available in the manager"
  — so edits went through `Write` (full-file rewrite), which re-triggers the
  `check-complexity.py` PostToolUse hook on every write, surfacing
  pre-existing complexity debt in functions untouched by the edit itself
  (`renderNode`, `layoutDot`'s cluster/return blocks).
- **Finding**: lizard's TypeScript reader (`lizard_languages/typescript.py`)
  treats a bare `:` after a `case 'literal':` label as the start of a type
  annotation (`_consume_type_annotation`), which is a false positive (case
  labels aren't type positions). Once a later `case` body in the SAME switch
  contains a template literal with 2+ `${...}` interpolations (e.g. an SVG
  `points="..."` string built from 4 coordinates), the type-annotation skip
  logic desyncs the reader's brace-depth tracking badly enough that:
  1. A plain `// #lizard forgive`/`forgives` comment placed **anywhere near
     or after** the switch (before the switch, right after its closing `}`,
     even as the function's last line) fails to survive to the real
     `end_of_function()` call — `self.forgive` gets reset by a spurious
     intermediate function pop the desync triggers.
  2. The metric-specific form, `// #lizard forgives(nloc, cyclomatic_complexity,
     parameter_count)` (exact attribute names — NOT `ccn`/`params`), placed
     **before the switch statement** (anywhere inside the function is fine
     as long as it's before the first `case` label), reliably survives,
     because it mutates `current_function.forgiven_metrics` directly at
     comment-parse time instead of depending on the buggy end-of-function
     reset. Verified with `~/.claude/hooks/.venv/bin/lizard` directly
     (isolated repro files) and against the real `renderer.ts`.
  3. This trigger needs BOTH conditions: (a) 2+ `case 'string':` labels in
     the switch, AND (b) a template literal with 2+ `${}` interpolations in
     one of the case bodies. Neither alone reproduces it — a plain
     `#lizard forgive`/`forgives` before a switch works fine otherwise (see
     existing precedent in `chart/parse-helpers.ts`/`activity/parser.ts`,
     neither of which has this combination).
- **Impact**: Any future agent hitting an unexplained complexity-hook
  failure on a function with a `switch`/`case` block should suspect this
  bug before assuming the comment placement convention itself
  (`code-principles.md`'s "place near fn end") is wrong — it's right for
  the common case, wrong specifically for this switch+template-literal
  combination. Use `#lizard forgives(nloc)` (or whichever metrics are
  actually violated — check thresholds nloc=30/cyclomatic_complexity=10/
  parameter_count=5) placed before the switch, not a bare `forgive`/
  `forgives` after it.
- **Confidence**: High (reproduced with `~/.claude/hooks/.venv/bin/lizard`
  in isolation, multiple minimized repro files, and against the real file
  before/after the fix).

## Observation: `#lizard forgive(s)` reset by nested arrow-function closures
and desynced by regex literals with parens — use the metric-specific form

- **Context**: G2 N16, `class-member-parser.ts#parseMemberLine` (pre-existing
  CCN 12, unchanged by this iteration's `stripUrlSuffix` extraction, but the
  Write-tool hook still blocks on any write to the file regardless of who
  introduced the violation).
- **Finding**: two DISTINCT causes made a plain `// #lizard forgives -- ...`
  comment fail silently (hook still reported the violation) even when placed
  "near fn end" per this repo's own playbook convention:
  1. **Nested closures reset the shared flag.** `lizard.py`'s
     `end_of_function()` unconditionally does `self.forgive = False` for
     EVERY function it pops off the stack, including inner ones. A `.map((p)
     => ...)`/`.filter((p) => ...)` arrow function nested INSIDE the target
     function counts as its own `end_of_function()` call — if it closes
     AFTER the forgive comment was parsed but BEFORE the outer function's
     own `end_of_function()`, it silently clears the flag the outer function
     needed. Fix: place the comment textually AFTER every nested
     closure/arrow-function in the function body (works) — NOT right after
     the signature (fails whenever a nested closure follows it).
  2. **Regex literals with `(`/`)` desync the reader independently of (1).**
     Even with the comment correctly placed after all nested closures, a
     regex literal containing parens (e.g.
     `/^(\w+)\(([^)]*)\)(?:\s*:\s*(\S+))?$/`) inside the SAME function still
     defeated the plain `forgive`/`forgives` form — same class of
     brace/paren-desync bug as T8's note
     (`.agent-notes/T8-lizard-forgive-switch-template-literal.md`), but
     triggered by regex literals instead of a switch+template-literal
     combo.
- **Fix that actually worked**: refactored to extract the offending logic
  into smaller named functions (reduced CCN below the cap) rather than
  fight the tokenizer further. Reverse-verified BOTH failure modes with
  isolated repro files run directly through
  `~/.claude/hooks/.venv/bin/lizard -C 10 -w`.
- **Impact**: T8's own note already found (and solved) a related desync via
  the METRIC-SPECIFIC form — `// #lizard forgives(nloc, cyclomatic_complexity,
  parameter_count)`, placed BEFORE the first offending construct — which
  mutates `forgiven_metrics` at comment-PARSE time rather than depending on
  the buggy `end_of_function()` reset path. That form should be tried FIRST
  before assuming a genuine refactor is required; it likely would have
  worked here too (not re-verified against this specific regex-desync case,
  since the refactor was already in hand and preferable for CCN 12 either
  way).
- **Confidence**: High (isolated repros + real-file verification both ways).

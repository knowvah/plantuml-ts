# T14 — Diagnose `svg-class/class-actor-bare-no-allowmixing`

**Agent:** debugger · **Depends on:** T9 · **Commit:** `fix(T14): <mechanism>` or `docs(T14): explain the no-svg fixture`

## Context

One pinned fixture produces **no SVG from the jar at all**. It is the sole
`FAILED` in the regeneration run and predates this mission — it is not
caused by the pin advance or the size-reduction port.

That means one pinned fixture currently has no regenerable oracle. Per this
repo's rules a fixture that will not capture is a gap to explain, not to
drop.

## Read-set

- `oracle/goldens/svg-class/class-actor-bare-no-allowmixing/in.puml`
- `oracle/capture.sh` — the exact jar invocation
- `oracle/goldens/svg-class/ratchet.json` — its manifest entry
- `~/.claude/rules/diagnosis.md` — **this task is diagnosis mode**

## Task

Run the jar on the fixture by hand and find out why no SVG is produced.
Candidates worth distinguishing: the jar writes a differently-named output
file; the diagram errors and only an error image is produced; the fixture
needs `allow_mixing` and upstream now rejects it; the `-o` handling differs
for this diagram type.

Produce the `rules/diagnosis.md` artifact **before** proposing any change:
mechanism, origin, causal chain, what you ruled out.

Only then decide the disposition, and say which it is:
- a capture-invocation bug (fix the script — but that is T2's file, so
  report rather than edit), or
- a genuinely uncapturable fixture (document it, and only then consider
  whether its ratchet entry is still meaningful).

## Acceptance criteria

1. Given the fixture, when the jar is run on it, then the mechanism for
   emitting no SVG is stated with evidence — not "it fails".
2. Given the diagnosis, then a note lands in `.agent-notes/` with the full
   artifact.
3. Given a proposed disposition, then it is justified by the mechanism —
   the fixture is **not** silently un-pinned or deleted.

## Observability

Its `FAILED` count in `scripts/rebaseline-svg-goldens.ts` is the standing
signal. If it stays unfixable, the expected count is documented as 1 so a
future `FAILED=2` is visibly new.

## Rollback

**Reversible** — diagnosis only, unless a fixture change is warranted.

## Quality bar

All four gates pass. "This is hard" and "good enough" are not stop
conditions (`rules/diagnosis.md`); an unresolved cause must still be
reported as mechanism-plus-ruled-out, not as an unexplained failure.

## Boundaries

- **Ask first:** any change to `ratchet.json` — un-pinning is a
  conformance decision, not a cleanup.
- **Never:** delete the fixture; run any `git` command.

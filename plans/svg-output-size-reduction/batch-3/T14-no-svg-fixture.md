# T14 — Diagnose `svg-class/class-actor-bare-no-allowmixing`

**Agent:** debugger · **Depends on:** T9 · **Commit:** `fix(T14): <mechanism>` or `docs(T14): explain the no-svg fixture`

> ## ⚠ PREMISE VOID — diagnosed 2026-08-08 during T2. Read this first.
>
> **The fixture does not fail.** The jar emits a valid 2147-byte SVG and
> exits 200. That SVG is a PlantUML **error diagram** (green `#33FF02` on
> black) reading `Use 'allowmixing' if you want to mix classes and other
> UML elements. (Assumed diagram type: class)`. The committed `golden.svg`
> (2645 B) is the same error diagram, captured before the size-reduction
> commits — so it re-baselines like any other golden.
>
> **Mechanism of the original report:** the ad-hoc scratch script behind
> `SAME=0 CHANGED=445 FAILED=1` classified FAILED by the jar's **exit
> code**; `scripts/rebaseline-svg-goldens.ts` classifies by **SVG
> presence**, per its spec. They disagree on this fixture and no other.
>
> **Ruled out:** differently-named output file (the jar writes `in.svg`
> where expected); `-o` handling (identical invocation to every other
> fixture); pin advance as cause (the fixture is authored — SI10/T3 — and
> its own header says it deliberately exercises a bare `actor` reachable
> *without* `allowmixing`, so pinning the jar's error output is the point).
>
> Full artifact: `.agent-notes/svg-rebaseline-error-diagram-fixture.md`.
>
> **What remains for T14:** confirm the fixture re-baselined cleanly in T9
> and that `ERROR-DIAGRAM=1` names only this fixture. Do **not** re-run the
> diagnosis, un-pin the ratchet entry, or change the fixture — there is no
> defect. Acceptance criteria 1–3 below are already satisfied by the note.
> Expected disposition: `docs(T14)`, not `fix(T14)`.
>
> ## CLOSED 2026-08-08 — no defect, nothing to fix
>
> T9 re-captured this golden from the pinned jar like any other; it is now
> the CURRENT error page (which has grown: height 162 → 288, childCount
> 11 → 18). `scripts/rebaseline-svg-goldens.ts` reports
> `SAME=0 CHANGED=446 FAILED=0` with `ERROR-DIAGRAM=1` naming exactly this
> fixture — the guard added in T2 so an error-diagram capture can never
> re-baseline silently.
>
> Its characterisation pin in `class-usecase-actor.test.ts` was re-measured
> deliberately (6 pinned diffs → 5; the `svg/@background` diff disappeared
> because the new error page's background matches what we emit). Our own
> raw output is unchanged at 169×96 with 2 children.
>
> Acceptance criteria 1–3 are satisfied by
> `.agent-notes/svg-rebaseline-error-diagram-fixture.md`. The fixture stays
> pinned; nothing was un-pinned, deleted or loosened.

## Context (as originally written — superseded above)

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

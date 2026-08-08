# T9 — Regenerate all 450 goldens

**Agent:** general-purpose · **Depends on:** T2 · **Commit:** `chore(T9): re-baseline svg goldens against pin 11ed6720`

## Context

The 450 committed `golden.svg` files are the **jar's** output at the
current oracle pin. They were captured before upstream's two "reduce SVG
output size" commits, so all 445 pinned fixtures are stale. This task
re-captures them with T2's script.

**This task does not read our renderer at all** — it only runs the jar. It
is independent of T3–T8 and can execute at any point after batch-1.

⚠️ Gate deferred (ADR-5): the suite is only expected green at the end of
batch-2d, once the emitters (T3–T8) and these goldens agree.

## Write-set

- `oracle/goldens/svg-*/**/golden.svg` — **nothing else**

## Read-set

- `plans/svg-output-size-reduction/batch-1/T2-rebaseline-script.md` — the CLI contract
- `.agent-notes/svg-output-size-reduction-measured.md` — the expected counts
- `oracle/pin.json` — confirm `upstreamSha` is `11ed6720…` before writing

## Task

1. Run report-only first: `npx tsx scripts/rebaseline-svg-goldens.ts`.
   Confirm it reports `SAME=0 CHANGED=445 FAILED=1`. **If the numbers
   differ materially from that, stop** — the jar or the pin has moved and
   the whole mission's measurement is invalid.
2. Run `npx tsx scripts/rebaseline-svg-goldens.ts --write`.
3. Verify with `git status --short` that only `golden.svg` files changed —
   no `in.puml`, no `ratchet.json`, no source.
4. Record the before/after byte totals in the commit body. Expected: about
   1,477,458 B → 1,354,859 B, an 8.3% reduction.

Takes roughly 12 minutes — JVM startup dominates. Do not parallelize
beyond what the script already does; concurrent jar runs writing a shared
scratch tree is a race.

## Acceptance criteria

1. Given `--write`, when the script completes, then 445 `golden.svg` files
   are replaced and `FAILED=1` names only
   `svg-class/class-actor-bare-no-allowmixing` (T14).
2. Given `git status --short`, then every changed path ends in
   `golden.svg`.
3. Given a spot-checked golden, then it shows the reduced form — 3
   decimals, `#RGB` colors, root-level `font-family`, no per-text
   `lengthAdjust`.

## Observability

The script's `SAME/CHANGED/FAILED` summary is the mission SLI. Paste it
into the commit body — it is the record the next pin advance compares to.

## Rollback

**Reversible with migration** — reverting restores the old goldens, but
only together with the emitter commits (ADR-5); goldens and emitters are
only consistent as a pair.

## Quality bar

- The oracle drift guard must pass. A golden captured from a drifted jar is
  a silently wrong oracle — the exact defect class that created this
  mission's predecessor.
- Do not hand-edit a single golden. Ever. If one looks wrong, that is a
  finding about the emitter or the jar, not a file to patch.

## Boundaries

- **Always:** report-only run first; verify the pin before writing.
- **Stop:** counts differ materially from `SAME=0 CHANGED=445 FAILED=1`.
- **Never:** edit a golden by hand; touch `ratchet.json` or `in.puml`; run
  any `git` command.

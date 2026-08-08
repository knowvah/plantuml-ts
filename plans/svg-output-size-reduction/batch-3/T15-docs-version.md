# T15 — Docs and version (ADR-6)

**Agent:** technical-writer · **Depends on:** T14 · **Commit:** `docs(T15): record the SVG output format change` + `BREAKING CHANGE:` footer

## Context

This mission changes the library's **public SVG output** — same functions,
same signatures, different bytes. ADR-6 settled the framing: this is not a
divergence *from upstream* (we now match it more closely); it is a break
against **our own previous output**, which is consumer-facing.

Three artifacts, per ADR-6.

## Read-set

- `plans/svg-output-size-reduction/decisions.md#adr-6` — the approved framing
- `DIVERGENCES.md` — existing structure: categories block, then `##`
  sections with `###` entries. Match it.
- `CHANGELOG.md` — existing entry format
- `oracle/pin.json` — `previousPin.svgSuitesNotRebaselined` is the
  follow-up being retired
- `.agent-notes/svg-output-size-reduction-measured.md` — the six rules and
  the 8.3% figure

## Write-set

- `DIVERGENCES.md`, `CHANGELOG.md`, `package.json`, `oracle/pin.json`

## Task

**`DIVERGENCES.md`** — a new `## Output format` section with one `###`
entry recording that this port previously emitted 4-decimal, long-form SVG
and now tracks upstream's reduced form (3 decimals, `#RGB`, inherited text
attributes). State plainly that this **removes** a divergence rather than
adding one, so a reader does not conclude we still differ.

**`CHANGELOG.md`** — a `0.2.0` entry: SVG output is byte-different though
visually identical; consumers byte-comparing or snapshot-testing our SVG
must re-baseline; total emitted SVG shrinks ~8.3%; no API change.

**`package.json`** — version to `0.2.0` (pre-1.0 semver permits a breaking
output change in a minor).

**`oracle/pin.json`** — retire `previousPin.svgSuitesNotRebaselined`.
Replace it with a short record: the suites WERE re-baselined at pin
`11ed6720`, on which date, 445 goldens changed, 8.3% smaller, driven by
upstream `ba68279df92` + `4f3a0dcc63b`. Note T14's disposition for the
no-SVG fixture so the expected `FAILED` count is documented.

## Acceptance criteria

1. Given `DIVERGENCES.md`, then the new entry states we now track upstream
   and that this closes a prior divergence.
2. Given `CHANGELOG.md` and `package.json`, then both read `0.2.0` and the
   entry tells a consumer exactly what to do ("re-baseline your snapshots").
3. Given `oracle/pin.json`, then `svgSuitesNotRebaselined` is gone and
   replaced by the completion record, including the expected `FAILED` count.
4. Given `git diff --numstat`, then no pre-existing content was dropped
   from any of the four files.

## Observability

N/A.

## Rollback

**Reversible** — documentation and a version bump.

## Quality bar

- All four gates pass — **the orchestrator runs them**; this agent has no
  Bash tool.
- The agent rewrites whole files: check `git diff --numstat` for
  unexpectedly large deletions before accepting.
- Commit message carries a `BREAKING CHANGE:` footer per
  `~/.claude/rules/commits.md`.

## Boundaries

- **Always:** preserve every existing entry in `DIVERGENCES.md` and
  `CHANGELOG.md`.
- **Never:** edit `oracle/pin.json`'s `upstreamSha`, `seamCommitCount`, or
  any other pin field — only the `previousPin` follow-up note; run any
  `git` command.

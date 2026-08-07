# F4-c — G9-E2 tab-stop advance (`AtomText`)

Agent: **typescript-pro**. Closes `fariba-82-xolu802` — **CONDITIONALLY,
+1 → 346, only if F3-diag resolved the residual.** If F3-diag reports
`unresolved`, this task still lands E2 correctly but the fixture does NOT
close and the mission lands at 345/346 for this task — that is a correct
outcome per README, not a failure.

## Context

`container-cluster.md` `fariba-82-xolu802`: two independent leaf-body gaps
on the `file policy <<policy>> [ … ]` node, each worth exactly one 14px
text row.

- **E1** (already fixed in F1-b, per SYNTHESIS §8 — not this task's
  concern): the `keyword code <<stereo>> [` multiline open form drops the
  stereotype.
- **E2** (this task): `\t` is measured as an ordinary zero-width character
  instead of advancing to a tab stop. Under `skinparam wrapWidth 200`
  (set by `awslib/AWSCommon.puml:35`), the `\t\t"sts:AssumeRole"` line
  never overflows in our port and never wraps to a second row, where the
  jar's tab expansion pushes it over 200 and forces the wrap.

Origin: the ABSENCE of upstream `AtomText.java:243-249`'s tab-stop
advance. No `AtomText.ts` exists anywhere in `src/` (grep-confirmed in
diagnosis) — the creole text-run builder
`src/core/klimt/creole/legacy/StripeSimple.ts:267`
(`buildStripeAtoms`/`StripeAtomBuilder`) has NO tab branch at all; `\t`
falls through the per-character scan as an ordinary character.

**The jar's tab expansion is a fixed 56px, and it does NOT respond to
`skinparam tabSize`** — `container-cluster.md` ruledOut (e): "the jar's
tab advance is 56px and does not respond to `tabSize` (matches
`planning/sizer-renderer-parity.md`'s tabSize row), so the gap is tab
EXPANSION, not the setting." Read that row before implementing — do not
wire a `tabSize`-driven variable-width tab stop; the jar's own behavior is
fixed-width.

**Split proof (jar-isolated, no `!include`):** `file policy <<policy>>
[AAAA\nBBBB]` = `1.020139 × 0.861111` vs `file policy [AAAA\nBBBB]` =
`0.797917 × 0.666667` (stereotype delta = +16w/+14h — E1, already closed).
Body truncated after the `\t\t` line: jar `1.055556` vs ours `0.861111` →
**E2 = 14px exactly, one wrapped row.** 14 (E1) + 14 (E2) = 28px =
0.388889in = the fixture's full reported delta, with zero residual
attributed to either E1 or E2.

## The residual F3-diag must have addressed

`container-cluster.md`'s own `nextStep`: node `sh0006` (the awslib
`User(user, "Trusted user", "")` element) is oracle `1.462500 × 1.722222`
vs ours `1.462500 × 1.750000` — **+2px height (0.027778in)**, reproduced
in isolation, INDEPENDENT of label width. This is a SEPARATE, undiagnosed
mechanism (the `$User [64x64/16z]` sprite + label stack height in
`measureEntityLeaf`) — it is NOT tab-related and NOT this task's write-set.

**Do not chase the +1 by improvising a fix for this residual.** If
F3-diag's diagnosis-sub-task resolved it, its fix is already landed
upstream of this batch (or is a separate task you were not assigned); if
F3-diag reports `unresolved`, record that in this task's own completion
summary and stop there — E2's own correctness is verified independently
of whether `sh0006`'s residual closes.

## Task

1. Create `src/core/klimt/creole/legacy/AtomText.ts` — a real tab-stop
   advance primitive, porting `AtomText.java:243-249`'s fixed-56px
   behavior. Match the file's naming convention to the Java class it
   ports, per `CLAUDE.md`'s "preserve upstream names" rule — this is a
   genuinely new file, not a rename of existing code.
2. Wire a tab branch into `StripeSimple.ts`'s per-character scan
   (`buildStripeAtoms`/`StripeAtomBuilder.modifyStripe`, `:200-234`) so a
   `\t` character advances the run's cumulative width by the fixed
   56px, not zero.
3. Verify the fix against BOTH split-proof probes from `container-cluster.md`
   (stereotype-present and stereotype-absent variants) before touching the
   full fixture, to isolate E2 from E1 exactly as diagnosis did.

## Write-set

| File | Change |
|---|---|
| `src/core/klimt/creole/legacy/StripeSimple.ts` | tab branch in the per-character scan, `:200-234` |
| NEW `src/core/klimt/creole/legacy/AtomText.ts` | fixed-56px tab-stop advance primitive |

Do NOT touch `leaf-sizing.ts`, `parser.ts`, or `parse-helpers.ts` — E1 is
already closed by F1-b; re-touching those files without a demonstrated
need is scope creep.

## Read-set

| File:lines | Why |
|---|---|
| `StripeSimple.ts:200-254` | `StripeAtomBuilder.modifyStripe`, `flushPending`, `finish` — the per-character scan to extend |
| `StripeSimple.ts:255-330` (approx, `buildStripeAtoms` onward) | how `CreoleMode` and the img/sprite carve-out already branch per-character, the pattern for a tab branch |
| `plans/s1l-tail-diagnosis/findings/container-cluster.md` `fariba-82` record (whole) | full E1/E2 split proof, ruled-out list, the residual `nextStep` |
| `plans/s1l-tail-diagnosis/findings/SYNTHESIS.md` §4 | the residual's status and why it must not be conflated with E2 |
| `planning/sizer-renderer-parity.md`'s `tabSize` row | confirms `tabSize` is a lever the jar ignores for tab EXPANSION — do not wire it in |
| `~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/atom/AtomText.java:243-249` | the exact fixed-advance formula to port |
| F3-diag's completion summary (batch 3) | whether the `sh0006` residual resolved or stayed `unresolved` — read BEFORE reporting this task's own fixture-closure status |

## Architecture decisions binding this task

- **Push-forward rule #4** (README): "F3-diag cannot resolve the
  `fariba-82` residual — record `unresolved` ... Do **not** invent a
  mechanism to reach 347; F4-c would act on it." This task is the one
  that would act on a resolved residual — but it must not invent one if
  F3-diag came back empty.
- **ADR-1**: never write `size-backlog.json`.
- No ADR governs `AtomText.ts` directly, but `CLAUDE.md`'s porting
  discipline applies: port `AtomText.java`'s tab-stop logic faithfully,
  including the fixed-56px constant even though it looks like it "should"
  be configurable — it is not, on the jar's own evidence.

## Interface contracts

```typescript
// AtomText.ts — new file, ports AtomText.java's tab-stop advance.
/** Fixed pixel width the jar advances to the next tab stop by
 *  (AtomText.java:243-249). Verified NOT to respond to
 *  `skinparam tabSize` — see planning/sizer-renderer-parity.md. */
export const TAB_STOP_WIDTH = 56;

/** Given the current cumulative x position within a line, returns the
 *  x position after a `\t` advance -- upstream's fixed-width tab stop,
 *  not a variable/`tabSize`-driven one. */
export function advanceToTabStop(currentX: number): number;
```

`StripeSimple.ts`'s scan gains a tab branch analogous to the existing
img/sprite carve-out at `:211-230` — when the scanned character is `\t`,
flush pending text, advance the run's accumulated width via
`advanceToTabStop`, and continue the scan (no new `CreoleAtom` kind is
required if the existing text-run accumulation already tracks width
incrementally — verify against `measureBuiltLine`, `:202+`, before adding
a new atom kind).

## Acceptance criteria

1. **Given** `file policy [AAAA\nBBBB]` (no stereotype, no tab), **when**
   measured, **then** it is unchanged from today (`0.797917 × 0.666667`)
   — this task must not move a fixture with no `\t` in it.
2. **Given** the isolated `\t\t"sts:AssumeRole"` line under `skinparam
   wrapWidth 200`, **when** measured, **then** the line wraps to a second
   row exactly as the jar does (verify against the container-cluster.md
   split-proof numbers: `1.055556` vs pre-fix `0.861111`).
3. **Given** `skinparam tabSize` set to a non-default value, **when** the
   same fixture is measured, **then** the tab advance is UNCHANGED (fixed
   56px) — confirming the ruled-out lever stays ruled out.
4. **Given** F3-diag's residual verdict is `unresolved`, **when** this
   task completes, **then** the completion summary states `fariba-82` did
   NOT close, names the residual (`sh0006`, +2px height, independent
   mechanism), and does not claim the +1.
5. **Given** F3-diag's residual verdict resolved it, **when** this task's
   fix lands, **then** `fariba-82`'s full `svek-1.dot` measures
   byte-conformant against the oracle (both E1+E2 already closed AND the
   residual resolved).

## Quality bar

Per README + `batch-4/overview.md`, plus:
- `npx tsx scripts/measure-description-size-deltas.ts` — report
  `fariba-82`'s status honestly per F3-diag's verdict; `widened == 0`
  regardless.
- New `AtomText.ts` gets its own unit tests (TDD — write first) covering
  `advanceToTabStop` at multiple starting positions, including a tab
  landing exactly on a stop boundary.
- 90/90/90 coverage floor on the new file.
- `StripeSimple.ts` is cross-engine (`creole-atoms*` shared with class/
  state/object per README) — re-run all four size ratchets, not just
  description.

## Observability

No runtime logging surface applies (pure SVG renderer, no `console.*` in
`src/` per `~/.claude/rules/logging.md`'s intent translated to this
codebase). The observable output IS the measured dimension — the
completion summary is the only report channel, and it must state the
F3-diag-dependent closure status explicitly (see acceptance criteria 4/5).

## Rollback classification

**Fully revertible.** A pure geometry/text-measurement change with no
asset, licence, or external-data component — `git revert` is clean and
complete.

## Boundaries

**Always do**
- Read F3-diag's completion summary before claiming `fariba-82` closed.
- Verify the fixed-56px constant against the jar probes in
  `container-cluster.md`, not a guessed value.

**Ask first**
- If the tab-stop advance interacts with an existing `CreoleAtom` kind in
  a way that requires changing `measureBuiltLine`'s signature (outside
  the declared write-set files, though same subsystem).

**Never do**
- Never make the tab advance respond to `skinparam tabSize` — ruled out
  by direct jar evidence.
- Never touch `leaf-sizing.ts` / `parser.ts` / `parse-helpers.ts` — E1 is
  out of scope, already closed.
- Never invent a fix for the `sh0006` residual to force the +1.

## Commit format

`fix(F4-c): port AtomText fixed tab-stop advance`

Body (required if closure claim is conditional): state explicitly whether
`fariba-82` closed and why, citing F3-diag's verdict.

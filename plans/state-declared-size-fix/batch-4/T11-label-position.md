# T11 — F10: transition-label ink-box POSITION (G13) — diagnose first

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch `fix/state-declared-size`.
SI28 G13: `nimana-36-veco708`, `bunade-42-fudu910`, `nimise-04-jove070`
(−3.836 / −0.164 px; label SIZE is right, its POSITION inside the composite
ink fold at `layout-ink-extent.ts:386-392` is not; jar `TextBlockMarged.java:
79-87` + `LimitFinder.java:159-162`). Two of three are `unresolved` with the
nextStep "instrument `transition.label.inkBox.x/y` vs jar's label anchor".
These three were the RE-PIN group in `oracle/goldens/state/size-backlog.json`
(SI28 corrected the group to three; bajelo/fotuje/pavuzo do not belong). Read
`findings/other.md` (bunade, nimise), `composite-a.md#nimana`, `SYNTHESIS.md`
§1 G13, `decisions.md`, `~/.claude/rules/diagnosis.md`, CLAUDE.md.

## Task
1. DIAGNOSE first (probe under `scripts_scratch/T11/`, deleted): print our
   `label.inkBox.x/y` and jar's label anchor (from `in.svg` text x/y and the
   `svek-N.dot` label geometry) for the three; open `TextBlockMarged.java`,
   `SvekEdge.java`'s label placement, and `LimitFinder` and state the
   mechanism as a `file:line` before changing anything.
2. If the mechanism closes: fix at its origin (`layout-ink-extent.ts` and/or
   `state-composite-edge-label.ts`), ratchets for the three, unit test with
   nimana's `in.puml`. If it does NOT close: write
   `plans/state-declared-size-fix/findings/G13.md` on SI28's SCHEMA (status
   `unresolved`, probe evidence, concrete nextStep) and change no `src/`.
Never fit: a shift constant that makes three rows exact without the Java
mechanism is README stop 7.

## Write-set
`src/diagrams/state/layout-ink-extent.ts`, `state-composite-edge-label.ts`,
`tests/unit/state/layout-ink-extent.test.ts`, ratchet entries, OR
`plans/state-declared-size-fix/findings/G13.md`.

## Read-set
Records; `layout-ink-extent.ts:370-400`; `state-composite-edge-label.ts`;
`state-composite-pass.ts#attachTransitionLabel` (`:250`); Java
`klimt/shape/TextBlockMarged.java:60-100`, `svek/SvekEdge.java` (label
placement), `klimt/LimitFinder.java:150-195`.

## Acceptance
- Given the three fixtures, then rows exact with the mechanism cited, OR a `G13.md` record on SCHEMA with `originFileLine`, `javaRef`, `ruledOut`, `nextStep`.
- Given `harness-diff.py`, then 0 rows appeared or grew.

## Observability / Rollback
Harness. Reversible.

## Report (≤400 tokens)
Mechanism (or why not); rows per fixture; files touched.

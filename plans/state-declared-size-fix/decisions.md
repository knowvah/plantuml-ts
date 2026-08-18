# Architecture decisions — state-declared-size-fix

Approved 2026-08-18. Locked; a conflict is README stop 8, not a judgment call.

## D1 — One core creole-text seam, shared by the state sizer AND renderer
**Context.** SI28 G1/G2/G23 (22 fixtures, every delta > 100 px except G4's):
state text is measured raw, never through `Display.create8(..., CreoleMode.FULL,
wrapWidth)`. State may not import the class engine's `class-member-creole.ts`
(`tests/architecture/layering.test.ts`). **Decision.** New core module
`src/core/svek/image/creole-text-lines.ts` (beside `leaf-sizing-text.ts`):
`creoleTextLines(display, font, measurer, {wrapWidth?, tabSize?, sprites?})`
→ per-line styled runs `{text, style, color?, url?}` + width/height/kind,
built on the already-unified lexer (`klimt/creole/legacy/StripeSimple.ts#
buildLineAtoms`), `legacy/AtomText.ts` tab stops (`AtomText.java:183-260`)
and `klimt/creole/Fission.ts#getSplitted` for `wrapWidth`. The sizer measures
the runs; the renderer draws the same runs — lockstep by construction.
**Consequences.** One place to reach `Sheet`/`SheetBlock1` fidelity later
(kept local: the seam's return type is the only contract). Rejected: porting
the full Sheet pipeline now (too large for a fix mission); lifting
`class-member-creole.ts` (member-shaped).

## D2 — G24 guards error like the jar via `DiagramRefusal`
**Decision.** Port `StateDiagram#checkConcurrentStateOk`
(`StateDiagram.java:70-90`) and `CommandLinkStateCommon.java:277-278`'s
`parent.getData()==null` gate into `state-parse-resolve.ts`; on failure throw
`DiagramRefusal` at the offending line → `errorSvg`. Our error names STATE at
the real line; the jar's `PSystemErrorUtils#mergeV2` may name another factory
(zecivu: "sequence", line 2). Incidental error-render text — no
`DIVERGENCES.md` entry, one commit-message note. **Consequences.** cagego-53,
xacona-99, zecivu-62, fugedo-34 stay `unmatched` (0 dot both sides); no phantom
`ChildMode1 { A }` is drawn.

## D3 — `ReadFilterMergeLines` at upstream's chain position, pipeline-wide
**Decision.** Mirror `preproc2/Preprocessor.java:50-54` (after
`ReadFilterAddConfig`, no quote-comment pre-strip — `:51` is commented out
upstream) in the main chain, and `TContext.java:661` for `!include`d readers.
Gate on the full-corpus `render-manifest --diff`: only fixtures containing a
trailing-`\` line (grep first, list in the batch overview) may move.
**Consequences.** Every diagram type gains continuation; the manifest proves
nothing else moved. Rejected: a state-only merge in `state-commands.ts`.

## D4 — Harness baseline: F0 first, then re-pin downward only
**Decision.** T0 lands Candidate B pairing (METRIC-AUDIT §3) with counters
provably identical (272/2654/2481/144/29/4/79) and re-pins. Every later task
re-pins only after `harness-diff.py` prints `0 rows appeared or grew`; task
exit = its fixtures' rows exact. **Consequences.** README stop 3 is mechanical.

## D5 — Ratchets tighten in-task
**Decision.** Each F-task removes/tightens its fixtures' entries in
`oracle/goldens/state/size-backlog.json` and `tests/oracle/dot-parity-backlog-
data.ts` in the same commit; svg-conformance state golden ratchet rise-only.
Rejected: one end-of-mission sweep (hides regressions).

## D6 — Batch 5 is diagnosis-only on SI28's SCHEMA
**Decision.** D1–D8 write `findings/<group>.md` on
`plans/state-declared-size-diagnosis/findings/SCHEMA.md`; no `src/` edits;
a ≤5-line fix may be PROPOSED in the record, not applied. Follow-on fix
batch = a later mission.

## D7 — Model routing and commit discipline
**Decision.** T6, T8, T20: `general-purpose` (Opus, effort high, brevity
constraint). Every other task: `typescript-pro` (Sonnet). Agents run no git;
orchestrator commits `git commit -- <paths>` per task; merge commit to main.

## D8 — Repo law carried as ADRs
No engine→engine imports (`layering.test.ts` green, `KNOWN_DEBT = []`); never
fit a value — every constant cites `~/git/plantuml` `file:line`; the
sizer/renderer parity audit (`planning/sizer-renderer-parity.md`) is run and
noted by T6 and T7; `.claude/catalog.md` is not created.

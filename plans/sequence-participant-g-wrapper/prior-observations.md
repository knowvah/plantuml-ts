# Prior observations bearing on this write-set

Injected verbatim into task prompts per `rules/parallelism.md` §0. Only the
notes that bear on `src/diagrams/sequence/renderer.ts` and the sequence
comparator are here; unrelated notes are distractors and are left out.

---

## 1. The comparator blocks descent — the whole reason this mission exists

`.agent-notes/T15-comparator-blocks-arrow-descent.md`. Measured twice, once
by the task agent and once independently by the orchestrator.

- Every sequence fixture short-circuits on a TAG mismatch at the first
  participant child, so **no arrow attribute is ever compared**.
- Origin: `tests/oracle/svg-conformance/compare.ts:222-231`,
  `return; // structural mismatch — stop here`.
- Verified by dumping all 30 diffs of `celego-19-laji937`: 4 root dimensions,
  the rest tag mismatches (`line vs g`, `rect vs g`, `text vs rect`,
  `polygon vs text`). **Not one `polygon/@points` record exists.**
- It **supersedes** `.agent-notes/T13-sequence-ratchet-rise-diagnosis.md:167-172`,
  which saw the same wrapper gap but concluded it "moves no ratchet". It does
  not merely fail to move the ratchet — it blocks descent.

## 2. `compareSvg`'s diff COUNT is not monotonic; `weightedScore` is

Memory `comparesvg-count-not-monotonic`, and D5 of
`plans/sequence-root-chrome/decisions.md`. Three short-circuits each used to
cost exactly 1 however large the skipped subtree. `weightedScore` charges an
upper bound instead and **is** monotone in alignment.

**Gate on `weightedScore`.** A risen `diffCount` beside a fallen
`weightedScore` is expected, not a failure.

## 3. `sequencediagram/graphic/` is DEAD for rendering — `teoz/` is live

`planning/next-missions.md`. Reading `graphic/` to answer "what does upstream
draw?" gives confidently wrong answers; it has already cost one wrong
constant, one throwaway commit and one locked decision's premise.

**And the corollary that outlived the correction:** "every call site is under
`teoz/`" means "every call site is LIVE", never "this is optional/teoz-only
behaviour". That inference produced a second wrong conclusion (`hnote`
shapes) inside the same mission.

**A call-site census is not evidence about what upstream draws. Only the
method body is.**

## 4. Verify agent claims before committing them

Memory `verify-agent-claims-si31`. Subagent reports in this repo have carried
confident mechanism claims that measurement disproved. Re-measure before a
claim reaches a commit message or the journal.

## 5. No Prettier in this repo

Memory `no-prettier-in-plantuml-ts`. It rewrites every quote and no gate
catches it. Do not run it.

## 6. Complexity limits are hook-enforced

`rules/code-principles.md`: `PostToolUse` hook **blocks** the write at 500
lines/file, 30 NLOC/function, CCN 10, 5 params. `renderer.ts` is already
large — check its length before adding to it, and extract to a sibling
module (as `renderer-participant-shapes.ts` and `renderer-message.ts`
already do) rather than growing it past the cap.

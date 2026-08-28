# Prior observations bearing on this write-set

Carried forward from earlier missions. Each has already cost real time.

## 1. `compareSvg`'s diff COUNT is not monotone in fidelity

`compareNodes` short-circuits in three places — node type, tag, child count
(`compare.ts:198,229,404`) — and charges each `units(actual) + units(expected)`.
The charge scales with the size of OUR document, so the same "still mismatched"
verdict costs strictly more once our side grows, even when our side moved
CLOSER to the golden.

**`weightedScore` is the gated quantity and IS monotone. `diffCount` is
informational and is never gated.** A risen `diffCount` beside a fallen
`weightedScore` is the expected artefact, not a failure.

Never read a raw count as fidelity. Go through
`scripts/sequence-ratchet-adjudicate.ts`.

## 2. A census that swallows exceptions is worse than no census

Two of `sequence-participant-g-wrapper`'s own throwaway census scripts called
`layoutSequence(ast, measurer)` against a `(ast, theme, measurer)` signature
and swallowed every throw into a bare `catch {}`, reporting a clean `[]` for a
population of 32. The mission nearly acted on both.

**Any throwaway script in this mission MUST report its own skip count.**

## 3. Two measurement seams are mandatory, not optional

`renderSync` returns `errorSvg` when `options.includeStore` is absent
(`src/index.ts:213`), and `resolveMeasurer` defaults to `CanvasMeasurer`, which
is unimplemented under jsdom. Either turns a resolution or layout failure into
a FALSE measurement.

Always go through `tests/oracle/svg-conformance/render-fixture-sequence.ts`
with `DeterministicMeasurer` and `fixtureIncludeStore()` passed **explicitly**.

## 4. `sequencediagram/graphic/` is DEAD — and so is the corollary

`SequenceDiagram.java:306-309` returns `SequenceDiagramFileMakerTeoz`
unconditionally. **All sequence pixels come from `sequencediagram/teoz/`.**
Reading `graphic/` to answer "what does upstream draw?" gives confidently wrong
answers.

**The corollary is the trap that outlived the correction:** "every call site is
under `teoz/`" means "every call site is LIVE", never "this is
optional/teoz-only behaviour". That inference produced a second wrong
conclusion inside the very mission that established the first.

**A call-site census is not evidence about what upstream draws. Only the method
body is.**

## 5. Read the Java method body, not a summary

Most-violated rule in this repo, and it is not forgotten — it is out-competed
by a measurement harness, because a fast numeric loop feels like evidence.
Stop and open the Java before you (1) state *why* something differs, (2) act on
a number you just measured, (3) repeat a mechanism from a ledger or brief or
subagent or your own earlier message, (4) call something unported or out of
scope.

**This brief is a ledger.** Its mechanism claims were verified during planning,
but verify again before acting on one — the filing this mission came from had
its mechanism subtly wrong (see README).

## 6. `npm test` is red at baseline

567 of 1151 sequence-ratchet assertions fail on
`feat/sequence-participant-g-wrapper`. That is the known blocked state this
mission exists to clear, not a regression. Do not "fix" it, and above all do
not re-pin to silence it (D8).

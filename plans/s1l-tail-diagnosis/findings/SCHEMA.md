# Findings record schema (ADR-1) — T8's interface contract

One record per fixture. Copy this block verbatim and fill it. T8 parses these
across all seven files, so **do not vary the field names or their order**.

```markdown
### <slug>

- **bucketLabel:** <the classifier's label — provenance only, ADR-3>
- **delta:** <maxSizeDeltaIn, in inches, as measured NOW>
- **status:** resolved | unresolved | already-conformant | divergence-proposed
- **mechanism:** <one or two sentences. The CAUSE, not the symptom. If
  status is `unresolved`, write "UNRESOLVED" and fill ruledOut + nextStep.>
- **originFileLine:** <path/to/file.ts:LINE — the single site the mechanism
  originates at. Never a bucket label, never "somewhere in X".>
- **causalChain:** <why the observed delta follows from that cause. Include
  the arithmetic where the delta is numeric.>
- **ruledOut:** <what you eliminated, and the EVIDENCE that eliminated it.
  An empty list on a non-trivial fixture means it was guessed — see
  `~/.claude/rules/diagnosis.md`.>
- **sharedCauseWith:** <slugs (ANY bucket) you believe share this exact
  mechanism, or `none`. This is the field T8 re-partitions on.>
- **proposedWriteSet:** <files a fix would touch. Estimate, not a patch.>
- **sizeEstimate:** <files / blast radius / verification cost. One line.>
- **confidence:** high | medium | low
- **nextStep:** <required when status is `unresolved`: the next
  instrumentation you would run. Omit otherwise.>
```

## Rules that decide whether a record is acceptable

1. **`originFileLine` must be a real file and line.** "The container bbox
   code" is not a mechanism; `frontier-cluster-bbox.ts:118` is.
2. **`ruledOut` must be non-empty for any non-trivial fixture.** Per
   `diagnosis.md`, an empty ruled-out list on a hard fixture means the cause
   was guessed rather than isolated.
3. **Identical deltas must be reconciled.** These pairs are already known to
   carry the same number to four decimals:
   - `kovaxi-11-reti348` / `zidebi-71-nocu387` — both 0.772
   - `lesori-32-zeve057` / `ravodu-50-siso430` — both 0.2429
   - `loroto-06-fano471` / `toxine-81-xofo986` — both 0.0833
   For each pair, either both records name the other in `sharedCauseWith`, or
   both state explicitly why an identical delta does NOT imply a shared cause.
   `CLAUDE.md`: "An IDENTICAL delta across fixtures = ONE shared cause" — it
   has held every time so far, so contradicting it needs evidence.
4. **`unresolved` is a legitimate outcome.** Record it honestly with
   `ruledOut` and `nextStep`. Do NOT invent a plausible mechanism to look
   complete — the fix mission will act on whatever you write, so a fabricated
   diagnosis is strictly worse than an admitted gap.
5. **No fix, no patch, no source edit** (ADR-2/ADR-5).

## Measuring a fixture

```sh
# current delta + cause label for everything
npx tsx scripts/measure-description-size-deltas.ts

# the jar's own oracle for one fixture
ls test-results/dot-cache/{component,usecase}/<slug>/   # in.puml, in.svg
```

Probes go in `scripts_scratch/` and are deleted before commit. Import the
real pipeline rather than reimplementing it — `renderFixtureDescription`
(`tests/oracle/svg-conformance/render-fixture.ts`) and `DeterministicMeasurer`
are the seam the goldens were captured through.

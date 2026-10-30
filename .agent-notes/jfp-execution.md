## Observation: a brief's "known divergence" can be output-inert — probe before porting
- **Context**: jfp's brief named M1 (size echo) and M2 (min-shift vs `Mirror(max)`) as the json family's two known structural divergences and planned B2+B3 around closing rows with them.
- **Finding**: the B1 probe of exactly that port changed zero bytes on all 92 rows. The structural difference was real in the code but not in the output, because a precondition (root alone in rank 0) made the two formulas coincide. The brief's design (B1 diagnosis with an uncommitted probe BEFORE the core change) is what caught it; the user then ruled to land the port anyway as structure.
- **Impact**: when a brief predicts that a structural port closes rows, keep a probe batch ahead of the core change; a reading of the Java alone does not tell you the output moves.
- **Confidence**: High

## Observation: "conformant" in the golden ratchets is ≤ 0.01, not 0
- **Context**: jfp T0b, positional residue measure.
- **Finding**: json/babico-87-soxo095 is ratchet-conformant but measures 0.001 (3-dp rounding of a `.xxx5` value, ours 57.637 vs jar 57.638). `TOLERANCES.deterministic` = 0.01 (`compare.ts:27`) defines conformant; the positional gate gives conformant rows an implicit 0.01 band.
- **Impact**: any new per-row magnitude gate must use compare's tolerance for "conformant", or it rejects rows the ratchets accept.
- **Confidence**: High

## Observation: a mirrored-structure fix can measure worse on our engine
- **Context**: jfp T4b, mirroring `SmetanaForJson.java:253-254` (no label on an empty record).
- **Finding**: without a label, dot-engine sizes the default `\N` as the node NAME plus record XPAD/YPAD (29.5 × 25.5 for `n1`); Smetana's `storeline` sizes any non-`_dim_` text (0,16) with no PAD (`labels__c.java:119-122`). Mirroring the jar's structure here raises 4 rows and unaligns 6, so only the declared-size half landed.
- **Impact**: on Smetana paths, a structure mirror that lets the ENGINE decide a size inherits graphviz-version arithmetic; measure it per row before committing.
- **Confidence**: High

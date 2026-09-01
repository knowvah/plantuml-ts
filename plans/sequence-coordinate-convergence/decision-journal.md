# Decision journal — sequence-coordinate-convergence

Branch `feat/sequence-coordinate-convergence`, cut from `main` @ `ebbd1f41`.

| # | when | decision | why |
|---|---|---|---|
| J1 | Batch 0 | The brief was found at `~/git/plantuml/plans/sequence-coordinate-convergence/` — the upstream JAVA clone, not this repo. Copied into `plans/sequence-coordinate-convergence/` here and executed from there. | The Java clone is a read-only reference checkout; a mission brief for this port belongs in this port's `plans/`. No content changed. |
| J2 | T1.2 | Baseline recorded as BOTH `findings/baseline.md` (the brief's write-set) and `findings/baseline.json` (the machine-readable snapshot the instrument's `--compare` mode reads). | Every later batch's gate is "distance fell against Batch 1's baseline". Re-deriving that from a prose table by hand is exactly the kind of transcription that fits a constant. The JSON is additive, lives inside this mission's own plan directory, and is owned by no other task. |

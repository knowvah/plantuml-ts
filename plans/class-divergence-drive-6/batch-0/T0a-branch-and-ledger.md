# T0a: branch and ledger

**Task.**
1. `git checkout -b feat/class-divergence-drive-6` from main (`0f3998f57` or later).
   Commit the brief: `docs(cdd6): plan class-divergence-drive-6 mission brief`.
2. Create `fixtures.md` with the header below and one row per cdd5 row whose
   `final` is `open -> cdd6` (62 rows), copying `tree/slug`, `mechanism` and
   `family` from `plans/class-divergence-drive-5/fixtures.md`; `task` = the owning
   cdd6 task from the batch overviews (or `T0d` for D1's doubtful rows); `final`
   empty. List the 4 accept-candidates under a "Not in scope" note.

```
| tree/slug | verdict (b0) | dotEqual | family | cdd5 mechanism | task | cdd6 mechanism | final |
```

3. Journal the row counts per task. Commit `docs(cdd6-T0a): seed the row ledger`.

**Write-set:** `fixtures.md`, `decision-journal.md`. **Read-set:** cdd5 `fixtures.md`.

**Acceptance.**
- Given the cdd5 ledger, then every `open -> cdd6` row appears once, with a task.

**Observability:** N/A. **Rollback:** Reversible.

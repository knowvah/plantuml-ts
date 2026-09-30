# T0a: branch, ledger, signed acceptances, salt hand-off

Agent: orchestrator.

**Task.**
1. `git checkout -b feat/class-divergence-drive-7` from main (`bfa8d8e09` or later;
   journal the actual base). Commit the brief:
   `docs(cdd7): plan class-divergence-drive-7 mission brief`.
2. Create `fixtures.md` with the header below and one row per cdd6 row whose `final`
   is `open -> cdd7` or `accept-candidate` (20 rows), copying `tree/slug`, `family`
   and the cdd6 mechanism column from `plans/class-divergence-drive-6/fixtures.md`;
   `cdd6 row` = the journal row(s) carrying the mechanism; `task` = the owning cdd7
   task from the batch overviews; `final` = `accepted (D8)` for the eight D8 rows,
   `open -> salt-engine-port` for lubicu, empty otherwise.

```
| tree/slug | verdict (b0) | dotEqual | family | cdd6 mechanism | cdd6 row | task | cdd7 mechanism | final |
```

   Row → task: bonaco T2a; sejube, bisefo T1a; kexaba T1b; xuloxo T1b (edge label)
   + T1c (leaf style); dezobu T1c; fepiko T1d; tefeco T1e; josebu T1f; rojida T1g.

3. Acceptances (D8): append eight entries to `oracle/accepted-divergences.json` in
   the existing shape — `match.id`, `scope`, `acceptedAt: "2026-09-30"`,
   `acceptedBy: "maintainer"`, `reason` (> 80 chars, quoting `decisions.md#D8` and
   the cdd6 journal row). Id form is `svg-<type>/<slug>` where `<type>` names the
   parity file the slug lives in (`tests/oracle/svg-conformance/emitter.golden.test.ts:150-158`
   resolves `svg-unknown/<slug>` against `parity-unknown.json`): all eight rows are
   unknown-tree, so `svg-unknown/<slug>`. semutu's entry adds `until`. The ledger is
   a record, not an accounting change: the survey bars keep counting these rows
   (cdd6's 15 class acceptances still read as non-conformant in 708/3/12), and the
   `no in-force entry names a fixture a fix has since made conformant` test retires an
   entry the moment its row turns conformant. Add a short `DIVERGENCES.md` note under
   the existing Smetana / embedded-42×42 sections listing the eight ids.
4. Salt hand-off (D9): add a `## salt-engine-port — proposed` stub to
   `planning/next-missions.md` (below the cdd6 section): the corpus row (lubicu),
   the Java measurement (62 files / 5,669 lines: `salt/`, `salt/element/`,
   `salt/factory/`), the harness shape (mindmap-engine-port T0b: golden ratchet +
   diff-baseline), and that description-label and note embeds already reach the
   registered renderer (cdd6 ledger, lubicu row).
5. Journal the row counts per task. Commit
   `docs(cdd7-T0a): seed the ledger, sign eight acceptances, file salt hand-off`
   (body: the eight ids and D8).

**Write-set:** `fixtures.md`, `decision-journal.md`, `oracle/accepted-divergences.json`,
`DIVERGENCES.md`, `planning/next-missions.md`.
**Read-set:** cdd6 `fixtures.md`; `decisions.md#D8`, `#D9`; the first two entries of
`oracle/accepted-divergences.json`; `DIVERGENCES.md:108-125` (ELK entry, the shape);
`tests/oracle/svg-conformance/emitter.golden.test.ts:95-175` (ledger schema + retire test).

**Acceptance.**
- Given the cdd6 ledger, then every `open -> cdd7` and `accept-candidate` row appears
  once (20 rows), with a task or a `final`, and its cdd6 journal row number.
- Given the eight entries, when `npx vitest run tests/oracle/svg-conformance/emitter.golden.test.ts`
  runs, then both ledger tests pass (schema-valid, none already conformant) and
  `npm run parity:dashboard` lists the eight under the divergence ledger.
- Given semutu's entry, then it carries `until` and DIVERGENCES.md calls it revocable.
- Given `planning/next-missions.md`, then `salt-engine-port` names lubicu and the
  62-file measurement.

**Observability:** N/A. **Rollback:** Reversible.

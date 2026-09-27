# T0f: re-verify the 17 accepted divergences on 8beta1 (D7, D9)

**Context.** `oracle/accepted-divergences.json` holds 17 in-force class entries:
- 7 ELK (`!pragma layout elk`, ruled unsupported);
- 6 embedded `{{ }}` payload (D9 of cdd1; moxobo and zikabo carry `surveyBlind`);
- luzive and sadamo (error-page identity);
- zuduxu (jar crash page);
- nugecu (dot-engine A3).

Each was verified against 7beta11. The ledger gate in `emitter.golden.test.ts`
fails when an in-force entry reads conformant: good news, so retire it (memory:
conformance-failures-are-good-news).

**Task.**
1. Run render-diff on all 17 against the new cache. For each, record whether the
   divergence the reason describes is still exactly what differs.
2. Unchanged premise: update only the "Re-verified" date and version in the reason
   (D9: luzive and sadamo's jar banner now reads 8beta1).
3. Changed premise (for example, zuduxu's jar no longer crashes, or an ELK row
   changed shape): leave the entry in force, journal it, add a `fixtures.md` row with
   `final = open -> maintainer`, and list it for next-missions. Never rewrite a
   maintainer-signed reason (D7, stop 12).
4. Reads conformant: move it to `retired` with the date and the fix that closed it,
   and journal it. This is the ledger gate's intended path.
5. besepi: record its verdict. It should be conformant, per T0d. If it isn't, it
   becomes a normal drive row.
6. Run the ledger gate and full `npm test`. Commit
   `chore(cdd5-T0f): re-verify accepted divergences on 8beta1`.

**Write-set:** `oracle/accepted-divergences.json`, `fixtures.md`, journal, README tick.
**Read-set:** `oracle/accepted-divergences.json`,
`tests/oracle/svg-conformance/emitter.golden.test.ts` (ledger gate),
`decisions.md#D7`, `#D9`.

**Acceptance.**
- Given all 17 entries, then each has a journal row: re-verified, flagged or retired.
- Given the ledger gate, then green.

**Observability:** N/A. **Rollback:** Reversible.

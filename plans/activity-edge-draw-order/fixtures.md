# Affected fixtures (measured by T1, 2026-09-15)

Union of every baseline fixture that moved in T1's re-measurement, with its
pin at `6ff347f8`. `a` / `b` are that rule's delta against
[`measurements/base.json`](measurements/base.json); `-` means the rule left
it unchanged. Bold is a RISE.

Measured in a scratch worktree off `6ff347f8` with `edges` AND `edgeMeta`
permuted together (D1), the shape the provisional table did NOT have. A
control run with both gates off reproduced the baseline exactly (aggregate
52673, every delta 0), so each column below is the rule and nothing else.

Aggregates: base **52673** · (a) **52616** · (b) **52078** · (a)+(b)
**52067**. Runs: [`scratch-a.json`](measurements/scratch-a.json),
[`scratch-b.json`](measurements/scratch-b.json),
[`scratch-ab.json`](measurements/scratch-ab.json).

Sum of pins below: **11193** over 38 slugs.

| slug | pin | a | b |
|---|---|---|---|
| `becanu-19-diti597` | 197 | - | −14 |
| `bixefi-77-moki051` | 222 | - | −64 |
| `bugaja-31-jaso630` | 206 | - | −16 |
| `bumaca-51-kece901` | 169 | - | **+4** |
| `cemipu-87-dinu624` | 245 | - | −6 |
| `decudi-92-bisu741` | 362 | - | **+4** |
| `firibi-00-puki721` | 348 | - | −48 |
| `gevaxi-80-tone223` | 225 | −5 | - |
| `givanu-33-kire967` | 204 | - | −4 |
| `gugala-11-suce270` | 248 | −16 | −48 |
| `jevoce-05-mumi686` | 397 | **+2** | −22 |
| `judatu-15-xize591` | 575 | **+2** | **+2** |
| `jupivo-67-gidi531` | 320 | −6 | - |
| `kasadu-53-tuki533` | 164 | - | −4 |
| `kudedo-31-pafi082` | 167 | - | −10 |
| `mafete-03-rapa918` | 174 | - | −12 |
| `maketa-43-juja264` | 275 | - | **+1** |
| `manata-12-rido730` | 263 | - | −6 |
| `megara-21-rumi574` | 213 | - | −8 |
| `misiji-27-buje656` | 205 | **+32** | −32 |
| `navene-45-cozo466` | 600 | - | −18 |
| `nesozi-09-zezu092` | 133 | - | −6 |
| `nikinu-06-sace939` | 243 | - | −6 |
| `noxasi-06-nejo322` | 223 | - | −32 |
| `nupose-71-vido428` | 377 | - | −12 |
| `patagi-39-jone354` | 110 | - | −16 |
| `pezubu-98-niba240` | 198 | - | −6 |
| `pujozo-36-nino158` | 177 | - | −10 |
| `racana-82-zece676` | 406 | −64 | −128 |
| `raruzu-62-giro837` | 243 | - | −6 |
| `roboja-69-susa752` | 377 | - | −12 |
| `ruzica-16-deli877` | 538 | - | −24 |
| `sucice-41-pebi088` | 242 | - | −6 |
| `tobajo-64-mipi810` | 956 | −2 | −14 |
| `vidada-17-xuse810` | 245 | - | −6 |
| `xarumo-26-zinu467` | 217 | - | **+4** |
| `xovano-23-tazo278` | 351 | - | −8 |
| `zeporo-46-zicu301` | 378 | - | −6 |

## How this differs from the provisional table

- **Membership is identical** — the same 38 slugs, none added, none dropped.
  The misaligned `edgeMeta` changed the numbers, not which fixtures move.
- **The pin sum was wrong, not stale.** The provisional header said 11035;
  re-adding its own rows gives 11193, which matches
  [`diff-baseline.json`](../../oracle/goldens/svg-activity/diff-baseline.json)
  row for row. A transcription error in the header, not a pin change.
- Rule (a): 52616, identical to the provisional run — with zero split/fork
  connectors crossing a lane boundary in the misaligned scratch, permuting
  `edgeMeta` alongside `edges` changed nothing for (a). Its riser/faller sets
  match too.
- Rule (b): **52078**, not 52074 (4 higher). (a)+(b): **52067**, not 52066.
- `maketa-43-juja264`'s one-unit move under (b) SURVIVES the D1 permutation
  (+1), so it is not an artefact of the misaligned `edgeMeta` as the
  provisional note guessed. Its mechanism is in `.agent-notes/aedo-T1.md` Q5.
- `xarumo-26-zinu467` is **+4** under (b) in BOTH runs — the D1 permutation
  did not change it. It is a genuine riser, mechanism in Q5.

## Notes for T2/T3

- Rule (b) owns 36 of the 38 rows; rule (a) owns 7, and 5 of those overlap.
  Only `gevaxi-80-tone223` and `jupivo-67-gidi531` move under (a) ALONE.
- Every (a) riser is absorbed once (b) lands: the `ab` column equals the `b`
  column on every row except `gevaxi` and `jupivo` (which (b) does not
  touch). `misiji-27-buje656` is the clearest case — **+32** under (a) alone,
  −32 under (b) alone AND under (a)+(b).
- Five rows still rise under (a)+(b): `bumaca` +4, `decudi` +4, `xarumo` +4,
  `judatu` +2, `maketa` +1. All five are element-COUNT mismatches against the
  jar, where `weightedScore` pairs positionally; mechanisms in Q5. None is a
  geometry regression.
- Baseline population, re-measured from the AST (not a markup regex): **59**
  of 268 baseline fixtures declare a swimlane, not 60. 18 split and 17 fork
  fixtures (32 unique).

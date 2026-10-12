# class-divergence-drive-8 (cdd8)

**Read first, every start and after every compaction:**
`~/.claude/docs/reference/autonomous-execution.md`, then this file, then
[decisions.md](decisions.md), then the current batch's `overview.md`. Tail
[decision-journal.md](decision-journal.md) for where you stopped.

## Objective

Push every remaining non-conformant CLASS-routed row to conforming, or to an
acceptance that is honest. The biggest item is **porting upstream's ELK layout
maker** (`net/sourceforge/plantuml/elk/`) on top of `elkjs@0.12.0`, which is
the same ELK 0.12.0 the jar bundles. It goes behind a swappable `ElkBackend`
seam, because the maintainer will port ELK itself to TypeScript next (D2).
Alongside: re-capture the five `!pragma layout smetana` unknown rows with the
pragma stripped (G0 policy), port the archimate sprite stereotype (dezobu),
replace the latex size heuristic with JLaTeXMath's TeXIcon rule (sapofa), and
retire two acceptances whose stated mechanism is false (bixogo, roxosu → salt).
The mission ends by launching `/plan-mission salt-engine-port` (D10).

Starting state (main `84bd0c3f4`, clean; measured 2026-10-11 with
`render-all --tree all`):
- class bucket survey **713 / 3 / 7** (3 of the 713 are error-page conformant);
  unknown CLASS-routed **275 / 10 / 2** (both diverged rows error-page conformant).
- 20 non-conformant CLASS-routed rows, listed in [fixtures.md](fixtures.md).

**Exit target:**
- class bucket **720 / 3 / 0**: bixogo and roxosu are open → salt-engine-port; nugecu
  stays accepted under D5/D11.1.
- unknown CLASS-routed **282 / 3**: gubeca and jixibu stay accepted (Smetana nested yaml);
  lubicu is open → salt.
- 0 conformant losses in any engine.

## Branch

`feat/class-divergence-drive-8` off main, with one merge commit at close (never
squash: the journal cites per-task commits). **Never push** anything: not main,
not dot-engine, not the plantuml fork. `plans/` is tracked, so commit the brief.
Each task gets its own worktree via
`plans/class-divergence-drive-8/measurements/mkwt.sh <Tid>`.

## Quality gates (all four before any commit lands on the branch)

```sh
npm test -- --maxWorkers=6 --reporter=default --reporter=json --outputFile.json=<path>
npm run typecheck
npm run lint
npm run build
```
The JSON reporter's collected file count must equal
`find tests -name '*.test.ts' | wc -l`. Check load first with `uptime`; above
~10, wait. A new src module means running `npm run catalog`.

Measurement:
- Survey: `npm run svg:survey -- <engine> --out <path>`. Never use the
  positional form.
- Census: `npx jiti scripts/svg-conformance-census.ts class --json <path>`.
- `$T` = `plans/class-divergence-drive/tools/`: `render-all.mts <out> --tree
  all`, `render-diff.mts <tree/slug...>`, `pin-diff.mts`, `pin-goldens.mts --tree`.
- Oracle renders: `scripts/oracle-render.sh <out-dir> <puml>` only.
- Batch close: [close-procedure.md](close-procedure.md).

## Stop conditions (halt, journal, report)

1. A task needs a file that another task in the same batch owns.
2. The same gate fails on 2 consecutive fix attempts, or one code location changes
   3 times without resolving the same check.
3. A finding contradicts D1–D13: amend `decisions.md`, then halt.
4. A conformant fixture in any engine stops being conformant, or `dotEqual` flips
   true→false, with no stated mechanism.
5. A diff count rises with no mechanism. A structural fall alongside a numeric rise
   is a reveal, not a stop.
6. Class DOT parity goes red.
7. Collected ≠ on-disk after a `--maxWorkers=6` rerun, or a survey times out while
   load is below 8.
8. More than **60** fixtures outside class change verdict at a batch close (D9).
9. Any edit under `~/git/knowvah/dot-engine` or the plantuml fork, or any push (D5).
10. Any change to the oracle jar or cached oracle bytes, except T0b's five
    re-captures (D7) and a journaled re-render of an error page.
11. Signing any acceptance outside D11's three classes. Any ELK residue counts.
12. A public API change beyond D2's additive `RenderOptions.elk`, `loadElk()` and
    `ElkBackend`.
13. The T0c spike: elkjs node coordinates differ from the jar's on cadutu.
14. T2e: any fixture without `!pragma layout elk` renders different bytes than at b0.
15. elkjs's worker `dispatcher` is missing or changes shape.
16. T1d cannot size single-atom latex (`\theta`, `\nu`) exactly within its 2-fix budget.

## Push-forward (decide, journal, continue)

- A pure type or file-cap move that extends a write-set (a helper split forced by
  the complexity hook, a type re-home). Journal the consumers.
- A unit-test pin update explained by a measured mechanism and a Java quote.
- Latex movers in other engines: re-pin each after verifying its new size against
  the jar, or sign it under D11.3.
- A dot-engine mismatch confirmed with real `dot -Tdot` against the cached
  `svek-N.dot`: sign it under D11.2.
- Description ELK fixtures (T3b): fix them when they share a mechanism with a
  class row, otherwise ledger them with their mechanism.
- Re-slotting a residual to a later batch, when its mechanism is stated.
- `npm run catalog` whenever exports change.

## Batches

| Batch | Tasks | Status |
|---|---|---|
| [0](batch-0/overview.md): baseline, hygiene, re-capture, ELK spike | T0a, T0b, T0c | [x] |
| [1](batch-1/overview.md): seam + independent fixes | T1a ElkBackend, T1b pragma, T1c dezobu, T1d latex, T1e xagomi hexagon | [x] |
| [2a](batch-2a/overview.md): ELK maker + adapter, harness preload | T2a, T2e | [x] |
| [2b](batch-2b/overview.md): ELK cluster + edge drawing | T2c, T2d | [x] |
| [2c](batch-2c/overview.md): ELK composite drawing | T2b | [x] |
| [3](batch-3/overview.md): wiring, ELK rows, ruling docs | T3a, T3b, T3c | [ ] |
| [exit](exit/overview.md): close + salt hand-off | T-exit, T-salt | [ ] |

## Index

- [decisions.md](decisions.md): D1–D13 (locked)
- [fixtures.md](fixtures.md): the row ledger (20 rows)
- [close-procedure.md](close-procedure.md): the standard batch close
- [decision-journal.md](decision-journal.md): append-only
- [diagrams/component-map.md](diagrams/component-map.md),
  [diagrams/data-flow.md](diagrams/data-flow.md)
- [settings.autonomous.json](settings.autonomous.json): copied to
  `.claude/settings.autonomous.json`

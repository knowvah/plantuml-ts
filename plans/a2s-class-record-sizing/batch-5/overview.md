# Batch 5 — Round 2 (the 24-fixture ledger queue)

Branch `feature/a2s-round-2` from main @ 267c3a66. Baseline 687/711
(96.6%), widened 0. Queue + mechanisms: [../ledger.md](../ledger.md).
Same discipline as round 1: probe → mechanism confirm → TDD fix; no
fitted constants; agents never run git or touch size-backlog.json
(orchestrator prunes after gates). gujigi-63 stays ledgered (SI1-gated).

| ID | Covers (slugs) | Write-set | Depends On | Done |
|----|----------------|-----------|------------|------|
| R2a | curupe-50 (monospace ""), lecelo-92 (<U+>/&#N;/<:emoji:> in names), lozego-15 + rotisi-30 (sprite atom in bodies/stereotypes) | src/core/klimt/creole/** + tests | — | [ ] |
| R2b | roputo-88 + rozudo-79 (TIM builtins in single-line notes), xadado-92 (EmbeddedDiagram {{...}} in notes) | src/diagrams/class/note-layout-measure.ts, src/core/tim/** + tests | — | [ ] |
| R2c | julixi-10 + rulite-35 (\n in quoted class NAME header), daxeno-00 (creole size tag + \n in USymbol package title), mizupo-59 (!theme element font), sovuxo-25 (stereotyped classAttributeFontSize) | src/diagrams/class/class-layout-header-geo.ts, class-stereotype-layout.ts, class-layout-leaf-shapes.ts, class-layout-helpers.ts + tests | — | [ ] |
| R2d | rakuci-96 (parser drops quoted display for aliased empty group), pejone-71 + xonamo-50 (enhanced-body blank rows) | src/diagrams/class/parser.ts, class-container.ts, class-command-containers.ts, class-body-enhanced-layout.ts + tests | — | [ ] |
| R2e | DIAGNOSIS ONLY: jecopa-66 (hide-in-package scoping — probe first), dibinu-95, cukaze-78, pasova-33, puvono-84 + sekame-22 (3.00px), ponono-25 + sumocu-27 (0.18 bullet/wrap residual) | scratchpad probes + mechanism JSONs only | — | [ ] |

Orchestrator after batch: full gates + all ratchets (rc captured
directly, never piped), prune backlog, per-task commits, instantiate
R2e fixes (or ledger what remains), C2 close (survey refresh, ledger
reconcile, merge --no-ff).

# Batch 0 — branch, tools, b0, authored fixtures, harness, mirror audit

T0a first (branch, commit brief, b0 all-engine chain and gates). Then T0b and
T0d in parallel worktrees off the T0a tip; T0c after T0b merges (it seeds the
baseline from T0b's oracles). The close is the standard one with step 3
seeding `authored-baseline.json` for the first time: every `default`/`onechar`
row is expected `rootExact`, every `none`/`glyphs` row is expected not (that
is the mission), and the 12 D2 rows carry `textLength: 'baseline'`.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T0a](T0a-branch-tools-b0.md) | branch off `bf18ede54`, commit the brief, b0 all-engine chain + gates | orchestrator | `plans/lengthadjust-document-wide/**` | — | [x] |
| [T0b](T0b-authored-fixtures.md) | 64 authored `.puml` + jar oracles via `oracle-render.sh` | typescript-pro (sonnet) | `tests/fixtures/lengthadjust/**` | T0a | [x] |
| [T0c](T0c-authored-harness.md) | render helper, authored ratchet test, baseline builder; seed the baseline | typescript-pro (sonnet) | `tests/oracle/svg-conformance/render-fixture-lengthadjust.ts`, `…/lengthadjust.authored.ratchet.test.ts`, `oracle/goldens/svg-lengthadjust/`, `$T/build-authored-baseline.mts` | T0b | [x] |
| [T0d](T0d-mirror-audit.md) | audit the harness mirrors and the json text path for the field | typescript-pro (sonnet), artifact only | `plans/lengthadjust-document-wide/diagnosis/mirrors.md` | T0a | [x] |
| close | merge, gates, seed baseline, b0 ledger | orchestrator | per close-procedure | T0b–T0d | [x] |

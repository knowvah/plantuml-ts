# T1g: rojida — DOT diff and the `dotEqualExempt` pin path

Prepend [task-preamble.md](task-preamble.md).

## Task (TDD)
**rojida (`desc-embed-ink-missing`, cdd6 rows 73, 82).** Conformant since cdd6
T3b (2f985121c) but unpinned: `dotEqual` is false and the ratchet's AC3 test
(`class.golden.ratchet.test.ts:242-250`) requires true. D6:
1. Diff first. Capture our DOT for `unknown/rojida-14-fuli428` (layout-input
   observer; cdd6 T0d's `our-dot.mts` precedent) and diff it against the cached
   `test-results/dot-cache/unknown/rojida-14-fuli428/svek-1.dot`, using the
   survey's own normaliser (`scripts/lib/survey-dot-equal.ts#computeDotEqual` —
   report which lines it rejects). Report the delta verbatim.
2. Only if the delta is exclusively the embedded-label node size (the package leaf's
   `{{ }}` label: jar reserves 42×42 under deterministic text, memory
   `oracle-seam-embedded-42x42`; `EmbeddedDiagram.java:126-152`): add
   `dotEqualExempt?: string` to the ratchet row (`pin-goldens.mts:56` `RatchetRow`,
   the `--dot-equal-exempt <reason>` flag writes it and the eligibility abort at
   `:32` honours it) and to `RatchetFixture` in the test (`:60-66`); AC3 accepts
   `dotEqual=false` only for a row whose `dotEqualExempt` is a non-empty string
   equal to one of a small allow-list (`'oracle-seam-42x42'`), and the test still
   fails for any other row. Do NOT pin here — the orchestrator pins at the b1 close
   (close-procedure step 10) once the ratchet honours the field.
3. Any other delta: stop and report it (stop 14) — it is a port defect for a
   follow-up (`open -> cdd8`) or, if in the DOT text itself, a dot-sync row.

## Rows
- `unknown/rojida-14-fuli428` (conformant, dotEqual false, unpinned)

## Write-set
- `plans/class-divergence-drive/tools/pin-goldens.mts` + `pin-goldens.test.mts`
- `tests/oracle/svg-conformance/class.golden.ratchet.test.ts`
- `oracle/goldens/svg-class/README.md` ("Add rule": document the exemption)

## Read-set
`decisions.md#D6`; cdd6 journal rows 12 (rojida mechanisms), 73, 82; memory
`oracle-seam-embedded-42x42`; `scripts/lib/survey-dot-equal.ts`;
`class.golden.ratchet.test.ts:55-90,236-252`; `pin-goldens.mts:1-80`.

## Interface contracts
Out: `RatchetRow.dotEqualExempt?: 'oracle-seam-42x42'` — consumed by the b1 close's
pin step and by the ratchet test.

## Acceptance
- Given rojida's two DOTs, when diffed with the survey's normaliser, then the delta
  is in the report verbatim before any edit.
- Given a ratchet row with `dotEqualExempt: 'oracle-seam-42x42'` and a parity entry
  with `dotEqual: false`, when AC3 runs, then it passes for that row; given the same
  row without the field, or with an unknown reason, then it fails naming the slug.
- Given `pin-goldens.mts --dot-equal-exempt oracle-seam-42x42`, when it pins, then
  the ratchet row carries the field and the tamper/sort tests still pass.

## Architecture decisions (locked)
D6, D11.

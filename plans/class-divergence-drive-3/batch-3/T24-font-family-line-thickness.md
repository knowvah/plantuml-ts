# T24 — SVG font-family stack + style LineThickness

**Agent:** typescript-pro (opus) · **Depends on:** T20 · wave A (worktree, ∥ T21, T22).
Prompt = [`fix-task.md`](../fix-task.md) + this file + the cited `diagnosis/` sections (read them in full).

## Fixtures

filoxo-23-fafi328, rakopi-21-sufa571, xoteci-81-jena668 (E3-8 part)

## Mechanisms (leads — re-run each probe before editing; stop 13 if one does not reproduce)

- **C-5** (`C.md` § filoxo): `toSvgFontFamily` lacks `FontStack#getSvgFamily`'s mapping (SansSerif→sans-serif) — cross-engine.
- **C-6**: the class border and block0 divider hard-code 0.5 instead of the style LineThickness (rose resolves 1.0) — two sites; the divider was not probe-patched.
- **E3-8** (`E3.md` § xoteci): the class note renderer ignores note LineColor/LineThickness.

## Primaries (D4 — extend into any other `src/` file no concurrent task owns; name it in the commit body)

`src/core/svg-text-font.ts`, `src/diagrams/class/renderer-classifier-colors.ts`, `class-body-enhanced-geometry.ts`, `renderer-note.ts`, `src/core/style-cascade-class*.ts`; tests beside each; `.agent-notes/cdd3-T24.md` (under `plans/class-divergence-drive-3/`).

## Survey scope

C-5 is cross-engine: survey ALL engines vs T0 baseline.

## Acceptance criteria

- Given filoxo and rakopi, when rendered, then 0/0
- Given the conformant set at the previous close, when render-all runs, then none leaves conformant
- Given every mover, when reported, then each has a mechanism (structural fall + numeric rise = reveal)

## Observability · Rollback

N/A — no new observable operations. Reversible (revert the commit).

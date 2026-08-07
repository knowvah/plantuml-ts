# F4-d — Uncovered url-label first-line defect

Agent: **typescript-pro**. Closes **0 pinned fixtures (+0)** — this fixes a
reproduced defect with NO golden today. Per ADR-7 it needs an AUTHORED
`.puml` fixture plus a GENERATED jar oracle, landed in the same task as
the fix.

## Context

Found incidentally while T2 isolated `bivira-53-boja685` (`sprite.md`,
"Incidental observation" section) — not one of the 26 diagnosed fixtures,
not diagnosed to a jar-arithmetic level, but reproducible and recorded.

**The defect:** a display whose FIRST line is entirely `[[url label]]`
measures the url text as well as the label.

| probe (single-line display) | jar | ours |
|---|---|---|
| `rectangle "[[http://www.google.com abc]]"` | `0.591319` (= `abc` + 20) | `2.663368` |
| `rectangle "[[http://www.google.com]]"` | `2.242882` | `2.349826` (+7.7 = one extra `[`+`]`) |
| `rectangle "[[http://www.google.com <$maxime>]]"` | `0.944444` | `3.067775` |

`buildLineAtoms` is **NOT at fault** — `sprite.md`'s own record for
`bivira-53` confirms `buildLineAtoms("aa[[http://p.com <$maxime>]]")`
returns exactly `[text "aa", inline sprite]` — the url text is correctly
dropped from measured content there. The failure is specific to a display
whose FIRST line is ENTIRELY the url-label construct, upstream of creole
atom-building — start in the description parser's own `[[…]]`/display
split: `parse-helpers-strings.ts`'s `RE_URL_TOKEN_G`
(`:283` — `/\[\[[^\]]*(?:\][^\]]+)*\]\]/g`) and `parseNameSection` (the
consumer that decides what portion of a line is "name" vs "display").

## Task

1. Reproduce all three probes above locally (no jar needed for this step —
   confirm current, wrong behavior against the numbers shown).
2. Diagnose the mechanism in `parse-helpers-strings.ts` around
   `RE_URL_TOKEN_G` / `parseNameSection`: what does the current code treat
   as the element's "name" section when the entire first line is a
   `[[url label]]` construct, and why does the url text leak into the
   measured display? Per `~/.claude/rules/diagnosis.md`: instrument before
   hypothesizing, produce a mechanism (file:line + causal chain +
   ruled-out) before writing the fix. This is a genuine, unattributed
   defect — earlier records deliberately declined to name the mechanism
   (`sprite.md`: "Whoever picks this up should start there, not in
   creole" — a pointer, not a diagnosis).
3. Author a `.puml` fixture exercising the defect (the three probes above,
   or a superset covering the same shapes) and generate its jar oracle
   (see command in `batch-4/overview.md` — deterministic flag mandatory).
4. Fix the mechanism; verify against the new oracle.

## Write-set

| File | Change |
|---|---|
| `src/diagrams/description/parse-helpers-strings.ts` | fix at the diagnosed origin (expect near `RE_URL_TOKEN_G`/`parseNameSection`, verify before editing) |

This is the ONLY file in this task's write-set. Do NOT touch
`buildLineAtoms` or any creole atom file — already ruled out as the
cause.

## Read-set

| File:lines | Why |
|---|---|
| `parse-helpers-strings.ts:270-330` (approx, around `:283` and `parseNameSection`) | the url-token regex and name-section split — the diagnosed starting point |
| `parse-helpers-strings.ts:260-280` | `extractNodeStereotype` — F2-b's neighbor in this same file; read to avoid an accidental write-set collision with its already-landed change |
| `plans/s1l-tail-diagnosis/findings/sprite.md` "Incidental observation" section (bottom of file) | the three jar-probed numbers, the `buildLineAtoms` ruled-out evidence |
| `~/git/plantuml/src/main/java/net/sourceforge/plantuml/descdiagram/command/*` or wherever the display/name split is ported from | upstream's own `[[url label]]`-as-first-line handling — locate via Serena, do not guess |

## Architecture decisions binding this task

- **ADR-7**: "Two reproduced defects have no golden today ... Each gets an
  authored `.puml` **plus a generated jar oracle** in the same task as its
  fix — never a synthetic-only check." This IS that task for the
  url-label defect (the other, emoji-only line height, is F4-b's
  fold-in).
- **Sequencing note** (SYNTHESIS §8, decisions.md): "The url-label task
  sequences after F2-b because both write `parse-helpers-strings.ts`." F2-b
  lands `extractNodeStereotype`'s rewrite first; this task must read the
  post-F2-b state of the file before editing, not a stale copy.
- **ADR-1**: never write existing `size-backlog.json` entries; DO add the
  new fixture's own entry (a NEW pin, not a regeneration).
- **`~/.claude/rules/diagnosis.md`**: no fix before a stated mechanism —
  this defect arrives UN-attributed (the source records explicitly
  declined to name it), so this task owns the full diagnosis, not just
  the fix.

## Interface contracts

No new exported types required — this is a parser-internal fix. If the
diagnosed mechanism requires a new helper function inside
`parse-helpers-strings.ts`, name it consistently with the file's existing
`extractNodeStereotype`/`parseNameSection` naming, and keep it
module-private unless another file genuinely needs it (verify via Serena
`find_referencing_symbols` before exporting anything new).

## Acceptance criteria

1. **Given** `rectangle "[[http://www.google.com abc]]"`, **when**
   measured, **then** the result matches the jar (`0.591319in`, i.e. `abc`
   + margin only — the url text does not contribute to the measured
   width).
2. **Given** `rectangle "[[http://www.google.com]]"` (no label text, only
   the url), **when** measured, **then** the result matches the jar
   (`2.242882in`) — verify this case separately; it is NOT simply "drop
   the url", since the jar itself is non-trivial here (some url-derived
   text does appear when there is no separate label).
3. **Given** `rectangle "[[http://www.google.com <$maxime>]]"` (a sprite
   as the label, not text), **when** measured, **then** the result
   matches the jar (`0.944444in`).
4. **Given** a MULTI-line display whose SECOND (not first) line is a
   `[[url label]]` construct, **when** measured, **then** behavior is
   UNCHANGED from today — `bivira-53`'s own fixture already measures this
   shape correctly elsewhere in the line, so the fix must not regress the
   non-first-line case. Confirm by re-running `bivira-53` and `vivido-49`
   (both already-passing-post-F2-c fixtures that touch url-label sprites)
   and verifying no regression.
5. **Given** the full 351-fixture description ratchet, **when** re-run
   after this fix, **then** `widened == 0` — this is a change to a
   shared, heavily-trafficked parse-helper function, so treat the full
   ratchet as the real acceptance gate, not just the three probes.

## Quality bar

Per README + `batch-4/overview.md`, plus:
- Produce the diagnosis artifact per `~/.claude/rules/diagnosis.md`
  (mechanism, origin `file:line`, causal chain, ruled-out) in the
  completion summary BEFORE the fix is described.
- New fixture's jar oracle generated (deterministic flag) and committed
  under `oracle/goldens/description/<new-slug>/`, plus its
  `size-backlog.json` entry added (new pin, ADR-7-approved, not a
  regeneration).
- Full `npm test` — this touches a shared parse-helper; add unit tests
  for `parseNameSection`/`RE_URL_TOKEN_G`'s corrected behavior per
  `~/.claude/rules/testing.md` TDD discipline.
- `npx tsx scripts/measure-description-size-deltas.ts` — `widened == 0`,
  and note the new fixture's own conformance in the summary (it will not
  appear in the 351-count until the orchestrator registers it, per ADR-1's
  batch-level pin ownership).
- 90/90/90 coverage floor.

## Observability

No runtime logging surface applies. The diagnosis artifact IS the
observability record for this task — without it, per
`~/.claude/rules/diagnosis.md`, the work is not complete regardless of
whether the symptom disappears.

## Rollback classification

**Fully revertible.** A pure parser-logic change with no asset or
licence component; `git revert` is clean.

## Boundaries

**Always do**
- State the diagnosed mechanism (file:line, causal chain, ruled-out)
  before writing the fix.
- Verify against all three probe numbers plus the new fixture's oracle,
  not just the fixture used to author the `.puml`.

**Ask first**
- If the mechanism turns out to live outside `parse-helpers-strings.ts`
  after instrumentation (the incidental finding's pointer is a starting
  point, not a guarantee) — that would be a write-set change, escalate
  before editing a second file.

**Never do**
- Never patch `buildLineAtoms` or any creole atom file — already ruled
  out.
- Never regress the multi-line / non-first-line url-label case
  (acceptance criterion 4).
- Never write existing `size-backlog.json` pins.

## Commit format

`fix(F4-d): correct url-label first-line display measurement`

Body (required — non-obvious design decision + new fixture): state the
diagnosed mechanism per `~/.claude/rules/diagnosis.md`, cite the new
fixture's slug and oracle path.

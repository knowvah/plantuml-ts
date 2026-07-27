# T2 — Quoted-title literalness: diagnose, narrow-fix or document

## Context
The jar oracle SVG for `gafico-37` renders node `a` (`node "$var" as a`) as ONE
literal `<text>` = the full raw string (tags + `<U+…>` verbatim), 7.857in wide.
So the quoted title is neither creole-processed nor codepoint-decoded — UNLIKE a
normal quoted label such as `component "<b>Bold</b>"` (which upstream renders
bold). The trigger is unknown and likely specific to the `!$var`
preprocessor-variable-in-quotes case. See `decisions.md` Rule 2 / ADR-2.

## Task (diagnosis mode — `rules/diagnosis.md`)
1. Determine the EXACT trigger for the literal render. Probes (render + inspect
   `<text>`): `component "<b>Bold</b>"` (expect bold), `node "a<U+000A>b"`
   literal string, and the `!$var=` preprocessor form. Read the upstream
   title-display path (`descdiagram` `CommandCreateElementFull` →
   `Display.getWithNewlines` → the entity-title text-block build) to find where a
   preprocessor-substituted quoted value bypasses creole.
2. State the mechanism (file:line + causal chain + what was ruled out).
3. If the trigger is narrow and verifiable, implement it with REGRESSION GUARDS
   (a test asserting `component "<b>Bold</b>"` still renders bold). Else leave
   gafico's quoted-title node pinned at its true delta and document the
   mechanism in `plans/s1l-leaf-sizing/ledger.md`.

## Read-set
- `oracle/corpus-cache/component/gafico-37-cuma657/input.svg` (the literal
  `<text>`), `.../gafico-37-cuma657/svek-1.dot`.
- `~/git/plantuml/.../descdiagram/command/CommandCreateElementFull.java`
  (display extraction), `.../klimt/creole/Display.java#getWithNewlines`.
- `src/diagrams/description/parser.ts` (quoted-name → `node.display`),
  `src/core/svek/image/EntityImageDescription.ts` (title `name` build).
- `decisions.md#adr-2`.

## Write-set
- Per finding: `src/diagrams/description/parser.ts` OR
  `src/core/svek/image/EntityImageDescription*.ts` (+ a regression test) — OR
  `plans/s1l-leaf-sizing/ledger.md` (document + keep the pin).

## Boundaries
- **Ask first** if a fix would touch >3 files or risk other quoted-label
  fixtures. Do NOT broadly disable creole on quoted titles.
- Do NOT widen any other fixture's pin to "fix" gafico.

## Observability
N/A.

## Rollback
Reversible — revert the commit.

## Quality bar
Mechanism stated with file:line. If a fix lands: the regression test passes AND
no golden regresses (structure EQUAL, zero widened). If documented: `measure`
exit 0 with gafico pinned at its true delta.

## Acceptance criteria (Given/When/Then)
- Given the quoted-literal mechanism, when diagnosed, then it is stated with a
  `file:line` origin and the ruled-out alternatives.
- Given `component "<b>Bold</b>"`, when rendered (with or without any fix), then
  it still renders BOLD (no regression).
- Given a cheap verified fix, when applied, then gafico's quoted-title node
  matches the oracle and `measure` exit 0; ELSE gafico is pinned at its true
  delta with a one-line ledger rationale.

## Commit
`fix(description): <quoted-title literal finding>` OR
`docs(s1l): ledger gafico-82 quoted-title residual (S1L-b-unicode T2)`.

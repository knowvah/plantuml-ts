# T12 — two-sided and multiple qualifiers

**Agent:** typescript-pro (opus, effort high) · **Depends on:** T10; T11 if
T6 finds a shared file

## Fixtures

rilali-81-gifu188, xoxega-30-vuju324, goloxu-09-nero458,
ririlu-13-zipi740, coxose-20-nifu136, mucoti-34-seve858,
sefazi-02-defe499, vuzoro-99-kizi978 (as re-grouped by T6)

## Mechanisms · Write-set

T6 fills from `diagnosis/Q.md`.

## Read-set

`diagnosis/Q.md` (T12 sections), `decisions.md` D4, D7; T11's report if
T11 ran first (shared terms must not be re-derived).

## Acceptance criteria

- Given each fixture, when it renders, then its diff is 0 or its residual
  has a diagnosis artifact
- Given several qualifiers on one node, when laid out, then node margins
  match the jar's `svek-N.dot` node sizes
- Given `class-kal.ts`, when edited, then D7 holds (cited, non-structural)

## Observability · Rollback

N/A. Reversible.

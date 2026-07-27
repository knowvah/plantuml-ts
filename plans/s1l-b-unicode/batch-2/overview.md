# Batch 2 — Quoted-title literalness (scoped fix or documented residual)

Resolve why a quoted `"$var"` title renders fully literal (Rule 2) and either
land a NARROW, regression-guarded fix or document gafico's width residual. This
is the risky factor — the bar is "no other quoted-label fixture regresses,"
not "gafico conformant."

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T2 | Investigate quoted-title literalness; narrow fix OR document | debugger | per finding: parser/renderer + regression test — OR `plans/s1l-leaf-sizing/ledger.md` | T1 | ☐ |

**Exit bar:** the mechanism is stated (file:line + causal chain, per
`rules/diagnosis.md`); either gafico's quoted-title node matches the oracle with
NO regression elsewhere, or it is pinned at its true delta with a one-line
ledger rationale; `measure` exit 0; structure EQUAL; full suite green.

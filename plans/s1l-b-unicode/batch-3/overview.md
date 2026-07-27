# Batch 3 — Emoji width (T3) + accounting close (T4)

Close the last width factor (emoji/wide-glyph measurement) and re-baseline the
accounting. T3 and T4 both touch `size-backlog.json` — do the backlog write
once, in T4.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T3 | Emoji/wide-glyph width: fixed fallback OR document | debugger | `measurer*` (+ test) OR `plans/s1l-leaf-sizing/ledger.md` | T1 | ☑ documented residual (real driver: sizer↔renderer creole-lexer gap, NOT emoji width) |
| T4 | Re-baseline backlog + ledger + mission-index; full gate | typescript-pro | `size-backlog.json`, `ledger.md`, `planning/mission-index.md` | T1, T2, T3 | ☑ 67.2%, all misses named, full gate green |

**Exit bar:** full gate green (measure exit 0, dot-sync 262/262+90/90, npm
test, typecheck, lint, build); every remaining backlog entry maps to a named
family/sub-mission; `mission-index.md` S1L-b row reflects the new conformant %
and the residuals (quoted-title, emoji).

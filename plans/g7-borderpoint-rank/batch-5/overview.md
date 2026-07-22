# Batch 5 — Attempt 5 (human sign-off 2026-07-22)

Ordered fix path from the T5 root-cause diagnosis: port jar's
"a"/"p0" ancestor-wrapper mechanism and fix `addClusters`
parent-resolution FIRST, re-gate on the PORT's own emitted DOT, then
re-attempt the border-point wiring unchanged.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T7 | Port a/p0 ancestor wrappers + parent-resolution fix | typescript-pro | graph-layout-build + types + state seam fields + tests | — | [x] |
| T8 | Paper gate v2: derive 3 targets from PORT-emitted DOT | debugger | derivation-doc addendum | T7 | [x] |
| T9 | Border-point wiring (T5 six-item edit list, unchanged) | typescript-pro | T5 write-set | T8 | [ ] |
| T10 | Family sweep, pins/backlog, close | typescript-pro | pins/backlog/journal/README | T9 | [ ] |

Hard bars carry over from D3/D5: T8 paper miss → stop before code;
T9 measured miss → full revert → stop (a SIXTH attempt needs fresh
sign-off). DOT gate frozen, 57-pin ratchet, backlog tighten-only at
every commit.

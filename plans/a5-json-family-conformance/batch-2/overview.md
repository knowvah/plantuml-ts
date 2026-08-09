# Batch 2 — true baseline and the document shell

Batch 1 built the instrument. This batch reads it, attributes what it finds, and
closes the one gap already diagnosed before the mission started.

**T3 is a diagnosis task and writes no production code.** It exists because
ADR-3 removed the DOT gate that every sibling mission used to separate "layout
is wrong" from "assembly is wrong." That attribution has to come from somewhere,
and here it comes from T3. Do not fold it into a fix task.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T3 | true baseline + per-fixture attribution | orchestrator (inline) | `plans/a5-json-family-conformance/baseline.md` | T1, T2 | [x] |
| T4 | route json/yaml/hcl through the unified document shell | orchestrator (inline) | `core/{dispatcher,assemble-svg,render-options}.ts`, `core/error/error-diagrams.ts`, `diagrams/{json,yaml,hcl}/index.ts`, `src/index.ts` (see journal #7: write-set amended) | T3 | [x] |

Strictly sequential: T4 acts on what T3 measures.

## The shell gap, already diagnosed

Measured pre-mission through production `renderSync` against the cached
goldens — rough signal, and T3 replaces it with the real number:

```
svg/@background          missing (jar: #FFFFFF)
svg/@contentStyleType    missing (jar: text/css)
svg/@preserveAspectRatio missing (jar: none)
svg/@version             missing (jar: 1.1)
svg/@zoomAndPan          missing (jar: magnify)
svg/@xmlns:xlink         missing
svg/defs[1][childCount]  13 vs 0
svg/g[1][childCount]     2 vs 6
svg/g[1]/@font-family    "sans-serif" vs "" (jar has none)
svg/g[1]/@lengthAdjust   "spacing" vs "" (jar has none)
```

**Class fixtures show none of these.** So json is not going through the chrome
DOM shape G1d unified across engines, and the 13-child `<defs>` is
`src/core/svg.ts#svgRoot` auto-embedding arrowhead markers the jar does not
emit. D14 hit the identical `defs` symptom on `@startdot` — same root, different
engine.

**Do not assume the fix is the same as dot's.** `@startdot` fixed it by ceasing
to use the shell at all (passthrough); json genuinely needs a shell, so it needs
the *correct* one. Diagnose to `file:line` before editing.

## Exit

- `baseline.md` states, per type: conformant count, diff-bucket histogram, and a
  named mechanism for every non-conformant fixture.
- The shell mechanisms above are closed, or each is attributed to a named
  mechanism that T4 could not reach and is carried into Batch 3/4.
- Any fixture reaching zero diffs is pinned into its ratchet.
- Four gates green; no ratchet regression in any other type.

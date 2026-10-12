# T3c: ruling docs (D4, D6)

Agent: orchestrator.

## Task
1. **DIVERGENCES.md, `!pragma layout elk`.** Retitle the entry with a strikethrough +
   "RETIRED 2026-10-11 (cdd8)", the same pattern as the retired `mainframe` and skin
   entries. Its body is one paragraph:
   - ELK is now supported through the swappable `ElkBackend` (D2), which mirrors
     upstream's `elk/proxy/`
   - the default backend is `elkjs@0.12.0`, the jar's ELK version
   - `renderSync` needs `options.elk`; `render()` lazy-loads
   - ELK is a different algorithm with a different drawing path, so it is not deferred to
     dot-engine

   Delete the false "elkjs's sole entry point is `layout(): Promise`" argument. Keep a
   one-line note of the license (EPL-2.0 OR GPL-3.0, as dot-engine is EPL-2.0).
2. **DIVERGENCES.md, "LaTeX rendering engine".** Replace the 2026-09-02 "every latex
   oracle is a rollback" correction with T1d's measured counts: how many oracles are now
   JLaTeXMath (Batik), and how many are still rollbacks. State the new sizing rule
   (D6), and list the signed D11.3 residues by fixture.
3. **CLAUDE.md, "One layout engine".** Add one line: "ELK (`!pragma layout elk`) is
   upstream's second engine, not a Smetana copy: supported via `ElkBackend`
   (`src/core/elk/`), elkjs 0.12.0 by default (ruling 2026-10-11)." Keep the section's
   Smetana bullets unchanged and remove ELK from any "unsupported" wording.

## Write-set
`DIVERGENCES.md`, `CLAUDE.md`.

## Acceptance
- Given DIVERGENCES.md, then no text claims ELK is unsupported or async-only, and the
  latex section's counts equal T1d's journal row.
- Given CLAUDE.md, then the one-engine section names ELK as supported, and its line count
  grows by 1 or 2.

**Observability:** N/A. **Rollback:** Reversible.

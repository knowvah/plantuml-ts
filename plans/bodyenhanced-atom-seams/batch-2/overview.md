# Batch 2 — Port base + seams (parallel)

Two tasks, disjoint write-sets, no dependency between them. Neither is
wired in: after this batch every ratchet must be **exactly** where it
started. That is the point — ADR-6 keeps behaviour change out of the port.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T2a | Port `BodyEnhancedAbstract` + `TextBlockLineBefore` | typescript-pro | `src/core/cucadiagram/BodyEnhancedAbstract.ts`, `src/core/klimt/shape/TextBlockLineBefore.ts` | T1 | [ ] |
| T3 | Both seams — ink fields + `imgFallbackFont` threading | typescript-pro | `src/core/creole-atoms.ts`, `src/core/svek/image/EntityImageDescriptionSupport.ts`, `src/diagrams/description/leaf-sizing-text.ts` | T1 | [ ] |

Both agents share one worktree: forbid state-mutating git in both prompts;
the orchestrator commits.

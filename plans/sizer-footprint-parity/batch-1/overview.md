# Batch 1 — The `<img>` fallback constant

One task. It must land before batch 2: both alter atom resolution, and
overlapping call graphs are not safe to parallelise even with disjoint
write-sets.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T1 | Hardcode `monospace(14)` per `AtomImg.java:106-107`; delete the `imgFallbackFont` seam | typescript-pro | `src/core/klimt/creole/legacy/StripeSimple.ts`, `src/core/svek/image/EntityImageDescriptionSupport.ts`, `src/diagrams/description/leaf-sizing-legacy-fallback.ts` | — | [ ] |

**Behaviour DOES change here** — a cannot-decode `<img>` currently draws at
whatever font reached it; afterwards it draws at the hardcoded constant. The
diff-count baseline and the size ratchet are what watch that.

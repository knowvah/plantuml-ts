# cdd-close-b9 — batch 9 close (class-divergence-drive)

Written 2026-09-23. Survey 528/110/85 → 548/98/77; census 530 → 548;
ratchet 530 → 548 (18 pins); DOT 711/712. The tree also carries batch 10's
T35 (13 conformant) and T36 (negative result); journal row 233 attributes
every mover.

## Observation: a diagnosis brief can be built on a measurement artifact
- **Finding**: T32's §5a "stdlib misdispatch" was the survey rendering
  `!include <bundle/...>` fixtures without an include store. The brief's
  own "ruled out" list was wrong because it reasoned from a grep of the
  error page's markers. Diagnosis-first briefs must instruct the agent to
  reproduce the symptom through the SAME instrument the survey uses and
  through `renderSync` with production options, and compare.
- **Confidence**: High (row 212).

## Observation: a rise by count can be a fix by content
- **Finding**: luzive went 2+4 → 11+21 because it now renders the jar's
  refusal page instead of a wrong diagram; the residual is a different,
  already-named mechanism. `pin-diff`'s rise flag is a prompt to read the
  diff, never a verdict.
- **Confidence**: High.

## Observation: the shared chrome seam pays off across engines
- **Finding**: porting `BigFrame` once into `core/annotations/chrome.ts`
  moved eight non-class fixtures toward the jar with no engine-specific
  code; class is exact because it alone carries the ink-corrected
  `preChromeWidth/Height`. The other engines' remaining mainframe gap is
  that correction, not the frame.
- **Confidence**: High (row 206).

# sdd2 T6b — sequence labels through core creole

## Observation: a sequence `note` is an ENHANCED component (BodyEnhanced2), not create0
- **Context**: migrating note bodies to the creole seam; the T6a probe used `create0` for them.
- **Finding**: `ComponentRoseNote.java:66-71` passes `enhanced = true`, so `AbstractTextualComponent.java:88-89` builds the block with `BodyFactory.create3` -> `BodyEnhanced2`. Its `--`/`==`/`..`/`__` lines are block separators (`TextBlockLineBefore`, `BodyEnhancedAbstract.java:66-80`), not creole `CreoleHorizontalLine`s, and the separator's `UHorizontalLine` is clipped by the note component's OWN stencil (`UGraphicStencil.create(ug, this, UStroke.simple())`, `ComponentRoseNote.java:124,140-146`), with a 1 px skip each end (`TextBlockLineBefore.java:84`). `rnote`/`hnote` are NOT enhanced (`ComponentRoseNoteBox.java:58`, `ComponentRoseNoteHexagonal.java:58`).
- **Impact**: without the component stencil the recorder meets a raw `UHorizontalLine` and `UGraphicSvg` throws "No driver registered for shape UHorizontalLine" (nibiju, sisege went to the error cohort). With it both reach zero.
- **Confidence**: High (Java read, both rows zero).

## Observation: the ref body text is drawn under the HEADER's ink
- **Context**: choosing the `ug.apply` chain for `ref` text blocks.
- **Finding**: `ComponentRoseReference#drawInternalU` applies `symbolContextBody`, draws the rect, then applies `symbolContextHeader` and `UStroke.simple()` (`:121-124`) before drawing BOTH `textHeader` (`:126`) and the body block (`:137`). A monochrome sprite in a ref body tints over the header fill, not the body fill.
- **Impact**: earlier port code passed the body fill as the sprite back; now `ref-body-geo.ts#refTextInk`.
- **Confidence**: High (Java read; no pinned row moved).

## Observation: classify error rows have no `ws` key
- **Context**: comparing `classify.mts` output against `b5-classify.json`.
- **Finding**: rows in the `error` cohort carry `{slug, cohort, error}` only. A comparator that defaults a missing `ws` to 0 lists a row that went structural -> error as "to zero".
- **Impact**: always cross-check the cohort counts (zero AND error) before reporting a to-zero list.
- **Confidence**: High.

## Observation: the b5 tip already exceeds stop 17's absolute bound on a loaded box
- **Context**: timing `svg:survey -- sequence` before and after T6b.
- **Finding**: a `git archive HEAD` copy of the b5 tip measured 41.7 s and 35.8 s (load 4.3-5.7) against the 34.6 s bound; the T6b tree measured 38.6 s twice under the same load (ratio 0.93-1.08). The in-worktree "before" read 52.0 s at load 9.4. The archive copy surveys 907 conformant where the worktree surveys 909 (gitignored generated assets are absent), so it is a timing proxy only.
- **Impact**: stop 17 should be judged on a same-load ratio, not on the absolute 34.6 s, until b0 is re-measured on a quiet box.
- **Confidence**: Medium (two pairs, load not quiet).

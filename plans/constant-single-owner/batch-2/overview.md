# Batch 2 — the cited cross-engine family

The highest-confidence shares: constants the class, description and state
engines all read from one upstream `CucaDiagram`/svek field. This is the
same shape `SvekResult`'s pair already proved, so the pattern is established
rather than being invented here.

Candidates from the mission's own scan (T1's classification is authoritative
— work ITS list, not this one; these are here to show the shape and size):

```
9x  ARROW_LABEL_FONT_SIZE = 13   class, description, state   cited
5x  NOTE_FONT_SIZE        = 13   class, description, state   cited
5x  NOTE_MARGIN_Y         = 5    class, description, state   cited
4x  NOTE_MARGIN_X1        = 6    class, state                cited
3x  DOCUMENT_MARGIN_TOP   = 0    class, description, state   cited
    (…and the rest of the DOCUMENT_MARGIN_* set)
```

| ID | Description | Agent | Writes | Depends on | Done |
|----|-------------|-------|--------|-----------|------|
| T2 | Consolidate the cited cross-engine shares, one owner module per upstream file | typescript-pro | new `src/core/**` owner modules + the engine modules that declare them | B1 | [ ] |

## One commit per OWNER, not per batch

Each owner module and its import sites land together as one commit — that
keeps a revert surgical if one consolidation turns out to be a coincidence
after all. Do not batch several unrelated constants into one commit.

## Batch exit bar

1. Every consolidation carries a Java `file:line` in the owner module's doc
   comment. No citation, no consolidation (decision D2).
2. Owner modules mirror the upstream package/file (decision D1); no
   `src/core/constants.ts` grab-bag.
3. No engine imports from another engine (decision D6).
4. **`shape-match-report.ts` reports 776 / 25695 EXACTLY** — unchanged. Any
   movement means two different constants were merged: stop, do not accept.
5. Redundant-declaration count strictly lower.
6. All four gates green.

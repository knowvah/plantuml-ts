## Observation: packetdiag "no stub" entry described the wrong mechanism
- **Context**: Rendering the DIVERGENCES.md "Spanning field" example with the jar.
- **Finding**: The jar draws no empty stub. Its remainder block of a spanning item is sized `Math.min(colWidth, carriedWidth)` (PacketDiagram.java:430,526), not `remain`, so it is a full-row block while the row accounting uses `remain` (:431). Later items land to its right and widen the canvas (:143-178).
- **Impact**: The old entry's premise was wrong; ours drew the "correct" layout. Mirrored now.
- **Confidence**: High

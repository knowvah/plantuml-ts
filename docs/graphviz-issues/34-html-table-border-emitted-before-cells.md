# HTML table: real graphviz 16.1.0 draws the table border before the cells; dot-engine draws it after

**Impact:** every HTML-table label. Order-only (same polygons, same
coordinates), so it only matters to consumers sensitive to SVG element order or
z-order. Seen in `unknown/rubebe-45-sura795` (the two polygons of cluster label
`cluster6` flip) and in every HTML-table label tested (nodes, edge labels,
cluster labels). Engine:
`@knowvah/dot-engine` 1.6.1 vs real `dot` 16.1.0. Found by plantuml-ts mission
`large-group-mirror`, task T0c.

## Repro

```dot
digraph g { a [shape=plaintext,label=<<TABLE><TR><TD></TD></TR></TABLE>>]; }
```

`dot -Tsvg` (exit 0), polygons after the canvas:

```
<polygon points="21,-12 21,-24 33,-24 33,-12 21,-12"/>   table border
<polygon points="24,-15 24,-21 30,-21 30,-15 24,-15"/>   cell border
```

`renderSvg(src, 'dot')`: the same two polygons in the opposite order (cell
first, table border last). With `BGCOLOR` on the table and cells
(`<TABLE BGCOLOR="#ffffcc"><TR><TD BGCOLOR="#ccffcc">x</TD><TD>y</TD></TR></TABLE>`)
real emits table background, table border, then each cell (fill, border, text);
dot-engine emits background, cells, then the table border last.

## Version note and suspected source

The local graphviz source checkout (15.0.0-82, 2026-06-10)
`lib/common/htmltable.c#emit_html_tbl` (517-580) draws the cells and then the
border ("Draw after cells so we can draw over any fill"), which is what
dot-engine does. The oracle binary is 16.1.0 (20260904) and draws the border
first, so this is most likely a graphviz change between 15.0.0 and 16.1.0
that dot-engine 1.6.1 has not tracked; the 16.1.0 source was not available to
confirm. Confidence: MEDIUM (observed behaviour certain; cause inferred from
the 15.x source). Possible oracle-version skew may explain other residuals in
this tracker.

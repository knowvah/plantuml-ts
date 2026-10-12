// Jar probe behind element-tree-dimensions.json: builds the oracle jar's own
// net.sourceforge.plantuml.salt.element.ElementTree / ElementTreeEntry the way
// ElementFactoryTree does (UFontFactory.byDefault(12), ElementText cells) and
// prints, as JSON, each case's preferred dimension under the deterministic
// width-table bounder the conformance harness uses.
//
// Regenerate (from the repo root):
//   java -DPLANTUML_DETERMINISTIC_TEXT=true -cp oracle/dist/plantuml-oracle.jar \
//     tests/unit/salt/element/fixtures/ElementTreeProbe.java \
//     > tests/unit/salt/element/fixtures/element-tree-dimensions.json
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;

import net.sourceforge.plantuml.FileFormat;
import net.sourceforge.plantuml.klimt.font.StringBounder;
import net.sourceforge.plantuml.klimt.font.UFont;
import net.sourceforge.plantuml.klimt.font.UFontFactory;
import net.sourceforge.plantuml.klimt.geom.XDimension2D;
import net.sourceforge.plantuml.salt.SaltDictionary;
import net.sourceforge.plantuml.salt.element.ElementText;
import net.sourceforge.plantuml.salt.element.ElementTree;
import net.sourceforge.plantuml.salt.element.ElementTreeEntry;
import net.sourceforge.plantuml.salt.element.ListWidth;
import net.sourceforge.plantuml.salt.element.TableStrategy;

public class ElementTreeProbe {
	static final UFont FONT = UFontFactory.byDefault(12);
	static final SaltDictionary DICT = new SaltDictionary(null, null);
	static final StringBounder SB = FileFormat.SVG.getDefaultStringBounder();
	static final List<String> OUT = new ArrayList<>();

	static ElementText text(String... lines) {
		return new ElementText(Arrays.asList(lines), FONT, DICT);
	}

	// Each row: first cell (with its "+" run), then the "other" cells.
	static ElementTree tree(String[][] rows) {
		final ElementTree t = new ElementTree(FONT, DICT, TableStrategy.DRAW_ALL);
		for (String[] row : rows) {
			t.addEntry(row[0]);
			for (int i = 1; i < row.length; i++)
				t.addCellToEntry(text(row[i]));
		}
		return t;
	}

	static void tree(String name, String[][] rows) {
		dim(name, tree(rows).getPreferredDimension(SB, 0, 0));
	}

	static void dim(String name, XDimension2D d) {
		OUT.add("  \"" + name + "\": [" + d.getWidth() + ", " + d.getHeight() + "]");
	}

	public static void main(String[] args) {
		tree("rulico", new String[][] { { "+Region", "Population", "Age" }, { "+ World", "7.13 billion", "30" },
				{ "++ America", "964 million", "30" }, { "+++ Canada", "35 million", "30" },
				{ "+++ USA", "319 million", "30" }, { "++++ NYC", "8 million", "30" },
				{ "++++ Boston", "617 thousand", "30" }, { "+++ Mexico", "117 million", "30" },
				{ "++ Europe", "601 million", "30" }, { "+++ Italy", "61 million", "30" },
				{ "+++ Germany", "82 million", "30" }, { "++++ Berlin", "3 million", "30" },
				{ "++ Africa", "1 billion", "30" } });
		tree("gubexu", new String[][] { { "+World" }, { "++America" }, { "+++Canada" }, { "+++USA" },
				{ "++++New York" }, { "++++Boston" }, { "+++Mexico" }, { "++Europe" }, { "+++Italy" },
				{ "+++Germany" }, { "++++Berlin" }, { "++Africa" } });
		tree("empty", new String[][] {});
		tree("level0", new String[][] { { "Root" } });
		tree("ragged", new String[][] { { "+a", "wide text" }, { "++b", "x", "yy" } });

		final ElementTree orphan = new ElementTree(FONT, DICT, TableStrategy.DRAW_NONE);
		orphan.addCellToEntry(text("ignored"));
		orphan.addEntry("+A");
		dim("orphan-cell", orphan.getPreferredDimension(SB, 0, 0));

		final ElementTree tall = new ElementTree(FONT, DICT, TableStrategy.DRAW_NONE);
		tall.addEntry("+A");
		tall.addCellToEntry(text("x", "y"));
		tall.addEntry("++B");
		dim("tall-other", tall.getPreferredDimension(SB, 0, 0));

		final ElementTreeEntry entry = new ElementTreeEntry(3, text("Germany"));
		entry.addCell(text("82 million"));
		entry.addCell(text("x", "y"));
		dim("entry-first-cell", entry.getPreferredDimensionFirstCell(SB));
		OUT.add("  \"entry-row-height\": " + entry.getRowHeight(SB));
		OUT.add("  \"entry-x-delta\": " + entry.getXDelta());
		final ListWidth other = entry.getPreferredDimensionOtherCell(SB);
		final StringBuilder widths = new StringBuilder();
		for (Iterator<Double> it = other.iterator(); it.hasNext();)
			widths.append(widths.length() == 0 ? "" : ", ").append(it.next());
		OUT.add("  \"entry-other-widths\": [" + widths + "]");
		System.out.print("{\n" + String.join(",\n", OUT) + "\n}\n");
	}
}

// Jar probe behind Positionner2.test.ts: drives the oracle jar's own
// net.sourceforge.plantuml.salt.Positionner2 with ElementEmpty cells and
// prints every cell (Cell#toString) plus getNbRows/getNbCols per scenario.
// A token is `e,` (add, NEWCOL), `e;` (add, NEWLINE), `*,` / `*;`
// (mergeLeft NEWCOL / NEWLINE), space-separated.
//
// Regenerate (from the repo root):
//   java -cp oracle/dist/plantuml-oracle.jar \
//     tests/unit/salt/fixtures/Positionner2Probe.java "e, e; e;" ...
import java.util.Map;

import net.sourceforge.plantuml.salt.Cell;
import net.sourceforge.plantuml.salt.Positionner2;
import net.sourceforge.plantuml.salt.Terminated;
import net.sourceforge.plantuml.salt.Terminator;
import net.sourceforge.plantuml.salt.element.Element;
import net.sourceforge.plantuml.salt.element.ElementEmpty;

public class Positionner2Probe {
	public static void main(String[] args) {
		for (String scenario : args) {
			final Positionner2 p = new Positionner2();
			final StringBuilder out = new StringBuilder(scenario).append(" =>");
			try {
				for (String tok : scenario.trim().split(" +")) {
					final Terminator t = tok.charAt(1) == ',' ? Terminator.NEWCOL : Terminator.NEWLINE;
					if (tok.charAt(0) == '*')
						p.mergeLeft(t);
					else
						p.add(new Terminated<Element>(new ElementEmpty(), t));
				}
				for (Map.Entry<Element, Cell> ent : p.getAll().entrySet())
					out.append(' ').append(ent.getValue());
				out.append(" rows=").append(p.getNbRows()).append(" cols=").append(p.getNbCols());
			} catch (RuntimeException e) {
				out.append(' ').append(e.getClass().getSimpleName());
			}
			System.out.println(out);
		}
	}
}

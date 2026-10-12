// Jar probe behind preferred-dimension.json: builds each given .puml's salt
// root element with the oracle jar's own PSystemSalt#createElement (private,
// reached reflectively, after manageSprite as getTextBlock does) and prints,
// as JSON, the root's getPreferredDimension(stringBounder, 0, 0) under the
// SVG string bounder PSystemSalt.java:114 uses.
//
// Regenerate (from the repo root; deterministic text ON, as
// scripts/oracle-render.sh renders):
//   java -DPLANTUML_DETERMINISTIC_TEXT=true -cp oracle/dist/plantuml-oracle.jar \
//     tests/unit/salt/element/fixtures/PreferredDimensionProbe.java <puml>... \
//     > tests/unit/salt/element/fixtures/preferred-dimension.json
import java.lang.reflect.Method;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;

import net.sourceforge.plantuml.FileFormat;
import net.sourceforge.plantuml.FileFormatOption;
import net.sourceforge.plantuml.SourceStringReader;
import net.sourceforge.plantuml.klimt.font.StringBounder;
import net.sourceforge.plantuml.klimt.geom.XDimension2D;
import net.sourceforge.plantuml.salt.PSystemSalt;
import net.sourceforge.plantuml.salt.element.Element;

public class PreferredDimensionProbe {
	public static void main(String[] args) throws Exception {
		final StringBuilder out = new StringBuilder("{\n");
		for (int k = 0; k < args.length; k++) {
			final String text = new String(Files.readAllBytes(Paths.get(args[k])), "UTF-8");
			final PSystemSalt salt = (PSystemSalt) new SourceStringReader(text).getBlocks().get(0).getDiagram();
			final Method manageSprite = PSystemSalt.class.getDeclaredMethod("manageSprite");
			manageSprite.setAccessible(true);
			final Method createElement = PSystemSalt.class.getDeclaredMethod("createElement", List.class);
			createElement.setAccessible(true);
			final Element root = (Element) createElement.invoke(salt, manageSprite.invoke(salt));
			final StringBounder sb = new FileFormatOption(FileFormat.SVG).getDefaultStringBounder(salt.getSkinParam(),
					salt.getPragma());
			final XDimension2D dim = root.getPreferredDimension(sb, 0, 0);
			final String name = Paths.get(args[k]).getFileName().toString().replace(".puml", "");
			out.append("  \"").append(name).append("\": { \"root\": \"").append(root.getClass().getSimpleName())
					.append("\", \"width\": ").append(dim.getWidth()).append(", \"height\": ").append(dim.getHeight())
					.append(" }").append(k == args.length - 1 ? "\n" : ",\n");
		}
		System.out.print(out.append("}\n"));
	}
}

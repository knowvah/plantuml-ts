// Jar probe behind data-source-tokens.json: runs the oracle jar's own
// net.sourceforge.plantuml.salt.DataSourceImpl over the lines between
// @startsalt and @endsalt of each given .puml and prints, as JSON, the
// lines fed in and every Terminated<String> it yields, in order.
//
// Regenerate (from the repo root):
//   java -cp oracle/dist/plantuml-oracle.jar \
//     tests/unit/salt/fixtures/DataSourceProbe.java <puml>... \
//     > tests/unit/salt/fixtures/data-source-tokens.json
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

import net.sourceforge.plantuml.salt.DataSourceImpl;
import net.sourceforge.plantuml.salt.Terminated;

public class DataSourceProbe {
	public static void main(String[] args) throws Exception {
		final StringBuilder out = new StringBuilder("[\n");
		for (int k = 0; k < args.length; k++) {
			final Path path = Paths.get(args[k]);
			final List<String> body = new ArrayList<>();
			for (String l : Files.readAllLines(path))
				if (l.startsWith("@startsalt") == false && l.startsWith("@endsalt") == false)
					body.add(l);
			final DataSourceImpl ds = new DataSourceImpl(body);
			out.append("  {\n    \"source\": ").append(json(args[k])).append(",\n    \"lines\": [");
			for (int j = 0; j < body.size(); j++)
				out.append(j == 0 ? "" : ", ").append(json(body.get(j)));
			out.append("],\n    \"tokens\": [\n");
			boolean first = true;
			while (ds.hasNext()) {
				final Terminated<String> t = ds.next();
				out.append(first ? "" : ",\n").append("      [").append(json(t.getElement())).append(", \"")
						.append(t.getTerminator()).append("\"]");
				first = false;
			}
			out.append("\n    ]\n  }").append(k == args.length - 1 ? "\n" : ",\n");
		}
		System.out.print(out.append("]\n"));
	}

	private static String json(String s) {
		final StringBuilder b = new StringBuilder("\"");
		for (char c : s.toCharArray())
			if (c == '"' || c == '\\')
				b.append('\\').append(c);
			else if (c < 32 || c > 126)
				b.append(String.format("\\u%04x", (int) c));
			else
				b.append(c);
		return b.append('"').toString();
	}
}

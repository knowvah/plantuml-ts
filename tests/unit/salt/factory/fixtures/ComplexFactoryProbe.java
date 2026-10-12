// Jar probe behind complex-factories.json: drives the oracle jar's own
// net.sourceforge.plantuml.salt.factory.ElementFactory{Pyramid,Scroll,Border,
// Tree,Menu,Tab} over every scenario of complex-factory-scenarios.txt.
//
// `### ready <name>`: each of the six factories, fresh and unwired, answers
//   ready() on the scenario's DataSourceImpl (true / false / the exception).
// `### create <name>`: the factories are wired as PSystemSalt#createElement
//   wires them (PSystemSalt.java:174-216), restricted to the complex six plus
//   ElementFactoryText (the last simple factory, PSystemSalt.java:234); the
//   first ready root candidate builds the element, which is dumped
//   structurally (private fields read by reflection), with its terminator and
//   its preferred dimension under the deterministic width-table bounder.
//
// Regenerate (from the repo root):
//   java -DPLANTUML_DETERMINISTIC_TEXT=true -cp oracle/dist/plantuml-oracle.jar \
//     tests/unit/salt/factory/fixtures/ComplexFactoryProbe.java \
//     tests/unit/salt/factory/fixtures/complex-factory-scenarios.txt \
//     > tests/unit/salt/factory/fixtures/complex-factories.json \
//   && npx prettier --write tests/unit/salt/factory/fixtures/complex-factories.json
import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import net.sourceforge.plantuml.FileFormat;
import net.sourceforge.plantuml.klimt.font.StringBounder;
import net.sourceforge.plantuml.klimt.geom.XDimension2D;
import net.sourceforge.plantuml.salt.Cell;
import net.sourceforge.plantuml.salt.DataSourceImpl;
import net.sourceforge.plantuml.salt.SaltDictionary;
import net.sourceforge.plantuml.salt.Terminated;
import net.sourceforge.plantuml.salt.element.Element;
import net.sourceforge.plantuml.salt.element.ElementBorder;
import net.sourceforge.plantuml.salt.element.ElementEmpty;
import net.sourceforge.plantuml.salt.element.ElementMenuBar;
import net.sourceforge.plantuml.salt.element.ElementPyramid;
import net.sourceforge.plantuml.salt.element.ElementPyramidScrolled;
import net.sourceforge.plantuml.salt.element.ElementTabBar;
import net.sourceforge.plantuml.salt.element.ElementText;
import net.sourceforge.plantuml.salt.element.ElementTree;
import net.sourceforge.plantuml.salt.factory.AbstractElementFactoryComplex;
import net.sourceforge.plantuml.salt.factory.ElementFactory;
import net.sourceforge.plantuml.salt.factory.ElementFactoryBorder;
import net.sourceforge.plantuml.salt.factory.ElementFactoryMenu;
import net.sourceforge.plantuml.salt.factory.ElementFactoryPyramid;
import net.sourceforge.plantuml.salt.factory.ElementFactoryScroll;
import net.sourceforge.plantuml.salt.factory.ElementFactoryTab;
import net.sourceforge.plantuml.salt.factory.ElementFactoryText;
import net.sourceforge.plantuml.salt.factory.ElementFactoryTree;

public class ComplexFactoryProbe {
	static final SaltDictionary DICT = new SaltDictionary(null, null);
	static final StringBounder SB = FileFormat.SVG.getDefaultStringBounder();

	static Object field(Object o, String name) throws Exception {
		for (Class<?> c = o.getClass(); c != null; c = c.getSuperclass()) {
			try {
				final Field f = c.getDeclaredField(name);
				f.setAccessible(true);
				return f.get(o);
			} catch (NoSuchFieldException e) {
				// walk up
			}
		}
		throw new NoSuchFieldException(name);
	}

	// A JSON string literal (the dumps and messages carry quotes).
	static String q(String s) {
		return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
	}

	static String cells(Map<?, ?> positions) throws Exception {
		final List<String> out = new ArrayList<>();
		for (Map.Entry<?, ?> e : positions.entrySet())
			out.add(e.getValue() + "=" + dump((Element) e.getKey()));
		return String.join(", ", out);
	}

	static String dump(Element e) throws Exception {
		if (e instanceof ElementText)
			return "Text(" + q(((ElementText) e).getText()) + ")";
		if (e instanceof ElementEmpty)
			return "Empty";
		if (e instanceof ElementPyramidScrolled)
			return "Scroll(" + field(e, "scrollStrategy") + " " + pyramid(e) + ")";
		if (e instanceof ElementPyramid)
			return pyramid(e);
		if (e instanceof ElementBorder)
			return "Border(N=" + dump((Element) field(e, "north")) + ", S=" + dump((Element) field(e, "south"))
					+ ", E=" + dump((Element) field(e, "east")) + ", W=" + dump((Element) field(e, "west"))
					+ ", C=" + dump((Element) field(e, "center")) + ")";
		if (e instanceof ElementTree)
			return tree(e);
		if (e instanceof ElementTabBar)
			return "Tab(vertical=" + field(e, "vertical") + " " + list((Collection<?>) field(e, "tabs")) + ")";
		if (e instanceof ElementMenuBar)
			return menu(e);
		return e.getClass().getSimpleName();
	}

	static String pyramid(Element e) throws Exception {
		return "Pyramid(" + field(e, "tableStrategy") + " rows=" + field(e, "rows") + " cols=" + field(e, "cols")
				+ " [" + cells((Map<?, ?>) field(e, "positions1")) + "])";
	}

	static String list(Collection<?> elements) throws Exception {
		final List<String> out = new ArrayList<>();
		for (Object o : elements)
			out.add(dump((Element) o));
		return "[" + String.join(", ", out) + "]";
	}

	static String tree(Element e) throws Exception {
		final List<String> rows = new ArrayList<>();
		for (Object entry : (Collection<?>) field(e, "entries"))
			rows.add(field(entry, "level") + ":" + dump((Element) field(entry, "firstElement")) + " "
					+ list((Collection<?>) field(entry, "otherElements")));
		return "Tree(" + field(e, "strategy") + " [" + String.join(", ", rows) + "])";
	}

	// popups is an identity HashMap (unordered); read it per entry, in entry order.
	static String menu(Element e) throws Exception {
		final Map<?, ?> popups = (Map<?, ?>) field(e, "popups");
		final List<String> out = new ArrayList<>();
		for (Object entry : (Collection<?>) field(e, "entries")) {
			String s = q((String) field(entry, "text"));
			final Object popup = popups.get(entry);
			if (popup != null) {
				final List<String> subs = new ArrayList<>();
				for (Object sub : (Collection<?>) field(popup, "entries"))
					subs.add(q((String) field(sub, "text")));
				s += "{" + String.join(", ", subs) + "}";
			}
			out.add(s);
		}
		return "Menu[" + String.join(", ", out) + "]";
	}

	static String error(Throwable t) {
		return t.getClass().getSimpleName() + (t.getMessage() == null ? "" : ": " + t.getMessage());
	}

	static String ready(List<String> lines) {
		final List<String> out = new ArrayList<>();
		final String[] names = { "Pyramid", "Scroll", "Border", "Tree", "Menu", "Tab" };
		for (String name : names) {
			final DataSourceImpl source = new DataSourceImpl(lines);
			final ElementFactory f = name.equals("Pyramid") ? new ElementFactoryPyramid(source, DICT)
					: name.equals("Scroll") ? new ElementFactoryScroll(source, DICT)
							: name.equals("Border") ? new ElementFactoryBorder(source, DICT)
									: name.equals("Tree") ? new ElementFactoryTree(source, DICT)
											: name.equals("Menu") ? new ElementFactoryMenu(source, DICT)
													: new ElementFactoryTab(source, DICT);
			String v;
			try {
				v = String.valueOf(f.ready());
			} catch (RuntimeException e) {
				v = e.getClass().getSimpleName();
			}
			out.add(q(name) + ": " + q(v));
		}
		return "{ " + String.join(", ", out) + " }";
	}

	static String create(List<String> lines) {
		final DataSourceImpl source = new DataSourceImpl(lines);
		final ElementFactoryTree treeFactory = new ElementFactoryTree(source, DICT);
		final List<AbstractElementFactoryComplex> cpx = new ArrayList<>();
		cpx.add(new ElementFactoryPyramid(source, DICT));
		cpx.add(new ElementFactoryScroll(source, DICT));
		cpx.add(new ElementFactoryBorder(source, DICT));
		cpx.add(treeFactory);
		for (AbstractElementFactoryComplex f : cpx) {
			f.addFactory(new ElementFactoryMenu(source, DICT));
			f.addFactory(treeFactory);
			f.addFactory(new ElementFactoryTab(source, DICT));
			f.addFactory(new ElementFactoryText(source, DICT));
		}
		for (AbstractElementFactoryComplex f1 : cpx)
			for (AbstractElementFactoryComplex f2 : cpx)
				f1.addFactory(f2);
		try {
			for (ElementFactory f : cpx)
				if (f.ready()) {
					final Terminated<Element> t = f.create();
					final XDimension2D dim = t.getElement().getPreferredDimension(SB, 0, 0);
					return "{ \"root\": " + q(f.getClass().getSimpleName()) + ", \"dump\": " + q(dump(t.getElement()))
							+ ", \"terminator\": " + q(String.valueOf(t.getTerminator())) + ", \"dim\": ["
							+ dim.getWidth() + ", " + dim.getHeight() + "] }";
				}
			return "{ \"error\": \"IllegalArgumentException\" }";
		} catch (Exception e) {
			return "{ \"error\": " + q(error(e)) + " }";
		}
	}

	public static void main(String[] args) throws Exception {
		final Map<String, List<String>> scenarios = new LinkedHashMap<>();
		List<String> current = null;
		for (String line : Files.readAllLines(Paths.get(args[0]), StandardCharsets.UTF_8)) {
			if (line.startsWith("### ")) {
				current = new ArrayList<>();
				scenarios.put(line.substring(4), current);
			} else if (current != null && line.length() > 0) {
				current.add(line);
			}
		}
		final List<String> out = new ArrayList<>();
		for (Map.Entry<String, List<String>> e : scenarios.entrySet()) {
			final String[] kind = e.getKey().split(" ", 2);
			final String body = kind[0].equals("ready") ? ready(e.getValue()) : create(e.getValue());
			out.add("  " + q(kind[1]) + ": " + body);
		}
		System.out.print("{\n" + String.join(",\n", out) + "\n}\n");
	}
}

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

import net.sourceforge.plantuml.BlockUml;
import net.sourceforge.plantuml.FileFormat;
import net.sourceforge.plantuml.FileFormatOption;
import net.sourceforge.plantuml.SourceStringReader;
import net.sourceforge.plantuml.core.Diagram;
import net.sourceforge.plantuml.mindmap.MindMapDiagram;
import net.sourceforge.plantuml.style.PName;
import net.sourceforge.plantuml.style.SName;
import net.sourceforge.plantuml.style.Style;
import net.sourceforge.plantuml.style.StyleBuilder;
import net.sourceforge.plantuml.style.StyleSignatureBasic;

/**
 * Prints the merged {@link Style} the oracle jar computes for a given style
 * signature, one {@code PName=value} line per property the merge actually
 * set.
 *
 * <p>Runs the real pipeline: a mindmap source is parsed via
 * {@link SourceStringReader} (as {@code scripts/oracle-render.sh} does for
 * SVG), which executes every {@code skin}/{@code skinparam}/{@code <style>}
 * command it contains in source order -- exactly the order
 * {@code SkinParam.setParam}/{@code muteStyle} apply them (see
 * {@code SkinParam.java:220-245}) -- then reads the resulting
 * {@link StyleBuilder} off the diagram via {@code TitledDiagram
 * .getCurrentStyleBuilder()} (public; {@code TitledDiagram.java:178-180})
 * and queries it the same way {@code Idea.getStyle()} /
 * {@code Idea.getStyleArrow()} do (mindmap/Idea.java:96-116): either
 * {@link StyleBuilder#getMergedStyle(StyleSignatureBasic)} or
 * {@link StyleBuilder#getMergedStyleSpecial(StyleSignatureBasic, int)}.
 *
 * <p>Usage:
 *
 * <pre>
 * run-probe.sh StyleProbe &lt;snippet-file&gt; &lt;merged|special&gt; &lt;snames-csv&gt; \
 *     [--skin name] [--stereotype s]... [--level n] [--star] [--delta n]
 * </pre>
 *
 * <p>{@code snippet-file} is the diagram body placed between
 * {@code @startmindmap}/{@code @endmindmap} -- {@code skin}/
 * {@code skinparam}/{@code <style>} lines plus at least one root idea line
 * (e.g. {@code * root}) so the source parses. {@code --skin name} is a
 * convenience that prepends a {@code skin name} line (loads
 * {@code name.skin}, replacing the whole stylesheet --
 * {@code TitledDiagram.loadSkin}, {@code TitledDiagram.java:160-182})
 * before the snippet body, so it still applies in source order ahead of
 * any skinparam/style lines the snippet itself declares (decision D2).
 * {@code snames-csv} is a comma-separated {@link SName} list, e.g.
 * {@code root,element,mindmapDiagram,node,rootNode} (the query
 * {@code Idea.getDefaultStyleDefinitionNode} builds --
 * {@code mindmap/Idea.java:65-90}). {@code --level} defaults to 0.
 * {@code --star} marks the signature starred ({@link
 * StyleSignatureBasic#addStar()}, used for every ancestor query in
 * {@code Idea.getStyle()}). {@code --delta} is required for {@code special}
 * (the {@code deltaPriority} argument).
 */
public final class StyleProbe {

	/** Parsed CLI options (everything after the three positional args). */
	private static final class Options {
		String skinName;
		final List<String> stereotypes = new ArrayList<>();
		int level = 0;
		boolean star = false;
		Integer delta = null;
	}

	public static void main(String[] args) throws Exception {
		if (args.length < 3) {
			usage();
			System.exit(2);
		}

		final String snippetPath = args[0];
		final String method = args[1];
		final String snamesCsv = args[2];
		final Options opt = parseOptions(args);

		if ("special".equals(method) && opt.delta == null)
			throw new IllegalArgumentException("--delta is required for method=special");

		final MindMapDiagram diagram = renderAndGetDiagram(buildSource(snippetPath, opt.skinName));
		final StyleBuilder styleBuilder = diagram.getCurrentStyleBuilder();
		final StyleSignatureBasic signature = buildSignature(snamesCsv, opt);
		final Style style = resolveStyle(styleBuilder, method, signature, opt.delta);

		printStyle(style, signature);
	}

	private static Options parseOptions(String[] args) {
		final Options opt = new Options();
		for (int i = 3; i < args.length; i++) {
			switch (args[i]) {
			case "--skin":
				opt.skinName = args[++i];
				break;
			case "--stereotype":
				opt.stereotypes.add(args[++i]);
				break;
			case "--level":
				opt.level = Integer.parseInt(args[++i]);
				break;
			case "--star":
				opt.star = true;
				break;
			case "--delta":
				opt.delta = Integer.parseInt(args[++i]);
				break;
			default:
				throw new IllegalArgumentException("unknown option: " + args[i]);
			}
		}
		return opt;
	}

	private static String buildSource(String snippetPath, String skinName) throws Exception {
		final String snippet = new String(Files.readAllBytes(Paths.get(snippetPath)), StandardCharsets.UTF_8);
		final StringBuilder source = new StringBuilder("@startmindmap\n");
		if (skinName != null)
			source.append("skin ").append(skinName).append('\n');
		return source.append(snippet).append("\n@endmindmap\n").toString();
	}

	private static StyleSignatureBasic buildSignature(String snamesCsv, Options opt) {
		StyleSignatureBasic signature = StyleSignatureBasic.of(parseSNames(snamesCsv)).addLevel(opt.level);
		for (final String stereo : opt.stereotypes)
			signature = signature.addStereotype(stereo);
		if (opt.star)
			signature = signature.addStar();
		return signature;
	}

	private static Style resolveStyle(StyleBuilder styleBuilder, String method, StyleSignatureBasic signature,
			Integer delta) {
		if ("merged".equals(method))
			return styleBuilder.getMergedStyle(signature);
		if ("special".equals(method))
			return styleBuilder.getMergedStyleSpecial(signature, delta);
		throw new IllegalArgumentException("method must be 'merged' or 'special', got: " + method);
	}

	private static void printStyle(Style style, StyleSignatureBasic signature) {
		if (style == null) {
			System.out.println("# no style matched signature " + signature);
			return;
		}
		for (final PName pname : PName.values())
			if (style.hasValue(pname))
				System.out.println(pname.name() + "=" + style.value(pname).asString());
	}

	private static SName[] parseSNames(String csv) {
		final String[] parts = csv.split(",");
		final SName[] result = new SName[parts.length];
		for (int i = 0; i < parts.length; i++) {
			try {
				result[i] = SName.valueOf(parts[i].trim());
			} catch (IllegalArgumentException e) {
				throw new IllegalArgumentException("not a style.SName: '" + parts[i].trim() + "'", e);
			}
		}
		return result;
	}

	/**
	 * Runs the source through the real pipeline (same {@link
	 * SourceStringReader} entry point {@code scripts/oracle-render.sh} drives
	 * for SVG) and returns the first block's diagram, already fully executed
	 * (every skin/skinparam/style command applied in source order).
	 */
	private static MindMapDiagram renderAndGetDiagram(String source) throws Exception {
		final SourceStringReader reader = new SourceStringReader(source);
		// Force full command execution the same way rendering does; the style
		// builder is populated as each command runs, not merely by parsing.
		reader.outputImage(new ByteArrayOutputStream(), 0, new FileFormatOption(FileFormat.SVG));

		final List<BlockUml> blocks = reader.getBlocks();
		if (blocks.isEmpty())
			throw new IllegalStateException("no @start/@end block found -- check the snippet file");

		final Diagram diagram = blocks.get(0).getDiagram();
		if (!(diagram instanceof MindMapDiagram))
			throw new IllegalStateException("not a mindmap diagram: " + diagram.getClass() + " -- "
					+ diagram.getDescription());

		return (MindMapDiagram) diagram;
	}

	private static void usage() {
		System.err.println("usage: StyleProbe <snippet-file> <merged|special> <snames-csv> "
				+ "[--skin name] [--stereotype s]... [--level n] [--star] [--delta n]");
	}

	private StyleProbe() {
	}
}

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;

import net.sourceforge.plantuml.BlockUml;
import net.sourceforge.plantuml.FileFormat;
import net.sourceforge.plantuml.FileFormatOption;
import net.sourceforge.plantuml.SourceStringReader;
import net.sourceforge.plantuml.core.Diagram;
import net.sourceforge.plantuml.klimt.font.StringBounder;
import net.sourceforge.plantuml.klimt.geom.Rankdir;
import net.sourceforge.plantuml.klimt.geom.XDimension2D;
import net.sourceforge.plantuml.mindmap.FingerImpl;
import net.sourceforge.plantuml.mindmap.MindMap;
import net.sourceforge.plantuml.mindmap.MindMapDiagram;
import net.sourceforge.plantuml.mindmap.SymetricalTeePositioned;
import net.sourceforge.plantuml.mindmap.Tetris;

/**
 * Prints, per node, the values a jar-faithful port of {@code FingerImpl}/
 * {@code MindMap} needs: label, level, branch, direction, phalanx
 * dimensions, {@code getX12}, the node's own {@code SymetricalTee} (as
 * consumed by its parent's {@code Tetris}), each child's positioned
 * {@code SymetricalTee} ("Tetris element") {@code y}, and the node's
 * absolute translation (the sum of every {@code UTranslate} applied on the
 * path from the diagram root -- {@code FingerImpl.drawU},
 * {@code mindmap/FingerImpl.java} whole file, and {@code MindMap.drawU} /
 * {@code calculateDimensionSlow}, {@code mindmap/MindMap.java:63-112}).
 *
 * <p>Renders the source through the real pipeline first (same
 * {@link SourceStringReader} entry point {@code scripts/oracle-render.sh}
 * drives for SVG, with {@code -DPLANTUML_DETERMINISTIC_TEXT=true} set by
 * {@code run-probe.sh}), so every value below -- including the lazily-built
 * {@code Tetris} trees ({@code FingerImpl.getTetris}, called from {@code
 * asSymetricalTee}/{@code drawU}) -- is exactly what production computed,
 * not a re-run against a probe-only graphics context. {@link
 * FileFormat#getDefaultStringBounder()} is then used to obtain the same
 * deterministic {@code StringBounder} the render just used ({@code
 * FileFormat.java}'s "plantuml-ts oracle seam" comment), so the probe's own
 * calls to public per-size methods ({@code getPhalanxThickness},
 * {@code getPhalanxElongation}) reproduce identically instead of
 * re-measuring with a different bounder.
 *
 * <p>Several fields read here are private with no public accessor
 * ({@code FingerImpl.idea/nail/tetris/direction}, {@code MindMap.regular/
 * reverse}, {@code MindMapDiagram.mindmaps}, {@code Branch.finger}) --
 * see {@link ProbeReflect}'s class javadoc for why reflection, not a jar
 * edit or a same-package trick, is used to read them. Where a value has a
 * public accessor ({@code MindMap.calculateDimension}, {@code FingerImpl
 * .getPhalanxThickness/Elongation/getX12}, {@code Tetris.getElements})
 * this probe calls it directly.
 *
 * <p>The absolute-translation formula reproduced in {@link #printNode} is
 * quoted directly from {@code FingerImpl.drawU} (topToBottom vs. left/right
 * branches) and {@code MindMap.drawU} -- it is not re-derived or fitted;
 * every input (phalanx thickness/elongation, {@code getX12()}, each
 * child's positioned {@code SymetricalTee.getY()}, {@code direction},
 * {@code Rankdir}) is read off the real, already-drawn object graph.
 *
 * <p>Usage: {@code run-probe.sh LayoutProbe <file.puml>}
 */
public final class LayoutProbe {

	/** Values constant across one render: the deterministic bounder and axis mode. */
	private static final class Ctx {
		final StringBounder sb;
		final boolean topToBottom;
		final String branch;

		Ctx(StringBounder sb, boolean topToBottom, String branch) {
			this.sb = sb;
			this.topToBottom = topToBottom;
			this.branch = branch;
		}

		Ctx withBranch(String newBranch) {
			return new Ctx(sb, topToBottom, newBranch);
		}
	}

	/** A node's absolute translation (sum of every UTranslate from the diagram root). */
	private static final class Origin {
		final double x;
		final double y;

		Origin(double x, double y) {
			this.x = x;
			this.y = y;
		}
	}

	public static void main(String[] args) throws Exception {
		if (args.length < 1) {
			System.err.println("usage: LayoutProbe <file.puml>");
			System.exit(2);
		}

		final String source = new String(Files.readAllBytes(Paths.get(args[0])), StandardCharsets.UTF_8);
		final MindMapDiagram diagram = renderAndGetDiagram(source);
		final StringBounder sb = FileFormat.SVG.getDefaultStringBounder();
		final boolean topToBottom = diagram.getSkinParam().getRankdir() == Rankdir.TOP_TO_BOTTOM;

		@SuppressWarnings("unchecked")
		final List<MindMap> mindmaps = (List<MindMap>) ProbeReflect.getField(diagram, "mindmaps");

		double stackDy = 0;
		for (int i = 0; i < mindmaps.size(); i++) {
			System.out.println("mindmap[" + i + "]");
			stackDy = printMindMap(mindmaps.get(i), new Ctx(sb, topToBottom, null), stackDy);
		}
	}

	/** Prints one {@code MindMap}'s regular/reverse branches; returns the new stacking dy. */
	private static double printMindMap(MindMap mindmap, Ctx ctx, double stackDy) {
		final Object regular = ProbeReflect.getField(mindmap, "regular");
		final Object reverse = ProbeReflect.getField(mindmap, "reverse");

		// MindMap.calculateDimensionSlow / drawU (mindmap/MindMap.java:63-112).
		final double y1 = (Double) ProbeReflect.invoke(regular, "getHalfThickness", ctx.sb);
		final double y2 = (Double) ProbeReflect.invoke(reverse, "getHalfThickness", ctx.sb);
		final double y = Math.max(y1, y2);
		final double x = (Double) ProbeReflect.invoke(reverse, "getX12", ctx.sb);
		final Origin origin = new Origin(ctx.topToBottom ? y : x, (ctx.topToBottom ? x : y) + stackDy);

		printBranch(regular, ctx.withBranch("regular"), origin);
		printBranch(reverse, ctx.withBranch("reverse"), origin);

		// MindMapDiagram.getTextBlock's stacking loop applies UTranslate.dy(height)
		// between successive mindmaps (mindmap/MindMapDiagram.java:84-98).
		final XDimension2D dim = mindmap.calculateDimension(ctx.sb);
		return stackDy + dim.getHeight();
	}

	private static void printBranch(Object branch, Ctx ctx, Origin origin) {
		final Object finger = ProbeReflect.getField(branch, "finger");
		if (finger == null)
			return;
		printNode((FingerImpl) finger, ctx, origin, 0, "0");
	}

	private static void printNode(FingerImpl node, Ctx ctx, Origin origin, int depth, String path) {
		final NodeReading r = readNode(node, ctx.sb);
		System.out.printf(
				"%s%s branch=%s label=%s level=%d direction=%d phalanxThickness=%.6f phalanxElongation=%.6f"
						+ " getX12=%.6f originX=%.6f originY=%.6f%n",
				indent(depth), path, ctx.branch, escape(r.label), r.level, r.direction, r.thickness, r.elongation,
				r.x12, origin.x, origin.y);

		if (r.nail.isEmpty())
			return;

		// FingerImpl.asSymetricalTee(StringBounder) -- what this node contributes to
		// its PARENT's Tetris (mindmap/FingerImpl.java, asSymetricalTee).
		final Object ownTee = ProbeReflect.invoke(node, "asSymetricalTee", ctx.sb);
		System.out.printf("%s  symetricalTee %s%n", indent(depth), ownTee);

		printChildren(r, ctx, origin, depth, path);
	}

	private static void printChildren(NodeReading r, Ctx ctx, Origin origin, int depth, String path) {
		final List<SymetricalTeePositioned> elements = r.tetris.getElements();
		for (int i = 0; i < r.nail.size(); i++) {
			final SymetricalTeePositioned stp = elements.get(i);
			System.out.printf("%s  tetris[%d] y=%.6f minY=%.6f maxY=%.6f maxX=%.6f%n", indent(depth), i, stp.getY(),
					stp.getMinY(), stp.getMaxY(), stp.getMaxX());

			// FingerImpl.drawU's p2 computation (mindmap/FingerImpl.java).
			final double p2x = ctx.topToBottom ? stp.getY() : r.direction * (r.elongation + r.x12);
			final double p2y = ctx.topToBottom ? r.direction * (r.elongation + r.x12) : stp.getY();

			printNode(r.nail.get(i), ctx, new Origin(origin.x + p2x, origin.y + p2y), depth + 1, path + "/" + i);
		}
	}

	/** Bundles one node's real, jar-computed values so print methods stay within the param budget. */
	private static final class NodeReading {
		String label;
		int level;
		int direction;
		double thickness;
		double elongation;
		double x12;
		List<FingerImpl> nail;
		Tetris tetris;
	}

	@SuppressWarnings("unchecked")
	private static NodeReading readNode(FingerImpl node, StringBounder sb) {
		final Object idea = ProbeReflect.getField(node, "idea");

		final NodeReading r = new NodeReading();
		r.label = idea.toString(); // Idea.toString() -> label.toString() (public, on Object)
		r.level = (Integer) ProbeReflect.invoke(idea, "getLevel");
		r.direction = (Integer) ProbeReflect.getField(node, "direction");
		r.nail = (List<FingerImpl>) ProbeReflect.getField(node, "nail");
		r.tetris = r.nail.isEmpty() ? null : (Tetris) ProbeReflect.getField(node, "tetris");
		if (!r.nail.isEmpty() && r.tetris == null)
			throw new IllegalStateException(
					"tetris not computed for '" + r.label + "' -- did the source render before reading FingerImpl state?");
		r.thickness = node.getPhalanxThickness(sb);
		r.elongation = node.getPhalanxElongation(sb);
		r.x12 = node.getX12();
		return r;
	}

	private static String indent(int depth) {
		final StringBuilder sb = new StringBuilder(depth * 2);
		for (int i = 0; i < depth; i++)
			sb.append("  ");
		return sb.toString();
	}

	private static String escape(String s) {
		return s.replace("\\", "\\\\").replace("\n", "\\n");
	}

	private static MindMapDiagram renderAndGetDiagram(String source) throws Exception {
		final SourceStringReader reader = new SourceStringReader(source);
		reader.outputImage(new ByteArrayOutputStream(), 0, new FileFormatOption(FileFormat.SVG));

		final List<BlockUml> blocks = reader.getBlocks();
		if (blocks.isEmpty())
			throw new IllegalStateException("no @start/@end block found -- check the .puml file");

		final Diagram diagram = blocks.get(0).getDiagram();
		if (!(diagram instanceof MindMapDiagram))
			throw new IllegalStateException(
					"not a mindmap diagram: " + diagram.getClass() + " -- " + diagram.getDescription());

		return (MindMapDiagram) diagram;
	}

	private LayoutProbe() {
	}
}

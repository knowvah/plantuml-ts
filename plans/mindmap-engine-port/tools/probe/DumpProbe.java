import java.io.ByteArrayOutputStream;
import java.lang.reflect.*;
import java.nio.file.*;
import java.util.*;
import net.sourceforge.plantuml.*;
import net.sourceforge.plantuml.core.Diagram;
import net.sourceforge.plantuml.mindmap.MindMapDiagram;
import net.sourceforge.plantuml.style.*;

/** T2a probe (committed by the orchestrator at the b2 close): dumps a mindmap StyleBuilder's storage with priorities, and every Idea.getStyle(). */
public final class DumpProbe {
  static Object field(Object t, String n) throws Exception {
    for (Class<?> c = t.getClass(); c != null; c = c.getSuperclass()) {
      try { Field f = c.getDeclaredField(n); f.setAccessible(true); return f.get(t); } catch (NoSuchFieldException e) {}
    }
    throw new NoSuchFieldException(n);
  }
  static Object call(Object t, String n) throws Exception {
    for (Class<?> c = t.getClass(); c != null; c = c.getSuperclass())
      for (Method m : c.getDeclaredMethods()) if (m.getName().equals(n) && m.getParameterCount() == 0) { m.setAccessible(true); return m.invoke(t); }
    throw new NoSuchMethodException(n);
  }
  static String json(String s) { return s == null ? "null" : "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"") + "\""; }
  @SuppressWarnings("unchecked")
  static String styleJson(Style s) throws Exception {
    Map<PName, Value> map = (Map<PName, Value>) field(s, "map");
    StyleSignatureBasic sig = s.getSignature();
    StyleKey key = sig.getKey();
    StringBuilder sb = new StringBuilder("{\"snames\":[");
    Set<SName> sn = (Set<SName>) field(key, "snames");
    int i = 0; for (SName n : sn) sb.append(i++ > 0 ? "," : "").append(json(n.name()));
    sb.append("],\"level\":").append(field(key, "level")).append(",\"star\":").append(field(key, "isStared"));
    sb.append(",\"stereotypes\":[");
    i = 0; for (String st : new TreeSet<String>((Set<String>) field(sig, "stereotypes"))) sb.append(i++ > 0 ? "," : "").append(json(st));
    sb.append("],\"values\":{");
    i = 0;
    for (Map.Entry<PName, Value> e : map.entrySet()) {
      sb.append(i++ > 0 ? "," : "").append(json(e.getKey().name())).append(":");
      Value v = e.getValue();
      if (v instanceof ValueImpl) {
        Object ds = field(v, "value");
        sb.append("[").append(json((String) field(ds, "value1"))).append(",").append(json((String) field(ds, "value2"))).append(",").append(field(ds, "priority")).append("]");
      } else sb.append(json(v.getClass().getSimpleName() + ":" + v.getPriority()));
    }
    return sb.append("}}").toString();
  }
  public static void main(String[] a) throws Exception {
    String src = new String(Files.readAllBytes(Paths.get(a[1])), "UTF-8");
    SourceStringReader r = new SourceStringReader(src);
    r.outputImage(new ByteArrayOutputStream(), 0, new FileFormatOption(FileFormat.SVG));
    MindMapDiagram d = (MindMapDiagram) r.getBlocks().get(0).getDiagram();
    StyleBuilder sb = d.getCurrentStyleBuilder();
    if (a[0].equals("dump")) {
      StyleStorage st = (StyleStorage) field(sb, "storage");
      System.out.println("[");
      int i = 0; for (Style s : st.getStyles()) System.out.println((i++ > 0 ? "," : "") + styleJson(s));
      System.out.println("]");
    } else {
      GETTERS = a[0].equals("getters");
      for (Object mm : (List<?>) field(d, "mindmaps"))
        for (String b : new String[] {"regular", "reverse"}) {
          Object root = field(field(mm, b), "root");
          if (root != null) walk(root, b);
        }
    }
  }
  static boolean GETTERS = false;
  static void getters(Object idea, Style s) throws Exception {
    net.sourceforge.plantuml.klimt.color.HColorSet set = net.sourceforge.plantuml.klimt.color.HColorSet.instance();
    StringBuilder o = new StringBuilder(idea + ":");
    ClockwiseTopRightBottomLeft m = s.getMargin(), p = s.getPadding();
    o.append(" margin=").append(m.getTop()+","+m.getRight()+","+m.getBottom()+","+m.getLeft());
    o.append(" padding=").append(p.getTop()+","+p.getRight()+","+p.getBottom()+","+p.getLeft());
    net.sourceforge.plantuml.klimt.UStroke st = s.getStroke();
    o.append(" stroke=").append(st.getDashVisible()+","+st.getDashSpace()+","+st.getThickness());
    o.append(" wrap=").append(s.wrapWidth()).append(" halign=").append(s.getHorizontalAlignment()).append(" shadow=").append(s.getShadowing());
    net.sourceforge.plantuml.klimt.font.UFont f = s.getUFont();
    o.append(" font=").append(field(f, "fontStack")).append("|w=").append(f.getFontFace().getCssWeight()).append("|i=").append(f.getFontFace().isItalic()).append("|size=").append(f.getSize());
    net.sourceforge.plantuml.klimt.font.FontConfiguration fc = s.getFontConfiguration(set);
    o.append(" fc.color=").append(fc.getColor()).append(" fc.hyper=").append(field(fc, "hyperlinkColor"));
    net.sourceforge.plantuml.klimt.UStroke us = (net.sourceforge.plantuml.klimt.UStroke) field(fc, "hyperlinkUnderlineStroke");
    o.append(" fc.ustroke=").append(us.getDashVisible()+","+us.getDashSpace()+","+us.getThickness()).append(" fc.tab=").append(fc.getTabSize());
    o.append(" back=").append(s.value(PName.BackGroundColor).asColor(set)).append(" line=").append(s.value(PName.LineColor).asColor(set));
    System.out.println(o);
  }
  static void walk(Object idea, String branch) throws Exception {
    Style s = (Style) call(idea, "getStyle");
    if (GETTERS) { getters(idea, s); } else
    System.out.println(branch + " " + idea + " level=" + call(idea, "getLevel") + " " + styleJson(s));
    for (Object c : (Collection<?>) call(idea, "getChildren")) walk(c, branch);
  }
}

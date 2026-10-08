// Reference generator for cases.txt (unwind-U4): scales a seeded random
// TYPE_INT_ARGB image exactly as PortableImageAwt#scale does
// (klimt/awt/PortableImageAwt.java:113-127) and prints source + result.
// Regenerate: javac Bl.java && for each "w h scale seed" line in cases.txt,
//   echo "w h scale seed"; java -cp . Bl w h scale seed
// Measured with OpenJDK 21.0.1 (Microsoft build), macOS arm64.
import java.awt.image.*;
import java.awt.geom.AffineTransform;
import java.util.Random;
public class Bl {
  public static void main(String[] a) {
    int w = Integer.parseInt(a[0]), h = Integer.parseInt(a[1]); double s = Double.parseDouble(a[2]); long seed = Long.parseLong(a[3]);
    Random r = new Random(seed);
    BufferedImage im = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
    StringBuilder sb = new StringBuilder();
    for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) { int v = r.nextInt(); if (a.length > 4) v = (v & 0x00ffffff) | (a[4].equals("opaque") ? 0xff000000 : (r.nextBoolean()? 0 : v & 0xff000000)); im.setRGB(x, y, v); sb.append(Integer.toHexString(im.getRGB(x,y))).append(' '); }
    System.out.println(sb);
    int dw = (int) Math.round(w * s), dh = (int) Math.round(h * s);
    BufferedImage d = new BufferedImage(dw, dh, BufferedImage.TYPE_INT_ARGB);
    AffineTransform at = new AffineTransform(); at.scale(s, s);
    new AffineTransformOp(at, AffineTransformOp.TYPE_BILINEAR).filter(im, d);
    sb = new StringBuilder(); sb.append(dw).append(' ').append(dh).append('\n');
    for (int y = 0; y < dh; y++) for (int x = 0; x < dw; x++) sb.append(Integer.toHexString(d.getRGB(x,y))).append(' ');
    System.out.println(sb);
  }
}

import java.lang.reflect.Field;
import java.lang.reflect.Method;

/**
 * Shared reflection helpers for the T0c jar probes (StyleProbe,
 * LayoutProbe).
 *
 * <p>The mindmap package (net.sourceforge.plantuml.mindmap) keeps several
 * classes package-private ({@code Idea}, {@code Branch}) and several fields
 * {@code private} even on public classes ({@code FingerImpl.idea},
 * {@code FingerImpl.nail}, {@code FingerImpl.tetris},
 * {@code FingerImpl.direction}, {@code MindMap.regular}/{@code reverse},
 * {@code MindMapDiagram.mindmaps}). None of that state has a public
 * accessor, so probes read it via reflection rather than modifying the jar
 * or hand-duplicating upstream's layout math from private state. Where a
 * value already has a public accessor (e.g. {@code FingerImpl
 * .getPhalanxThickness(StringBounder)}, {@code Tetris.getElements()}) the
 * probes call it directly -- reflection is used only where CLAUDE.md's "do
 * not modify the jar" rule leaves no other route to a real, jar-computed
 * value.
 */
final class ProbeReflect {

	private ProbeReflect() {
	}

	/** Reads a (possibly private) field by walking up the class hierarchy. */
	static Object getField(Object target, String fieldName) {
		Class<?> c = target.getClass();
		while (c != null) {
			try {
				final Field f = c.getDeclaredField(fieldName);
				f.setAccessible(true);
				return f.get(target);
			} catch (NoSuchFieldException e) {
				c = c.getSuperclass();
			} catch (IllegalAccessException e) {
				throw new IllegalStateException("cannot read field " + fieldName + " on " + target.getClass(), e);
			}
		}
		throw new IllegalStateException("no field named " + fieldName + " on " + target.getClass()
				+ " (or any superclass) -- upstream mindmap/ layout changed shape; re-check against the Java");
	}

	/**
	 * Invokes a (possibly private, or public-but-on-a-non-public-class) no/1-arg
	 * method by simple name, matching on argument count only -- the mindmap
	 * package has no overloads sharing a name at the same arity that this tool
	 * calls.
	 */
	static Object invoke(Object target, String methodName, Object... args) {
		Class<?> c = target.getClass();
		while (c != null) {
			for (final Method m : c.getDeclaredMethods()) {
				if (m.getName().equals(methodName) && m.getParameterCount() == args.length) {
					m.setAccessible(true);
					try {
						return m.invoke(target, args);
					} catch (ReflectiveOperationException e) {
						throw new IllegalStateException("cannot invoke " + methodName + " on " + target.getClass(), e);
					}
				}
			}
			c = c.getSuperclass();
		}
		throw new IllegalStateException("no " + args.length + "-arg method named " + methodName + " on "
				+ target.getClass() + " (or any superclass) -- upstream mindmap/ layout changed shape; re-check"
				+ " against the Java");
	}
}

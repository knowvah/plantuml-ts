/**
 * Proxy for `org.eclipse.elk.core.util.NullElkProgressMonitor`: a monitor
 * that records nothing. Upstream only constructs it to pass to
 * `RecursiveGraphLayoutEngine#layout` (`CucaDiagramFileMakerElk.java:493`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/proxy/core/util/NullElkProgressMonitor.java:5-10
 */
export class NullElkProgressMonitor {
  /** The ELK class upstream instantiates (`NullElkProgressMonitor.java:8`). */
  readonly trueClassName = 'org.eclipse.elk.core.util.NullElkProgressMonitor';
}

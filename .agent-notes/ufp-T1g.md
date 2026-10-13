## Observation: UImage.getHeight() is raster height minus one
- **Context**: placing the logo on the donors page (PSystemDonors.java:127 `y - logo.getHeight()`).
- **Finding**: Java `UImage#getHeight()` returns `image.getHeight() - 1` (UImage.java:91-93); the port's `UImage.getHeight()` returns the declared height (71). Using it put the logo 1px too high vs the jar (501 vs 502). Draw itself keeps 80x71.
- **Impact**: any port of Java code reading `UImage.getWidth/getHeight()` for placement needs the -1 applied locally (T1h/T1f dedication/charlie/version should check).
- **Confidence**: High

/**
 * `sonyxperiadev` built-in `<style>`-grammar skin, part 1 of 2 -- the oracle
 * jar's `skin/sonyxperiadev.skin` verbatim (`unzip -p
 * oracle/dist/plantuml-oracle.jar skin/sonyxperiadev.skin` is byte-identical
 * to `~/git/plantuml/src/main/resources/skin/sonyxperiadev.skin`). Upstream
 * converted it from the legacy skinparam file to a complete style sheet when
 * fixing plantuml/plantuml#2797 (commit 11ed6720). Split only to keep each
 * module under the 500-line cap, at a section boundary (part 2 starts at
 * `usecase {`); `skins-builtin.ts` concatenates the two parts.
 */
export const SONYXPERIADEV_SKIN_PART1 = `/*
 * sonyxperiadev skin
 *
 * Complete stylesheet: a \`skin xxx\` file replaces the whole style sheet, it is
 * not merged on top of plantuml.skin. The part above is therefore a copy of
 * plantuml.skin; the sonyxperiadev specifics are grouped in the clearly marked
 * section at the end.
 *
 * Converted from the legacy skinparam-based sonyxperiadev.skin, which was not
 * in the style format and could not be loaded (see issue #2797).
 */

root {
  --common-background: #f1f1f1;
  --note-background: #FEFFDD;
  --grey-blue: #e2e2f0;

  FontName SansSerif
  HyperLinkColor blue
  HyperLinkUnderlineThickness 1
  FontColor black
  FontSize 14
  FontStyle plain
  HorizontalAlignment left
  RoundCorner 0
  DiagonalCorner 0
  LineThickness 1.0
  LineColor #181818
  BackGroundColor: var(--common-background);
  Shadowing: 0.0;
}

document {
  BackGroundColor white
  header {
    HorizontalAlignment right
    FontSize 10
    FontColor #8
    BackGroundColor transparent
    LineColor transparent
  }
  title {
    HorizontalAlignment center
    FontSize 14
    FontStyle bold
    Padding 5
    Margin 5
    LineColor transparent
    BackGroundColor transparent
  }
  footer {
    HorizontalAlignment center
    FontSize 10
    FontColor #8
    BackGroundColor transparent
    LineColor transparent
  }
  legend {
    LineColor black
    BackGroundColor #D
    FontSize 14
    RoundCorner 15
    Padding 5
    Margin 12
  }
  caption {
    HorizontalAlignment center
    FontSize 14
    Padding 0
    Margin 1
    LineColor transparent
    BackGroundColor transparent
  }
  frame {
    LineColor black
    LineThickness 1.5
  }
}

map {
    HorizontalAlignment center
}

package {
  title {
    FontStyle bold
  }
}


stereotype {
  FontStyle italic
  HorizontalAlignment center
}


mainframe {
  Padding 1 5
  LineThickness 1.5
  Margin 10 5
}

element {
  Shadowing 0.0
  LineThickness 0.5
  composite,package {
    title {
      FontStyle bold
      HorizontalAlignment center
    }
  }
}

group {
  BackGroundColor transparent
  LineThickness 1.0
  package {
    LineThickness 1.5
    LineColor black
  }
  folder {
    LineThickness 1.5
    LineColor black
  }
}

sequenceDiagram {
	group {
	  LineColor black
	  LineThickness 1.5
	  FontSize 11
	  FontStyle bold
	}

	groupHeader {
	  LineThickness 1.5
	  BackGroundColor #e
	  LineColor black
	  FontSize 13
	  FontStyle bold
	}

	lifeLine {
	  LineStyle 5
	}

	activationBox {
	  BackGroundColor white
	}

  destroy {
    LineColor #A80036
    LineStyle 0
    LineThickness 2
  }

	reference {
	  FontSize 12
	  LineColor black
	  BackGroundColor transparent
	  LineThickness 1.5
	  HorizontalAlignment center
	}

	referenceHeader {
	  LineColor black
	  BackGroundColor #e
	  FontColor black
	  FontSize 13
	  FontStyle bold
	  LineThickness 2.0
	}

	box {
	  BackGroundColor #d

	  FontSize 13
	  FontStyle bold
	}

	separator {
	  LineColor black
	  LineThickness 2.0
	  BackGroundColor #e

	  FontSize 13
	  FontStyle bold
	  Padding 4
	}

  newpage {
    LineStyle 2
  }

	participant {
	  RoundCorner 5
	}

	participant,actor,boundary,control,entity,queue,database,collections {
	  BackgroundColor: var(--grey-blue);
	  HorizontalAlignment center
	  Padding 7
	}
}

classDiagram,componentDiagram,objectDiagram {
  object {
   Padding 2 2 
  }
  element {
    RoundCorner 5
  }
  generic {
    BackgroundColor white
  }
}

visibilityIcon {
  public {
    LineColor #038048
    BackgroundColor #84BE84
  }
  private {
    LineColor #C82930
    BackgroundColor #F24D5C
  }
  protected {
    LineColor #B38D22
    BackgroundColor #FFFF44
  }
  package {
    LineColor #1963A0
    BackgroundColor #4177AF
  }
  IEMandatory {
    LineColor black
    BackgroundColor black
  }
}
// light theme
spot {
  spotAnnotation {
    BackgroundColor #E3664A
  }
  spotAbstractClass {
    BackgroundColor #A9DCDF
  }
  spotClass {
    BackgroundColor #ADD1B2
  }
  spotInterface {
    BackgroundColor #B4A7E5
  }
  spotEnum {
    BackgroundColor #EB937F
  }
  spotEntity {
    BackgroundColor #ADD1B2
  }
  spotException {
	BackgroundColor #D94321
  }
  spotMetaClass {
    BackgroundColor #CCCCCC
  }
  spotStereotype {
    BackgroundColor #FF77FF
  }
	spotDataClass {
		BackgroundColor #7E57C2
	}
	spotRecord {
		BackgroundColor #FF8F00
	}
}


stateDiagram {
  state {
    RoundCorner 25
    body {
      BackGroundColor transparent
    }
	name {
	  FontStyle plain
      HorizontalAlignment center
    }
  }
  group {
    LineThickness 0.5
  }
  circle {
   start, stop, end {
      LineThickness 1
	    LineColor #2
	    BackgroundColor #2
    }
  }
}


delay {
  FontSize 11
  FontStyle plain
  HorizontalAlignment center
  LineStyle 1-4
}



swimlane {
  BackGroundColor transparent
  LineColor black
  LineThickness 1.5
  FontSize 18
}

arrow {
  FontSize 13
  LineThickness 1.0
  BackGroundColor black
}

note {
  FontSize 13
  BackGroundColor: var(--note-background);
  LineThickness 0.5
}

partition {
}

circle {
}

mindmapDiagram {
}

mindmapDiagram {
	node {
	    Padding 10
	    Margin 10
	    RoundCorner 25
	    LineThickness 1.5
	}
	arrow {
	    LineThickness 1.0
	}
}


wbsDiagram {
    Padding 10
    Margin 15
    RoundCorner 0
    LineThickness 1.5
    FontSize 12
}

activityDiagram {
	activity {
	    Padding 10
	    FontSize 12
	    RoundCorner 25
	}
	composite {
	    LineColor black
	    BackgroundColor transparent
	    LineThickness 1.5
	}
	diamond {
	    FontSize 11
	}
	arrow {
	    FontSize 11
	    LineThickness 1
	}
	circle {
	    start, stop, end {
        LineThickness 1
		    LineColor #2
		    BackgroundColor #2
	    }
      end {
        LineThickness 1.5
      }
	}
	activityBar {
	  BackgroundColor #5
	}
}


task {
    FontSize 11
}

milestone {
    FontSize 11
	BackGroundColor black
	LineColor black
}

ganttDiagram {
	arrow {
	  LineThickness 1.5
	}
	note {
	  FontSize 9
	}
	separator {
	  FontSize 11
	  FontStyle plain
	  BackGroundColor transparent
	  Margin 5
	  Padding 5
	}
	verticalSeparator {
	  LineThickness 2
	  LineStyle 2-2
	  LineColor black
	}
	timeline {
	    BackgroundColor transparent
	    LineColor #C0C0C0
	    FontSize 10
	    month {
	      FontSize 12
	    }
	    year {
	      FontSize 14
	    }
	}
	closed {
        BackGroundColor #F1E5E5
        FontColor #989898
    }
	task {
        BackGroundColor: var(--grey-blue);
		RoundCorner 0
        Margin 2 2 2 2
        Padding 0
	}
	undone {
        BackGroundColor white
	}
	milestone {
        Margin 2
        Padding 3
	}
}


`;

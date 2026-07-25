/**
 * `rose` built-in `<style>`-grammar skin, part 1 of 2 -- skin-file-loading
 * mission Batch 4 split, purely to keep every module under this project's
 * 500-line-per-file limit (`rose.skin` alone is ~550 lines verbatim, by far
 * the largest of the five bundled skins, and none of it is authored logic
 * to refactor). No behavioral split: `ROSE_SKIN` (skins-builtin.ts)
 * concatenates this with {@link ROSE_SKIN_PART2} to reproduce
 * `~/git/plantuml/src/main/resources/skin/rose.skin` byte-for-byte. Split
 * point is a real section boundary (root/document/stereotype/element/
 * ...Diagram declarations end here; part 2 picks up at `delay {`), not an
 * arbitrary line cut. See `skins-builtin.ts`'s own doc comment for the full
 * picture (grammar families, D1/D2, key convention).
 */
export const ROSE_SKIN_PART1 = `root {
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
  LineColor #A80036
  BackGroundColor #FEFECE
  Shadowing 0.0
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
    BackGroundColor #d
    FontSize 14
    RoundCorner 15
    Padding 6
    Margin 8
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

stereotype {
  FontStyle italic
}



element {
  Shadowing 4.0
  composite {
    title {
      FontStyle bold
    }
  }
}

artifact {
  Shadowing 4.0
}
node {
  Shadowing 2.0
}
person {
  Shadowing 2.0
}
queue {
  Shadowing 2.0
}
rectangle {
  Shadowing 3.0
}
stack {
  Shadowing 3.0
}
storage {
  Shadowing 3.0
}
boundary {
  Shadowing 4.0
}
card {
  Shadowing 3.0
}
cloud {
  Shadowing 3.0
}
collections {
  Shadowing 3.0
}
component {
  Shadowing 4.0
}
database {
  Shadowing 3.0
}
file {
  Shadowing 3.0
}
frame {
  Shadowing 3.0
}
folder {
  Shadowing 3.0
}
group {
  package {
    LineThickness 1.5
    LineColor black
  }
  folder {
    LineThickness 1.5
    LineColor black
  }
}

group {
    BackGroundColor transparent
}

componentDiagram {
  node, rectangle {
    LineColor black
    LineThickness 1.5
  }
}


sequenceDiagram {
  group {
    LineColor black
    LineThickness 2.0
    FontSize 11
    FontStyle bold
  }

  groupHeader {
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
	}

	reference {
	  FontSize 12
	  LineColor black
	  BackGroundColor white
	  LineThickness 2.0
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

	participant,actor,boundary,control,entity,queue,database,collections {
	  Padding 7
	}

}

classDiagram {
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
}


stateDiagram {
  state {
    RoundCorner 25
  }
  element {
	title {
	  FontStyle plain
	}
  }
  circle {
    start, stop, end {
	    LineColor black
	    BackgroundColor black
    }
  }
}
`;

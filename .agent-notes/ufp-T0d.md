## Observation: port NAMES is registration order, Java NAMES is a TreeSet
- **Context**: porting HColorSet.names()
- **Finding**: ColorTrieNode.ts:224 NAMES keeps registration order; Java ColorTrieNode.java:50 is a TreeSet (sorted, deduped). names() sorts by UTF-16 code unit and dedups; 154 names, first APPLICATION, last YellowGreen.
- **Impact**: T1b must use names() not NAMES for upstream order.
- **Confidence**: High

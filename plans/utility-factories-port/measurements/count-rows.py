# ufp T0a: list dot-cache rows whose first content line after @startuml is a
# utility literal (PSystemBuilder.java:133-200 single-line factories).
import glob, re
PAT = re.compile(r'^(listopeniconic|openiconic\s|colou?rs(\s|$)|emoji\s|listsprites?$|sudoku(\s|$)|charlie$|license$|licence$|version$|about$|authors?$|stdlib$|donors$|skinparameters$|listfonts|help(\s|$)|path$|testdot$|apple\s*\]\[|rip$|.*dedication)', re.I)
for f in sorted(glob.glob('test-results/dot-cache/*/*/in.puml')):
    try:
        with open(f, encoding='utf-8', errors='replace') as fh:
            lines = [l.strip() for l in fh.read().splitlines() if l.strip()]
    except Exception: continue
    if len(lines) < 2 or not lines[0].lower().startswith('@startuml'): continue
    if PAT.match(lines[1]): print(f'{f} :: {lines[1]} :: nlines={len(lines)}')

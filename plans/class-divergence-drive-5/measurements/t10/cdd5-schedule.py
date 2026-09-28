import json,re,collections
rows=json.load(open('/tmp/cdd5-rowfam.json'))
def prim(v): return re.split(r'\s*\(\+|\s+\+\s', v[0][1])[0].strip()
MERGE={'descriptive-usymbol-render-allowlist':'desc-leaf-classbox-fallback','json-node-edge-shield-port':'json-node-emitted-as-shield'}
P={s:MERGE.get(prim(v),prim(v)) for s,v in rows.items()}
TASKS={
 '3a':('empty-diagram-simple-empty-body',['empty-diagram-simple-empty-body','chrome-atomtext-min-height']),
 '3b':('desc-leaf-render-dispatch',['desc-leaf-classbox-fallback','usymbol-leaf-entity-color-dropped','collapsed-group-leaf-stereo-dropped']),
 '3c':('note-target-qualification',['note-target-not-namespace-qualified','free-note-alias-not-quark-qualified','freestanding-note-opale-group-endpoint']),
 '3d':('json-node-shield',['json-node-emitted-as-shield','json-duplicate-no-execution-error']),
 '3e':('class-badge-glyphs',['badge-glyph-letter-uncaptured','badge-leaftype-spot-unported','sprite-badge-headerlayout-offset']),
 '4a':('degenerate-layout',['degenerate-check-after-group-mute','degenerate-excludes-notes','degenerate-text-ensurevisible','degenerate-single-note-leaf']),
 '4b':('classifier-declaration',['entity-visibility-icon-dropped','package-header-multi-stereotype-truncated','parenthesis-element-code-as-display','class-redeclare-mute-guard-missing','descriptive-leaf-code-bracket-not-stripped','diamond-folded-into-association','class-business-usecase-dropped']),
 '4c':('multiline-element-body',['multiline-element-blank-line-dropped','multiline-usecase-kind']),
 '4d':('desc-label-embed',['desc-label-embed-unported','desc-atom-text-tab-draw']),
 '4e':('leaf-and-legend-singles',['legend-document-background-cascade','legend-style-maximumwidth-ignored','descriptive-leaf-ink-fallthrough','enhanced-body-icon-block-height','separator-none-namespace-parent','empty-package-leaf-url-dropped']),
 '5a':('creole-newline-and-url',['creole-e1-newline-split','creole-url-hyperlink-color-hardcoded']),
 '5b':('member-and-extractor-parsing',['member-method-params-reformatted','member-double-bracket-url-stripped','class-decl-as-case-sensitive','generic-space-before-angle']),
 '5c':('cluster-style-and-title',['cluster-style-signature-unmerged','group-linestyle-dropped','cluster-header-sprite-stereotype','namespace-title-bypasses-creole']),
 '5d':('relationship-and-directive-singles',['remove-group-not-cascaded','class-circle-decor-unmapped','tim-guessfunctions-pair-order','addmethod-space-lenient']),
}
fam2task={f:t for t,(n,fs) in TASKS.items() for f in fs}
sched=collections.defaultdict(list); deferred=collections.defaultdict(list)
for s,f in P.items():
    (sched[fam2task[f]] if f in fam2task else deferred[f]).append(s)
if __name__=='__main__':
    for t in sorted(TASKS): print(t,TASKS[t][0],len(sched[t]))
    print('scheduled',sum(len(v) for v in sched.values()),'deferred',sum(len(v) for v in deferred.values()))
    for f,v in sorted(deferred.items()): print('  defer',f,len(v))
    json.dump({'P':P,'sched':sched,'deferred':deferred,'TASKS':TASKS},open('/tmp/cdd5-sched.json','w'),indent=1)

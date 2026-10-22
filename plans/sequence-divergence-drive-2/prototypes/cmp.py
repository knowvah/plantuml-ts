import json,sys
S='/private/tmp/claude-501/-Users-scottseely-git-knowvah-plantuml-ts/22654321-fb13-42ce-aa81-e8c390d76578/scratchpad/research-c'
b=json.load(open(S+'/base.json')); n=json.load(open(sys.argv[1]))
newz=[s for s in n if n[s]==0 and b[s]!=0]; lost=[s for s in n if b[s]==0 and n[s]!=0]
fall=[s for s in n if n[s]<b[s] and n[s]!=0]; rise=[s for s in n if n[s]>b[s] and b[s]!=0]
print('new zero',len(newz),sorted(newz)); print('LOST pinned',len(lost),sorted(lost)); print('fell',len(fall),'rose',len(rise))
print('rose:',sorted(rise)[:40])
print('sum base',sum(v for v in b.values() if v>0),'sum new',sum(v for v in n.values() if v>0))

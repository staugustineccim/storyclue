import time, json
from collections import defaultdict
from wordfreq import top_n_list, zipf_frequency
from gridfill4 import BLOCKLIST
from gridfill2 import build_index, fill, render, entries
from gridfill6 import gen_greedy

def load_big(n=250000):
    by_len=defaultdict(list)
    for w in top_n_list('en', n):
        if not (w.isalpha() and w.isascii() and 3<=len(w)<=15): continue
        z=zipf_frequency(w,'en'); L=len(w)
        floor = 3.3 if L==3 else 3.0 if L==4 else 2.7 if L==5 else 2.4
        if z<floor: continue
        W=w.upper()
        if W in BLOCKLIST or not any(v in W for v in 'AEIOUY'): continue
        by_len[L].append(W)
    return by_len

t0=time.time()
by_len=load_big(); idx=build_index(by_len)
print(f"setup {time.time()-t0:.1f}s, {sum(len(v) for v in by_len.values())} words")

pats=[]
for ps in range(12):
    pv=gen_greedy(15,seed=ps,min_blocks=32,max_blocks=40)
    if pv: pats.append((sum(r.count('#') for r in pv[0]), ps, pv))
pats.sort(reverse=True)
print(f"{len(pats)} patterns generated, densest={pats[0][0]} blocks, {time.time()-t0:.1f}s")

for nb, ps, (patt, slots0) in pats[:6]:
    g,slots,dt=fill(patt,by_len,idx,seed=ps+100,time_limit=25)
    if g:
        print(f"\n*** FILLED: {len(slots0)} words, {nb} blocks, fill {dt:.1f}s, total {time.time()-t0:.1f}s ***")
        print(render(patt,g))
        a,d=entries(patt,slots,g)
        print("\nAcross:",a)
        print("\nDown:",d)
        json.dump({"pattern":patt,"across":a,"down":d},open('grid15.json','w'))
        break
    print(f"pattern {ps} ({len(slots0)}w/{nb}b): no fill in {dt:.0f}s")
    if time.time()-t0 > 170: break

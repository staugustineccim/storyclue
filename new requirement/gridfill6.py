import random, time, json
from collections import deque
from gridfill4 import load_curated
from gridfill2 import build_index, extract_slots, fill, render, entries

def seg_ok(line):
    """all open runs in a 0/1 line (1=block) are >=3 or 0"""
    run=0
    for v in line+[1]:
        if v==0: run+=1
        else:
            if 0<run<3: return False
            run=0
    return True

def gen_greedy(size=15, seed=0, max_slot=9, min_blocks=30, max_blocks=40):
    rng=random.Random(seed)
    for _attempt in range(400):
        blocks=set()
        def line_row(r): return [1 if (r,c) in blocks else 0 for c in range(size)]
        def line_col(c): return [1 if (r,c) in blocks else 0 for r in range(size)]
        def try_add(cell):
            twin=(size-1-cell[0], size-1-cell[1])
            add={cell,twin}
            if add & blocks: return False
            blocks.update(add)
            rows={cell[0],twin[0]}; cols={cell[1],twin[1]}
            if all(seg_ok(line_row(r)) for r in rows) and all(seg_ok(line_col(c)) for c in cols):
                return True
            blocks.difference_update(add); return False
        ok=True
        for _ in range(600):
            patt=[''.join('#' if (r,c) in blocks else '.' for c in range(size)) for r in range(size)]
            slots=extract_slots(patt)
            longest=max(slots,key=len)
            if len(longest)<=max_slot and len(blocks)>=min_blocks: break
            # split a long slot (or random densify)
            target = longest if len(longest)>max_slot else rng.choice(slots)
            L=len(target)
            if L<7: continue
            i=rng.randrange(3,L-3)
            try_add(target[i])
            if len(blocks)>max_blocks: ok=False; break
        if not ok: continue
        patt=[''.join('#' if (r,c) in blocks else '.' for c in range(size)) for r in range(size)]
        slots=extract_slots(patt)
        if max(len(s) for s in slots)>max_slot or not(min_blocks<=len(blocks)<=max_blocks) or len(slots)>78:
            continue
        opens=[(r,c) for r in range(size) for c in range(size) if (r,c) not in blocks]
        seen={opens[0]};q=deque([opens[0]])
        while q:
            r,c=q.popleft()
            for dr,dc in((1,0),(-1,0),(0,1),(0,-1)):
                n=(r+dr,c+dc)
                if 0<=n[0]<size and 0<=n[1]<size and n not in blocks and n not in seen:
                    seen.add(n);q.append(n)
        if len(seen)!=len(opens): continue
        return patt,slots
    return None

if __name__=='__main__':
    t0=time.time()
    by_len=load_curated(); idx=build_index(by_len)
    print(f"setup {time.time()-t0:.1f}s")
    for ps in range(40):
        pv=gen_greedy(15,seed=ps)
        if not pv: continue
        patt,slots0=pv
        g,slots,dt=fill(patt,by_len,idx,seed=ps,time_limit=5)
        nb=sum(r.count('#') for r in patt)
        if g:
            print(f"\n*** FILLED: {len(slots0)} words, {nb} blocks, fill {dt:.2f}s, total {time.time()-t0:.1f}s ***")
            print(render(patt,g))
            a,d=entries(patt,slots,g)
            print("\nAcross:",a); print("\nDown:",d)
            json.dump({"pattern":patt,"across":a,"down":d},open('grid15.json','w'))
            break
        else:
            print(f"pattern {ps} ({len(slots0)}w/{nb}b): no fill in 5s")
        if time.time()-t0>100: print("over budget"); break

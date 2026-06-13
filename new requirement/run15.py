import time, json
from final15 import load_big
from gridfill2 import build_index, render, entries, extract_slots
from gridfill6 import gen_greedy
from fill_v7 import make_solver

t0 = time.time()
by_len = load_big(); idx = build_index(by_len)
solver = make_solver(by_len, idx)
print(f"setup {time.time()-t0:.1f}s, {sum(len(v) for v in by_len.values())} words")

pats = []
for ps in range(16):
    pv = gen_greedy(15, seed=ps, max_slot=8, min_blocks=34, max_blocks=44)
    if pv: pats.append((sum(r.count('#') for r in pv[0]), ps, pv))
pats.sort(reverse=True)
print(f"{len(pats)} patterns, densest {pats[0][0]} blocks ({time.time()-t0:.1f}s)")

for nb, ps, (patt, slots) in pats[:8]:
    if len(slots) > 78: continue
    for restart in range(4):                      # random restarts
        g, dt = solver(patt, slots, seed=ps*10+restart, time_limit=6)
        if g:
            print(f"\n*** FILLED *** {len(slots)} words, {nb} blocks, attempt {restart+1}, fill {dt:.1f}s, total {time.time()-t0:.0f}s")
            print(render(patt, g))
            a, d = entries(patt, slots, g)
            print("\nAcross:", a)
            print("\nDown:", d)
            json.dump({"pattern": patt, "across": a, "down": d}, open('grid15.json', 'w'))
            raise SystemExit
    print(f"pattern {ps} ({len(slots)}w/{nb}b): 4 restarts failed")
    if time.time()-t0 > 160: break

"""v4: tiered word quality + human-style symmetric pattern generation + 15x15."""
import random, time, itertools
from collections import defaultdict, deque
from wordfreq import top_n_list, zipf_frequency
from gridfill2 import build_index, extract_slots, fill, render, entries

BLOCKLIST = set('''CUCK STI STD SEXY SEX PORN NAZI RAPE DAMN HELL KILL KILLS KILLED
DRUG DRUGS METH HEROIN VAPE BEER VODKA WHISKY SMUT ASS TIT ANAL ANUS DPRK HESS CUM
GUN GUNS AMMO BOMB BOMBS PISS CRAP SLUT HOE HOES DIE DIED DEAD DEATH MURDER SUICIDE
NUDE NAKED BUTT FART POOP HATE RACIST KKK ISIS COCAINE OPIOID WEED BONG'''.split())

def load_curated(n=100000):
    by_len = defaultdict(list)
    for w in top_n_list('en', n):
        if not (w.isalpha() and w.isascii() and 3 <= len(w) <= 15): continue
        z = zipf_frequency(w, 'en')
        L = len(w)
        floor = 3.7 if L == 3 else 3.4 if L == 4 else 3.1 if L == 5 else 2.9
        if z < floor: continue
        W = w.upper()
        if W in BLOCKLIST: continue
        if not any(v in W for v in 'AEIOUY'): continue
        by_len[L].append(W)
    return by_len

def row_options(size, rng):
    """One row's block columns with all open segments >= 3 (or zero-length at edges)."""
    for _ in range(50):
        nblocks = rng.choice([0,1,1,2,2,2,3,3])
        cols = sorted(rng.sample(range(size), nblocks))
        segs, prev = [], -1
        ok = True
        for b in cols:
            seg = b - prev - 1
            if seg not in (0,) and seg < 3: ok = False; break
            prev = b
        if ok and (size - prev - 1) not in (0,) and (size - prev - 1) < 3: ok = False
        if ok: return set(cols)
    return set()

def gen_pattern(size=15, seed=0, max_words=78, tries=300000):
    rng = random.Random(seed)
    half = size // 2
    for _ in range(tries):
        blocks = set()
        for r in range(half):
            for c in row_options(size, rng):
                blocks.add((r,c)); blocks.add((size-1-r, size-1-c))
        center = row_options(size, rng)
        for c in center:
            blocks.add((half,c)); blocks.add((half, size-1-c))
        # re-validate rows after symmetric merge, then columns, via extract_slots
        patt = [''.join('#' if (r,c) in blocks else '.' for c in range(size)) for r in range(size)]
        try: slots = extract_slots(patt)
        except ValueError: continue
        if len(slots) > max_words or len(blocks) > 40: continue
        opens = [(r,c) for r in range(size) for c in range(size) if (r,c) not in blocks]
        seen={opens[0]}; q=deque([opens[0]])
        while q:
            r,c=q.popleft()
            for dr,dc in ((1,0),(-1,0),(0,1),(0,-1)):
                n=(r+dr,c+dc)
                if 0<=n[0]<size and 0<=n[1]<size and n not in blocks and n not in seen:
                    seen.add(n); q.append(n)
        if len(seen)!=len(opens): continue
        return patt, slots
    return None

if __name__=='__main__':
    by_len = load_curated()
    idx = build_index(by_len)
    print(f"Curated wordlist: {sum(len(v) for v in by_len.values())} words")

    print("\n=== 15x15 NYT-style: generated pattern + fill ===")
    t0=time.time()
    done=False
    for ps in range(40):
        pv = gen_pattern(15, seed=ps)
        if not pv: continue
        patt, slots0 = pv
        nb = sum(row.count('#') for row in patt)
        g, slots, dt = fill(patt, by_len, idx, seed=ps*3+1, time_limit=60)
        if g:
            print(f"[pattern seed {ps}: {len(slots0)} words, {nb} blocks — FILLED in {dt:.1f}s, total elapsed {time.time()-t0:.0f}s]")
            print(render(patt,g))
            a,d = entries(patt,slots,g)
            print("\nAcross:", a)
            print("\nDown:", d)
            import json
            json.dump({"pattern":patt,"across":a,"down":d}, open('grid15.json','w'))
            done=True
            break
        else:
            print(f"[pattern seed {ps}: {len(slots0)} words, {nb} blocks — no fill in {dt:.0f}s]")
        if time.time()-t0 > 480: break
    if not done: print("No fill found.")

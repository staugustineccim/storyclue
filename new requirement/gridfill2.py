"""NYT-style grid filler v2: indexed candidates + forward checking."""
import random, time
from collections import defaultdict
from wordfreq import top_n_list, zipf_frequency

def load_words(n=80000, min_zipf=2.5):
    words = top_n_list('en', n)
    by_len = defaultdict(list)
    for w in words:
        if w.isalpha() and w.isascii() and 3 <= len(w) <= 15 and zipf_frequency(w,'en') >= min_zipf:
            by_len[len(w)].append(w.upper())
    return by_len

def build_index(by_len):
    idx = {}
    for L, words in by_len.items():
        for i in range(L):
            for ch in set(w[i] for w in words):
                idx[(L,i,ch)] = set()
        for wi, w in enumerate(words):
            for i, ch in enumerate(w):
                idx[(L,i,ch)].add(wi)
    return idx

def extract_slots(pattern):
    rows, cols = len(pattern), len(pattern[0])
    slots = []
    for r in range(rows):
        c = 0
        while c < cols:
            if pattern[r][c] == '.':
                s = c
                while c < cols and pattern[r][c] == '.': c += 1
                if c-s >= 3: slots.append(tuple((r,x) for x in range(s,c)))
                elif c-s == 2: raise ValueError(f"2-letter across at row {r}")
            else: c += 1
    for c in range(cols):
        r = 0
        while r < rows:
            if pattern[r][c] == '.':
                s = r
                while r < rows and pattern[r][c] == '.': r += 1
                if r-s >= 3: slots.append(tuple((x,c) for x in range(s,r)))
                elif r-s == 2: raise ValueError(f"2-letter down at col {c}")
            else: r += 1
    # unchecked-letter check: every open cell must be in 2 slots (or at least 1; NYT wants 2)
    cellcount = defaultdict(int)
    for s in slots:
        for cell in s: cellcount[cell] += 1
    for r in range(rows):
        for c in range(cols):
            if pattern[r][c]=='.' and cellcount[(r,c)] < 2:
                raise ValueError(f"unchecked letter at {(r,c)}")
    return slots

def fill(pattern, by_len, idx, seed=0, time_limit=60):
    random.seed(seed)
    slots = extract_slots(pattern)
    cell_slots = defaultdict(list)
    for si, s in enumerate(slots):
        for pos, cell in enumerate(s):
            cell_slots[cell].append((si, pos))
    grid = {cell: None for s in slots for cell in s}
    assignment = {}
    used = set()
    t0 = time.time()

    def cand_ids(si):
        s = slots[si]
        L = len(s)
        sets = []
        for i, cell in enumerate(s):
            ch = grid[cell]
            if ch is not None:
                key = (L,i,ch)
                if key not in idx: return set()
                sets.append(idx[key])
        if not sets:
            return None  # all words of this length
        res = set.intersection(*sorted(sets, key=len))
        return res

    def ncand(si):
        c = cand_ids(si)
        return len(by_len[len(slots[si])]) if c is None else len(c)

    def solve():
        if time.time()-t0 > time_limit: return False
        unfilled = [si for si in range(len(slots)) if si not in assignment]
        if not unfilled: return True
        si = min(unfilled, key=ncand)
        s = slots[si]; L = len(s)
        ids = cand_ids(si)
        words = by_len[L]
        order = sorted(ids) if ids is not None else list(range(len(words)))
        # frequency-biased: keep order (already freq-sorted), shuffle within top band
        top, rest = order[:30], order[30:300]
        random.shuffle(top)
        for wi in top + rest:
            w = words[wi]
            if w in used: continue
            saved = {cell: grid[cell] for cell in s}
            for i, cell in enumerate(s): grid[cell] = w[i]
            used.add(w); assignment[si] = w
            # forward check crossing slots
            ok = True
            for cell in s:
                for sj, _ in cell_slots[cell]:
                    if sj != si and sj not in assignment and ncand(sj) == 0:
                        ok = False; break
                if not ok: break
            if ok and solve(): return True
            used.discard(w); del assignment[si]
            for cell, v in saved.items(): grid[cell] = v
        return False

    ok = solve()
    return (grid, slots, time.time()-t0) if ok else (None, slots, time.time()-t0)

def render(pattern, grid):
    out = []
    for r,row in enumerate(pattern):
        out.append(' '.join('■' if ch=='#' else grid[(r,c)] for c,ch in enumerate(row)))
    return '\n'.join(out)

def entries(pattern, slots, grid):
    rows, cols = len(pattern), len(pattern[0])
    num = 0; across=[]; down=[]
    for r in range(rows):
        for c in range(cols):
            if pattern[r][c]=='#': continue
            sa = (c==0 or pattern[r][c-1]=='#') and c+1<cols and pattern[r][c+1]=='.'
            sd = (r==0 or pattern[r-1][c]=='#') and r+1<rows and pattern[r+1][c]=='.'
            if sa or sd:
                num += 1
                if sa:
                    s = next(s for s in slots if s[0]==(r,c) and s[1][0]==r)
                    across.append((num, ''.join(grid[x] for x in s)))
                if sd:
                    s = next(s for s in slots if s[0]==(r,c) and s[1][1]==c)
                    down.append((num, ''.join(grid[x] for x in s)))
    return across, down

if __name__ == '__main__':
    by_len = load_words()
    idx = build_index(by_len)
    print(f"Wordlist: {sum(len(v) for v in by_len.values())} words, indexed.\n")

    mini = ['.....']*5
    print("=== 5x5 NYT MINI (fully open) ===")
    g, slots, dt = fill(mini, by_len, idx, seed=3, time_limit=30)
    print(f"({dt:.2f}s)")
    if g:
        print(render(mini,g))
        a,d = entries(mini, slots, g); print("Across:",a); print("Down:  ",d)

    nine = [
        '....#....',
        '.........',
        '.........',
        '......###',
        '...###...',
        '###......',
        '.........',
        '.........',
        '....#....',
    ]
    print("\n=== 9x9, 180-degree rotational symmetry ===")
    g, slots, dt = fill(nine, by_len, idx, seed=11, time_limit=90)
    print(f"({dt:.2f}s)")
    if g:
        print(render(nine,g))
        a,d = entries(nine, slots, g); print("Across:",a); print("Down:  ",d)
    else:
        print("FAILED within time limit")

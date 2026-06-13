"""v7: least-constraining-value ordering via letter-position frequencies + restarts."""
import random, time
from collections import defaultdict

def make_solver(by_len, idx):
    # pos_freq[(L,i,ch)] = how many words of length L have ch at i
    pos_freq = {k: len(v) for k, v in idx.items()}

    def fill(pattern, slots, seed=0, time_limit=8):
        rng = random.Random(seed)
        cell_slots = defaultdict(list)
        for si, s in enumerate(slots):
            for pos, cell in enumerate(s):
                cell_slots[cell].append((si, pos))
        cross = {}  # (si,pos) -> (Lj, pj) of crossing slot
        for si, s in enumerate(slots):
            for pos, cell in enumerate(s):
                for sj, pj in cell_slots[cell]:
                    if sj != si:
                        cross[(si, pos)] = (len(slots[sj]), pj, sj)
        grid = {cell: None for s in slots for cell in s}
        assignment = {}
        used = set()
        t0 = time.time()

        def cand_ids(si):
            s = slots[si]; L = len(s)
            sets = []
            for i, cell in enumerate(s):
                ch = grid[cell]
                if ch is not None:
                    key = (L, i, ch)
                    if key not in idx: return set()
                    sets.append(idx[key])
            if not sets: return None
            return set.intersection(*sorted(sets, key=len))

        def ncand(si):
            c = cand_ids(si)
            return len(by_len[len(slots[si])]) if c is None else len(c)

        def lcv_score(si, w):
            """higher = letters more hospitable to unfilled crossings"""
            s = slots[si]; total = 0
            for i, cell in enumerate(s):
                if grid[cell] is None and (si, i) in cross:
                    Lj, pj, sj = cross[(si, i)]
                    if sj not in assignment:
                        f = pos_freq.get((Lj, pj, w[i]), 0)
                        if f == 0: return -1
                        total += f
            return total + rng.random()

        def solve():
            if time.time() - t0 > time_limit: return False
            unfilled = [si for si in range(len(slots)) if si not in assignment]
            if not unfilled: return True
            si = min(unfilled, key=ncand)
            s = slots[si]; L = len(s)
            ids = cand_ids(si)
            words = by_len[L]
            pool = (sorted(ids) if ids is not None else range(len(words)))
            scored = []
            for wi in pool:
                w = words[wi]
                if w in used: continue
                sc = lcv_score(si, w)
                if sc >= 0: scored.append((-sc, wi))
            scored.sort()
            for _, wi in scored[:400]:
                w = words[wi]
                saved = {cell: grid[cell] for cell in s}
                for i, cell in enumerate(s): grid[cell] = w[i]
                used.add(w); assignment[si] = w
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

        return (grid if solve() else None), time.time() - t0
    return fill

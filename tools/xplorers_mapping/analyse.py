"""Train the dual encoder, evaluate it, group users, and build the mapping tables."""

from __future__ import annotations

import random
from collections import Counter, defaultdict

from .encoder import DualEncoder, dot, item_features, sigmoid, user_features
from .generate import eligible
from .vocab import AGE_BANDS, PROGRAM, TRAIT_BY_ID, TRAITS, band_for, trait_min_age

TOP_K = 6
REASON_MIN = 1.0  # a trait must lift the score (logit) at least this much to be named as the reason

# Representative member per band for the mapping tables: Mei's ages and balances from program.json (7, 15, 20).
MEI = PROGRAM["xplorers"]["personas"]["mei"]
REP = {band_for(int(a)): {"age": int(a), "miles": m} for a, m in MEI["balanceByAge"].items()}


# --- Training data and evaluation --------------------------------------------------------------------------

def split(log: list[dict], rng: random.Random, test_share: float = 0.2):
    rows = list(log)
    rng.shuffle(rows)
    cut = int(len(rows) * (1 - test_share))
    return rows[:cut], rows[cut:]


def examples(rows, users, promos):
    return [(user_features(users[r["user"]]["age"], users[r["user"]]["traits"]), item_features(promos[r["promo"]]),
             r["promo"], r["redeemed"]) for r in rows]


def auc(scored: list[tuple[float, int]]) -> float:
    """Probability a random positive outranks a random negative (ties count half)."""
    scored = sorted(scored)
    pos = sum(y for _, y in scored)
    neg = len(scored) - pos
    if not pos or not neg:
        return 0.5
    rank_sum, i = 0.0, 0
    while i < len(scored):
        j = i
        while j < len(scored) and scored[j][0] == scored[i][0]:
            j += 1
        avg_rank = (i + j + 1) / 2
        rank_sum += avg_rank * sum(y for _, y in scored[i:j])
        i = j
    return (rank_sum - pos * (pos + 1) / 2) / (pos * neg)


def evaluate(model: DualEncoder, train, test, users, promos, item_vecs) -> dict:
    # Dual encoder AUC on held-out interactions.
    test_scored = []
    for r in test:
        u = model.encode_user(user_features(users[r["user"]]["age"], users[r["user"]]["traits"]))
        test_scored.append((model.score(u, item_vecs[r["promo"]], r["promo"]), r["redeemed"]))

    # Popularity-by-band baseline (smoothed redemption rate in training).
    counts = defaultdict(lambda: [0, 0])
    for r in train:
        key = (band_for(users[r["user"]]["age"]), r["promo"])
        counts[key][0] += r["redeemed"]
        counts[key][1] += 1
    pop = lambda uid, pid: (counts[(band_for(users[uid]["age"]), pid)][0] + 1) / (counts[(band_for(users[uid]["age"]), pid)][1] + 4)
    base_scored = [(pop(r["user"], r["promo"]), r["redeemed"]) for r in test]

    # Recall@6: for each user, rank every eligible promo they didn't see in training (stage 1 rules first);
    # how many of their held-out redemptions land in the top 6.
    seen = defaultdict(set)
    for r in train:
        seen[r["user"]].add(r["promo"])
    held = defaultdict(set)
    for r in test:
        if r["redeemed"]:
            held[r["user"]].add(r["promo"])

    def recall(score_fn) -> float:
        hits = total = 0
        for uid, positives in held.items():
            pool = [pid for pid, p in promos.items() if pid not in seen[uid] and eligible(users[uid], p)]
            ranked = sorted(pool, key=lambda pid: score_fn(uid, pid), reverse=True)[:TOP_K]
            hits += sum(1 for pid in ranked if pid in positives)
            total += min(TOP_K, len(positives))
        return hits / total if total else 0.0

    user_vecs = {uid: model.encode_user(user_features(u["age"], u["traits"])) for uid, u in users.items()}
    model_score = lambda uid, pid: model.score(user_vecs[uid], item_vecs[pid], pid)
    return {
        "auc": round(auc(test_scored), 4),
        "baselineAuc": round(auc(base_scored), 4),
        "recallAt6": round(recall(model_score), 4),
        "baselineRecallAt6": round(recall(pop), 4),
        "testInteractions": len(test),
    }


# --- Retrieval for a profile (stages 1-3) ------------------------------------------------------------------

def reason_for(model: DualEncoder, traits: list[str], v: list[float]) -> str:
    contrib = model.trait_contributions(traits, v)
    if contrib:
        best, value = max(contrib.items(), key=lambda kv: kv[1])
        if value >= REASON_MIN:
            return TRAIT_BY_ID[best]["reason"]
    return "Popular at your age"


def retrieve(model: DualEncoder, profile: dict, promos: list[dict], item_vecs: dict, k: int = TOP_K) -> list[dict]:
    """Stage 1: eligibility rules. Stages 2-3: user tower, then exact top-k by dot product."""
    u = model.encode_user(user_features(profile["age"], profile["traits"]))
    pool = [p for p in promos if eligible(profile, p)]
    scored = sorted(pool, key=lambda p: model.score(u, item_vecs[p["id"]], p["id"]), reverse=True)[:k]
    return [{"id": p["id"], "score": round(sigmoid(model.score(u, item_vecs[p["id"]], p["id"])), 4),
             "reason": reason_for(model, profile["traits"], item_vecs[p["id"]])} for p in scored]


# --- Grouping ----------------------------------------------------------------------------------------------

def kmeans(vectors: list[list[float]], k: int, rng: random.Random, iters: int = 25) -> list[int]:
    """k-means++ seeding, then Lloyd iterations. Returns a cluster id per vector."""
    dist = lambda a, b: sum((x - y) ** 2 for x, y in zip(a, b))
    centroids = [list(rng.choice(vectors))]
    while len(centroids) < k:
        d = [min(dist(v, c) for c in centroids) for v in vectors]
        r, acc = rng.random() * sum(d), 0.0
        for v, dv in zip(vectors, d):
            acc += dv
            if acc >= r:
                centroids.append(list(v))
                break
    labels = [0] * len(vectors)
    for _ in range(iters):
        labels = [min(range(k), key=lambda c: dist(v, centroids[c])) for v in vectors]
        for c in range(k):
            members = [v for v, l in zip(vectors, labels) if l == c]
            if members:
                centroids[c] = [sum(col) / len(members) for col in zip(*members)]
    return labels


def cluster_users(model, users: list[dict], promos: list[dict], item_vecs, rng, k: int = 8) -> list[dict]:
    vecs = [model.encode_user(user_features(u["age"], u["traits"])) for u in users]
    labels = kmeans(vecs, k, rng)
    band_name = {b["id"]: b["name"].replace(" Xplorers", "") for b in AGE_BANDS}
    out = []
    for c in range(k):
        members = [u for u, l in zip(users, labels) if l == c]
        if not members:
            continue
        ages = sorted(u["age"] for u in members)
        median_age = ages[len(ages) // 2]
        # Label by the median member's band, so the label and the picks (made for that age) agree.
        band = band_for(median_age)
        freq = Counter(t for u in members for t in u["traits"])
        common = [t for t, n in freq.most_common() if n / len(members) >= 0.5 and median_age >= trait_min_age(t)][:3]
        label = f"{band_name[band]} ({ages[0]}-{ages[-1]}): " + (
            ", ".join(TRAIT_BY_ID[t]["label"].lower() for t in common) if common else "mixed interests")
        centroid = [sum(col) / len(members) for col in zip(*[vecs[i] for i, l in enumerate(labels) if l == c])]
        rep = {"age": median_age, "traits": common, "miles": REP[band]["miles"]}
        pool = [p for p in promos if eligible(rep, p)]
        top = sorted(pool, key=lambda p: dot(centroid, item_vecs[p["id"]]) + model.item_bias.get(p["id"], 0), reverse=True)[:TOP_K]
        out.append({"id": c, "size": len(members), "label": label, "band": band, "traits": common,
                    "medianAge": rep["age"], "top": [p["id"] for p in top]})
    return sorted(out, key=lambda c: -c["size"])


def segments(model, users: list[dict], promos, item_vecs, min_users: int = 5) -> list[dict]:
    groups = defaultdict(list)
    for u in users:
        groups[(band_for(u["age"]), tuple(sorted(u["traits"])))].append(u)
    out = []
    for (band, traits), members in groups.items():
        if len(members) < min_users:
            continue
        ages = sorted(u["age"] for u in members)
        profile = {"age": ages[len(ages) // 2], "traits": list(traits), "miles": REP[band]["miles"]}
        out.append({"id": f"{band}|{'+'.join(traits) or 'none'}", "band": band, "traits": list(traits),
                    "users": len(members), "medianAge": profile["age"], "top": retrieve(model, profile, promos, item_vecs)})
    return sorted(out, key=lambda s: -s["users"])


# --- Mapping tables ----------------------------------------------------------------------------------------

def by_band(model, promos, item_vecs) -> dict:
    return {band: retrieve(model, {**rep, "traits": []}, promos, item_vecs, k=8) for band, rep in REP.items()}


def by_trait(model, promos, item_vecs) -> dict:
    """Per trait and band: top picks with that one trait ticked, and the lift over the no-trait baseline."""
    out = {}
    for t in TRAITS:
        out[t["id"]] = {}
        for band, rep in REP.items():
            if rep["age"] < trait_min_age(t["id"]):
                continue
            traits = list(t.get("requires", [])) + [t["id"]]
            u0 = model.encode_user(user_features(rep["age"], []))
            picks = retrieve(model, {**rep, "traits": traits}, promos, item_vecs)
            for pick in picks:
                base = sigmoid(model.score(u0, item_vecs[pick["id"]], pick["id"]))
                pick["lift"] = round(pick["score"] / base, 3) if base else None
            out[t["id"]][band] = picks
    return out


def most_lifted(model, promos, item_vecs, k: int = TOP_K) -> dict:
    """Per trait and band: the eligible promos whose redemption probability rises most when the trait is ticked."""
    out = {}
    for t in TRAITS:
        out[t["id"]] = {}
        for band, rep in REP.items():
            if rep["age"] < trait_min_age(t["id"]):
                continue
            base_traits = list(t.get("requires", []))
            with_traits = base_traits + [t["id"]]
            u0 = model.encode_user(user_features(rep["age"], base_traits))
            u1 = model.encode_user(user_features(rep["age"], with_traits))
            pool = [p for p in promos if eligible({**rep, "traits": with_traits}, p)]
            rows = []
            for p in pool:
                p0 = sigmoid(model.score(u0, item_vecs[p["id"]], p["id"]))
                p1 = sigmoid(model.score(u1, item_vecs[p["id"]], p["id"]))
                # Rank by the gain in redemption probability: a ratio would favour items nobody wanted to begin with.
                rows.append({"id": p["id"], "gain": round(p1 - p0, 4), "lift": round(p1 / p0, 3), "score": round(p1, 4)})
            out[t["id"]][band] = sorted(rows, key=lambda r: -r["gain"])[:k]
    return out

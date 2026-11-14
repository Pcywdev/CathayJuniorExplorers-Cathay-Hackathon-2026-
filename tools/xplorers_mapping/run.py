"""Generate -> train the dual encoder -> evaluate -> group -> write the mapping JSON for the frontend."""

from __future__ import annotations

import argparse
import json
import random
import time
from pathlib import Path

from . import analyse
from .encoder import DualEncoder, item_features
from .generate import make_interactions, make_promotions, make_users
from .vocab import AGE_BANDS, AGE_BUCKETS, MAX_AGE, MIN_AGE, ROOT, TRAITS, trait_min_age

SEED = 2026
DIM = 16
EPOCHS = 20
# Softmax temperature the frontend uses to turn scores into draw weights (lower = sharper).
TEMPERATURE = 1.0

OUT = ROOT / "frontend" / "src" / "xplorers" / "data" / "mapping.json"
DATA = Path(__file__).resolve().parent / "data"


def r4(xs):
    return [round(x, 4) for x in xs]


def build(seed: int = SEED, n_users: int = 800, epochs: int = EPOCHS, log=print) -> tuple[dict, dict]:
    """Returns (mapping, raw) where raw holds the dummy users, promotions and interactions."""
    rng = random.Random(seed)
    promos = make_promotions()
    users = make_users(rng, n_users)
    log_rows = make_interactions(rng, users, promos)
    log(f"Dummy data: {len(users)} users, {len(promos)} promotions, {len(log_rows)} interactions "
        f"({sum(r['redeemed'] for r in log_rows)} redeemed)")

    users_by_id = {u["id"]: u for u in users}
    promos_by_id = {p["id"]: p for p in promos}
    train, test = analyse.split(log_rows, rng)

    log(f"Training dual encoder (dim {DIM}, {epochs} epochs, {len(train)} examples)")
    model = DualEncoder(dim=DIM, seed=seed)
    history = model.fit(analyse.examples(train, users_by_id, promos_by_id), epochs=epochs, log=log)

    # Item tower runs offline: precompute every promo's vector.
    item_vecs = {p["id"]: model.encode_item(item_features(p)) for p in promos}
    # Make sure every user-tower row the frontend may need exists.
    for lo, hi in AGE_BUCKETS:
        model._row(model.user_emb, f"bucket:{lo}-{hi}")
    for b in AGE_BANDS:
        model._row(model.user_emb, f"band:{b['id']}")
    for t in TRAITS:
        model._row(model.user_emb, f"trait:{t['id']}")

    metrics = analyse.evaluate(model, train, test, users_by_id, promos_by_id, item_vecs)
    log(f"Held-out: AUC {metrics['auc']} (baseline {metrics['baselineAuc']}), "
        f"recall@6 {metrics['recallAt6']} (baseline {metrics['baselineRecallAt6']})")

    clusters = analyse.cluster_users(model, users, promos, item_vecs, rng)
    segs = analyse.segments(model, users, promos, item_vecs)
    mapping = {
        "meta": {
            "note": "illustrative, synthetic data, confirm with team",
            "generator": "tools/xplorers_mapping (toy dual encoder)",
            "seed": seed, "users": len(users), "promos": len(promos), "interactions": len(log_rows),
            "dim": DIM, "epochs": epochs, "temperature": TEMPERATURE,
            "loss": {"first": round(history[0], 4), "last": round(history[-1], 4)},
            "eval": metrics,
            "minAge": MIN_AGE, "maxAge": MAX_AGE,
        },
        "ageBands": AGE_BANDS,
        "ageBuckets": [{"id": f"{lo}-{hi}", "minAge": lo, "maxAge": hi} for lo, hi in AGE_BUCKETS],
        "traits": [{"id": t["id"], "label": t["label"], "group": t["group"], "minAge": trait_min_age(t["id"]),
                    "requires": t.get("requires", []), "reason": t["reason"]} for t in TRAITS],
        "userTower": {k: r4(v) for k, v in sorted(model.user_emb.items())},
        "promos": [{**p, "embedding": r4(item_vecs[p["id"]]), "bias": round(model.item_bias.get(p["id"], 0.0) + model.b0, 4)}
                   for p in promos],
        "byBand": analyse.by_band(model, promos, item_vecs),
        "byTrait": analyse.by_trait(model, promos, item_vecs),
        "mostLifted": analyse.most_lifted(model, promos, item_vecs),
        "segments": segs,
        "clusters": clusters,
    }
    raw = {"users": users, "promotions": promos, "interactions": log_rows}
    return mapping, raw


def summarise(mapping: dict, log=print) -> None:
    titles = {p["id"]: p["title"] for p in mapping["promos"]}
    log("\nUser groups (k-means on user-tower embeddings):")
    for c in mapping["clusters"]:
        log(f"  {c['size']:3d}  {c['label']:<45} -> {', '.join(titles[i] for i in c['top'][:3])}")
    log("\nWhat each trait changes (most lifted promos, Teen at 15 or Campus at 20):")
    for tid, bands in mapping["mostLifted"].items():
        band = "teen" if bands.get("teen") else "campus"
        log(f"  {tid:<16} [{band:<6}] " + "; ".join(f"{titles[p['id']]} +{round(p['gain'] * 100)}pp" for p in bands[band][:3]))
    log(f"\nSegments with >= 5 users: {len(mapping['segments'])}")


def main(argv=None) -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seed", type=int, default=SEED)
    parser.add_argument("--users", type=int, default=800)
    parser.add_argument("--epochs", type=int, default=EPOCHS)
    args = parser.parse_args(argv)

    t0 = time.time()
    mapping, raw = build(args.seed, args.users, args.epochs)
    summarise(mapping)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(mapping, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    DATA.mkdir(exist_ok=True)
    for name, rows in raw.items():
        (DATA / f"{name}.json").write_text(json.dumps(rows, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"\nWrote {OUT.relative_to(ROOT)} and tools/xplorers_mapping/data/*.json in {time.time() - t0:.1f}s")


if __name__ == "__main__":
    main()

"""A toy dual encoder (two-tower model), pure Python.

User tower: u = sum of embeddings of the user's active features (age bucket, age band, each trait).
Item tower: v = sum of embeddings of the promo's active features (id, kind, tags, designed-for age buckets,
            miles bucket, required traits).
Score:      s = u . v + b_item + b0, trained with binary cross-entropy on redeemed vs not redeemed.

Both towers are "embedding bags", so each training step only touches the ~10 active feature rows: fast enough in
plain Python. At serving time the item vectors are precomputed (offline) and only the user tower runs (online),
which is how the frontend uses the exported mapping.
"""

from __future__ import annotations

import math
import random

from .vocab import AGE_BUCKETS, band_for, bucket_for, miles_bucket

Feature = tuple[str, float]  # (feature id, weight)


def user_features(age: int, traits: list[str]) -> list[Feature]:
    return [(f"bucket:{bucket_for(age)}", 1.0), (f"band:{band_for(age)}", 1.0)] + [(f"trait:{t}", 1.0) for t in traits]


def item_features(promo: dict) -> list[Feature]:
    buckets = [f"{lo}-{hi}" for lo, hi in AGE_BUCKETS if lo <= promo["maxAge"] and hi >= promo["minAge"]]
    feats: list[Feature] = [(f"item:{promo['id']}", 1.0), (f"kind:{promo['kind']}", 1.0)]
    feats += [(f"tag:{t}", 1.0) for t in promo["tags"]]
    feats += [(f"agebucket:{b}", 1.0 / len(buckets)) for b in buckets]
    feats.append((f"miles:{miles_bucket(promo.get('miles'))}", 1.0))
    feats += [(f"req:{r}", 1.0) for r in promo["requires"]]
    return feats


def sigmoid(x: float) -> float:
    if x >= 0:
        return 1 / (1 + math.exp(-x))
    e = math.exp(x)
    return e / (1 + e)


def dot(a: list[float], b: list[float]) -> float:
    return sum(x * y for x, y in zip(a, b))


class DualEncoder:
    def __init__(self, dim: int = 16, seed: int = 2026, init: float = 0.1):
        self.dim = dim
        self.rng = random.Random(seed)
        self.init = init
        self.user_emb: dict[str, list[float]] = {}
        self.item_emb: dict[str, list[float]] = {}
        self.item_bias: dict[str, float] = {}
        self.b0 = 0.0

    def _row(self, table: dict[str, list[float]], key: str) -> list[float]:
        if key not in table:
            table[key] = [self.rng.gauss(0, self.init) for _ in range(self.dim)]
        return table[key]

    def _bag(self, table: dict[str, list[float]], feats: list[Feature]) -> list[float]:
        out = [0.0] * self.dim
        for key, w in feats:
            row = self._row(table, key)
            for k in range(self.dim):
                out[k] += w * row[k]
        return out

    # Towers
    def encode_user(self, feats: list[Feature]) -> list[float]:
        return self._bag(self.user_emb, feats)

    def encode_item(self, feats: list[Feature]) -> list[float]:
        return self._bag(self.item_emb, feats)

    def score(self, u: list[float], v: list[float], item_id: str) -> float:
        return dot(u, v) + self.item_bias.get(item_id, 0.0) + self.b0

    def fit(self, examples: list[tuple[list[Feature], list[Feature], str, int]], epochs: int = 20,
            lr: float = 0.05, l2: float = 1e-4, decay: float = 0.15, log=None) -> list[float]:
        """examples: (user feats, item feats, item id, label). Returns the mean loss per epoch.
        The learning rate decays as lr / (1 + decay * epoch) so the loss settles instead of bouncing."""
        history = []
        order = list(range(len(examples)))
        base_lr = lr
        for epoch in range(epochs):
            lr = base_lr / (1 + decay * epoch)
            self.rng.shuffle(order)
            total = 0.0
            for idx in order:
                uf, vf, item_id, y = examples[idx]
                u = self.encode_user(uf)
                v = self.encode_item(vf)
                p = sigmoid(self.score(u, v, item_id))
                total += -(y * math.log(p + 1e-9) + (1 - y) * math.log(1 - p + 1e-9))
                g = p - y
                # Sparse SGD: only the active rows of each tower move.
                for key, w in uf:
                    row = self.user_emb[key]
                    for k in range(self.dim):
                        row[k] -= lr * (g * w * v[k] + l2 * row[k])
                for key, w in vf:
                    row = self.item_emb[key]
                    for k in range(self.dim):
                        row[k] -= lr * (g * w * u[k] + l2 * row[k])
                self.item_bias[item_id] = self.item_bias.get(item_id, 0.0) - lr * g
                self.b0 -= lr * g * 0.1
            history.append(total / len(examples))
            if log:
                log(f"  epoch {epoch + 1:2d}  loss {history[-1]:.4f}")
        return history

    def trait_contributions(self, traits: list[str], v: list[float]) -> dict[str, float]:
        """How much each ticked trait pushes this item's score up or down: E_user[trait] . v."""
        return {t: dot(self.user_emb[f"trait:{t}"], v) for t in traits if f"trait:{t}" in self.user_emb}

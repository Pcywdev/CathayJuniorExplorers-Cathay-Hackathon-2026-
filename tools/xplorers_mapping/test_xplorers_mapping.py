"""python -m unittest tools.xplorers_mapping.test_xplorers_mapping  (also runs under pytest)."""

from __future__ import annotations

import json
import unittest

from .analyse import auc
from .encoder import item_features, user_features
from .generate import eligible, make_promotions
from .run import build

PROMOS = {p["id"]: p for p in make_promotions()}


def quiet(*_):
    pass


class EligibilityRules(unittest.TestCase):
    def test_designed_range_is_soft_hard_limits_are_rules(self):
        # Bubble tea is designed for 12-19, but a 20-year-old may still get it: the model decides.
        self.assertTrue(eligible({"age": 20, "traits": [], "miles": 99999}, PROMOS["bubble-tea-gate"]))
        # The hostel is adults only: a hard rule.
        self.assertFalse(eligible({"age": 16, "traits": [], "miles": 99999}, PROMOS["hostel-deal"]))
        self.assertTrue(eligible({"age": 18, "traits": [], "miles": 99999}, PROMOS["hostel-deal"]))

    def test_required_trait(self):
        p = PROMOS["move-abroad-bags"]  # needs studying_abroad
        self.assertFalse(eligible({"age": 20, "traits": ["studying"], "miles": 99999}, p))
        self.assertTrue(eligible({"age": 20, "traits": ["studying", "studying_abroad"], "miles": 99999}, p))

    def test_affordability_but_games_always_affordable(self):
        self.assertFalse(eligible({"age": 22, "traits": [], "miles": 1000}, PROMOS["grad-trip"]))
        self.assertTrue(eligible({"age": 15, "traits": [], "miles": 0}, PROMOS["route-quiz"]))


class Metrics(unittest.TestCase):
    def test_auc(self):
        self.assertEqual(auc([(0.1, 0), (0.9, 1)]), 1.0)
        self.assertEqual(auc([(0.9, 0), (0.1, 1)]), 0.0)
        self.assertEqual(auc([(0.5, 0), (0.5, 1)]), 0.5)


class Pipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.mapping, cls.raw = build(log=quiet)

    def test_training_lowers_loss(self):
        loss = self.mapping["meta"]["loss"]
        self.assertLess(loss["last"], loss["first"])

    def test_beats_popularity_baseline(self):
        ev = self.mapping["meta"]["eval"]
        self.assertGreater(ev["auc"], ev["baselineAuc"])
        self.assertGreater(ev["recallAt6"], ev["baselineRecallAt6"])

    def test_foodie_lifts_food_promos(self):
        # The hidden preference favours food for foodies; the trait's embedding should point at food items.
        tower = self.mapping["userTower"]
        foodie = tower["trait:foodie"]
        dot = lambda a, b: sum(x * y for x, y in zip(a, b))
        food = [dot(foodie, p["embedding"]) for p in self.mapping["promos"] if "food" in p["tags"]]
        other = [dot(foodie, p["embedding"]) for p in self.mapping["promos"] if "food" not in p["tags"]]
        self.assertGreater(sum(food) / len(food), sum(other) / len(other))

    def test_every_frontend_feature_is_exported(self):
        tower = self.mapping["userTower"]
        for b in self.mapping["ageBuckets"]:
            self.assertIn(f"bucket:{b['id']}", tower)
        for t in self.mapping["traits"]:
            self.assertIn(f"trait:{t['id']}", tower)
        for p in self.mapping["promos"]:
            self.assertEqual(len(p["embedding"]), self.mapping["meta"]["dim"])

    def test_model_learns_age_fit(self):
        # No age rule stops a kids' colouring kit at 22; the model should still rank it far below at 22 than at 6.
        m = self.mapping
        dot = lambda a, b: sum(x * y for x, y in zip(a, b))
        u = lambda bucket, band: [x + y for x, y in zip(m["userTower"][f"bucket:{bucket}"], m["userTower"][f"band:{band}"])]
        kit = next(p for p in m["promos"] if p["id"] == "cockpit-colouring")
        self.assertGreater(dot(u("4-6", "little"), kit["embedding"]), dot(u("20-22", "campus"), kit["embedding"]))

    def test_foodie_student_gets_bubble_tea_beyond_its_range(self):
        m = self.mapping
        dot = lambda a, b: sum(x * y for x, y in zip(a, b))
        keys = ["bucket:20-22", "band:campus", "trait:studying"]
        base = [sum(v) for v in zip(*[m["userTower"][k] for k in keys])]
        foodie = [x + y for x, y in zip(base, m["userTower"]["trait:foodie"])]
        tea = next(p for p in m["promos"] if p["id"] == "bubble-tea-gate")
        self.assertGreater(dot(foodie, tea["embedding"]), dot(base, tea["embedding"]) + 1.0)

    def test_deterministic(self):
        again, _ = build(log=quiet)
        self.assertEqual(json.dumps(again, sort_keys=True), json.dumps(self.mapping, sort_keys=True))

    def test_feature_builders(self):
        self.assertIn(("trait:gamer", 1.0), user_features(15, ["gamer"]))
        feats = dict(item_features(PROMOS["student-fare"]))
        self.assertIn("req:studying", feats)
        self.assertAlmostEqual(sum(w for k, w in feats.items() if k.startswith("agebucket:")), 1.0)


if __name__ == "__main__":
    unittest.main()

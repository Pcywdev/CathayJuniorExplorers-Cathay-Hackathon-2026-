# Xplorers promotion mapping (toy dual encoder)

A toy version of a hybrid recommender: deterministic rules first, a two-tower model for retrieval, then packaging.
Pure Python (stdlib only), seeded, synthetic data. It writes `frontend/src/xplorers/data/mapping.json`, which Home's
"Picked for you" grid serves from.

```
python -m tools.xplorers_mapping                                 # generate, train, evaluate, write the mapping (~20 s)
python -m unittest tools.xplorers_mapping.test_xplorers_mapping  # tests
```

| Stage | Production idea | Here |
|---|---|---|
| 1. Rules | SQL checks: verified student, balance, city | `generate.eligible`: **hard** age limits only (e.g. hostel 18+, a minors-only service), required traits (`studying`, `studying_abroad`), affordability |
| 2. User encoder | Text/profile model into a vector | **User tower**: sum of embeddings for age bucket, age band and each ticked trait |
| Catalog encoder | Item embeddings stored with the catalog | **Item tower**: id, kind, tags, designed-for age buckets, miles bucket, required traits; precomputed offline |
| 3. Retrieval | HNSW approximate nearest neighbours | Exact top-k by dot product: 49 items, so an index would only add error |
| 4. Packaging | Assemble the answer | `mapping.json`: per band, per trait, band x trait segments, user clusters, reasons |

## Age is learnt, not ruled
A promo's `minAge`/`maxAge`/`peakAge` say who it was designed for. They are soft: an item-tower feature, not a filter.
Synthetic users see the whole catalog, and the hidden preference fades with distance from the designed peak, so the model
learns how far each promo reaches. Result: bubble tea (designed 12-19) is in 64% of a 15-year-old foodie's grids, 13% at
20 (student, foodie), 2% at 20 without Foodie; a kids' colouring kit is ~0% at 20 with no rule stopping it.
Only real restrictions are rules (`HARD_LIMITS` in generate.py).

## Files
- `vocab.py`: age bands (from `shared/program.json` tiers), age buckets, traits (style and situation), tags.
- `generate.py`: ~800 users, 49 promotions (the `xplorers.discover` seed plus new ones), and an interaction log drawn
  from a hidden preference function that the model never sees.
- `encoder.py`: the dual encoder. Embedding-bag towers, score `u·v + bias`, binary cross-entropy, sparse SGD with decay.
- `analyse.py`: train/test split, AUC and recall@6 against a popularity-by-band baseline, k-means on user embeddings,
  and the mapping tables (`byBand`, `byTrait`, `mostLifted`, `segments`, `clusters`).
- `run.py`: wires it together and prints the summary. Raw dummy data lands in `data/` for inspection.

## How the frontend uses it
`frontend/src/xplorers/discover.ts` runs the user tower online (age + ticked traits from the demo panel's "Mei is…" boxes),
applies the same rules, and draws 6 promos with weight `exp(score / temperature)`, so every profile still gets a random
mix. A tile names the ticked trait that lifts it most (`E_user[trait]·v ≥ 1.0`).

Everything is illustrative: synthetic users with made-up first names, generic partners, miles to confirm with the team.

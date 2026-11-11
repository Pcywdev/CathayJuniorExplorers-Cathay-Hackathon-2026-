# Architecture

```
  ┌──────────────┐     ┌──────────────┐
  │ Child phone  │     │ Parent phone │
  └──────┬───────┘     └──────┬───────┘
         │  React app (Vite PWA, service worker caches chapters)
         ▼                    ▼
  ┌──────────────────────────────────────┐
  │        React frontend  /child /parent │
  └──────┬──────────────────────▲─────────┘
         │ REST (fetch)         │ SSE  /api/trips/{id}/stream
         │                      │ (same event to both phones)
         ▼                      │
  ┌─────────────────────────────┴────────┐
  │        FastAPI backend (Cloud Run)    │
  │  routers ─► logic (rules engine)      │
  │          ─► services (OAG, LLM)       │
  └──┬──────────────┬──────────────┬──────┘
     │              │              │
     ▼              ▼              ▼
  ┌──────┐     ┌─────────┐    ┌─────────┐
  │ OAG  │     │   LLM   │    │ SQLite  │
  │ API  │     │ wrapper │    │ (trips, │
  │+cache│     │+safety  │    │ events, │
  │+fixt.│     │+fallback│    │ cache)  │
  └──────┘     └─────────┘    └─────────┘
```

## Components
- **Child phone / parent phone:** the same React app on two routes; each renders its own version of every event.
- **React frontend:** Vite + TypeScript + Tailwind + Framer Motion; all API calls in `src/api/`; PWA service worker stores chapters for offline.
- **FastAPI backend:** routers by feature, pydantic models matching docs/api.md; publishes each event once per trip channel.
- **Rules engine (`app/logic/`):** pure functions for missions, annual cap, chapter unlock, delay branch, graduation score.
- **OAG service:** the only caller of OAG; every response cached, demo flights stored as fixtures (quota 1,000 / 30 days).
- **LLM wrapper:** one function, one provider (Gemini or Bedrock); writes all chapters as JSON, then safety checks, fallback to pre-written chapters.
- **SQLite (SQLModel):** trips, events, chapters and the OAG response cache.
- **SSE stream:** one channel per trip; both phones subscribe; polling every second is the fallback.
- **`shared/program.json`:** every displayed number, read by backend and frontend.

## One event through the system (architecture slide)
gate scan → `POST /events {type: boarded}` → rules engine (Boarding Badge ✓, cap 1,330 / 2,000 ✓, chapter 2 unlocked) → event published once → child and parent phones. Wording comes from the event's `systemLines`.

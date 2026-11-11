# Frontend (Vite + React + TypeScript)

- One component per file. `src/components/` for parts, `src/screens/` for routes (`/child`, `/parent`).
- Styling with Tailwind only; Tailwind v4 theme lives in the `@theme` block of `src/index.css` and mirrors docs/DESIGN.md tokens (defaults cleared). Use only those colours, two radii (`rounded-doc`, `rounded-pill`), one shadow (`shadow-doc`).
- Framer Motion for all animation; respect `prefers-reduced-motion`.
- All API calls live in `src/api/`. Components never call `fetch` directly.
- Build against mock data in `src/mocks/` until an endpoint exists; shapes must match docs/api.md.
- Displayed numbers come from `shared/program.json` or the API, never literals in components.
- Before calling a screen done, run /screen-check.

## Run (from `frontend/`)
- `npm install` once, then `npm run dev` (http://localhost:5173/child and /parent)
- API base URL: `VITE_API_BASE_URL` in `frontend/.env` (see `.env.example`), default http://localhost:8000
- Build check: `npm run build`

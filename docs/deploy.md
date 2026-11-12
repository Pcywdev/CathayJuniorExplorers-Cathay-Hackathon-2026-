# Deploy runbook (Cloud Run)

Do this on the hackathon day, once `gcloud` and the GCP project are provided. Replace the `<...>` values.
Never put keys in the image; set them on the service.

## 1. One-time setup
```
gcloud auth login
gcloud config set project <PROJECT_ID>
gcloud services enable run.googleapis.com artifactregistry.googleapis.com
gcloud artifacts repositories create little-explorers --repository-format=docker --location=<REGION>
gcloud auth configure-docker <REGION>-docker.pkg.dev
```

## 2. Build and push (from the repo root; the Dockerfile copies shared/)
```
docker build -f backend/Dockerfile -t <REGION>-docker.pkg.dev/<PROJECT_ID>/little-explorers/api:latest .
docker push <REGION>-docker.pkg.dev/<PROJECT_ID>/little-explorers/api:latest
```

## 3. Deploy
```
gcloud run deploy little-explorers-api \
  --image <REGION>-docker.pkg.dev/<PROJECT_ID>/little-explorers/api:latest \
  --region <REGION> --allow-unauthenticated \
  --max-instances=1 --timeout=3600 \
  --set-env-vars ALLOWED_ORIGINS=<FRONTEND_URL>,LLM_PROVIDER=<gemini|bedrock>
```
Keys (`OAG_API_KEY`, `LLM_API_KEY`) go in Secret Manager and are attached with `--set-secrets`, not `--set-env-vars`.

## 4. Check
Open `<service-url>/api/health`; expect `{"status":"ok",...}`. Then set the frontend's `VITE_API_BASE_URL` to the service URL.

## Notes
- Cloud Run supplies `PORT`; the Dockerfile already reads it.
- `--max-instances=1`: SSE subscribers live in memory and trips in a SQLite file inside the container, so every phone must reach the same instance. `--timeout=3600` lets a stream stay open up to an hour (the browser reconnects after that).
- Trips are lost when the instance restarts; just turn junior mode on again.
- Redeploying after a code change: repeat steps 2 and 3.
- If CORS blocks the browser, `ALLOWED_ORIGINS` is missing the frontend's exact origin.

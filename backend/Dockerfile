# Build from the repo root so shared/ is in the build context:
#   docker build -f backend/Dockerfile -t little-explorers-api .
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Same layout as the repo, so app/config.py finds ../shared/program.json.
WORKDIR /srv/backend

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY shared /srv/shared
COPY backend/app ./app

# Cloud Run tells the container which port to listen on via $PORT (usually 8080).
ENV PORT=8080
EXPOSE 8080
# sh -c expands $PORT; exec makes uvicorn PID 1 so it receives Cloud Run's stop signal.
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]

FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY core/ core/
COPY services/ services/
COPY config/ config/
COPY data/ data/
COPY docs/ docs/

ENV PYTHONUNBUFFERED=1

CMD ["sh", "-c", "uvicorn services.api.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

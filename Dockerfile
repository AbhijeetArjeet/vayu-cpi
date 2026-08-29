FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY core/ core/
COPY services/ services/
COPY config/ config/
COPY data/ data/
COPY docs/ docs/
COPY start.py .

ENV PYTHONUNBUFFERED=1

CMD ["python", "start.py"]

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /service
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY modelo_predictivo.py ./modelo_predictivo.py
COPY servicio.py ./servicio.py

EXPOSE 8000
CMD ["uvicorn", "servicio:app", "--host", "0.0.0.0", "--port", "8000"]

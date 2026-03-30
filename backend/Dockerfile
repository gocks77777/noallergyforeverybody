FROM python:3.10-slim

# HF Spaces requires non-root user
RUN useradd -m -u 1000 user
WORKDIR /home/user/app

# System deps for pyproj
RUN apt-get update && \
    apt-get install -y --no-install-recommends libproj-dev proj-data && \
    rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ app/

# Copy model and data files
COPY models/ models/
COPY data/ data/

# Fix ownership
RUN chown -R user:user /home/user/app

USER user

# HF Spaces uses port 7860
EXPOSE 7860

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]

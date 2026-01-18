# 1. Use official Python image
FROM python:3.9-slim

# Install system dependencies required by OpenCV
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*



# 2. Set working directory inside container
WORKDIR /app

# 3. Copy dependency list first (for caching)
COPY requirements.txt .

# 4. Install Python dependencies
RUN pip install --no-cache-dir \
    --extra-index-url https://download.pytorch.org/whl/cpu \
    -r requirements.txt

# 5. Copy application code
COPY . .

# 6. Expose port FastAPI will run on
EXPOSE 8000

# 7. Command to run the app
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]

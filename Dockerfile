FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Set working directory
WORKDIR /app

# Copy Python requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy frontend files and build
COPY frontend/package*.json frontend/
RUN cd frontend && npm install

COPY frontend/ frontend/
RUN cd frontend && npm run build

# Copy the rest of the application
COPY . .

# Create necessary directories
RUN mkdir -p uploads outputs

# Expose port
EXPOSE 8001

# Run the application
CMD ["python", "app_secure.py"] 
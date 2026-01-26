🚗 CarinClaim — Vehicle Damage Assessment Platform
CarinClaim is a full-stack web application that uses computer vision and AI to analyze vehicle damage from images and assist with insurance claim decisions.
It is designed to be production-ready, observable, and easy to run using Docker or local setup.

✨ What It Does
Upload a photo of a damaged vehicle and instantly get:
🚘 Automatic damage detection (dent, scratch, severe damage, etc.)
📋 Claim eligibility decision
💰 Repair cost estimation
🤖 AI assistant to explain the decision (with safe fallback)
🩺 Health checks and structured logs
🔁 Circuit breaker for AI failures (OpenAI-safe)

🧱 Tech Stack
Backend
Python
FastAPI
YOLO (Ultralytics)
OpenAI (with fallback logic)
Structured logging + request tracing
Frontend
React
Vite
Axios
Infrastructure
Docker & Docker Compose
Nginx (frontend)
Circuit breaker & fallback patterns

🚀 How to Run the Project
You can run CarinClaim in two ways:

✅ Option A (Recommended): Run with Docker
Best for reviewers, teammates, and production-like environments.
Prerequisites
Docker Desktop (Windows/macOS)
OR
Docker Engine + Docker Compose (Linux)
Steps
1.git clone <your-repo-url>
2.cd application
3.Start Docker Desktop
4.docker compose up --build
Access
Frontend: http://localhost:3000
Backend API Docs: http://localhost:8000/docs
Health Check: http://localhost:8000/health

✔ One command
✔ Same environment for everyone
✔ No Python / Node version issues

🧑‍💻 Option B: Run Locally (Without Docker)
Useful if Docker is not installed.
Prerequisites
Python 3.9+
Node.js 18+
npm
Backend Setup
cd insurance-damage-backend
python -m venv venv
source venv/bin/activate # Windows: venv\Scripts\activate
pip install -r requirements.txt
Set environment variable (or .env file):
OPENAI_API_KEY=your_api_key_here

Start backend:
uvicorn app:app --reload
Backend runs at:
➡ http://localhost:8000

Frontend Setup
cd insurance-damage-frontend
npm install
npm run dev

Frontend runs at:
➡ http://localhost:5173
🧪 Features You Can Test
✅ /health endpoint
✅ Damage prediction
✅ AI agent (fallback works if OpenAI fails)
✅ Structured logs with request IDs
✅ Circuit breaker behavior
✅ End-to-end flow from UI to backend

📂 Project Structure
application/
├── insurance-damage-backend/
│ ├── app.py
│ ├── utils/
│ │ ├── predictor.py
│ │ └── agent.py
│ ├── requirements.txt
│ └── Dockerfile
│
├── insurance-damage-frontend/
│ ├── src/
│ ├── public/
│ ├── Dockerfile
│ └── package.json
│
├── docker-compose.yml
└── README.md

🛠 Notes
OpenAI API is optional — fallback logic ensures the app works without it
YOLO model runs locally inside the backend container
Logs are structured and production-ready
Designed for easy cloud deployment

🧩 Troubleshooting

Frontend can’t reach backend
→ Ensure backend is running on port 8000

AI agent returns fallback
→ OpenAI key missing or invalid (expected behavior)

Docker command fails
→ Make sure Docker Desktop / Docker Engine is running

⭐ Project Quality

This project is intentionally built with industry practices:
Dockerized services
Health checks
Observability
Failure handling
CI/CD & cloud-ready design
test 1

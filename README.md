🚗 CarinClaim — Vehicle Damage Assessment Platform
CarinClaim is a full-stack web application that uses computer vision and AI to analyze vehicle damage from images and assist with insurance claim decisions.
It is designed to be production-ready, observable, cloud-deployable, and fully automated.

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
AWS EC2
Elastic IP
IAM Roles
SSM Parameter Store
Terraform (Infrastructure as Code)

🚀 How to Run the project
You can run CarinClaim in three ways:
✅ Option A (Recommended): Run with Docker
Best for reviewers, teammates, and production-like environments.
Prerequisites
Docker Desktop (Windows/macOS)
OR
Docker Engine + Docker Compose (Linux)
Steps
git clone <your-repo-url>
cd application
docker compose up --build
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

🌍 Option C: Deploy to AWS with Terraform (Fully Automated)
CarinClaim is designed to be cloud-deployable using Infrastructure as Code.
Terraform provisions:
EC2 Instance (Ubuntu 22.04)
Elastic IP
Security Groups
IAM Role
SSM Parameter Store integration
Automatic Docker installation
Automatic Git clone
Automatic container startup
Deployment Command
From your Terraform directory:
terraform init
terraform apply

📊 Prometheus
9090
Access via:
http://<Elastic-IP>:9090
📈 Grafana
3001 (since you mapped it that way in docker-compose)
Access via:
http://<Elastic-IP>:3001
⚠️ Important
Make sure your AWS Security Group allows inbound traffic on:
9090 (Prometheus)
3001 (Grafana)
80 (Frontend)
8000 (Backend, if exposed)
If those ports aren’t open, the browser will show “Site can’t be reached” even if containers are running.
That’s it.

Once Terraform finishes, the application is automatically:
Provisioned
Dockerized
Configured
Exposed to the internet via Elastic IP
At this point, the site loads directly in your browser using the Elastic IP.
🔍 Checking Cloud-Init Logs
If something doesn’t load or you want to verify that the setup completed successfully, SSH into the instance and run:

sudo cat /var/log/cloud-init-output.log

This log shows:
Docker installation
AWS CLI setup
Git clone progress
.env creation
Container startup logs
Any startup errors
This is the first place to check if deployment fails.

🧪 Features You Can Test

✅ /health endpoint
✅ Damage prediction
✅ AI agent (fallback works if OpenAI fails)
✅ Structured logs with request IDs
✅ Circuit breaker behavior
✅ End-to-end flow from UI to backend
✅ Full cloud deployment via Terraform

import uuid
import time
import logging
import os
from fastapi import FastAPI, File, UploadFile, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel

from utils.predictor import predict_damage
from utils.agent import ask_agent

# ---------- LOGGING ----------
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

logger = logging.getLogger("insurance-backend")
logger.info(f"Logger initialized with level={LOG_LEVEL}")

# ---------- APP ----------
app = FastAPI()

# ---------- REQUEST ID MIDDLEWARE ----------
class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

app.add_middleware(RequestIDMiddleware)

# ---------- LOGGING MIDDLEWARE ----------
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    latency = (time.time() - start_time) * 1000

    logger.info(
        f"{request.method} {request.url.path} | "
        f"status={response.status_code} | "
        f"request_id={request.state.request_id} | "
        f"latency={latency:.2f}ms"
    )
    return response

# ---------- CORS ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- ENDPOINTS ----------
@app.get("/health")
def health_check():
    return {"status": "ok", "service": "insurance-backend"}

@app.post("/predict")
async def predict(file: UploadFile = File(...), request: Request = None):
    try:
        logger.info("Prediction request received")
        result = predict_damage(file)
        logger.info("Prediction completed successfully")
        return result
    except Exception:
        logger.error("Prediction failed", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Prediction failed",
                "request_id": request.state.request_id if request else None
            }
        )

class AgentRequest(BaseModel):
    detections: list
    decision: dict
    question: str

@app.post("/ask-agent")
async def ask_agent_endpoint(payload: AgentRequest, request: Request):
    try:
        logger.info("Agent question received")
        answer = ask_agent(payload.question, payload.decision)
        logger.info("Agent response generated")
        return {"answer": answer}
    except Exception:
        logger.error("Agent failed", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Agent error",
                "request_id": request.state.request_id
            }
        )

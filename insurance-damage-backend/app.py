import uuid
import time
import logging
import os
from fastapi import FastAPI, File, UploadFile, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel
import json
from datetime import datetime
from utils.predictor import predict_damage
from utils.agent import ask_agent
from utils.metrics import (HTTP_REQUESTS_TOTAL, HTTP_REQUEST_LATENCY)
from utils.metrics import (PREDICTION_REQUESTS_TOTAL, PREDICTION_LATENCY)
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from fastapi.responses import Response
# ---------- LOGGING ----------
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "service": "insurance-backend",
            "message": record.getMessage(),
        }

        if hasattr(record, "request_id"):
            log_record["request_id"] = record.request_id

        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_record)
    
handler = logging.StreamHandler()
handler.setFormatter(JsonFormatter())

logger = logging.getLogger("insurance-backend")
logger.info(f"Logger initialized with level={LOG_LEVEL}")
logger.setLevel(LOG_LEVEL)
logger.handlers.clear()
logger.addHandler(handler)

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

    path = request.url.path

    HTTP_REQUESTS_TOTAL.labels(
        method=request.method,
        path=path,
        status=response.status_code
    ).inc()

    HTTP_REQUEST_LATENCY.labels(path=path).observe(latency)

    logger.info(
        f"{request.method} {path} | "
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
    start_time = time.time()

    try:
        logger.info("Prediction request received")
        PREDICTION_REQUESTS_TOTAL.inc()
        
        result = predict_damage(file)
        latency = (time.time() - start_time) * 1000
        
        PREDICTION_LATENCY.observe(latency)
        logger.info("Prediction completed successfully")
        return result

    except Exception:
        latency = (time.time() - start_time) * 1000
        PREDICTION_LATENCY.observe(latency)

        logger.error(
            "Prediction failed",
            exc_info=True,
            extra={
                "request_id": request.state.request_id if request else None
            }
        )

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
        result = ask_agent(payload.question, payload.decision)

        return {
            "answer": result["answer"],
            "source": result["source"],
            "request_id": request.state.request_id
        }

    except Exception:
        logger.exception("agent_failed")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Agent error",
                "request_id": request.state.request_id
            }
        )
        
@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
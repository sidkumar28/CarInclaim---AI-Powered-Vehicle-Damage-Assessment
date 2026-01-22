from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from utils.predictor import predict_damage
from utils.agent import ask_agent

# CREATE APP FIRST
app = FastAPI()

# ADD MIDDLEWARE
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "insurance-backend"
    }
    
# EXISTING PREDICTION ENDPOINT
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    result = predict_damage(file)
    return result

# REQUEST MODEL FOR AGENT
class AgentRequest(BaseModel):
    detections: list
    decision: dict
    question: str

# AI AGENT ENDPOINT
@app.post("/ask-agent")
async def ask_agent_endpoint(req: AgentRequest):
    answer = ask_agent(
        req.detections,
        req.decision,
        req.question
    )
    return {"answer": answer}

import time
import logging
from openai import OpenAI
from utils.metrics import (
    AGENT_REQUESTS_TOTAL,
    AGENT_OPENAI_FAILURES,
    AGENT_FALLBACK_TOTAL,
    AGENT_LATENCY,
    CIRCUIT_STATE
)

logger = logging.getLogger("insurance-backend")
client = OpenAI()

# ---------- CIRCUIT BREAKER CONFIG ----------
FAILURE_THRESHOLD = 3
COOLDOWN_SECONDS = 120  # seconds

failure_count = 0
circuit_opened_at = None


# ---------- CIRCUIT STATE ----------
def circuit_is_open() -> bool:
    return (
        circuit_opened_at is not None
        and (time.time() - circuit_opened_at) < COOLDOWN_SECONDS
    )


def open_circuit():
    global circuit_opened_at
    circuit_opened_at = time.time()
    CIRCUIT_STATE.set(1)
    logger.error("circuit_opened", extra={"cooldown_seconds": COOLDOWN_SECONDS})


def close_circuit():
    global failure_count, circuit_opened_at
    failure_count = 0
    circuit_opened_at = None
    CIRCUIT_STATE.set(0)
    logger.info("circuit_closed")


def record_failure():
    global failure_count
    failure_count += 1
    AGENT_OPENAI_FAILURES.inc()

    if failure_count >= FAILURE_THRESHOLD:
        open_circuit()


# ---------- FALLBACK ----------
def fallback_answer(decision: dict) -> str:
    return (
        "Based on the detected damage and insurance rules, "
        "this claim appears valid. "
        "A manual inspection is recommended for confirmation."
    )


# ---------- MAIN AGENT ----------
def ask_agent(question: str, decision: dict) -> dict:
    start_time = time.time()
    AGENT_REQUESTS_TOTAL.inc()

    # ---------- CIRCUIT OPEN ----------
    if circuit_is_open():
        AGENT_FALLBACK_TOTAL.inc()
        logger.warning("circuit_open_skip_openai")

        AGENT_LATENCY.observe((time.time() - start_time) * 1000)

        return {
            "answer": fallback_answer(decision),
            "source": "fallback"
        }

    # ---------- TRY OPENAI ----------
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an insurance claim assistant."},
                {"role": "user", "content": question},
            ],
        )

        close_circuit()

        AGENT_LATENCY.observe((time.time() - start_time) * 1000)

        return {
            "answer": response.choices[0].message.content,
            "source": "openai"
        }

    # ---------- FAILURE ----------
    except Exception:
        logger.exception("agent_openai_failed")
        record_failure()
        AGENT_FALLBACK_TOTAL.inc()

        AGENT_LATENCY.observe((time.time() - start_time) * 1000)

        return {
            "answer": fallback_answer(decision),
            "source": "fallback"
        }

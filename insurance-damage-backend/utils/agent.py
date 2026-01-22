import time
import logging
from openai import OpenAI

logger = logging.getLogger("insurance-backend")
client = OpenAI()

# ---------- CIRCUIT BREAKER STATE ----------
FAILURE_THRESHOLD = 3
COOLDOWN_SECONDS = 120  # 2 minutes

failure_count = 0
circuit_opened_at = None


def circuit_is_open() -> bool:
    return (
        circuit_opened_at is not None
        and (time.time() - circuit_opened_at) < COOLDOWN_SECONDS
    )


def open_circuit():
    global circuit_opened_at
    circuit_opened_at = time.time()
    logger.error("circuit_opened", extra={"cooldown_seconds": COOLDOWN_SECONDS})


def close_circuit():
    global failure_count, circuit_opened_at
    failure_count = 0
    circuit_opened_at = None
    logger.info("circuit_closed")


def record_failure():
    global failure_count
    failure_count += 1

    if failure_count >= FAILURE_THRESHOLD:
        open_circuit()


def fallback_answer(decision: dict) -> str:
    return (
        "Based on the detected damage and insurance rules, "
        "this claim appears valid. "
        "A manual inspection is recommended for confirmation."
    )


def ask_agent(question: str, decision: dict) -> dict:
    # ---------- CIRCUIT OPEN ----------
    if circuit_is_open():
        logger.warning("circuit_open_skip_openai")
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

        return {
            "answer": response.choices[0].message.content,
            "source": "openai"
        }

    # ---------- FAILURE ----------
    except Exception:
        logger.exception("agent_openai_failed")
        record_failure()

        return {
            "answer": fallback_answer(decision),
            "source": "fallback"
        }

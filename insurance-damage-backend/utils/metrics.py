from prometheus_client import Counter, Histogram, Gauge

# ---------- HTTP METRICS ----------
HTTP_REQUESTS_TOTAL = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "path", "status"]
)

HTTP_REQUEST_LATENCY = Histogram(
    "http_request_latency_ms",
    "HTTP request latency in ms",
    ["path"]
)

# ---------- PREDICTION METRICS ----------
PREDICTION_REQUESTS_TOTAL = Counter(
    "prediction_requests_total",
    "Total prediction requests"
)

PREDICTION_LATENCY = Histogram(
    "prediction_latency_ms",
    "Prediction latency in ms"
)

# ---------- AGENT METRICS ----------
AGENT_REQUESTS_TOTAL = Counter(
    "agent_requests_total",
    "Total agent requests"
)

AGENT_OPENAI_FAILURES = Counter(
    "agent_openai_failures_total",
    "Total OpenAI failures"
)

AGENT_FALLBACK_TOTAL = Counter(
    "agent_fallback_total",
    "Total agent fallback responses"
)

AGENT_LATENCY = Histogram(
    "agent_latency_ms",
    "Agent response latency in ms"
)

# ---------- CIRCUIT BREAKER ----------
CIRCUIT_STATE = Gauge(
    "circuit_state",
    "Circuit breaker state (1=open, 0=closed)"
)

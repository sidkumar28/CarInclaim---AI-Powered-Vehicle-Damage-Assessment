import { useState, useRef, useEffect } from "react";
import "./App.css";
import axios from "axios";
import { API_BASE_URL } from "./config";

const generateRequestId = () => {
  return crypto.randomUUID();
};

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    text: "",
  });
  const [currentPage, setCurrentPage] = useState("analysis");
  const beforeCanvasRef = useRef(null);
  const afterCanvasRef = useRef(null);
  const imageRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setResult(null);
    setAnswer("");
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);

    const requestId = generateRequestId();
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API_BASE_URL}/predict`, formData, {
        headers: {
          "X-Request-ID": requestId,
        },
      });

      setResult(res.data);
    } catch (error) {
      alert("Error analyzing image");
    } finally {
      setLoading(false);
    }
  };

  const askAgent = async () => {
    if (!question.trim() || !result) return;

    setLoading(true);

    const requestId = generateRequestId();

    try {
      const res = await axios.post(
        `${API_BASE_URL}/ask-agent`,
        {
          detections: result.detections,
          decision: result.decision,
          question: question,
        },
        {
          headers: {
            "X-Request-ID": requestId,
          },
        },
      );

      setAnswer(res.data.answer);
      setAnswerSource(res.data.source);
      setQuestion("");
    } catch (error) {
      alert("Error asking AI");
    } finally {
      setLoading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setAnswer("");
    setQuestion("");
  };

  useEffect(() => {
    if (
      result &&
      preview &&
      beforeCanvasRef.current &&
      afterCanvasRef.current &&
      imageRef.current
    ) {
      const beforeCanvas = beforeCanvasRef.current;
      const afterCanvas = afterCanvasRef.current;
      const beforeCtx = beforeCanvas.getContext("2d");
      const afterCtx = afterCanvas.getContext("2d");
      const img = imageRef.current;

      const drawComparison = () => {
        beforeCanvas.width = img.naturalWidth;
        beforeCanvas.height = img.naturalHeight;
        afterCanvas.width = img.naturalWidth;
        afterCanvas.height = img.naturalHeight;

        beforeCtx.drawImage(img, 0, 0);
        afterCtx.drawImage(img, 0, 0);

        result.detections.forEach((det) => {
          const bbox = det.bbox[0];
          const [x1, y1, x2, y2] = bbox;
          const width = x2 - x1;
          const height = y2 - y1;

          const confidence = det.confidence * 100;
          let color;
          if (confidence >= 90) color = "rgba(239, 68, 68, 0.4)";
          else if (confidence >= 70) color = "rgba(251, 146, 60, 0.4)";
          else color = "rgba(34, 197, 94, 0.4)";

          afterCtx.fillStyle = color;
          afterCtx.fillRect(x1, y1, width, height);
          afterCtx.strokeStyle = color.replace("0.4", "0.8");
          afterCtx.lineWidth = 2;
          afterCtx.strokeRect(x1, y1, width, height);
        });
      };

      const handleMouseMove = (e) => {
        const rect = afterCanvas.getBoundingClientRect();
        const scaleX = afterCanvas.width / rect.width;
        const scaleY = afterCanvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        const hoveredDamage = result.detections.find((det) => {
          const [x1, y1, x2, y2] = det.bbox[0];
          return x >= x1 && x <= x2 && y >= y1 && y <= y2;
        });

        if (hoveredDamage) {
          setTooltip({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            text: `${hoveredDamage.class} (${(hoveredDamage.confidence * 100).toFixed(0)}%)`,
          });
        } else {
          setTooltip({ visible: false, x: 0, y: 0, text: "" });
        }
      };

      const handleMouseLeave = () => {
        setTooltip({ visible: false, x: 0, y: 0, text: "" });
      };

      if (img.complete) {
        drawComparison();
      } else {
        img.onload = drawComparison;
      }

      afterCanvas.addEventListener("mousemove", handleMouseMove);
      afterCanvas.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        afterCanvas.removeEventListener("mousemove", handleMouseMove);
        afterCanvas.removeEventListener("mouseleave", handleMouseLeave);
      };
    }
  }, [result, preview, currentPage]);

  const getConfidenceColor = (confidence) => {
    const percent = confidence * 100;
    if (percent >= 90) return "high";
    if (percent >= 70) return "medium";
    return "low";
  };

  const calculateCostEstimate = () => {
    if (!result || !result.detections) return "₹0 - ₹0";

    let minCost = 0;
    let maxCost = 0;

    result.detections.forEach((det) => {
      const damageType = det.class.toLowerCase();
      const confidence = det.confidence * 100;

      let rangeMin, rangeMax;

      if (damageType.includes("scratch")) {
        rangeMin = 500;
        rangeMax = 5000;
      } else if (damageType.includes("dent")) {
        rangeMin = 1500;
        rangeMax = 8000;
      } else if (
        damageType.includes("broken") ||
        damageType.includes("crack")
      ) {
        rangeMin = 3000;
        rangeMax = 15000;
      } else if (
        damageType.includes("severe") ||
        damageType.includes("major")
      ) {
        rangeMin = 25000;
        rangeMax = 100000;
      } else {
        rangeMin = 2000;
        rangeMax = 10000;
      }

      const confidenceRatio = confidence / 100;
      minCost += rangeMin + (rangeMax - rangeMin) * confidenceRatio * 0.2;
      maxCost +=
        rangeMin + (rangeMax - rangeMin) * (0.5 + confidenceRatio * 0.5);
    });

    return `₹${Math.round(minCost).toLocaleString("en-IN")} - ₹${Math.round(maxCost).toLocaleString("en-IN")}`;
  };

  const renderPageContent = () => {
    if (currentPage === "history") {
      return (
        <div className="page-content">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="stat-info">
                <div className="stat-value">24</div>
                <div className="stat-label">Total Analyses</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon approved">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    d="M5 13l4 4L19 7"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="stat-info">
                <div className="stat-value">18</div>
                <div className="stat-label">Claims Approved</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon rejected">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    d="M6 18L18 6M6 6l12 12"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="stat-info">
                <div className="stat-value">6</div>
                <div className="stat-label">Claims Rejected</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon cost">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="stat-info">
                <div className="stat-value">₹2.4L</div>
                <div className="stat-label">Total Estimates</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Recent Analyses
            </div>
            <div className="history-list">
              {[
                {
                  id: 1,
                  date: "2024-01-15",
                  time: "14:30",
                  damage: "Dent",
                  status: "Approved",
                  cost: "₹8,500",
                },
                {
                  id: 2,
                  date: "2024-01-14",
                  time: "11:20",
                  damage: "Scratch",
                  status: "Approved",
                  cost: "₹3,200",
                },
                {
                  id: 3,
                  date: "2024-01-13",
                  time: "16:45",
                  damage: "Broken",
                  status: "Rejected",
                  cost: "₹15,000",
                },
                {
                  id: 4,
                  date: "2024-01-12",
                  time: "09:15",
                  damage: "Severe",
                  status: "Approved",
                  cost: "₹45,000",
                },
                {
                  id: 5,
                  date: "2024-01-11",
                  time: "13:30",
                  damage: "Scratch",
                  status: "Approved",
                  cost: "₹2,800",
                },
              ].map((item) => (
                <div key={item.id} className="history-item">
                  <div className="history-date">
                    <div className="date">{item.date}</div>
                    <div className="time">{item.time}</div>
                  </div>
                  <div className="history-damage">
                    <div className="damage-type">{item.damage}</div>
                  </div>
                  <div
                    className={`history-status ${item.status.toLowerCase()}`}
                  >
                    {item.status === "Approved" ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          d="M5 13l4 4L19 7"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          d="M6 18L18 6M6 6l12 12"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                    {item.status}
                  </div>
                  <div className="history-cost">{item.cost}</div>
                  <div className="history-actions">
                    <button className="btn-action">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle cx="12" cy="12" r="3" strokeWidth="2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (currentPage === "settings") {
      return (
        <div className="page-content">
          <div className="settings-grid">
            <div className="card">
              <div className="card-title">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                AI Model Settings
              </div>
              <div className="settings-section">
                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-name">Detection Confidence</div>
                    <div className="setting-desc">
                      Minimum confidence threshold for damage detection
                    </div>
                  </div>
                  <div className="setting-control">
                    <input
                      type="range"
                      min="50"
                      max="95"
                      defaultValue="75"
                      className="slider"
                    />
                    <span className="setting-value">75%</span>
                  </div>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-name">Model Sensitivity</div>
                    <div className="setting-desc">
                      Adjust detection sensitivity for minor damages
                    </div>
                  </div>
                  <div className="setting-control">
                    <select className="setting-select">
                      <option>Low</option>
                      <option selected>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-title">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Cost Estimation
              </div>
              <div className="settings-section">
                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-name">Regional Pricing</div>
                    <div className="setting-desc">
                      Adjust costs based on your location
                    </div>
                  </div>
                  <div className="setting-control">
                    <select className="setting-select">
                      <option selected>India (₹)</option>
                      <option>USA ($)</option>
                      <option>Europe (€)</option>
                    </select>
                  </div>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-name">Cost Multiplier</div>
                    <div className="setting-desc">
                      Adjust base cost estimates
                    </div>
                  </div>
                  <div className="setting-control">
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      defaultValue="1"
                      className="slider"
                    />
                    <span className="setting-value">1.0x</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-title">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                User Preferences
              </div>
              <div className="settings-section">
                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-name">Language</div>
                    <div className="setting-desc">Interface language</div>
                  </div>
                  <div className="setting-control">
                    <select className="setting-select">
                      <option selected>English</option>
                      <option>Hindi</option>
                      <option>Spanish</option>
                    </select>
                  </div>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-name">Auto-save Results</div>
                    <div className="setting-desc">
                      Automatically save analysis results
                    </div>
                  </div>
                  <div className="setting-control">
                    <label className="toggle">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-title">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                System Information
              </div>
              <div className="settings-section">
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">Model Version</div>
                    <div className="info-value">v2.1.4</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Last Updated</div>
                    <div className="info-value">Jan 10, 2024</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Accuracy Rate</div>
                    <div className="info-value">96.2%</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Processing Speed</div>
                    <div className="info-value">2.3s avg</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Analysis page content
    return (
      <>
        {!result ? (
          <div className="upload-section">
            <div className="upload-box">
              <div className="info-section">
                <div className="app-info">
                  <h2>AI-Powered Vehicle Damage Assessment</h2>
                  <p>
                    Upload your vehicle images and get instant damage analysis
                    powered by advanced computer vision technology.
                  </p>

                  <div className="features">
                    <div className="feature">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>Accurate damage detection with 95%+ precision</span>
                    </div>
                    <div className="feature">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>Instant cost estimation and claim approval</span>
                    </div>
                    <div className="feature">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>Secure processing with data protection</span>
                    </div>
                  </div>
                </div>
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                id="file-input"
              />
              <label htmlFor="file-input" className="upload-label">
                {preview ? (
                  <img src={preview} alt="Vehicle" className="preview-img" />
                ) : (
                  <div className="upload-placeholder">
                    <svg
                      width="64"
                      height="64"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p>Click to upload or drag and drop</p>
                    <span>
                      PNG, JPG up to 10MB • Supports front, side, and rear views
                    </span>
                  </div>
                )}
              </label>
              {file && (
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? "Analyzing with AI..." : "Start AI Analysis"}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="results-layout">
            <div className="left-panel">
              <div className="card visual-card">
                <div className="card-title">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Before / After Comparison
                </div>
                <div className="comparison-container">
                  <img
                    ref={imageRef}
                    src={preview}
                    alt="Original"
                    style={{ display: "none" }}
                  />
                  <div className="comparison-images">
                    <div className="image-section">
                      <h4>Before</h4>
                      <canvas
                        ref={beforeCanvasRef}
                        className="comparison-canvas"
                      />
                    </div>
                    <div className="image-section">
                      <h4>After (Damage Highlighted)</h4>
                      <canvas
                        ref={afterCanvasRef}
                        className="comparison-canvas"
                        style={{ cursor: "pointer" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card decision-card">
                <div className="card-title">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Claim Status
                </div>
                <div
                  className={`status-indicator ${result.decision.claim_approved ? "approved" : "rejected"}`}
                >
                  <div className="status-icon">
                    {result.decision.claim_approved ? (
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          d="M5 13l4 4L19 7"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          d="M6 18L18 6M6 6l12 12"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="status-text">
                    {result.decision.claim_approved ? "Approved" : "Rejected"}
                  </div>
                </div>
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">Damage Type</div>
                    <div className="info-value">
                      {result.decision.final_damage}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Estimated Cost</div>
                    <div className="info-value cost">
                      {result.decision.estimated_cost_range ||
                        calculateCostEstimate()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-title-row">
                  <div className="card-title">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9l2 2 4-4"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Damage Detection
                  </div>
                  <div className="badge">{result.detections.length} found</div>
                </div>
                <div className="detections-grid">
                  {result.detections.map((det, i) => (
                    <div key={i} className="detection-item">
                      <div className="detection-info">
                        <div className="detection-name">{det.class}</div>
                        <div
                          className={`confidence-bar ${getConfidenceColor(det.confidence)}`}
                        >
                          <div
                            className="confidence-fill"
                            style={{ width: `${det.confidence * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div
                        className={`confidence-value ${getConfidenceColor(det.confidence)}`}
                      >
                        {(det.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="right-panel">
              <div className="card chat-card">
                <div className="card-title">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-5l-5 5v-5z"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  AI Assistant
                </div>
                <div className="chat-container">
                  {answer && (
                    <div className="message assistant">
                      <div className="message-avatar">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <div className="message-content">{answer}</div>
                    </div>
                  )}
                </div>
                <div className="chat-input-container">
                  <input
                    type="text"
                    placeholder="Ask about the assessment..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && askAgent()}
                    className="chat-input"
                  />
                  <button
                    onClick={askAgent}
                    disabled={loading || !question.trim()}
                    className="btn-send"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              d="M7 17h10l-2-6H9l-2 6zM6 6h12l3 11v3a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3l3-11zM9 12h6M9.5 16a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM14.5 16a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          CarInclaim
        </div>
        <nav className="nav">
          <div
            className={`nav-item ${currentPage === "analysis" ? "active" : ""}`}
            onClick={() => setCurrentPage("analysis")}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Analysis
          </div>
          <div
            className={`nav-item ${currentPage === "history" ? "active" : ""}`}
            onClick={() => setCurrentPage("history")}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            History
          </div>
          <div
            className={`nav-item ${currentPage === "settings" ? "active" : ""}`}
            onClick={() => setCurrentPage("settings")}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Settings
          </div>
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          {currentPage === "analysis" && result ? (
            <h1>Vehicle Damage Assessment</h1>
          ) : currentPage === "history" ? (
            <h1>Analysis History</h1>
          ) : currentPage === "settings" ? (
            <h1>Settings</h1>
          ) : (
            <h1>CarInclaim AI</h1>
          )}
          <div className="topbar-actions">
            {result && currentPage === "analysis" && (
              <button onClick={resetUpload} className="btn-new">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    d="M12 5v14M5 12h14"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                New Analysis
              </button>
            )}
            <div className="user-info">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Admin
            </div>
          </div>
        </header>

        <div className="content">{renderPageContent()}</div>
      </main>
      {tooltip.visible && (
        <div
          className="damage-tooltip"
          style={{ left: tooltip.x + 10, top: tooltip.y + 10 }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}

export default App;

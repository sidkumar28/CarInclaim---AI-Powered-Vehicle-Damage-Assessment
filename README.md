# CarinClaim - Vehicle Damage Assessment

A web application that uses computer vision to analyze vehicle damage from photos and automatically determine insurance claim eligibility with cost estimates.

## What it does

Upload a photo of your damaged vehicle and get:

- Automatic damage detection (scratches, dents, broken parts, severe damage)
- Instant claim approval/rejection decision
- Cost estimation for repairs
- Interactive before/after comparison with highlighted damage areas
- AI assistant to answer questions about the assessment

## Tech Stack

**Backend:** Python, FastAPI, YOLO object detection, OpenAI GPT
**Frontend:** React, Vite, Axios
**Styling:** Custom CSS with modern design

## Setup Instructions

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. Navigate to backend folder:

```bash
cd insurance-damage-backend
```

2. Install Python dependencies:

```bash
pip install -r requirements.txt
```

3. Add your OpenAI API key to environment variables or create a `.env` file:

```
OPENAI_API_KEY=your_api_key_here
```

4. Start the backend server:

```bash
uvicorn app:app --reload
```

Backend will run on `http://127.0.0.1:8000`

### Frontend Setup

1. Navigate to frontend folder:

```bash
cd insurance-damage-frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## Usage

1. Open your browser and go to `http://localhost:5173`
2. Upload a vehicle damage photo (PNG/JPG, max 10MB)
3. Click "Start AI Analysis"
4. View results including damage detection, claim status, and cost estimates
5. Use the AI assistant to ask questions about the assessment
6. Check History and Settings pages for additional features

## Features

- **Analysis Page:** Upload and analyze vehicle damage photos
- **History Page:** View past analyses with statistics dashboard
- **Settings Page:** Configure AI model parameters and user preferences
- **Responsive Design:** Works on desktop and mobile devices
- **Real-time Processing:** Fast damage detection and cost calculation

## File Structure

```
application/
├── insurance-damage-backend/
│   ├── main.py
│   ├── utils/
│   └── requirements.txt
├── insurance-damage-frontend/
│   ├── src/
│   ├── public/
│   └── package.json
└── README.md
```

## Notes

- Make sure both backend and frontend servers are running
- The AI model requires an active internet connection for OpenAI API calls
- Supported image formats: PNG, JPG, JPEG
- Maximum file size: 10MB per image

## Troubleshooting

- If backend fails to start, check if all Python dependencies are installed
- If frontend shows connection errors, verify backend is running on port 8000
- For API key issues, ensure OpenAI key is properly set in environment variables

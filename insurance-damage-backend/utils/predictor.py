from ultralytics import YOLO
from PIL import Image
import io
from utils.severity import calculate_severity_and_claim

model = YOLO("model/best.pt")

def predict_damage(file):
    image_bytes = file.file.read()
    image = Image.open(io.BytesIO(image_bytes))

    results = model.predict(image, conf=0.25)

    detections = []

    for r in results:
        for box in r.boxes:
            detections.append({
                "class": r.names[int(box.cls)],
                "confidence": float(box.conf),
                "bbox": box.xyxy.tolist()
            })

    decision = calculate_severity_and_claim(detections)

    return {
        "detections": detections,
        "decision": decision
    }

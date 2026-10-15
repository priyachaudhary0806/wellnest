import base64
import io
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
from ultralytics import YOLO


# Paths
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "yolo11n.pt"

# FastAPI application
app = FastAPI(title="WellNest YOLO Object Detection API")

# Allow requests from the WellNest frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load pretrained YOLO model once at startup
model = YOLO(str(MODEL_PATH))


class ImageRequest(BaseModel):
    image: str


@app.get("/")
def home():
    return {
        "service": "WellNest YOLO API",
        "status": "running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model": "yolo11n.pt",
        "model_loaded": True
    }


@app.post("/detect")
def detect_objects(request: ImageRequest):
    try:
        # Accept base64 data with or without a data URL prefix
        image_data = request.image

        if "," in image_data and image_data.startswith("data:"):
            image_data = image_data.split(",", 1)[1]

        image_bytes = base64.b64decode(image_data, validate=True)

        # Convert uploaded image to RGB
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # Run YOLO inference
        results = model.predict(
            source=image,
            conf=0.35,
            imgsz=640,
            verbose=False
        )

        detections = []

        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                class_id = int(box.cls[0].item())
                confidence = float(box.conf[0].item())

                image_width, image_height = image.size
                center_x = (x1 + x2) / 2

                if center_x < image_width / 3:
                    position = "left"
                elif center_x > 2 * image_width / 3:
                    position = "right"
                else:
                    position = "center"

                detections.append({
                    "label": result.names[class_id],
                    "confidence": round(confidence, 3),
                    "position": position,
                    "bbox": [
                        round(x1),
                        round(y1),
                        round(x2),
                        round(y2)
                    ]
                })

        summary = (
            "Detected " + ", ".join(
                f"{count} {label}"
                for label, count in _count_objects(detections).items()
            )
            if detections
            else "No recognizable objects detected."
        )

        return {
            "success": True,
            "objects": detections,
            "summary": summary,
            "image_width": image.width,
            "image_height": image.height
        }

    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=f"Object detection failed: {str(error)}"
        )


def _count_objects(detections):
    counts = {}

    for item in detections:
        label = item["label"]
        counts[label] = counts.get(label, 0) + 1

    return counts
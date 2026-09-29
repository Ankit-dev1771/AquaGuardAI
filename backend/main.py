from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from ultralytics import YOLO

import io
import base64
from typing import List


app = FastAPI(title="SonarAI API")


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# MODEL CONFIGURATION
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"


MODEL_PATHS = {
    "crab_pot": MODEL_DIR / "crabpots_model/weights/best.pt",
    "pipeline": MODEL_DIR / "pipeline_model/weights/best.pt",
    "mines": MODEL_DIR / "mine_model/weights/best.pt",
}


MODEL_INFO = {
    "crab_pot": {
        "display_name": "Crab Pot",
        "color": (255, 205, 40),
        "description": "Fishing gear & marine debris",
    },

    "pipeline": {
        "display_name": "Pipeline",
        "color": (0, 210, 255),
        "description": "Underwater pipeline",
    },

    "mines": {
        "display_name": "Mine / Contact",
        "color": (255, 70, 70),
        "description": "Mine-like & non-mine contacts",
    },
}


# --------------------------------------------------
# LOAD MODELS ONCE
# --------------------------------------------------

MODELS = {}

for name, path in MODEL_PATHS.items():

    if not path.exists():
        print(f"WARNING: Model not found: {path}")
        continue

    print(f"Loading model: {name}")
    MODELS[name] = YOLO(str(path))

print("Loaded models:", list(MODELS.keys()))


# --------------------------------------------------
# IMAGE HELPERS
# --------------------------------------------------

def encode_image(image: Image.Image) -> str:

    buffer = io.BytesIO()

    image.save(
        buffer,
        format="JPEG",
        quality=92
    )

    return base64.b64encode(
        buffer.getvalue()
    ).decode("utf-8")


def get_font(size=16):

    try:
        return ImageFont.truetype(
            "arial.ttf",
            size
        )

    except Exception:

        return ImageFont.load_default()


def clean_class_name(name):

    mapping = {

        "MILCO": "Mine-Like Contact",
        "milco": "Mine-Like Contact",
        "mine_like_contact": "Mine-Like Contact",

        "NOMBO": "Non-Mine Object",
        "nombo": "Non-Mine Object",
        "non_mine_object": "Non-Mine Object",
    }

    return mapping.get(
        str(name),
        str(name).replace("_", " ").title()
    )


# --------------------------------------------------
# CUSTOM DETECTION DRAWING
# --------------------------------------------------

def draw_detection(
    image,
    x1,
    y1,
    x2,
    y2,
    label,
    confidence,
    color
):

    draw = ImageDraw.Draw(image)

    # Main border
    draw.rectangle(
        [x1, y1, x2, y2],
        outline=color,
        width=3
    )

    # Corner length
    corner = min(
        22,
        max(8, int(min(x2 - x1, y2 - y1) * 0.18))
    )

    # Top-left
    draw.line(
        [(x1, y1), (x1 + corner, y1)],
        fill=color,
        width=5
    )

    draw.line(
        [(x1, y1), (x1, y1 + corner)],
        fill=color,
        width=5
    )

    # Top-right
    draw.line(
        [(x2, y1), (x2 - corner, y1)],
        fill=color,
        width=5
    )

    draw.line(
        [(x2, y1), (x2, y1 + corner)],
        fill=color,
        width=5
    )

    # Bottom-left
    draw.line(
        [(x1, y2), (x1 + corner, y2)],
        fill=color,
        width=5
    )

    draw.line(
        [(x1, y2), (x1, y2 - corner)],
        fill=color,
        width=5
    )

    # Bottom-right
    draw.line(
        [(x2, y2), (x2 - corner, y2)],
        fill=color,
        width=5
    )

    draw.line(
        [(x2, y2), (x2, y2 - corner)],
        fill=color,
        width=5
    )

    # Label
    font = get_font(15)

    text = f"{label}  {confidence:.0%}"

    bbox = draw.textbbox(
        (0, 0),
        text,
        font=font
    )

    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    label_x = x1
    label_y = max(
        0,
        y1 - text_height - 10
    )

    draw.rounded_rectangle(
        [
            label_x,
            label_y,
            label_x + text_width + 14,
            label_y + text_height + 8,
        ],
        radius=5,
        fill=color
    )

    draw.text(
        (
            label_x + 7,
            label_y + 4
        ),
        text,
        fill=(0, 0, 0),
        font=font
    )


# --------------------------------------------------
# PROCESS ONE IMAGE
# --------------------------------------------------

def process_image(
    image_bytes,
    filename,
    confidence
):

    original = Image.open(
        io.BytesIO(image_bytes)
    ).convert("RGB")

    annotated = original.copy()

    image_width, image_height = original.size

    detections = []

    # ----------------------------------------------
    # Run every model
    # ----------------------------------------------

    for model_name, model in MODELS.items():

        info = MODEL_INFO[model_name]

        results = model.predict(
            original,
            conf=confidence,
            imgsz=640,
            device=0,
            verbose=False
        )

        for result in results:

            if result.boxes is None:
                continue

            for box in result.boxes:

                xyxy = box.xyxy[0].tolist()

                x1, y1, x2, y2 = [
                    int(v) for v in xyxy
                ]

                class_id = int(
                    box.cls[0].item()
                )

                score = float(
                    box.conf[0].item()
                )

                raw_class_name = result.names.get(
                    class_id,
                    str(class_id)
                )

                class_name = clean_class_name(
                    raw_class_name
                )

                # ----------------------------------
                # Keep bbox inside image
                # ----------------------------------

                x1 = max(0, min(x1, image_width - 1))
                y1 = max(0, min(y1, image_height - 1))
                x2 = max(0, min(x2, image_width))
                y2 = max(0, min(y2, image_height))

                width = max(0, x2 - x1)
                height = max(0, y2 - y1)

                # ----------------------------------
                # Exact object crop
                # ----------------------------------

                crop = original.crop(
                    (
                        x1,
                        y1,
                        x2,
                        y2
                    )
                )

                # ----------------------------------
                # Custom annotation
                # ----------------------------------

                draw_detection(
                    annotated,
                    x1,
                    y1,
                    x2,
                    y2,
                    class_name,
                    score,
                    info["color"]
                )

                detections.append({

                    "id": len(detections) + 1,

                    "model": model_name,

                    "model_display": info[
                        "display_name"
                    ],

                    "class_id": class_id,

                    "class_name": class_name,

                    "raw_class_name": raw_class_name,

                    "confidence": score,

                    "bbox": {
                        "x1": x1,
                        "y1": y1,
                        "x2": x2,
                        "y2": y2,
                    },

                    "width": width,

                    "height": height,

                    "crop": encode_image(crop),
                })

    # ----------------------------------------------
    # Sort detections
    # ----------------------------------------------

    detections.sort(
        key=lambda x: x["confidence"],
        reverse=True
    )

    for index, detection in enumerate(
        detections,
        start=1
    ):
        detection["id"] = index

    # ----------------------------------------------
    # Summary
    # ----------------------------------------------

    summary = {}

    for detection in detections:

        class_name = detection["class_name"]

        summary[class_name] = (
            summary.get(class_name, 0) + 1
        )

    return {

        "status": "success",

        "filename": filename,

        "image_width": image_width,

        "image_height": image_height,

        "threshold": confidence,

        "total_detections": len(detections),

        "summary": summary,

        "detections": detections,

        "annotated_image": encode_image(
            annotated
        ),
    }


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.get("/")
def root():

    return {
        "status": "online",
        "models": list(MODELS.keys())
    }


# --------------------------------------------------
# MULTI-IMAGE DETECTION
# --------------------------------------------------

@app.post("/api/detect")
async def detect(

    files: List[UploadFile] = File(...),

    confidence: float = Form(0.30)
):

    results = []

    for uploaded_file in files:

        image_bytes = await uploaded_file.read()

        try:

            result = process_image(
                image_bytes,
                uploaded_file.filename,
                confidence
            )

            results.append(result)

        except Exception as e:

            results.append({

                "status": "error",

                "filename": uploaded_file.filename,

                "error": str(e),

            })

    return {

        "status": "success",

        "total_images": len(results),

        "results": results,

    }
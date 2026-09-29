# SonarSense-AI 🌊

### AI-Powered Automated Underwater Marine Debris & Anomaly Detection using Side-Scan Sonar Imagery

> **Smart India Hackathon 2026 --- Problem Statement 26057**\
> **Theme:** Marine Debris, Underwater Anomaly Detection & Intelligent
> Sonar Analysis

SonarSense-AI is a prototype AI-assisted system designed to
automatically analyze **Side-Scan Sonar (SSS)** imagery and identify
underwater objects, marine debris, infrastructure, and sonar anomalies
that may require human attention.

The core idea is simple:

**Instead of forcing an operator to manually inspect thousands of sonar
returns, let specialized AI models perform the first-pass screening and
present the potentially important detections in a structured, visual
form.**

The system is designed around a modular detection pipeline so that
different sonar object categories can be trained and improved
independently. The current prototype demonstrates detection models for
**crab pots/fishing gear, pipelines/cylindrical structures, mine-like
sonar contacts, shipwrecks, and ghost nets**, with different levels of
dataset maturity across categories.

------------------------------------------------------------------------

## 📌 Problem Statement

Side-scan sonar is widely used for surveying the seafloor because it can
reveal objects and structures that are difficult or impossible to
observe using conventional optical cameras.

However, interpreting SSS imagery is not trivial.

Sonar imagery contains characteristics such as:

-   Acoustic shadows
-   Speckle and sensor noise
-   Variable resolution
-   Strong dependence on sonar frequency and acquisition geometry
-   Seabed texture variations
-   Partial object visibility
-   Data gaps and acquisition artifacts
-   Objects whose appearance changes dramatically with orientation
-   Natural seabed structures that can resemble man-made objects

Large surveys can therefore produce enormous amounts of imagery
requiring manual interpretation.

### The challenge

The objective is to build an automated system capable of:

1.  Ingesting Side-Scan Sonar imagery and associated metadata.
2.  Preprocessing sonar imagery for AI analysis.
3.  Detecting underwater objects and anomalies.
4.  Classifying detected objects into meaningful categories.
5.  Filtering low-confidence or potentially false detections.
6.  Associating detections with available sonar/GPS metadata.
7.  Presenting detection evidence through a dashboard.
8.  Producing structured reports for further analysis or field
    operations.

------------------------------------------------------------------------

# 🎯 Our Approach

SonarSense-AI uses a **multi-model computer-vision architecture** rather
than attempting to force every underwater object into a single detector.

Different object categories can have radically different visual
signatures in sonar imagery. A pipeline, crab pot, shipwreck, mine-like
contact, and ghost net do not necessarily share the same morphology.

Therefore, the prototype follows a modular approach:

``` text
                    SIDE-SCAN SONAR DATA
                             │
                             ▼
                    IMAGE PREPROCESSING
                             │
                             ▼
                ┌─────────────────────────┐
                │ Specialized AI Models  │
                └─────────────────────────┘
                  │      │      │      │
                  ▼      ▼      ▼      ▼
               Fishing  Pipeline  Mine-like  Other
                 Gear             Contact   Anomalies
                  │      │      │      │
                  └──────┴──────┴──────┘
                             │
                             ▼
                   DETECTION CONSOLIDATION
                             │
                             ▼
                  CONFIDENCE / FILTERING
                             │
                             ▼
                  GEOLOCATION + METADATA
                             │
                             ▼
                   DASHBOARD / REPORT
```

The architecture is intentionally modular so that new object categories
can be added without redesigning the complete system.

------------------------------------------------------------------------

# 🧠 Why Specialized Models?

A major design decision was to avoid treating the problem as a simple
generic object-detection dataset.

A sonar image does not behave like a normal RGB photograph.

For example:

  -----------------------------------------------------------------------
  Object / Anomaly                    Typical Challenge
  ----------------------------------- -----------------------------------
  Crab pot / fishing gear             Small structures, acoustic shadows,
                                      cluttered seabed

  Pipeline / cylindrical structure    Long geometry and variable
                                      orientation

  Mine-like contact                   Appearance depends heavily on sonar
                                      geometry and shadow

  Shipwreck                           Large irregular structure with
                                      strong contextual features

  Ghost net                           Thin, fragmented, low-contrast
                                      structure that can blend into the
                                      seabed
  -----------------------------------------------------------------------

This motivated a **specialized-model strategy**, where each detector can
be trained using data appropriate to the visual characteristics of its
target category.

------------------------------------------------------------------------

# 🏗️ System Architecture

### Frontend

**React + Vite**

Responsible for:

-   Uploading sonar imagery
-   Displaying the analyzed image
-   Rendering detection bounding boxes
-   Showing individual detection crops
-   Displaying confidence and class information
-   Providing a clean operator-facing interface

### Backend

**Python + FastAPI**

Responsible for:

-   Receiving uploaded imagery
-   Running the AI inference pipeline
-   Executing multiple detection models automatically
-   Consolidating predictions
-   Generating annotated output
-   Returning structured detection information

### AI / Computer Vision

-   PyTorch
-   Ultralytics YOLO-based object detection
-   OpenCV
-   Pillow
-   NumPy

### Planned / Extendable Components

-   Sonar/GPS metadata extraction
-   Georeferencing
-   Structured JSON/CSV reports
-   ONNX-based optimized inference
-   Additional segmentation models
-   AUV/ROV integration

------------------------------------------------------------------------

# 🔬 Development Journey

This project was not built from one perfectly prepared dataset.

That would have been suspiciously convenient.

A significant part of the work involved identifying usable sonar
datasets, understanding their annotation formats, adapting incompatible
datasets, testing models, inspecting failures, and determining which
categories were realistically achievable within the available
development time.

The project evolved through several dataset and model experiments.

------------------------------------------------------------------------

## 1. Crab Pot / Fishing Gear Detection 🦀

The crab-pot detector was developed using the **GhostVision-derived
sonar dataset**.

The dataset contained thousands of SSS images with annotations for:

-   `Crab-Pot`
-   `Maybe-Crab-Pot`

### Dataset preparation

The original sonar imagery was not simply thrown into training.

The images were processed using a tiled training strategy:

``` text
Original SSS Image
       │
       ▼
  320 × 320 tiles
       │
       ├── 50% overlap
       ├── Object preservation
       └── More usable training samples
       │
       ▼
 YOLO Training Dataset
```

A 50% overlap was used so that objects close to tile boundaries were
less likely to be lost completely.

### Result

The best recorded run was:

  Metric        Result
  ----------- --------
  Precision      0.571
  Recall         0.428
  mAP@50         0.448
  mAP@50-95      0.150

Although the numerical metrics are not presented as production-grade
performance, qualitative inspection of predictions showed useful
detection behavior for the prototype.

------------------------------------------------------------------------

# 2. Pipeline / Cylindrical Object Detection 🛢️

The project also incorporated the **SubPipe / SubPipeMini Side-Scan
Sonar dataset**.

One of the important discoveries during development was that the dataset
contained actual sonar imagery and matching YOLO annotations rather than
being merely a collection of example images.

The working dataset contained:

``` text
SSS_HF_images/
├── Image/
└── YOLO_Annotation/

SSS_LF_images/
├── Image/
└── YOLO_Annotation/
```

The dataset contained hundreds of sonar images across the high-frequency
and low-frequency collections.

### Why this mattered

Pipeline-like structures are strongly dependent on:

-   Orientation
-   Acoustic shadow
-   Seabed texture
-   Sonar frequency
-   Object-to-sensor geometry

This made the dataset particularly useful for demonstrating that the
system can handle object categories with substantially different visual
morphology.

------------------------------------------------------------------------

# 3. Mine-Like Contact Detection ☢️

The mine-related dataset required particularly careful terminology.

The dataset uses:

-   **MILCO --- Mine-Like Contact**
-   **NOMBO --- Non-Mine-like Bottom Object**

The prototype deliberately preserves this distinction.

> **MILCO does not mean a confirmed mine.**

It represents a sonar contact whose characteristics resemble those of a
mine-like object.

The display labels used by the prototype are:

``` text
mine_like_contact
non_mine_object
```

### Validation results

For the recorded model validation:

  Class                 Precision      Recall      mAP@50   mAP@50-95
  ------------------- ----------- ----------- ----------- -----------
  Mine-like Contact         0.568       0.541       0.564       0.272
  Non-mine Object           0.447       0.292       0.294       0.169
  **Overall**           **0.507**   **0.416**   **0.429**   **0.221**

The results demonstrate that the model can identify useful sonar
contacts, while also highlighting the difficulty of distinguishing
visually similar seabed objects.

This is exactly why the system treats AI detections as
**decision-support evidence rather than unquestionable ground truth**.

------------------------------------------------------------------------

# 4. Shipwreck Detection 🚢

Shipwreck detection was investigated using the **AI4Shipwrecks**
dataset.

This experiment exposed an important issue in sonar computer vision:

### Shortcut learning

Some training configurations caused the model to associate the central
black sonar region with the target instead of learning the actual wreck
morphology.

In other words, the model was learning:

> "This part of the image usually means shipwreck."

instead of:

> "These visual structures represent a shipwreck."

This was identified through visual inspection of predictions and
training behavior.

Rather than presenting an unstable model as a finished component,
shipwreck detection was treated as an area requiring further work.

------------------------------------------------------------------------

# 5. Ghost Net Detection 🕸️

Ghost-net detection presented one of the most difficult dataset
challenges.

Unlike conventional objects such as pipelines or crab pots, ghost nets
are often:

-   Thin
-   Fragmented
-   Low contrast
-   Partially buried
-   Intertwined with other objects
-   Difficult to distinguish from seabed texture

More importantly, **large public real-world annotated SSS ghost-net
datasets are difficult to obtain**.

The project therefore investigated a hybrid strategy.

### Real sonar imagery as morphology references

Real ghost-net sonar examples were collected from publicly available
research and conservation sources.

These examples were used to understand:

-   Net thickness
-   Fragmentation
-   Brightness
-   Acoustic shadow
-   Orientation
-   Scale
-   Partial burial
-   Seabed interaction
-   Continuous vs fragmented appearance

### Synthetic augmentation strategy

Rather than claiming synthetic data to be real observations, the
intended approach is:

``` text
Real Ghost-Net Sonar Examples
              │
              ▼
      Morphology Analysis
              │
              ▼
      Synthetic Variations
              │
       ┌──────┼──────┐
       ▼      ▼      ▼
   Geometry  Noise  Contrast
       │      │      │
       └──────┼──────┘
              ▼
       Training Dataset
```

Real untouched examples can then be retained for validation/testing
where appropriate.

This approach is inspired by research such as **GhostNetZero**, which
investigated AI-based ghost-net detection using sonar-derived imagery
and augmentation techniques.

------------------------------------------------------------------------

# 📊 Current Prototype Models

  ---------------------------------------------------------------------------
  Category          Model Status      Dataset / Source      Notes
  ----------------- ----------------- --------------------- -----------------
  🦀 Crab Pot /     Prototype         GhostVision-derived   Strongest
  Fishing Gear      detector          dataset               qualitative
                                                            prototype

  🛢️ Pipeline /     Prototype         SubPipe / SubPipeMini Real SSS
  Cylinder          detector                                imagery + YOLO
                                                            annotations

  ☢️ Mine-Like      Prototype         MILCO / NOMBO dataset Terminology
  Contact           detector                                preserved
                                                            carefully

  🚢 Shipwreck      Experimental      AI4Shipwrecks         Requires further
                                                            robustness work

  🕸️ Ghost Net      Research /        Real sonar examples + Limited real
                    development       synthetic strategy    annotated data
  ---------------------------------------------------------------------------

The categories are intentionally presented with different maturity
levels instead of pretending every detector has identical validation
quality.

------------------------------------------------------------------------

# 🧪 Sonar-Specific Challenges

Conventional computer vision techniques cannot simply be transferred to
SSS imagery without modification.

### 1. Speckle and acoustic noise

Sonar images contain noise patterns that can obscure object boundaries.

**Approach:**

-   Image normalization
-   Contrast handling
-   Noise-aware preprocessing
-   Data augmentation

------------------------------------------------------------------------

### 2. Acoustic shadows

Objects are often recognized not only from their reflective surface but
also from the shadow they cast.

A model that sees only the bright return may miss important contextual
information.

**Approach:**

Training and evaluation consider object appearance together with
surrounding sonar context and shadow structure.

------------------------------------------------------------------------

### 3. Variable resolution

Different sonar frequencies, acquisition settings, and survey conditions
can change object appearance significantly.

**Approach:**

-   Dataset-specific preprocessing
-   Tiled training where necessary
-   Data augmentation
-   Testing across varied examples

------------------------------------------------------------------------

### 4. Natural seabed false positives

Rocks, ridges, sand ripples, seabed structures, and other natural
formations can resemble artificial objects.

**Approach:**

-   Confidence thresholds
-   Class-specific models
-   Context-aware analysis
-   Future geometry/shadow-based filtering
-   Human review of uncertain detections

------------------------------------------------------------------------

### 5. Limited labeled data

Rare objects such as ghost nets are particularly difficult to collect
and annotate at scale.

**Approach:**

-   Transfer learning
-   Data augmentation
-   Synthetic augmentation where justified
-   Modular model training
-   Reuse of public research datasets

------------------------------------------------------------------------

# 📈 Why We Did Not Claim 90%+ Accuracy

A key principle of the project is:

> **A prototype should not manufacture performance numbers.**

Different datasets produce different metrics, and the current models
were trained using heterogeneous public sonar datasets.

Therefore, the project does **not** claim a universal:

-   90% accuracy
-   90% mAP
-   95% detection rate
-   guaranteed real-time performance

Instead, reported metrics are tied to their corresponding datasets and
validation experiments.

This makes the evaluation more transparent and provides a realistic
foundation for future improvement.

------------------------------------------------------------------------

# 🖥️ Dashboard

The planned operator dashboard uses:

**React + Vite → FastAPI → AI inference pipeline**

The user uploads a sonar image once.

The backend automatically passes the image through the available
specialized detectors.

There is intentionally **no requirement for the operator to manually
select which model should run**.

Conceptually:

``` text
                    Uploaded SSS Image
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
         Crab Pot       Pipeline       Mine-like
          Model           Model          Model
             │              │              │
             └──────────────┼──────────────┘
                            ▼
                    Detection Merger
                            │
                            ▼
                     Annotated Image
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
         Detection Crops         Structured JSON
```

Each detection can contain information such as:

``` json
{
  "model": "crab_pot",
  "class_name": "crab_pot",
  "confidence": 0.82,
  "bbox": [x1, y1, x2, y2]
}
```

The final system is intended to support additional fields such as
geolocation, object dimensions, sonar metadata, and report identifiers.

------------------------------------------------------------------------

# 🗺️ Geolocation & Reporting

The proposed system is designed to connect AI detections with available
sonar metadata.

Where suitable metadata is available, a detection can be associated
with:

-   Sonar position
-   GPS coordinates
-   Ping information
-   Survey location
-   Object dimensions
-   Detection confidence
-   Object/anomaly category

The resulting information can be exported as structured data such as:

-   JSON
-   CSV

This turns an AI prediction into something operationally useful.

Instead of:

> "There is something suspicious somewhere in this giant sonar image."

the intended output becomes closer to:

> "A mine-like sonar contact was detected at this survey position with
> this confidence and this image evidence."

------------------------------------------------------------------------

# 🔧 Technology Stack

  Layer                     Technology
  ------------------------- ---------------------------------------
  Frontend                  React + Vite
  Backend                   Python + FastAPI
  Deep Learning             PyTorch
  Object Detection          Ultralytics YOLO
  Image Processing          OpenCV
  Image Handling            Pillow
  Numerical Processing      NumPy
  Deployment Optimization   ONNX Runtime (planned/extendable)
  Data                      Side-Scan Sonar imagery + annotations
  Reporting                 JSON / CSV
  Version Control           Git + GitHub

------------------------------------------------------------------------

# 📚 Research & Datasets

The project builds on publicly available research, datasets, and
technical documentation.

### Key references

-   **Ultralytics YOLO Documentation**\
    https://docs.ultralytics.com/

-   **Ronneberger et al. --- U-Net: Convolutional Networks for
    Biomedical Image Segmentation**\
    MICCAI, 2015\
    https://arxiv.org/abs/1505.04597

-   **NOAA Ocean Exploration --- Side-Scan Sonar**\
    https://oceanexplorer.noaa.gov/technology/sonar-side-scan/

-   **GhostNetZero --- AI for Detecting Marine Ghost Nets**\
    Microsoft Research\
    https://www.microsoft.com/en-us/research/publication/ghostnetzero-ai-for-detecting-marine-ghost-nets/

-   **SubPipe Dataset**\
    https://zenodo.org/records/12666132

-   **SubPipe GitHub Repository**\
    https://github.com/remaro-network/SubPipe-dataset

-   **AI4Shipwrecks**\
    https://umfieldrobotics.github.io/ai4shipwrecks/

Datasets remain subject to their respective licenses and attribution
requirements.

------------------------------------------------------------------------

# 🧩 Engineering Decisions

## Why YOLO-based detection?

YOLO-based detectors provide a practical balance between:

-   Detection speed
-   Model size
-   Training accessibility
-   Hardware requirements
-   Bounding-box output
-   Deployment flexibility

The architecture also makes it straightforward to create multiple
specialized detectors.

------------------------------------------------------------------------

## Why multiple models instead of one giant model?

Because sonar objects are not visually homogeneous.

A model optimized for small fishing gear does not necessarily need to be
the same model optimized for large shipwreck structures.

A modular system also allows:

-   Independent retraining
-   Easier dataset expansion
-   Category-specific optimization
-   Easier debugging
-   Independent model replacement

------------------------------------------------------------------------

## Why FastAPI?

FastAPI provides a lightweight Python backend that integrates naturally
with the project's AI stack.

This allows the same environment to handle:

``` text
HTTP Request
    ↓
Image Upload
    ↓
Preprocessing
    ↓
Model Inference
    ↓
Prediction Consolidation
    ↓
JSON Response
```

while keeping the frontend independent from the ML implementation.

------------------------------------------------------------------------

# 🛠️ Major Challenges & How We Addressed Them

  -----------------------------------------------------------------------
  Challenge               Problem                 Approach
  ----------------------- ----------------------- -----------------------
  Dataset fragmentation   Useful data was spread  Investigated and
                          across multiple         adapted multiple public
                          projects                datasets

  Different annotation    Datasets were not       Converted/organized
  formats                 immediately compatible  annotations into a
                                                  common training
                                                  workflow

  Small sonar objects     Objects could disappear Used tiled training for
                          during resizing         suitable datasets

  Sonar noise             Speckle and seabed      Preprocessing +
                          texture interfere with  augmentation
                          detection               

  Limited ghost-net data  Very few real annotated Real examples +
                          examples                morphology-guided
                                                  synthetic strategy

  Class ambiguity         Natural objects         Confidence filtering +
                          resemble man-made       specialized models
                          objects                 

  Shortcut learning       Shipwreck experiment    Visual inspection
                          learned image artifacts exposed the failure and
                                                  the experiment was not
                                                  treated as
                                                  production-ready

  Limited GPU resources   Training large models   Lightweight YOLO-based
                          is expensive            models and
                                                  dataset-specific
                                                  training

  Heterogeneous datasets  Different sonar systems Category-specific
                          produce different       experimentation
                          appearances             

  Unrealistic performance Metrics varied          Reported actual
  claims                  significantly by        validation results
                          dataset                 instead of one generic
                                                  accuracy number
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 🚀 Future Development

The current prototype provides a foundation rather than claiming to be a
finished marine survey system.

Future work includes:

### Better sonar preprocessing

-   Speckle reduction
-   Adaptive contrast enhancement
-   Shadow-aware preprocessing
-   Automatic sonar artifact correction

### Improved detection

-   Larger and more diverse datasets
-   Better hard-negative mining
-   Cross-sonar-domain validation
-   Segmentation for thin structures such as ghost nets
-   Object geometry estimation

### Better false-positive filtering

Combine:

``` text
AI Confidence
      +
Object Geometry
      +
Acoustic Shadow
      +
Seabed Context
      +
Metadata
      ↓
Improved Anomaly Verification
```

### Geospatial integration

-   GPS/INS metadata
-   Survey-track visualization
-   GIS-compatible exports
-   Detection maps
-   Spatial clustering of anomalies

### Edge deployment

Models can potentially be exported and optimized using:

-   ONNX
-   ONNX Runtime
-   TensorRT
-   Quantization

for resource-constrained field hardware.

### AUV / ROV integration

The longer-term architecture can support:

``` text
AUV / ROV
   │
   ▼
Side-Scan Sonar
   │
   ▼
Onboard / Edge AI
   │
   ▼
Detected Anomalies
   │
   ▼
Surface Station / Dashboard
```

------------------------------------------------------------------------

# 🌊 Expected Impact

SonarSense-AI is intended to support:

### Environmental monitoring

-   Marine debris identification
-   Ghost-gear detection
-   Seabed monitoring
-   Habitat protection

### Maritime operations

-   Identification of submerged hazards
-   Infrastructure awareness
-   Survey prioritization
-   Faster sonar review

### Research

-   Automated sonar screening
-   Large-scale dataset analysis
-   Detection model development
-   Marine robotics research

### Operational efficiency

The system is intended to reduce the amount of sonar imagery requiring
manual first-pass inspection by automatically prioritizing potentially
relevant areas.

It does **not** replace expert sonar interpretation.

Instead, it aims to make expert interpretation more efficient by
directing attention toward candidate detections.

------------------------------------------------------------------------

# ⚠️ Current Limitations

This is a research prototype.

The following limitations should be considered:

-   Model performance depends strongly on training data.
-   Different sonar systems can produce substantially different imagery.
-   Some classes have significantly less labeled data than others.
-   Ghost-net detection requires additional real annotated data.
-   Shipwreck detection requires further robustness work.
-   Mine-like contacts must not be interpreted as confirmed mines.
-   Geolocation quality depends on available sonar/GPS metadata.
-   Current validation results should not be interpreted as universal
    real-world accuracy.
-   Field deployment would require extensive testing on unseen sonar
    systems and geographic regions.

------------------------------------------------------------------------

# 🔐 Responsible Use

SonarSense-AI is intended as a **decision-support and screening
system**.

AI predictions should be reviewed by qualified operators before being
used for:

-   Navigation decisions
-   Marine cleanup operations
-   Infrastructure intervention
-   Mine/hazard assessment
-   Regulatory decisions
-   Safety-critical operations

In particular, a **mine-like contact is not equivalent to a confirmed
mine**.

The system should therefore surface evidence and uncertainty rather than
presenting predictions as absolute truth.

------------------------------------------------------------------------

# 📁 Suggested Repository Structure

``` text
SonarSense-AI/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── main.py
│   ├── models/
│   ├── inference/
│   └── requirements.txt
│
├── datasets/
│   └── README.md
│
├── training/
│   ├── configs/
│   ├── scripts/
│   └── experiments/
│
├── results/
│   ├── predictions/
│   └── evaluation/
│
├── docs/
│   ├── architecture/
│   └── research/
│
├── README.md
└── LICENSE
```

> The exact repository structure may differ depending on the final
> implementation.

------------------------------------------------------------------------

# ⚙️ Installation

## Backend

Create a Python virtual environment:

``` bash
python -m venv .venv
```

Activate it on Windows:

``` bash
.venv\Scripts\activate
```

Install dependencies:

``` bash
pip install -r requirements.txt
```

Start the FastAPI server:

``` bash
uvicorn main:app --reload
```

------------------------------------------------------------------------

## Frontend

Install dependencies:

``` bash
npm install
```

Start the development server:

``` bash
npm run dev
```

The frontend communicates with the FastAPI backend through HTTP
requests.

------------------------------------------------------------------------

# 🧪 Model Training

The general training workflow is:

``` text
Dataset Collection
       ↓
Annotation Inspection
       ↓
Dataset Conversion
       ↓
Train / Validation Split
       ↓
Preprocessing / Tiling
       ↓
YOLO Training
       ↓
Validation
       ↓
Visual Inspection
       ↓
Error Analysis
       ↓
Model Selection
```

Visual inspection is an important part of the workflow.

A model with an attractive numerical metric can still fail badly when
shown sonar imagery that differs from the training distribution.

------------------------------------------------------------------------

# 📊 Evaluation Philosophy

Model evaluation uses standard object-detection metrics where
appropriate:

### Precision

Measures how many predicted detections are correct.

### Recall

Measures how many relevant objects were successfully detected.

### mAP@50

Mean Average Precision at an IoU threshold of 0.50.

### mAP@50-95

A stricter metric averaged across multiple IoU thresholds.

However, these numbers are interpreted alongside:

-   Visual prediction quality
-   False positives
-   Missed detections
-   Dataset size
-   Class imbalance
-   Domain differences
-   Unseen sonar conditions

For sonar imagery, numerical metrics alone are not sufficient.

------------------------------------------------------------------------

# 🏁 Project Status

**Current status: Prototype / Research Demonstration**

### Completed / Demonstrated

-   [x] Side-scan sonar problem analysis
-   [x] Public sonar dataset investigation
-   [x] Multiple object-category datasets
-   [x] Dataset preprocessing and annotation handling
-   [x] YOLO-based model training
-   [x] Crab-pot / fishing-gear detector
-   [x] Pipeline detector
-   [x] Mine-like contact detector
-   [x] Shipwreck experimentation
-   [x] Ghost-net research and synthetic-data strategy
-   [x] Multi-model inference architecture
-   [x] React/Vite dashboard architecture
-   [x] FastAPI backend architecture
-   [x] Detection visualization
-   [x] Research and feasibility analysis

### Future / Extendable

-   [ ] More real ghost-net annotations
-   [ ] Robust shipwreck detector
-   [ ] Advanced sonar-aware filtering
-   [ ] Full sonar metadata parsing
-   [ ] Automated georeferencing
-   [ ] GIS-based survey maps
-   [ ] ONNX/TensorRT optimization
-   [ ] AUV/ROV live integration
-   [ ] Large-scale cross-region validation

------------------------------------------------------------------------

# 👥 Team

**Team:** The Eclipse\
**Event:** Smart India Hackathon 2026\
**Problem Statement:** SIH26057\
**Domain:** Marine Technology / Artificial Intelligence / Computer
Vision

------------------------------------------------------------------------

# 📜 Disclaimer

This project is a **research and hackathon prototype**.

The reported model performance was obtained on specific datasets and
validation splits and should not be interpreted as guaranteed field
performance.

Real-world deployment would require extensive testing across different:

-   Sonar manufacturers
-   Frequencies
-   Survey depths
-   Seabed types
-   Geographic regions
-   Environmental conditions
-   Acquisition configurations

The system is designed to assist human operators, not replace expert
judgment.

------------------------------------------------------------------------

# 🌐 Vision

The long-term goal of SonarSense-AI is to turn Side-Scan Sonar from a
large collection of difficult-to-interpret acoustic imagery into a more
searchable, structured, and actionable source of marine intelligence.

``` text
             RAW SONAR
                 │
                 ▼
          AI-ASSISTED ANALYSIS
                 │
        ┌────────┼────────┐
        ▼        ▼        ▼
      OBJECT   ANOMALY   LOCATION
     DETECTION  REVIEW   CONTEXT
        │        │        │
        └────────┼────────┘
                 ▼
          STRUCTURED DATA
                 │
                 ▼
        HUMAN DECISION SUPPORT
                 │
                 ▼
       CLEANER & SAFER OCEANS 🌊
```

**SonarSense-AI --- Making underwater sonar data easier to understand,
investigate, and act upon.**

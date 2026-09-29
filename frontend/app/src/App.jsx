import { useState } from "react";
import axios from "axios";
import "./App.css";


const MODEL_INFO = {

  crab_pot: {
    name: "Crab Pot",
    icon: "🦀",
    color: "#ffd429",
    description: "Fishing gear & marine debris",
  },

  pipeline: {
    name: "Pipeline",
    icon: "▮▮",
    color: "#00d9ff",
    description: "Underwater pipeline",
  },

  mines: {
    name: "Mine Detection",
    icon: "☢",
    color: "#ff4747",
    description: "Mine-like & non-mine contacts",
  },

};


function App() {

  const [files, setFiles] = useState([]);

  const [results, setResults] = useState([]);

  const [selectedImage, setSelectedImage] = useState(0);

  const [selectedDetection, setSelectedDetection] =
    useState(null);

  const [confidence, setConfidence] =
    useState(0.30);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  // ------------------------------------------------
  // FILE SELECTION
  // ------------------------------------------------

  const handleFiles = (event) => {

    const selected = Array.from(
      event.target.files || []
    );

    if (!selected.length) {
      return;
    }

    setFiles(selected);

    setResults([]);

    setSelectedImage(0);

    setSelectedDetection(null);

    setError("");
  };


  // ------------------------------------------------
  // RUN ANALYSIS
  // ------------------------------------------------

  const runAnalysis = async () => {

    if (!files.length) {

      setError(
        "Please select at least one image."
      );

      return;
    }

    setLoading(true);

    setError("");

    setResults([]);

    setSelectedImage(0);

    setSelectedDetection(null);


    try {

      const formData = new FormData();

      files.forEach((file) => {

        formData.append(
          "files",
          file
        );

      });


      formData.append(
        "confidence",
        confidence
      );


      const response = await axios.post(

        "http://127.0.0.1:8000/api/detect",

        formData,

        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }

      );


      setResults(
        response.data.results || []
      );


    } catch (err) {

      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Analysis failed. Check that the backend is running."
      );

    } finally {

      setLoading(false);

    }

  };


  // ------------------------------------------------
  // CURRENT RESULT
  // ------------------------------------------------

  const currentResult =
    results[selectedImage] || null;


  // ------------------------------------------------
  // SELECT DETECTION
  // ------------------------------------------------

  const selectDetection = (detection) => {

    setSelectedDetection(
      detection
    );

  };


  // ------------------------------------------------
  // DOWNLOAD JSON
  // ------------------------------------------------

  const downloadJSON = () => {

    if (!results.length) {
      return;
    }


    const cleanResults =
      results.map((result) => ({

        ...result,

        detections:
          result.detections.map(
            (detection) => {

              const {
                crop,
                ...rest
              } = detection;

              return rest;

            }
          ),

      }));


    const blob = new Blob(

      [
        JSON.stringify(
          {
            total_images:
              results.length,

            results:
              cleanResults,
          },

          null,

          2
        ),
      ],

      {
        type: "application/json",
      }

    );


    const url =
      URL.createObjectURL(blob);


    const link =
      document.createElement("a");


    link.href = url;

    link.download =
      "sonarai_report.json";


    link.click();

    URL.revokeObjectURL(url);

  };


  // ------------------------------------------------
  // DOWNLOAD CSV
  // ------------------------------------------------

  const downloadCSV = () => {

    if (!results.length) {
      return;
    }


    const rows = [

      [
        "Image",
        "ID",
        "Model",
        "Class",
        "Confidence",
        "X1",
        "Y1",
        "X2",
        "Y2",
        "Width",
        "Height",
      ],

    ];


    results.forEach((result) => {

      result.detections.forEach(
        (detection) => {

          rows.push([

            result.filename,

            detection.id,

            detection.model_display,

            detection.class_name,

            detection.confidence.toFixed(4),

            detection.bbox.x1,

            detection.bbox.y1,

            detection.bbox.x2,

            detection.bbox.y2,

            detection.width,

            detection.height,

          ]);

        }
      );

    });


    const csv =
      rows
        .map(
          (row) =>
            row
              .map(
                (value) =>
                  `"${String(value).replace(
                    /"/g,
                    '""'
                  )}"`
              )
              .join(",")
        )
        .join("\n");


    const blob =
      new Blob(
        [csv],
        {
          type: "text/csv",
        }
      );


    const url =
      URL.createObjectURL(blob);


    const link =
      document.createElement("a");


    link.href = url;

    link.download =
      "sonarai_report.csv";


    link.click();

    URL.revokeObjectURL(url);

  };


  // ------------------------------------------------
  // TOTAL DETECTIONS
  // ------------------------------------------------

  const totalDetections =
    results.reduce(
      (total, result) =>
        total +
        (result.total_detections || 0),
      0
    );


  return (

    <div className="app">


      {/* ==========================================
          HEADER
      ========================================== */}

      <header className="header">

        <div>

          <div className="brand">
            SONARSENSE-<span>AI</span>
          </div>

          <div className="subtitle">
            AUTOMATED UNDERWATER ANOMALY DETECTION
          </div>

        </div>


        <div className="system-status">

          <span className="status-dot" />

          SYSTEM ONLINE

        </div>

      </header>



      {/* ==========================================
          MAIN GRID
      ========================================== */}

      <main className="dashboard">


        {/* ========================================
            LEFT PANEL
        ======================================== */}

        <aside className="left-panel">


          <section className="panel">

            <div className="panel-title">
              DETECTION MODELS
            </div>


            {Object.entries(
              MODEL_INFO
            ).map(
              ([key, model]) => (

                <div
                  className="model-card"
                  key={key}
                >

                  <div
                    className="model-icon"
                    style={{
                      color:
                        model.color,
                    }}
                  >
                    {model.icon}
                  </div>


                  <div className="model-info">

                    <strong>
                      {model.name}
                    </strong>

                    <span>
                      {model.description}
                    </span>

                  </div>


                  <div className="model-online">
                    ●
                  </div>

                </div>

              )
            )}

          </section>



          {/* CONFIDENCE */}

          <section className="panel">

            <div className="panel-title">
              CONFIDENCE THRESHOLD
            </div>


            <div className="confidence-value">

              {confidence.toFixed(2)}

            </div>


            <input

              type="range"

              min="0.10"

              max="0.90"

              step="0.05"

              value={confidence}

              onChange={(e) =>
                setConfidence(
                  Number(e.target.value)
                )
              }

            />

          </section>



          {/* UPLOAD */}

          <section className="panel">

            <label
              className="upload-button"
            >

              📁

              <span>
                SELECT SONAR IMAGES
              </span>

              <input

                type="file"

                accept="image/*"

                multiple

                onChange={
                  handleFiles
                }

                hidden

              />

            </label>


            {files.length > 0 && (

              <div className="file-count">

                {files.length} image
                {files.length !== 1
                  ? "s"
                  : ""} selected

              </div>

            )}


            <button

              className="analyze-button"

              onClick={runAnalysis}

              disabled={
                loading ||
                files.length === 0
              }

            >

              {loading
                ? "ANALYZING..."
                : "RUN ANALYSIS"}

            </button>

          </section>



          {/* FILE LIST */}

          {files.length > 0 && (

            <section className="panel">

              <div className="panel-title">
                INPUT QUEUE
              </div>


              <div className="file-list">

                {files.map(
                  (file, index) => (

                    <div

                      key={
                        `${file.name}-${index}`
                      }

                      className={
                        `file-item ${
                          selectedImage ===
                          index
                            ? "active"
                            : ""
                        }`
                      }

                      onClick={() =>
                        setSelectedImage(
                          index
                        )
                      }

                    >

                      <span>
                        {index + 1}
                      </span>

                      <div>

                        <strong>
                          {file.name}
                        </strong>

                        <small>
                          {(
                            file.size /
                            1024 /
                            1024
                          ).toFixed(2)}
                          {" MB"}
                        </small>

                      </div>

                    </div>

                  )
                )}

              </div>

            </section>

          )}

        </aside>



        {/* ========================================
            CENTER PANEL
        ======================================== */}

        <section className="center-panel">


          {/* IMAGE TABS */}

          {results.length > 0 && (

            <div className="image-tabs">

              {results.map(
                (result, index) => (

                  <button

                    key={index}

                    className={
                      selectedImage ===
                      index
                        ? "image-tab active"
                        : "image-tab"
                    }

                    onClick={() => {

                      setSelectedImage(
                        index
                      );

                      setSelectedDetection(
                        null
                      );

                    }}

                  >

                    <span>
                      {index + 1}
                    </span>

                    {result.filename}

                    <b>
                      {
                        result.total_detections
                      }
                    </b>

                  </button>

                )
              )}

            </div>

          )}



          {/* SONAR VIEWER */}

          <section className="panel sonar-panel">


            <div className="panel-title">

              SONAR IMAGERY

              {currentResult && (

                <span className="image-name">
                  {currentResult.filename}
                </span>

              )}

            </div>


            <div className="sonar-viewer">

              {currentResult ? (

                <img

                  src={
                    `data:image/jpeg;base64,${currentResult.annotated_image}`
                  }

                  alt="Annotated sonar"

                />

              ) : (

                <div className="empty-viewer">

                  <div>
                    ◉
                  </div>

                  <span>
                    Upload sonar imagery
                    to begin analysis
                  </span>

                </div>

              )}

            </div>


            {/* LEGEND */}

            <div className="legend">

              {Object.entries(
                MODEL_INFO
              ).map(
                ([key, model]) => (

                  <div
                    key={key}
                    className="legend-item"
                  >

                    <span
                      className="legend-dot"
                      style={{
                        background:
                          model.color,
                      }}
                    />

                    {model.name}

                  </div>

                )
              )}

            </div>

          </section>



          {/* SELECTED OBJECT */}

          {selectedDetection && (

            <section className="panel object-details">

              <div className="panel-title">
                SELECTED OBJECT
              </div>


              <div className="object-content">


                <div className="crop-container">

                  <img

                    src={
                      `data:image/jpeg;base64,${selectedDetection.crop}`
                    }

                    alt="Detected object"

                  />

                </div>


                <div className="object-info">

                  <h2>
                    {selectedDetection.class_name}
                  </h2>


                  <div className="object-model">

                    {selectedDetection.model_display}

                  </div>


                  <div className="object-stats">


                    <div>

                      <span>
                        CONFIDENCE
                      </span>

                      <strong>
                        {(
                          selectedDetection.confidence *
                          100
                        ).toFixed(1)}
                        %
                      </strong>

                    </div>


                    <div>

                      <span>
                        BOUNDING BOX
                      </span>

                      <strong>

                        {selectedDetection.width}
                        ×
                        {selectedDetection.height}
                        px

                      </strong>

                    </div>


                    <div>

                      <span>
                        POSITION
                      </span>

                      <strong>

                        {selectedDetection.bbox.x1}
                        ,
                        {selectedDetection.bbox.y1}

                      </strong>

                    </div>


                  </div>

                </div>

              </div>

            </section>

          )}

        </section>



        {/* ========================================
            RIGHT PANEL
        ======================================== */}

        <aside className="right-panel">


          <section className="panel detection-panel">


            <div className="panel-title">

              DETECTIONS

              {currentResult && (

                <span>
                  {currentResult.total_detections}
                </span>

              )}

            </div>


            <div className="detection-list">


              {currentResult &&
              currentResult.detections.length >
                0 ? (

                currentResult.detections.map(
                  (detection) => {

                    const model =
                      MODEL_INFO[
                        detection.model
                      ];


                    return (

                      <button

                        key={
                          detection.id
                        }

                        className={
                          `detection-card ${
                            selectedDetection?.id ===
                            detection.id
                              ? "selected"
                              : ""
                          }`
                        }

                        onClick={() =>
                          selectDetection(
                            detection
                          )
                        }

                      >

                        <div
                          className="detection-color"
                          style={{
                            background:
                              model?.color,
                          }}
                        />


                        <div className="detection-main">

                          <strong>
                            {detection.class_name}
                          </strong>

                          <span>
                            {detection.model_display}
                          </span>

                        </div>


                        <div className="detection-confidence">

                          {(
                            detection.confidence *
                            100
                          ).toFixed(0)}
                          %

                        </div>

                      </button>

                    );

                  }

                )

              ) : (

                <div className="no-detections">

                  {currentResult
                    ? "No objects detected"
                    : "No analysis yet"}

                </div>

              )}

            </div>

          </section>



          {/* SUMMARY */}

          <section className="panel summary-panel">

            <div className="panel-title">
              SUMMARY
            </div>


            <div className="summary-total">

              <strong>
                {currentResult
                  ? currentResult.total_detections
                  : 0}
              </strong>

              <span>
                OBJECTS DETECTED
              </span>

            </div>


            {currentResult && (

              <div className="summary-list">

                {Object.entries(
                  currentResult.summary
                ).map(
                  ([name, count]) => (

                    <div
                      key={name}
                      className="summary-row"
                    >

                      <span>
                        {name}
                      </span>

                      <strong>
                        {count}
                      </strong>

                    </div>

                  )
                )}

              </div>

            )}

          </section>



          {/* REPORT */}

          {results.length > 0 && (

            <section className="panel report-panel">

              <div className="panel-title">
                REPORT
              </div>


              <div className="report-stats">

                <div>

                  <strong>
                    {results.length}
                  </strong>

                  <span>
                    IMAGES
                  </span>

                </div>


                <div>

                  <strong>
                    {totalDetections}
                  </strong>

                  <span>
                    DETECTIONS
                  </span>

                </div>

              </div>


              <div className="report-buttons">

                <button
                  onClick={
                    downloadJSON
                  }
                >
                  JSON
                </button>


                <button
                  onClick={
                    downloadCSV
                  }
                >
                  CSV
                </button>

              </div>

            </section>

          )}

        </aside>

      </main>



      {/* ERROR */}

      {error && (

        <div className="error-toast">

          ⚠️ {error}

        </div>

      )}



      <footer>

        SONARSENSE-AI • MULTI-MODEL
        UNDERWATER ANALYSIS SYSTEM

      </footer>

    </div>

  );
}


export default App;
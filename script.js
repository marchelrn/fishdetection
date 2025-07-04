// Optimized script for faster camera and object detection

// Global variables
let isDetecting = false;
let detectionInterval = null;
const DETECTION_DELAY = 2000; // 2 seconds between detections

const ROBOFLOW_CONFIG = {
  API_KEY: "UL8nLpCiEBGbxYqRq0nY", // Updated to the working API key
  PROJECT: "dataset-6nff1",
  VERSION: 4,
  CONFIDENCE: 40, // Increased confidence threshold
  OVERLAP: 30,
};

// Debug configuration
console.log("🔧 Using API Config:", {
  project: ROBOFLOW_CONFIG.PROJECT,
  version: ROBOFLOW_CONFIG.VERSION,
  confidence: ROBOFLOW_CONFIG.CONFIDENCE,
});

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", function () {
  console.log("Script.js loaded");
  setupImageUpload();
});

// Start object detection (called from index.html)
window.startObjectDetection = function () {
  const video = document.getElementById("camera");
  const canvas = document.getElementById("overlayCanvas");

  if (!video || !canvas) {
    console.error("Video or canvas element not found");
    return;
  }

  console.log("🎯 Starting object detection...");
  console.log("📹 Video ready state:", video.readyState);
  console.log(
    "📐 Video dimensions:",
    video.videoWidth + "x" + video.videoHeight
  );

  // Clear any existing interval
  if (detectionInterval) {
    clearInterval(detectionInterval);
  }

  // Ensure canvas is properly sized
  setupCanvasOverlay();

  // Start detection loop
  detectionInterval = setInterval(() => {
    if (video.readyState >= 2 && video.videoWidth > 0 && !isDetecting) {
      detectObjects();
    }
  }, DETECTION_DELAY);

  console.log("✅ Object detection started");
};

// Setup canvas overlay properly
function setupCanvasOverlay() {
  const video = document.getElementById("camera");
  const canvas = document.getElementById("overlayCanvas");

  if (video && canvas && video.videoWidth > 0) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Position canvas exactly over video
    const videoRect = video.getBoundingClientRect();
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";

    console.log("🎨 Canvas setup:", canvas.width + "x" + canvas.height);
  }
}

// Main detection function
async function detectObjects() {
  if (isDetecting) {
    console.log("⏳ Detection already in progress, skipping...");
    return;
  }

  const video = document.getElementById("camera");
  const canvas = document.getElementById("overlayCanvas");

  if (!video || !canvas || video.videoWidth === 0) {
    console.log("📹 Video not ready for detection");
    return;
  }

  isDetecting = true;
  console.log("🔍 Starting detection frame capture...");

  try {
    // Update canvas size if needed
    if (
      canvas.width !== video.videoWidth ||
      canvas.height !== video.videoHeight
    ) {
      setupCanvasOverlay();
    }

    // Capture frame
    const frameCanvas = document.createElement("canvas");
    frameCanvas.width = video.videoWidth;
    frameCanvas.height = video.videoHeight;
    const frameCtx = frameCanvas.getContext("2d");
    frameCtx.drawImage(video, 0, 0);

    console.log("📸 Frame captured, sending to API...");

    // Convert to blob and send to API
    frameCanvas.toBlob(
      async (blob) => {
        try {
          console.log("📤 Sending blob to Roboflow API...");
          const predictions = await sendToRoboflow(blob);
          console.log("📥 Received predictions:", predictions.length);
          drawPredictions(predictions);
        } catch (error) {
          console.error("🚨 Detection error:", error);
        } finally {
          isDetecting = false;
        }
      },
      "image/jpeg",
      0.8 // Higher quality for better detection
    );
  } catch (error) {
    console.error("🚨 Frame capture error:", error);
    isDetecting = false;
  }
}

// Send image to Roboflow API with improved error handling
async function sendToRoboflow(imageBlob) {
  const formData = new FormData();
  formData.append("file", imageBlob, "frame.jpg");

  const url = `https://detect.roboflow.com/${ROBOFLOW_CONFIG.PROJECT}/${ROBOFLOW_CONFIG.VERSION}?api_key=${ROBOFLOW_CONFIG.API_KEY}&confidence=${ROBOFLOW_CONFIG.CONFIDENCE}&overlap=${ROBOFLOW_CONFIG.OVERLAP}&format=json`;

  console.log("🌐 API URL:", url.replace(ROBOFLOW_CONFIG.API_KEY, "***"));

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    console.log("📡 Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("🚨 API Error Response:", errorText);
      throw new Error(
        `HTTP ${response.status}: ${response.statusText} - ${errorText}`
      );
    }

    const result = await response.json();
    console.log("✅ API Success:", result);

    return result.predictions || [];
  } catch (error) {
    console.error("🚨 Fetch error:", error);
    throw error;
  }
}

// Draw predictions on canvas with improved visibility
function drawPredictions(predictions) {
  const canvas = document.getElementById("overlayCanvas");
  if (!canvas) {
    console.error("Canvas not found for drawing");
    return;
  }

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!predictions || predictions.length === 0) {
    console.log("📊 No predictions to draw");
    return;
  }

  console.log(`🎨 Drawing ${predictions.length} predictions`);

  // Set drawing style with better visibility
  ctx.strokeStyle = "#00ff00";
  ctx.lineWidth = 4;
  ctx.font = "bold 18px Arial";
  ctx.fillStyle = "#00ff00";
  ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
  ctx.shadowBlur = 3;

  predictions.forEach((prediction, index) => {
    console.log(`🔹 Drawing prediction ${index + 1}:`, prediction);

    const { x, y, width, height, class: className, confidence } = prediction;

    // Calculate box coordinates (Roboflow uses center coordinates)
    const boxX = x - width / 2;
    const boxY = y - height / 2;

    // Draw bounding box
    ctx.strokeRect(boxX, boxY, width, height);

    // Draw label with background
    const label = `${className} ${Math.round(confidence * 100)}%`;
    const textMetrics = ctx.measureText(label);
    const textWidth = textMetrics.width;
    const labelY = boxY > 25 ? boxY - 10 : boxY + height + 25;

    // Draw label background
    ctx.fillStyle = "rgba(0, 255, 0, 0.9)";
    ctx.shadowBlur = 0;
    ctx.fillRect(boxX - 2, labelY - 20, textWidth + 12, 24);

    // Draw label text
    ctx.fillStyle = "black";
    ctx.fillText(label, boxX + 4, labelY - 2);

    // Reset for next prediction
    ctx.fillStyle = "#00ff00";
    ctx.shadowBlur = 3;
  });

  console.log(`✅ Successfully drew ${predictions.length} predictions`);
}

// Setup image upload functionality
function setupImageUpload() {
  const fileInput = document.getElementById("imageUpload");
  if (!fileInput) {
    console.warn("Image upload input not found");
    return;
  }

  fileInput.addEventListener("change", async function (event) {
    const file = event.target.files[0];
    if (!file) return;

    console.log("📤 Uploading image for analysis...");

    try {
      // Show preview immediately
      const imageUrl = URL.createObjectURL(file);
      const uploadedImage = document.getElementById("uploadedImage");
      if (uploadedImage) {
        uploadedImage.src = imageUrl;
        uploadedImage.style.display = "block";
      }

      // Send to Roboflow
      console.log("📤 Sending uploaded image to API...");
      const predictions = await sendToRoboflow(file);

      if (predictions.length > 0) {
        console.log(`✅ Found ${predictions.length} objects in uploaded image`);

        // Draw predictions on uploaded image
        const imgWithDetections = await drawPredictionsOnImage(
          imageUrl,
          predictions
        );
        if (uploadedImage) {
          uploadedImage.src = imgWithDetections;
        }
      } else {
        console.log("ℹ️ No objects detected in uploaded image");
      }
    } catch (error) {
      console.error("🚨 Upload analysis error:", error);
      alert(
        "Failed to analyze image. Please try again.\n\nError: " + error.message
      );
    }
  });
}

// Draw predictions on uploaded image
async function drawPredictionsOnImage(imageUrl, predictions) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Draw predictions with scaled styling
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = Math.max(3, img.width / 200);
      ctx.font = `bold ${Math.max(18, img.width / 40)}px Arial`;
      ctx.fillStyle = "#00ff00";

      predictions.forEach((prediction) => {
        const {
          x,
          y,
          width,
          height,
          class: className,
          confidence,
        } = prediction;

        const boxX = x - width / 2;
        const boxY = y - height / 2;

        // Draw box
        ctx.strokeRect(boxX, boxY, width, height);

        // Draw label
        const label = `${className} ${Math.round(confidence * 100)}%`;
        const labelY = boxY > 30 ? boxY - 15 : boxY + height + 35;

        ctx.fillStyle = "rgba(0, 255, 0, 0.9)";
        const textWidth = ctx.measureText(label).width;
        ctx.fillRect(boxX - 5, labelY - 25, textWidth + 15, 30);

        ctx.fillStyle = "black";
        ctx.fillText(label, boxX, labelY - 5);
        ctx.fillStyle = "#00ff00";
      });

      resolve(canvas.toDataURL());
    };

    img.onerror = function () {
      console.error("Failed to load image for annotation");
      resolve(imageUrl); // Return original if annotation fails
    };

    img.src = imageUrl;
  });
}

// Make setupCanvasOverlay available globally for use in index.html
window.setupCanvas = setupCanvasOverlay;
window.setupCanvasOverlay = setupCanvasOverlay;

// Add window resize handler
window.addEventListener("resize", () => {
  setTimeout(setupCanvasOverlay, 100);
});

console.log(
  "✅ Enhanced script.js loaded successfully with API key:",
  ROBOFLOW_CONFIG.API_KEY.substring(0, 8) + "..."
);

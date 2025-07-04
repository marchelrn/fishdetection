// Enhanced script.js for Vercel deployment
// Optimized for faster camera and object detection in production

console.log("🚀 Script.js loaded - Enhanced for Vercel deployment");

// Global variables
let isDetecting = false;
let detectionInterval = null;
const DETECTION_DELAY = 3000; // 3 seconds between detections for better performance

// Production-ready configuration
const ROBOFLOW_CONFIG = {
  API_KEY: "UL8nLpCiEBGbxYqRq0nY",
  PROJECT: "dataset-6nff1",
  VERSION: 4,
  CONFIDENCE: 40,
  OVERLAP: 30,
};

// Environment detection
const isProduction =
  window.location.hostname.includes("vercel.app") ||
  window.location.protocol === "https:";
const isDevelopment =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

// Debug configuration
console.log("🔧 Enhanced API Config:", {
  project: ROBOFLOW_CONFIG.PROJECT,
  version: ROBOFLOW_CONFIG.VERSION,
  confidence: ROBOFLOW_CONFIG.CONFIDENCE,
  environment: isProduction ? "Production (Vercel)" : "Development",
  protocol: window.location.protocol,
  hostname: window.location.hostname,
});

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", function () {
  console.log("✅ Enhanced script.js initialized");

  // Note: Image upload is now handled by camera.js
  console.log("📝 Image upload functionality delegated to camera.js");
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

// Main detection function - Enhanced for production
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

    // Capture frame with better quality
    const frameCanvas = document.createElement("canvas");
    frameCanvas.width = video.videoWidth;
    frameCanvas.height = video.videoHeight;
    const frameCtx = frameCanvas.getContext("2d");

    // Ensure clean frame capture
    frameCtx.clearRect(0, 0, frameCanvas.width, frameCanvas.height);
    frameCtx.drawImage(video, 0, 0);

    console.log(
      "📸 Frame captured:",
      frameCanvas.width + "x" + frameCanvas.height
    );

    // Convert to blob with optimization for API
    frameCanvas.toBlob(
      async (blob) => {
        try {
          if (!blob) {
            throw new Error("Failed to create image blob from camera frame");
          }

          console.log("📤 Sending camera frame to API...");
          console.log("📦 Frame blob size:", blob.size, "bytes");

          const predictions = await sendToRoboflow(blob);
          console.log("📥 Received predictions:", predictions.length);

          drawPredictions(predictions);

          // Update camera status
          if (window.updateCameraStatus) {
            window.updateCameraStatus(
              "active",
              `<i class="fas fa-video"></i> Live detection active (${predictions.length} fish)`
            );
          }
        } catch (error) {
          console.error("🚨 Detection error:", error);

          // Update camera status with error
          if (window.updateCameraStatus) {
            window.updateCameraStatus(
              "error",
              `<i class="fas fa-exclamation-triangle"></i> Detection error`
            );
          }
        } finally {
          isDetecting = false;
        }
      },
      "image/jpeg",
      0.85
    ); // Optimized quality for better API performance
  } catch (error) {
    console.error("🚨 Frame capture error:", error);
    isDetecting = false;
  }
}

// Send image to Roboflow API with improved error handling for production
async function sendToRoboflow(imageBlob) {
  const formData = new FormData();
  formData.append("file", imageBlob, "frame.jpg");

  // Use HTTPS endpoint for production
  const baseUrl = "https://detect.roboflow.com";
  const url = `${baseUrl}/${ROBOFLOW_CONFIG.PROJECT}/${ROBOFLOW_CONFIG.VERSION}?api_key=${ROBOFLOW_CONFIG.API_KEY}&confidence=${ROBOFLOW_CONFIG.CONFIDENCE}&overlap=${ROBOFLOW_CONFIG.OVERLAP}&format=json`;

  console.log("🌐 API URL:", url.replace(ROBOFLOW_CONFIG.API_KEY, "***"));
  console.log("📦 Blob size:", imageBlob.size, "bytes");
  console.log("📦 Blob type:", imageBlob.type);

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
      mode: "cors", // Explicitly set CORS mode
      headers: {
        // Let browser set Content-Type with boundary for FormData
      },
    });

    console.log("📡 Response status:", response.status);
    console.log(
      "📡 Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("🚨 API Error Response:", errorText);

      // More detailed error for debugging
      if (response.status === 401) {
        throw new Error("API Key authentication failed");
      } else if (response.status === 403) {
        throw new Error("API access forbidden - check project permissions");
      } else if (response.status === 429) {
        throw new Error("Rate limit exceeded - please wait");
      } else if (response.status === 413) {
        throw new Error("Payload too large - frame size issue");
      } else {
        throw new Error(
          `HTTP ${response.status}: ${response.statusText} - ${errorText}`
        );
      }
    }

    const result = await response.json();
    console.log("✅ API Success:", result);

    // Validate response structure
    if (!result || typeof result !== "object") {
      throw new Error("Invalid API response format");
    }

    return result.predictions || [];
  } catch (error) {
    console.error("🚨 Fetch error:", error);

    // Show user-friendly error message
    if (
      error.name === "TypeError" &&
      error.message.includes("Failed to fetch")
    ) {
      console.error("Network error - check internet connection");
      throw new Error("Network error - please check your internet connection");
    }

    throw error;
  }
}

// Enhanced prediction drawing with better visibility
function drawPredictions(predictions) {
  const canvas = document.getElementById("overlayCanvas");
  if (!canvas) {
    console.warn("Overlay canvas not found");
    return;
  }

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!predictions || predictions.length === 0) {
    console.log("� No fish detected in current frame");
    return;
  }

  console.log(`🎨 Drawing ${predictions.length} predictions`);

  const colors = [
    "#ff6b6b",
    "#4ecdc4",
    "#45b7d1",
    "#f9ca24",
    "#f0932b",
    "#eb4d4b",
    "#6c5ce7",
    "#a29bfe",
    "#fd79a8",
    "#e17055",
  ];

  predictions.forEach((prediction, index) => {
    const { x, y, width, height, confidence, class: className } = prediction;

    // Calculate box coordinates (Roboflow uses center coordinates)
    const boxX = x - width / 2;
    const boxY = y - height / 2;

    const color = colors[index % colors.length];

    // Draw bounding box with enhanced styling
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.setLineDash([]);
    ctx.strokeRect(boxX, boxY, width, height);

    // Draw filled background for label
    const label = `${className} (${Math.round(confidence * 100)}%)`;
    ctx.font = "bold 16px Inter, Arial, sans-serif";
    const textMetrics = ctx.measureText(label);
    const textWidth = textMetrics.width;
    const textHeight = 20;

    // Background rectangle
    ctx.fillStyle = color;
    ctx.fillRect(boxX, boxY - textHeight - 8, textWidth + 16, textHeight + 8);

    // Text
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, boxX + 8, boxY - 8);

    // Add corner indicators for better visibility
    const cornerSize = 12;
    ctx.lineWidth = 3;

    // Top-left corner
    ctx.beginPath();
    ctx.moveTo(boxX, boxY + cornerSize);
    ctx.lineTo(boxX, boxY);
    ctx.lineTo(boxX + cornerSize, boxY);
    ctx.stroke();

    // Top-right corner
    ctx.beginPath();
    ctx.moveTo(boxX + width - cornerSize, boxY);
    ctx.lineTo(boxX + width, boxY);
    ctx.lineTo(boxX + width, boxY + cornerSize);
    ctx.stroke();

    // Bottom-left corner
    ctx.beginPath();
    ctx.moveTo(boxX, boxY + height - cornerSize);
    ctx.lineTo(boxX, boxY + height);
    ctx.lineTo(boxX + cornerSize, boxY + height);
    ctx.stroke();

    // Bottom-right corner
    ctx.beginPath();
    ctx.moveTo(boxX + width - cornerSize, boxY + height);
    ctx.lineTo(boxX + width, boxY + height);
    ctx.lineTo(boxX + width, boxY + height - cornerSize);
    ctx.stroke();

    console.log(
      `🐟 Detected: ${className} (${Math.round(
        confidence * 100
      )}%) at [${Math.round(boxX)}, ${Math.round(boxY)}, ${Math.round(
        width
      )}, ${Math.round(height)}]`
    );
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

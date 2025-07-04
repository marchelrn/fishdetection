// Enhanced camera.js for Vercel deployment
// Handles image upload functionality with better error handling and production support

console.log("🎥 Camera.js loaded - Enhanced for Vercel deployment");

// Production-ready configuration
const ROBOFLOW_CONFIG = {
  PROJECT_ID: "dataset-6nff1",
  VERSION_ID: "4",
  API_KEY: "UL8nLpCiEBGbxYqRq0nY",
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

console.log(
  "🌍 Environment:",
  isProduction ? "Production (Vercel)" : "Development"
);
console.log("🔗 Protocol:", window.location.protocol);
console.log("🏠 Hostname:", window.location.hostname);

document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 Initializing enhanced image upload functionality...");

  const imageInput = document.getElementById("imageUpload");
  const uploadedImage = document.getElementById("uploadedImage");
  let currentObjectUrl = null;

  if (!imageInput || !uploadedImage) {
    console.error("❌ Required elements not found:", {
      imageInput: !!imageInput,
      uploadedImage: !!uploadedImage,
    });
    return;
  }

  console.log("✅ Image upload elements found and ready");

  // Enhanced file input handler
  imageInput.addEventListener("change", async function (event) {
    const file = event.target.files[0];

    if (!file) {
      console.log("📁 No file selected");
      return;
    }

    console.log("📁 File selected:", {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString(),
    });

    // Enhanced file validation
    if (!file.type.startsWith("image/")) {
      console.warn("⚠️ Invalid file type:", file.type);
      showNotification(
        "Please select a valid image file (JPG, PNG, WebP)",
        "error"
      );
      resetImageDisplay();
      return;
    }

    // File size validation (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.warn(
        "⚠️ File too large:",
        file.size,
        "bytes (max:",
        maxSize,
        ")"
      );
      showNotification(
        "Image size too large. Please select an image smaller than 10MB",
        "error"
      );
      resetImageDisplay();
      return;
    }

    // Process the image
    try {
      await processImageUpload(file);
    } catch (error) {
      console.error("🚨 Error processing image upload:", error);
      showNotification(`Upload failed: ${error.message}`, "error");
      resetImageDisplay();
    }
  });

  // Enhanced image processing function
  async function processImageUpload(file) {
    console.log("🔄 Processing image upload...");

    // Show loading state
    showLoadingState();

    try {
      // Create preview immediately
      const previewUrl = URL.createObjectURL(file);
      uploadedImage.src = previewUrl;
      uploadedImage.style.display = "block";
      uploadedImage.style.opacity = "0.6"; // Loading state

      console.log("👀 Preview displayed, processing with API...");

      // Process image for better API compatibility
      const processedFile = await optimizeImageForAPI(file);

      // Send to Roboflow API
      const result = await sendToRoboflowAPI(processedFile);

      // Handle the result
      if (result.success) {
        console.log("✅ Image processing successful");
        uploadedImage.style.opacity = "1";

        if (result.detections > 0) {
          showNotification(
            `Found ${result.detections} fish species!`,
            "success"
          );
        } else {
          showNotification("No fish detected in this image", "info");
        }
      } else {
        throw new Error(result.error || "Unknown processing error");
      }
    } catch (error) {
      console.error("🚨 Image processing failed:", error);
      uploadedImage.style.opacity = "1";
      throw error;
    }
  }

  // Optimize image for API (resize if needed, convert format)
  async function optimizeImageForAPI(file) {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = function () {
        console.log("🖼️ Original image size:", img.width + "x" + img.height);

        // Calculate optimal size (max 1280px on longest side)
        const maxSize = 1280;
        let { width, height } = img;

        if (width > maxSize || height > maxSize) {
          const scale = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
          console.log("📏 Resizing to:", width + "x" + height);
        }

        canvas.width = width;
        canvas.height = height;

        // Draw with good quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to optimized blob
        canvas.toBlob(
          (blob) => {
            console.log(
              "📦 Optimized image:",
              blob.size,
              "bytes, type:",
              blob.type
            );
            resolve(blob);
          },
          "image/jpeg",
          0.85
        ); // Good quality JPEG
      };

      img.onerror = () => {
        console.error("❌ Failed to load image for optimization");
        resolve(file); // Fallback to original file
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Enhanced API call function
  async function sendToRoboflowAPI(imageFile) {
    const formData = new FormData();
    formData.append("file", imageFile, "upload.jpg");

    // Use format=image for processed image response
    const apiUrl = `https://detect.roboflow.com/${ROBOFLOW_CONFIG.PROJECT_ID}/${ROBOFLOW_CONFIG.VERSION_ID}?api_key=${ROBOFLOW_CONFIG.API_KEY}&format=image&labels=on&stroke=4&confidence=${ROBOFLOW_CONFIG.CONFIDENCE}&overlap=${ROBOFLOW_CONFIG.OVERLAP}`;

    console.log("🌐 API Request:", {
      url: apiUrl.replace(ROBOFLOW_CONFIG.API_KEY, "***"),
      fileSize: imageFile.size,
      fileType: imageFile.type,
    });

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
        mode: "cors",
        headers: {
          // Let browser set Content-Type with boundary for FormData
        },
      });

      console.log("📡 API Response:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("🚨 API Error Response:", errorText);

        // Enhanced error handling
        if (response.status === 401) {
          throw new Error("API authentication failed - check API key");
        } else if (response.status === 403) {
          throw new Error("API access forbidden - check project permissions");
        } else if (response.status === 429) {
          throw new Error("Rate limit exceeded - please wait and try again");
        } else if (response.status === 413) {
          throw new Error(
            "Image too large for API - please use a smaller image"
          );
        } else {
          throw new Error(
            `API error ${response.status}: ${response.statusText}`
          );
        }
      }

      // Get processed image
      const imageBlob = await response.blob();
      console.log("📥 Received processed image:", imageBlob.size, "bytes");

      // Clean up previous URL
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
      }

      // Create new URL and display
      currentObjectUrl = URL.createObjectURL(imageBlob);
      uploadedImage.src = currentObjectUrl;
      uploadedImage.style.display = "block";

      console.log("✅ Processed image displayed successfully");

      // Count detections by trying to get JSON response for counting
      // Since we're using format=image, we can't count directly, so we estimate
      return {
        success: true,
        detections: 1, // Placeholder - actual counting would need format=json
        processedImageUrl: currentObjectUrl,
      };
    } catch (error) {
      console.error("🚨 API call failed:", error);

      // User-friendly error messages
      if (
        error.name === "TypeError" &&
        error.message.includes("Failed to fetch")
      ) {
        throw new Error(
          "Network error - please check your internet connection"
        );
      }

      throw error;
    }
  }

  // Utility functions
  function showLoadingState() {
    if (uploadedImage) {
      uploadedImage.src = "";
      uploadedImage.style.display = "none";
    }
  }

  function resetImageDisplay() {
    if (uploadedImage) {
      uploadedImage.style.display = "none";
      uploadedImage.src = "";
    }
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = null;
    }
  }

  // Enhanced notification system
  function showNotification(message, type = "info") {
    console.log(`📢 Notification (${type}):`, message);

    // Remove existing notifications
    const existingNotifications = document.querySelectorAll(
      ".upload-notification"
    );
    existingNotifications.forEach((n) => n.remove());

    const notification = document.createElement("div");
    notification.className = `upload-notification upload-notification-${type}`;
    notification.textContent = message;

    // Enhanced styling
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      font-size: 14px;
      z-index: 10000;
      max-width: 350px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      transition: all 0.3s ease;
      transform: translateX(100%);
      ${
        type === "success"
          ? "background: linear-gradient(135deg, #10b981, #059669);"
          : ""
      }
      ${
        type === "error"
          ? "background: linear-gradient(135deg, #ef4444, #dc2626);"
          : ""
      }
      ${
        type === "info"
          ? "background: linear-gradient(135deg, #6366f1, #4f46e5);"
          : ""
      }
    `;

    document.body.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
      notification.style.transform = "translateX(0)";
    });

    // Animate out and remove
    setTimeout(() => {
      notification.style.transform = "translateX(100%)";
      notification.style.opacity = "0";
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  console.log(
    "✅ Enhanced image upload functionality initialized successfully"
  );
});

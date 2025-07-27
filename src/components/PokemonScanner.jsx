import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";

/**
 * PokemonScanner Component
 * Handles camera access, image capture, and AI-based Pokémon identification using Gemini API.
 *
 * @param {object} props - The component props.
 * @param {Array} props.pokemonList - Full Pokémon data list for local lookup.
 * @param {function} props.onPokemonScanned - Callback for identified Pokémon object.
 * @param {function} props.onScanningChange - Callback to update scanning state in App.js.
 * @param {function} props.fetchPokemonDescription - Function to fetch Pokémon description.
 * @param {boolean} props.isVisible - Whether the scanner feed should be visible.
 * @param {function} props.onClose - Callback to hide the scanner.
 */
function PokemonScanner({
  pokemonList,
  onPokemonScanned,
  onScanningChange,
  fetchPokemonDescription,
  isVisible,
  onClose,
}) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  /**
   * Starts camera feed and assigns MediaStream to video element.
   * Uses .play().catch() to handle AbortError in React StrictMode dev environment.
   */
  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Camera not supported in this browser.");
      onClose();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;

        // Handle StrictMode AbortError gracefully
        videoRef.current
          .play()
          .then(() => {
            setIsCameraActive(true);
            toast.info("Camera started. Point at a Pokémon to scan!");
          })
          .catch((err) => {
            if (err.name === "AbortError") {
              console.warn("Video play aborted due to StrictMode remount (expected).");
            } else {
              console.error("Video play() error:", err);
              toast.error("Could not start camera feed.");
              onClose();
            }
          });
      }
    } catch (err) {
      console.error("Camera access error:", err);
      toast.error("Camera access denied or unavailable.");
      onClose();
    }
  }, [onClose]);

  /**
   * Stops camera feed and clears MediaStream tracks.
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  /**
   * Starts or stops camera based on visibility prop.
   * Cleans up camera on unmount. StrictMode double mount triggers this twice in dev.
   */
  useEffect(() => {
    if (isVisible) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isVisible, startCamera, stopCamera]);

  /**
   * Captures image from video feed and sends to Gemini API for Pokémon identification.
   * Updates parent with identified Pokémon and its description.
   */
  const captureAndScan = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isCameraActive) {
      toast.error("Camera is not active. Please ensure it's playing.");
      return;
    }

    const apiKey = process.env.REACT_APP_API_KEY;
    if (!apiKey) {
      toast.error("Gemini API key is not configured. Cannot scan Pokémon.");
      return;
    }

    setIsScanning(true);
    onScanningChange(true);
    onPokemonScanned(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // Capture current frame
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL("image/png");
    const base64ImageData = imageDataUrl.split(",")[1];

    let identifiedPokemonName = "Unknown";
    let identifiedPokemonDetails = null;

    try {
      const prompt =
        "What Pokémon is in this image? Provide only the Pokémon's name, or 'Unknown' if you cannot identify it. Do not include any other text or punctuation.";

      const payload = {
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "image/png",
                  data: base64ImageData,
                },
              },
            ],
          },
        ],
      };

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Gemini API failed: ${response.status} - ${errorData.error?.message || "Unknown error"}`
        );
      }

      const result = await response.json();
      identifiedPokemonName =
        result.candidates?.[0]?.content?.parts?.[0]?.text.trim() || "Unknown";

      console.log("Identified Pokémon by Gemini:", identifiedPokemonName);

      if (identifiedPokemonName.toLowerCase() !== "unknown") {
        const found = pokemonList.find(
          (p) => p.name.toLowerCase() === identifiedPokemonName.toLowerCase()
        );
        if (found) {
          identifiedPokemonDetails = found;
        }
      }
    } catch (error) {
      console.error("Error during Gemini API call:", error);
      toast.error(`Scan failed: ${error.message || "Could not process image."}`);
    } finally {
      setIsScanning(false);
      onScanningChange(false);
      stopCamera();
      onClose();
    }

    if (identifiedPokemonDetails) {
      onPokemonScanned(identifiedPokemonDetails);
      fetchPokemonDescription(identifiedPokemonDetails.name);
      toast.success(
        `Scanned: ${
          identifiedPokemonDetails.name.charAt(0).toUpperCase() +
          identifiedPokemonDetails.name.slice(1)
        }!`
      );
    } else {
      toast.info("No Pokémon identified. Try again with a clearer image!");
    }
  }, [
    isCameraActive,
    pokemonList,
    onPokemonScanned,
    onScanningChange,
    onClose,
    stopCamera,
    fetchPokemonDescription,
  ]);

  return (
    <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-6 mb-8 flex flex-col items-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Pokémon Scanner</h2>

      <div className="flex flex-col items-center w-full">
        <video
          ref={videoRef}
          className="w-full max-w-sm rounded-lg shadow-md mb-4 border border-gray-300"
          autoPlay
        ></video>

        <canvas ref={canvasRef} className="hidden"></canvas>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <button
            onClick={captureAndScan}
            className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={isScanning || !isCameraActive}
          >
            {isScanning ? "Scanning..." : "Scan Pokémon"}
          </button>

          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            disabled={isScanning}
          >
            Close Scanner
          </button>
        </div>

        {isScanning && (
          <p className="text-blue-600 text-lg mt-4 font-medium animate-pulse">
            Analyzing image...
          </p>
        )}
      </div>
    </div>
  );
}

export default PokemonScanner;

import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";

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
  
  // NEW: Ultra-strict API Lock to prevent 429
  const apiLock = useRef(false);

  const getGeminiConfig = useCallback(() => {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY || process.env.REACT_APP_API_KEY;
    const model = process.env.REACT_APP_GEMINI_MODEL || "gemini-2.0-flash";
    return { apiKey, model };
  }, []);

  const buildGeminiErrorMessage = useCallback((status, errorMessage) => {
    if (status === 429) return "API limit reached. Wait 60 seconds.";
    return errorMessage || "Could not process image.";
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Camera not supported.");
      onClose();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        videoRef.current.play().then(() => {
          setIsCameraActive(true);
        }).catch(err => {
          if (err.name !== "AbortError") toast.error("Camera play error.");
        });
      }
    } catch (err) {
      toast.error("Camera access denied.");
      onClose();
    }
  }, [onClose]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  useEffect(() => {
    if (isVisible) startCamera();
    return () => stopCamera();
  }, [isVisible, startCamera, stopCamera]);

  const captureAndScan = useCallback(async () => {
    // PREVENT DOUBLE FIRE
    if (apiLock.current || isScanning || !isCameraActive) return;

    const { apiKey, model } = getGeminiConfig();
    if (!apiKey) {
      toast.error("API key missing.");
      return;
    }

    apiLock.current = true; // Lock set
    setIsScanning(true);
    onScanningChange(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const base64ImageData = canvas.toDataURL("image/png").split(",")[1];
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [
            { text: "What Pokémon is in this image? Provide only the Pokémon's name, or 'Unknown'." },
            { inlineData: { mimeType: "image/png", data: base64ImageData } }
          ]}]
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(buildGeminiErrorMessage(response.status, errData.error?.message));
      }

      const result = await response.json();
      const name = result.candidates?.[0]?.content?.parts?.[0]?.text.trim() || "Unknown";

      if (name.toLowerCase() !== "unknown") {
        const found = pokemonList.find(p => p.name.toLowerCase() === name.toLowerCase());
        if (found) {
          onPokemonScanned(found);
          fetchPokemonDescription(found.name);
          toast.success(`Scanned: ${found.name}!`);
          onClose(); // Parent handles cleanup
          return;
        }
      }
      toast.info("No Pokémon identified. Try again!");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsScanning(false);
      onScanningChange(false);
      apiLock.current = false; // Lock released
    }
  }, [getGeminiConfig, isCameraActive, pokemonList, onPokemonScanned, onScanningChange, onClose, fetchPokemonDescription, isScanning, buildGeminiErrorMessage]);

  return (
    <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-6 mb-8 flex flex-col items-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Pokémon Scanner</h2>
      
      <div className="flex flex-col items-center w-full">
        <video ref={videoRef} className="w-full max-w-sm rounded-lg shadow-md mb-4 border border-gray-300" autoPlay playsInline muted></video>
        <canvas ref={canvasRef} className="hidden"></canvas>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <button
            onClick={captureAndScan}
            className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition font-semibold shadow-lg transform hover:-translate-y-0.5 disabled:bg-gray-400"
            disabled={isScanning || !isCameraActive}
          >
            {isScanning ? "Scanning..." : "Scan Pokémon"}
          </button>

          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition font-semibold shadow-lg transform hover:-translate-y-0.5"
            disabled={isScanning}
          >
            Close Scanner
          </button>
        </div>

        {isScanning && (
          <p className="text-blue-600 text-lg mt-4 font-medium animate-pulse">Analyzing image...</p>
        )}
      </div>
    </div>
  );
}

export default PokemonScanner;
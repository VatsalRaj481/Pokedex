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
  const [cooldownUntil, setCooldownUntil] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const apiLock = useRef(false);

  const SCAN_COOLDOWN_MS = 8000;
  const SCAN_API_URL =
    process.env.REACT_APP_SCAN_API_URL || "http://localhost:5000/scan";

  const buildGeminiErrorMessage = useCallback((status, errorMessage) => {
    if (status === 429) {
      return errorMessage || "Too many requests, please wait.";
    }

    return errorMessage || "Could not process image.";
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Camera not supported.");
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
        videoRef.current
          .play()
          .then(() => {
            setIsCameraActive(true);
          })
          .catch((error) => {
            if (error.name !== "AbortError") {
              toast.error("Camera play error.");
            }
          });
      }
    } catch (error) {
      toast.error("Camera access denied.");
      onClose();
    }
  }, [onClose]);

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

  useEffect(() => {
    if (isVisible) {
      startCamera();
    }

    return () => stopCamera();
  }, [isVisible, startCamera, stopCamera]);

  const captureAndScan = useCallback(async () => {
    if (apiLock.current || isScanning || !isCameraActive) {
      return;
    }

    const now = Date.now();
    if (cooldownUntil > now) {
      const secondsLeft = Math.ceil((cooldownUntil - now) / 1000);
      toast.info(`Please wait ${secondsLeft}s before scanning again.`);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!video || !canvas || !context) {
      toast.error("Camera is not ready yet.");
      return;
    }

    apiLock.current = true;
    setIsScanning(true);
    onScanningChange(true);
    onPokemonScanned(null);

    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const base64ImageData = canvas.toDataURL("image/png").split(",")[1];
      const payload = {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "What Pokemon is in this image? Provide only the Pokemon name, or 'Unknown' if you cannot identify it. Do not include any other text or punctuation.",
              },
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

      const response = await fetch(SCAN_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        const retryAfterMs =
          response.status === 429
            ? Math.max(
                Number(result.retryAfterMs) || SCAN_COOLDOWN_MS,
                SCAN_COOLDOWN_MS
              )
            : 0;

        if (retryAfterMs > 0) {
          setCooldownUntil(Date.now() + retryAfterMs);
        }

        throw new Error(
          buildGeminiErrorMessage(response.status, result.error)
        );
      }

      setCooldownUntil(Date.now() + SCAN_COOLDOWN_MS);

      const identifiedPokemonName =
        result.candidates?.[0]?.content?.parts?.[0]?.text.trim() || "Unknown";

      if (identifiedPokemonName.toLowerCase() !== "unknown") {
        const foundPokemon = pokemonList.find(
          (pokemon) =>
            pokemon.name.toLowerCase() === identifiedPokemonName.toLowerCase()
        );

        if (foundPokemon) {
          onPokemonScanned(foundPokemon);
          fetchPokemonDescription(foundPokemon.name);
          toast.success(`Scanned: ${foundPokemon.name}!`);
          onClose();
          return;
        }
      }

      toast.info("No Pokemon identified. Try again with a clearer image.");
    } catch (error) {
      toast.error(error.message || "Scan failed.");
    } finally {
      setIsScanning(false);
      onScanningChange(false);
      apiLock.current = false;
    }
  }, [
    buildGeminiErrorMessage,
    cooldownUntil,
    fetchPokemonDescription,
    isCameraActive,
    isScanning,
    onClose,
    onPokemonScanned,
    onScanningChange,
    pokemonList,
    SCAN_API_URL,
  ]);

  return (
    <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-6 mb-8 flex flex-col items-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Pokemon Scanner
      </h2>

      <div className="flex flex-col items-center w-full">
        <video
          ref={videoRef}
          className="w-full max-w-sm rounded-lg shadow-md mb-4 border border-gray-300"
          autoPlay
          playsInline
          muted
        ></video>
        <canvas ref={canvasRef} className="hidden"></canvas>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <button
            onClick={captureAndScan}
            className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition font-semibold shadow-lg transform hover:-translate-y-0.5 disabled:bg-gray-400"
            disabled={
              isScanning || !isCameraActive || cooldownUntil > Date.now()
            }
          >
            {isScanning ? "Scanning..." : "Scan Pokemon"}
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
          <p className="text-blue-600 text-lg mt-4 font-medium animate-pulse">
            Analyzing image...
          </p>
        )}
      </div>
    </div>
  );
}

export default PokemonScanner;

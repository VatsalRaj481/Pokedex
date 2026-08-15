import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

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
      toast.error("Camera not supported on this device.");
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
              toast.error("Error playing video stream.");
            }
          });
      }
    } catch (error) {
      toast.error("Camera access denied. Please enable permissions.");
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
      toast.error("Camera is initializing...");
      return;
    }

    apiLock.current = true;
    setIsScanning(true);
    onScanningChange(true);
    onPokemonScanned(null);

    const startTime = Date.now();

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

      // Enforce a minimum scanning display time of 2.2 seconds for the anime scanning sweep effect
      const elapsed = Date.now() - startTime;
      const minDelay = 2200;
      if (elapsed < minDelay) {
        await new Promise((resolve) => setTimeout(resolve, minDelay - elapsed));
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
          toast.success(`Match Found: ${foundPokemon.name}!`);
          onClose();
          return;
        }
      }

      toast.info("Could not identify any Pokémon. Keep target centered and try again.");
    } catch (error) {
      toast.error(error.message || "Scanning failed.");
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
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 18 }}
      className="w-full max-w-xl bg-theme-surface rounded-3xl border-2 border-theme shadow-xl p-6 mb-8 flex flex-col items-center relative overflow-hidden"
    >
      
      <div className="w-full flex justify-between items-center mb-6">
        <h2 className="text-2xl font-display font-extrabold text-theme-primary flex items-center gap-2.5 tracking-[-0.015em]">
          <span className="w-4 h-4 rounded-full bg-red-500 animate-pulse border border-white"></span>
          Dex Scanner
        </h2>
        <div className="text-[10px] font-display font-semibold text-theme-secondary bg-theme-input px-2.5 py-1 rounded-lg">
          SYS.BOOTED
        </div>
      </div>

      <div className="flex flex-col items-center w-full">
        {/* Camera Feed Container */}
        <div className="relative w-full max-w-sm aspect-video sm:aspect-square rounded-2xl overflow-hidden border-4 border-theme bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          ></video>
          <canvas ref={canvasRef} className="hidden"></canvas>

          {/* Scanner Visual Effects Overlay */}
          {isScanning && (
            <>
              {/* Animated Laser sweep line */}
              <div className="absolute left-0 w-full h-1.5 bg-green-500 shadow-[0_0_12px_#22c55e] animate-laser pointer-events-none"></div>
              {/* Digital Grid overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,255,0,0.05)_1px,transparent_1px),linear-gradient(to_right,rgba(0,255,0,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
              {/* Scan text details */}
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-[10px] font-display font-bold text-green-400 bg-slate-950/85 px-3.5 py-2 rounded-lg border border-green-500/30 backdrop-blur-sm">
                <span className="animate-pulse">ANALYZING SIGNALS...</span>
                <span>MATCHING ID</span>
              </div>
            </>
          )}

          {!isCameraActive && !isScanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-955/90 text-slate-400">
              <svg className="animate-spin h-8 w-8 text-theme-accent mb-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="font-display font-semibold text-theme-secondary">Booting Lens...</p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm mt-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            onClick={captureAndScan}
            className="flex-1 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-theme-surface-hover disabled:text-theme-secondary text-white rounded-2xl font-bold font-display shadow-md hover:shadow-lg focus:outline-none"
            disabled={
              isScanning || !isCameraActive || cooldownUntil > Date.now()
            }
          >
            {isScanning ? "Scanning..." : "Identify Pokemon"}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            onClick={onClose}
            className="px-6 py-3.5 bg-theme-accent hover:opacity-90 text-white rounded-2xl font-bold font-display shadow-md hover:shadow-lg focus:outline-none"
            disabled={isScanning}
          >
            Close
          </motion.button>
        </div>

        {isScanning && (
          <p className="text-green-500 font-display font-semibold text-[10px] mt-4 tracking-wider animate-pulse">
            COMMUNICATION IN PROGRESS WITH GEN-DEX
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default PokemonScanner;

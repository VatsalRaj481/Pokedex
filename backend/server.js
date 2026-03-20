const express = require("express");
const cors = require("cors");
const fetch = (...args) =>
  import("node-fetch").then(({ default: nodeFetch }) => nodeFetch(...args));

const app = express();

const PORT = process.env.PORT || 5000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash";
const GLOBAL_COOLDOWN_MS = 8000;

let lastScanTimestamp = 0;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

app.post("/scan", async (req, res) => {
  const now = Date.now();
  const retryAfterMs = GLOBAL_COOLDOWN_MS - (now - lastScanTimestamp);

  if (retryAfterMs > 0) {
    return res.status(429).json({
      error: "Wait before next scan",
      retryAfterMs,
    });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({
      error: "Gemini API key is not configured.",
    });
  }

  const payload = req.body;
  if (!Array.isArray(payload?.contents) || payload.contents.length === 0) {
    return res.status(400).json({
      error: "Invalid Gemini payload.",
    });
  }

  lastScanTimestamp = now;

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const geminiJson = await geminiResponse.json();

    if (!geminiResponse.ok) {
      if (geminiResponse.status === 429) {
        return res.status(429).json({
          error: "Wait before next scan",
          retryAfterMs: GLOBAL_COOLDOWN_MS,
          details:
            geminiJson?.error?.message ||
            "Gemini rate limit reached. Please try again later.",
        });
      }

      return res.status(geminiResponse.status).json({
        error: geminiJson?.error?.message || "Gemini request failed.",
      });
    }

    return res.status(200).json(geminiJson);
  } catch (error) {
    console.error("Gemini scan failed:", error);
    return res.status(500).json({
      error: "Unable to process the scan right now.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});

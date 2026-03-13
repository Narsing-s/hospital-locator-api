// server.js
const express = require("express");

// If you're on Node 16, uncomment the next two lines:
// const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
// global.fetch = global.fetch || fetch;

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ✅ Your backend base URL (includes /api)
const BASE_URL = "https://hospital-locator-api-jik9pb.5sc6y6-3.usa-e2.cloudhub.io/api";

// 🔐 From environment
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

/* =========================
   HELPERS
========================= */

// Defensive JSON parse for upstream responses
async function safeParse(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    return {
      error: "Invalid JSON from backend",
      rawResponse: text
    };
  }
}

// Basic health
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    node: process.version,
    hasClientId: !!CLIENT_ID,
    hasClientSecret: !!CLIENT_SECRET
  });
});

/* =========================
   API ROUTES (proxy)
========================= */

// 🔎 Get hospitals by pincode
app.get("/api/pincode", async (req, res) => {
  try {
    const { pincode } = req.query;
    if (!pincode) {
      return res.status(400).json({ error: "Pincode is required" });
    }

    const response = await fetch(`${BASE_URL}/pincode?pincode=${encodeURIComponent(pincode)}`, {
      headers: { client_id: CLIENT_ID, client_secret: CLIENT_SECRET }
    });

    const data = await safeParse(response);
    res.status(response.status).json(data);

  } catch (err) {
    res.status(500).json({ error: "Server Error: " + err.message });
  }
});

// 🏥 Get hospital services
app.get("/api/services/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Hospital ID is required" });
    }

    const response = await fetch(`${BASE_URL}/hospitals/${encodeURIComponent(id)}/services`, {
      headers: { client_id: CLIENT_ID, client_secret: CLIENT_SECRET }
    });

    const data = await safeParse(response);
    res.status(response.status).json(data);

  } catch (err) {
    res.status(500).json({ error: "Server Error: " + err.message });
  }
});

// 👤 Create patient (accepts LastName or lastName; email → gmail)
app.post("/api/patients", async (req, res) => {
  try {
    const payload = { ...req.body };

    // Normalize variants
    if (payload.LastName && !payload.lastName) {
      payload.lastName = payload.LastName;
      delete payload.LastName;
    }
    if (payload.email && !payload.gmail) {
      payload.gmail = payload.email;
      delete payload.email;
    }

    // Validate required canonical fields
    const required = ["firstName", "lastName", "age", "gender", "phoneNumber", "address", "gmail"];
    const missing = required.filter((k) => !payload[k]);
    if (missing.length) {
      return res.status(400).json({
        error: "Missing required fields",
        required,
        missing
      });
    }

    const response = await fetch(`${BASE_URL}/patients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
      },
      body: JSON.stringify(payload)
    });

    const data = await safeParse(response);
    res.status(response.status).json(data);

  } catch (err) {
    res.status(500).json({ error: "Server Error: " + err.message });
  }
});

// Optional: 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: "Not Found", path: req.path });
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

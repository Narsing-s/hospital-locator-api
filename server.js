// server.js
const express = require("express");

// If you're on Node 16, uncomment the next two lines and install node-fetch@2:
// const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
// global.fetch = global.fetch || fetch;

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ✅ Mule backend base URL (includes /api)
const BASE_URL = "https://hospital-locator-api-jik9pb.5sc6y6-3.usa-e2.cloudhub.io/api";

// 🔐 Env vars for Mule
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

// Health check
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

// 👤 Create patient — maps to Mule's required keys (case-sensitive)
app.post("/api/patients", async (req, res) => {
  try {
    const raw = { ...req.body };

    // 1) Normalize inbound variants to canonical lowerCamelCase internally
    const payload = {
      firstName:   raw.firstName ?? raw.FirstName ?? "",
      lastName:    raw.lastName  ?? raw.LastName  ?? "",
      age:         raw.age ?? "",
      gender:      raw.gender ?? "",
      phoneNumber: raw.phoneNumber ?? raw.phone ?? "",
      address:     raw.address ?? "",
      gmail:       raw.gmail ?? raw.email ?? "" // allow 'email' as alias from clients
    };

    // Trim strings
    for (const k of Object.keys(payload)) {
      if (typeof payload[k] === "string") payload[k] = payload[k].trim();
    }

    // 2) Validate required canonical fields (treat empty string as missing)
    const required = ["firstName", "lastName", "age", "gender", "phoneNumber", "address", "gmail"];
    const missing = required.filter((k) => payload[k] === undefined || payload[k] === null || payload[k] === "");
    if (missing.length) {
      return res.status(400).json({
        error: "Missing required fields",
        required,
        missing
      });
    }

    // Ensure age is a positive number
    const ageNum = Number(payload.age);
    if (!Number.isFinite(ageNum) || ageNum <= 0) {
      return res.status(400).json({
        error: "Invalid 'age': must be a positive number",
        received: payload.age
      });
    }

    // 3) Map to Mule's expected shape (CASE SENSITIVE)
    // Per RAML example: firstName, LastName (capital L), age, gender, phoneNumber, address, gmail
    const backendPayload = {
      firstName: payload.firstName,
      LastName:  payload.lastName,    // <-- Capital L for Mule
      age:       ageNum,
      gender:    payload.gender,
      phoneNumber: payload.phoneNumber,
      address:   payload.address,
      gmail:     payload.gmail        // Mule expects 'gmail' (not 'email') per RAML example
    };

    // Optional: log temporarily to verify what goes to Mule (remove in production)
    // console.log("backendPayload -> Mule:", backendPayload);

    const response = await fetch(`${BASE_URL}/patients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
      },
      body: JSON.stringify(backendPayload)
    });

    const data = await safeParse(response);
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: "Server Error: " + err.message });
  }
});

// 404 fallback for non-existent routes
app.use((req, res) => {
  res.status(404).json({ error: "Not Found", path: req.path });
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

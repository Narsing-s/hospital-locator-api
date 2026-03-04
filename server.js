const express = require("express");
const fetch = require("node-fetch"); // ✅ Required if Node < 18

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ✅ IMPORTANT: Add /api because your CloudHub endpoints start with /api
const BASE_URL = "https://hospital-locator-api-jik9pb.5sc6y6-3.usa-e2.cloudhub.io/api";

// 🔐 Secure way (DO NOT hardcode secrets)
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

/* =========================
   HELPER FUNCTION
========================= */

// ✅ Safe JSON parser (prevents Unexpected token error)
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

/* =========================
   BACKEND API ROUTES
========================= */

// 🔎 Get hospitals by pincode
app.get("/api/pincode", async (req, res) => {
  try {
    if (!req.query.pincode) {
      return res.status(400).json({ error: "Pincode is required" });
    }

    const response = await fetch(
      `${BASE_URL}/pincode?pincode=${req.query.pincode}`,
      {
        headers: {
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET
        }
      }
    );

    const data = await safeParse(response);
    res.status(response.status).json(data);

  } catch (err) {
    res.status(500).json({ error: "Server Error: " + err.message });
  }
});

// 🔎 Get hospitals by city
app.get("/api/city", async (req, res) => {
  try {
    if (!req.query.city) {
      return res.status(400).json({ error: "City is required" });
    }

    const response = await fetch(
      `${BASE_URL}/city?city=${req.query.city}`,
      {
        headers: {
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET
        }
      }
    );

    const data = await safeParse(response);
    res.status(response.status).json(data);

  } catch (err) {
    res.status(500).json({ error: "Server Error: " + err.message });
  }
});

// 🏥 Get hospital services
app.get("/api/services/:id", async (req, res) => {
  try {

    const response = await fetch(
      `${BASE_URL}/hospitals/${req.params.id}/services`,
      {
        headers: {
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET
        }
      }
    );

    const data = await safeParse(response);
    res.status(response.status).json(data);

  } catch (err) {
    res.status(500).json({ error: "Server Error: " + err.message });
  }
});

// 👤 Create patient
app.post("/api/patient", async (req, res) => {
  try {

    const response = await fetch(`${BASE_URL}/patients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
      },
      body: JSON.stringify(req.body)
    });

    const data = await safeParse(response);
    res.status(response.status).json(data);

  } catch (err) {
    res.status(500).json({ error: "Server Error: " + err.message });
  }
});

/* =========================
   FRONTEND UI
========================= */

app.get("/", (req, res) => {
  res.send("<h1>Hospital Locator Running 🚀</h1>");
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

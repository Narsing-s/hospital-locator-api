// server.js
const express = require("express");

// If you're on Node 16, uncomment the next two lines and run: npm i node-fetch@2
// const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
// global.fetch = global.fetch || fetch;

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ✅ Mule backend base URL (includes /api)
const BASE_URL = "https://hospital-locator-api-jik9pb.5sc6y6-3.usa-e2.cloudhub.io/api";

// 🔐 Env vars used by Mule (apply your values in shell or process manager)
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
  } catch {
    return { error: "Invalid JSON from backend", rawResponse: text };
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
// Example: GET /api/pincode?pincode=531034
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
// Example: GET /api/services/1
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
// Mule requires: firstName, LastName, age(number), gender, phoneNumber, address, gmail
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
      gmail:       raw.gmail ?? raw.email ?? "" // accept 'email' from clients; map later
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

    // 3) Map to Mule's expected shape (CASE SENSITIVE per RAML)
    const backendPayload = {
      firstName: payload.firstName,
      LastName:  payload.lastName,    // <-- Capital 'L' required by Mule
      age:       ageNum,
      gender:    payload.gender,
      phoneNumber: payload.phoneNumber,
      address:   payload.address,
      gmail:     payload.gmail        // Mule expects 'gmail' (not 'email')
    };

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

/* =========================
   SIMPLE UI AT "/"
========================= */

app.get("/", (_req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hospital Locator</title>
<style>
  :root {
    --bg1:#1e3c72; --bg2:#2a5298; --accent:#00c6ff; --accent2:#0072ff;
    --text:#fff; --mono:#00ff90; --panel:#000;
  }
  body{
    font-family: Segoe UI, Arial, sans-serif;
    background: linear-gradient(135deg, var(--bg1), var(--bg2));
    color: var(--text);
    text-align: center;
    padding: 20px;
  }
  .container{ max-width: 980px; margin: 0 auto; }
  .row{ margin: 22px 0; }
  input,button{
    padding: 10px;
    margin: 6px 5px;
    border-radius: 8px;
    border: none;
  }
  input{ min-width: 260px; }
  button{
    background: var(--accent);
    color: white;
    cursor: pointer;
  }
  button:hover{ background: var(--accent2); }
  pre{
    background: var(--panel);
    color: var(--mono);
    padding: 15px;
    border-radius: 10px;
    text-align: left;
    overflow: auto;
    max-height: 55vh;
  }
  .grid{
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 12px;
  }
  fieldset{
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 12px;
    padding: 12px;
    min-height: 160px;
  }
  legend{ padding: 0 8px; opacity: 0.9; }
</style>
</head>
<body>
  <div class="container">
    <h1>🏥 Hospital Locator</h1>

    <div class="grid">
      <fieldset>
        <legend>Search by Pincode</legend>
        <input id="pincode" placeholder="Enter Pincode">
        <button onclick="searchPincode()">Search</button>
      </fieldset>

      <fieldset>
        <legend>Hospital Services</legend>
        <input id="hospitalId" placeholder="Hospital ID">
        <button onclick="services()">Get Services</button>
      </fieldset>

      <fieldset>
        <legend>Create Patient</legend>
        <input id="firstName" placeholder="First Name">
        <input id="lastName"  placeholder="Last Name">
        <input id="age"       placeholder="Age">
        <input id="gender"    placeholder="Gender">
        <input id="phoneNumber" placeholder="Phone Number">
        <input id="address"   placeholder="Address">
        <input id="gmail"     placeholder="Gmail (email accepted too)">
        <button onclick="createPatient()">Create</button>
      </fieldset>
    </div>

    <div class="row">
      <h3>Result</h3>
      <div id="result"></div>
    </div>
  </div>

<script>
  function byId(id){
    const el = document.getElementById(id);
    if(!el){ throw new Error(\`Element #\${id} not found in DOM\`); }
    return el;
  }

  function show(obj){
    byId("result").innerHTML = "<pre>" + JSON.stringify(obj, null, 2) + "</pre>";
  }

  async function handleResponse(res){
    const data = await res.json().catch(() => ({ error: "Invalid JSON" }));
    if(!res.ok){
      throw new Error(JSON.stringify(data));
    }
    return data;
  }

  async function searchPincode(){
    try{
      const pincode = byId("pincode").value.trim();
      if(!pincode) return show({ error: "Please enter pincode" });
      const res = await fetch("/api/pincode?pincode=" + encodeURIComponent(pincode));
      const data = await handleResponse(res);
      show(data);
    }catch(err){
      show({ error: err.message });
    }
  }

  async function services(){
    try{
      const id = byId("hospitalId").value.trim();
      if(!id) return show({ error: "Please enter hospital ID" });
      const res = await fetch("/api/services/" + encodeURIComponent(id));
      const data = await handleResponse(res);
      show(data);
    }catch(err){
      show({ error: err.message });
    }
  }

  async function createPatient(){
    try{
      const payload = {
        firstName:   byId("firstName").value,
        lastName:    byId("lastName").value,   // UI uses lowerCamelCase
        age:         byId("age").value,
        gender:      byId("gender").value,
        phoneNumber: byId("phoneNumber").value,
        address:     byId("address").value,
        gmail:       byId("gmail").value
      };

      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload) // server maps lastName -> LastName for Mule
      });
      const data = await handleResponse(res);
      show(data);
    }catch(err){
      show({ error: err.message });
    }
  }
</script>
</body>
</html>`);
});

/* =========================
   404 FALLBACK
========================= */

app.use((req, res) => {
  res.status(404).json({ error: "Not Found", path: req.path });
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

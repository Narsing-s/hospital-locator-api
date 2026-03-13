// server.js
const express = require("express");

// If you're on Node 16, uncomment the next two lines and install node-fetch@2:
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

// Health
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

/* =========================
   SIMPLE UI AT "/"
========================= */

app.get("/", (_req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Hospital Locator</title>
<style>
body{
  font-family:Segoe UI, Arial, sans-serif;
  background:linear-gradient(135deg,#1e3c72,#2a5298);
  color:white;
  text-align:center;
  padding:20px;
}
input,button{
  padding:10px;
  margin:5px;
  border-radius:8px;
  border:none;
}
button{
  background:#00c6ff;
  color:white;
  cursor:pointer;
}
button:hover{
  background:#0072ff;
}
pre{
  background:black;
  color:#00ff90;
  padding:15px;
  border-radius:10px;
  text-align:left;
  overflow:auto;
  max-height:50vh;
}
.container{
  max-width:900px;
  margin:0 auto;
}
.row{ margin:24px 0; }
input{ min-width:260px; }
</style>
</head>
<body>
<div class="container">
  <h1>🏥 Hospital Locator Web UI</h1>

  <div class="row">
    <h3>Search By Pincode</h3>
    <input id="pincode" placeholder="Enter Pincode">
    <button onclick="searchPincode()">Search</button>
  </div>

  <div class="row">
    <h3>Hospital Services</h3>
    <input id="hospitalId" placeholder="Hospital ID">
    <button onclick="services()">Get Services</button>
  </div>

  <div class="row">
    <h3>Create Patient</h3>
    <input id="firstName" placeholder="First Name">
    <input id="lastName"  placeholder="Last Name">
    <input id="age"       placeholder="Age">
    <input id="gender"    placeholder="Gender">
    <input id="phoneNumber" placeholder="Phone">
    <input id="address"   placeholder="Address">
    <input id="gmail"     placeholder="Gmail (or send 'email' via API)">
    <button onclick="createPatient()">Create</button>
  </div>

  <div id="result"></div>
</div>

<script>
function byId(id) {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(\`Element #\${id} not found in DOM\`);
  }
  return el;
}

async function handleResponse(res){
  const data = await res.json().catch(() => ({error:"Invalid JSON"}));
  if(!res.ok){
    throw new Error(JSON.stringify(data));
  }
  return data;
}

async function searchPincode(){
  try{
    const pincode = byId("pincode").value;
    const res = await fetch("/api/pincode?pincode=" + encodeURIComponent(pincode));
    const data = await handleResponse(res);
    byId("result").innerHTML = "<pre>"+JSON.stringify(data,null,2)+"</pre>";
  }catch(err){
    byId("result").innerHTML = "<pre style='color:red'>"+err.message+"</pre>";
  }
}

async function services(){
  try{
    const id = byId("hospitalId").value;
    const res = await fetch("/api/services/" + encodeURIComponent(id));
    const data = await handleResponse(res);
    byId("result").innerHTML = "<pre>"+JSON.stringify(data,null,2)+"</pre>";
  }catch(err){
    byId("result").innerHTML = "<pre style='color:red'>"+err.message+"</pre>";
  }
}

async function createPatient(){
  try{
    const payload = {
      firstName:   byId("firstName").value,
      lastName:    byId("lastName").value,
      age:         byId("age").value,
      gender:      byId("gender").value,
      phoneNumber: byId("phoneNumber").value,
      address:     byId("address").value,
      gmail:       byId("gmail").value
    };

    const res = await fetch("/api/patients",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(payload)
    });
    const data = await handleResponse(res);
    byId("result").innerHTML = "<pre>"+JSON.stringify(data,null,2)+"</pre>";
  }catch(err){
    byId("result").innerHTML = "<pre style='color:red'>"+err.message+"</pre>";
  }
}
</script>
</body>
</html>`);
});

/* =========================
   404 FALLBACK (after all routes)
========================= */
app.use((req, res) => {
  res.status(404).json({ error: "Not Found", path: req.path });
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

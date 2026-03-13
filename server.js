// server.js
const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ✅ BASE_URL must include /api
const BASE_URL = "https://hospital-locator-api-jik9pb.5sc6y6-3.usa-e2.cloudhub.io/api";

// 🔐 Secure environment variables
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

/* =========================
   HELPER FUNCTION
========================= */

// Safe JSON parser to prevent 'Unexpected token' errors
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

// 👤 Create patient (supports both LastName/gmail and lastName/email)
app.post("/api/patients", async (req, res) => {
  try {
    const payload = { ...req.body };

    // ✅ Normalize fields: map variants to canonical keys
    if (payload.LastName && !payload.lastName) {
      payload.lastName = payload.LastName;
      delete payload.LastName;
    }
    // Accept 'email' as alias for 'gmail'
    if (payload.email && !payload.gmail) {
      payload.gmail = payload.email;
      delete payload.email;
    }

    // ✅ Validate required canonical fields
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
   FRONTEND UI
========================= */

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
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
.row{
  margin: 24px 0;
}
input{
  min-width: 260px;
}
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
    <input id="lastName"  placeholder="Last Name"><!-- ✅ aligned id -->
    <input id="age"       placeholder="Age">
    <input id="gender"    placeholder="Gender">
    <input id="phoneNumber" placeholder="Phone">
    <input id="address"   placeholder="Address">
    <input id="gmail"     placeholder="Gmail (or use 'email' via API)">
    <button onclick="createPatient()">Create</button>
  </div>

  <div id="result"></div>
</div>

<script>
async function handleResponse(res){
  const data = await res.json().catch(() => ({error:"Invalid JSON"}));
  if(!res.ok){
    // stringifying preserves upstream error structure
    throw new Error(JSON.stringify(data));
  }
  return data;
}

async function searchPincode(){
  try{
    const pincode = document.getElementById("pincode").value;
    const res = await fetch("/api/pincode?pincode=" + encodeURIComponent(pincode));
    const data = await handleResponse(res);
    document.getElementById("result").innerHTML = "<pre>"+JSON.stringify(data,null,2)+"</pre>";
  }catch(err){
    document.getElementById("result").innerHTML = "<pre style='color:red'>"+err.message+"</pre>";
  }
}

async function services(){
  try{
    const id = document.getElementById("hospitalId").value;
    const res = await fetch("/api/services/" + encodeURIComponent(id));
    const data = await handleResponse(res);
    document.getElementById("result").innerHTML = "<pre>"+JSON.stringify(data,null,2)+"</pre>";
  }catch(err){
    document.getElementById("result").innerHTML = "<pre style='color:red'>"+err.message+"</pre>";
  }
}

async function createPatient(){
  try{
    const firstNameEl   = document.getElementById("firstName");
    const lastNameEl    = document.getElementById("lastName");
    const ageEl         = document.getElementById("age");
    const genderEl      = document.getElementById("gender");
    const phoneNumberEl = document.getElementById("phoneNumber");
    const addressEl     = document.getElementById("address");
    const gmailEl       = document.getElementById("gmail");

    // Optional: guard against missing elements
    if (!firstNameEl || !lastNameEl) throw new Error("Form not loaded");

    const payload = {
      firstName:   firstNameEl.value,
      lastName:    lastNameEl.value,    // ✅ matches corrected id
      age:         ageEl.value,
      gender:      genderEl.value,
      phoneNumber: phoneNumberEl.value,
      address:     addressEl.value,
      gmail:       gmailEl.value
    };

    const res = await fetch("/api/patients",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(payload)
    });
    const data = await handleResponse(res);
    document.getElementById("result").innerHTML = "<pre>"+JSON.stringify(data,null,2)+"</pre>";
  }catch(err){
    document.getElementById("result").innerHTML = "<pre style='color:red'>"+err.message+"</pre>";
  }
}
</script>

</body>
</html>
  `);
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

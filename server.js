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

    const response = await fetch(`${BASE_URL}/pincode?pincode=${pincode}`, {
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

    const response = await fetch(`${BASE_URL}/hospitals/${id}/services`, {
      headers: { client_id: CLIENT_ID, client_secret: CLIENT_SECRET }
    });

    const data = await safeParse(response);
    res.status(response.status).json(data);

  } catch (err) {
    res.status(500).json({ error: "Server Error: " + err.message });
  }
});

// 👤 Create patient
app.post("/api/patient", async (req, res) => {
  try {
    // Clone the payload to avoid mutating req.body
    const payload = { ...req.body };

    // ✅ Auto-correct field names
    if (payload.LastName) {
      payload.lastName = payload.LastName;
      delete payload.LastName;
    }
    if (payload.gmail) {
      payload.gmail = payload.gmail;
      delete payload.gmail;
    }

    // Optional: Validate required fields before sending to API
    if (!payload.firstName || !payload.lastName || !payload.age || !payload.gender || !payload.phoneNumber || !payload.address || !payload.gmail) {
      return res.status(400).json({
        error: "Missing required fields. Required: firstName, lastName, age, gender, phoneNumber, address, gmail"
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
  font-family:Segoe UI;
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
}
</style>
</head>
<body>

<h1>🏥 Hospital Locator Web UI</h1>

<h3>Search By Pincode</h3>
<input id="pincode" placeholder="Enter Pincode">
<button onclick="searchPincode()">Search</button>

<h3>Hospital Services</h3>
<input id="hospitalId" placeholder="Hospital ID">
<button onclick="services()">Get Services</button>

<h3>Create Patient</h3>
<input id="firstName" placeholder="First Name">
<input id="lastName" placeholder="Last Name">
<input id="age" placeholder="Age">
<input id="gender" placeholder="Gender">
<input id="phoneNumber" placeholder="Phone">
<input id="address" placeholder="Address">
<input id="email" placeholder="Email">
<button onclick="createPatient()">Create</button>

<div id="result"></div>

<script>
async function handleResponse(res){
  const data = await res.json().catch(() => ({error:"Invalid JSON"}));
  if(!res.ok){
    throw new Error(JSON.stringify(data));
  }
  return data;
}

async function searchPincode(){
  try{
    const pincode=document.getElementById("pincode").value;
    const res=await fetch("/api/pincode?pincode="+pincode);
    const data=await handleResponse(res);
    document.getElementById("result").innerHTML="<pre>"+JSON.stringify(data,null,2)+"</pre>";
  }catch(err){
    document.getElementById("result").innerHTML="<pre style='color:red'>"+err.message+"</pre>";
  }
}

async function services(){
  try{
    const id=document.getElementById("hospitalId").value;
    const res=await fetch("/api/services/"+id);
    const data=await handleResponse(res);
    document.getElementById("result").innerHTML="<pre>"+JSON.stringify(data,null,2)+"</pre>";
  }catch(err){
    document.getElementById("result").innerHTML="<pre style='color:red'>"+err.message+"</pre>";
  }
}

async function createPatient(){
  try{
    const payload={
      firstName:document.getElementById("firstName").value,
      lastName:document.getElementById("lastName").value,
      age:document.getElementById("age").value,
      gender:document.getElementById("gender").value,
      phoneNumber:document.getElementById("phoneNumber").value,
      address:document.getElementById("address").value,
      email:document.getElementById("email").value
    };
    const res=await fetch("/api/patient",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(payload)
    });
    const data=await handleResponse(res);
    document.getElementById("result").innerHTML="<pre>"+JSON.stringify(data,null,2)+"</pre>";
  }catch(err){
    document.getElementById("result").innerHTML="<pre style='color:red'>"+err.message+"</pre>";
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

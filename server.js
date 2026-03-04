const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const BASE_URL = "https://hospital-locator-api-jik9pb.5sc6y6-3.usa-e2.cloudhub.io";

// 🔐 PUT REAL VALUES HERE
const CLIENT_ID = "b78eb419b5b340d5826b815b76346975";
const CLIENT_SECRET = "8c45f7039f764625A6278eB4c057E611";

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

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: "Server Error: " + err.message });
  }
});

// 🔎 Get hospitals by city (NEW)
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

    const data = await response.json();
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

    const data = await response.json();
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

    const data = await response.json();
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
body{font-family:Segoe UI;background:linear-gradient(135deg,#1e3c72,#2a5298);color:white;text-align:center;padding:20px;}
input,button{padding:10px;margin:5px;border-radius:8px;border:none;}
button{background:#00c6ff;color:white;cursor:pointer;}
button:hover{background:#0072ff;}
.card{background:rgba(255,255,255,0.2);padding:15px;margin:10px;border-radius:10px;}
pre{background:black;color:#00ff90;padding:15px;border-radius:10px;text-align:left;}
</style>
</head>
<body>

<h1>🏥 Hospital Locator Web UI</h1>

<h3>Search By Pincode</h3>
<input id="pincode" placeholder="Enter Pincode">
<button onclick="searchPincode()">Search</button>

<h3>Search By City</h3>
<input id="city" placeholder="Enter City">
<button onclick="searchCity()">Search</button>

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
  const data = await res.json();
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

async function searchCity(){
  try{
    const city=document.getElementById("city").value;
    const res=await fetch("/api/city?city="+city);
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
    document.getElementByById("result").innerHTML="<pre style='color:red'>"+err.message+"</pre>";
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

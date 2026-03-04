const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const BASE_URL = "https://hospital-locator-api-jik9pb.5sc6y6-3.usa-e2.cloudhub.io";

// 🔐 PUT REAL VALUES HERE
const CLIENT_ID = "REPLACE_WITH_REAL_CLIENT_ID";
const CLIENT_SECRET = "REPLACE_WITH_REAL_CLIENT_SECRET";

/* =========================
   BACKEND API ROUTES
========================= */

// 🔎 Get hospitals by pincode
app.get("/api/pincode", async (req, res) => {
  try {
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
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
body{font-family:Segoe UI;background:#1e3c72;color:white;text-align:center;padding:20px;}
input,button{padding:10px;margin:5px;border-radius:8px;border:none;}
button{background:#00c6ff;color:white;cursor:pointer;}
.card{background:rgba(255,255,255,0.2);padding:15px;margin:10px;border-radius:10px;}
</style>
</head>
<body>

<h1>🏥 Hospital Locator</h1>

<h3>Search By Pincode</h3>
<input id="pincode" placeholder="Pincode">
<button onclick="search()">Search</button>

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
<input id="gmail" placeholder="Gmail">
<button onclick="createPatient()">Create</button>

<div id="result"></div>

<script>

async function search(){
const pincode=document.getElementById("pincode").value;
const res=await fetch("/api/pincode?pincode="+pincode);
const data=await res.json();
document.getElementById("result").innerHTML=
"<pre>"+JSON.stringify(data,null,2)+"</pre>";
}

async function services(){
const id=document.getElementById("hospitalId").value;
const res=await fetch("/api/services/"+id);
const data=await res.json();
document.getElementById("result").innerHTML=
"<pre>"+JSON.stringify(data,null,2)+"</pre>";
}

async function createPatient(){
const payload={
firstName:document.getElementById("firstName").value,
LastName:document.getElementById("lastName").value,
age:document.getElementById("age").value,
gender:document.getElementById("gender").value,
phoneNumber:document.getElementById("phoneNumber").value,
address:document.getElementById("address").value,
gmail:document.getElementById("gmail").value
};

const res=await fetch("/api/patient",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify(payload)
});

const data=await res.json();
document.getElementById("result").innerHTML=
"<pre>"+JSON.stringify(data,null,2)+"</pre>";
}

</script>

</body>
</html>
`);
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

const BASE_URL = "https://hospital-locator-api-jik9pb.5sc6y6-3.usa-e2.cloudhub.io";

// 🔐 ADD YOUR REAL VALUES HERE
const CLIENT_ID = "YOUR_CLIENT_ID";
const CLIENT_SECRET = "YOUR_CLIENT_SECRET";

app.get("/", (req, res) => {

res.send(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Hospital Locator</title>
<style>
body{
font-family:Segoe UI;
background:#1e3c72;
color:white;
text-align:center;
margin:0;
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
.card{
background:rgba(255,255,255,0.2);
padding:15px;
margin:10px;
border-radius:10px;
}
</style>
</head>
<body>

<h1>🏥 Hospital Locator</h1>

<h2>Search Hospital By Pincode</h2>
<input type="number" id="pincode" placeholder="Enter Pincode">
<button onclick="searchPincode()">Search</button>

<h2>Get Hospital Services</h2>
<input type="text" id="hospitalId" placeholder="Enter Hospital ID">
<button onclick="getServices()">Get Services</button>

<h2>Create Patient</h2>
<input type="text" id="firstName" placeholder="First Name">
<input type="text" id="lastName" placeholder="Last Name">
<input type="number" id="age" placeholder="Age">
<input type="text" id="gender" placeholder="Gender">
<input type="text" id="phoneNumber" placeholder="Phone Number">
<input type="text" id="address" placeholder="Address">
<input type="text" id="gmail" placeholder="Gmail">
<button onclick="createPatient()">Create Patient</button>

<div id="results"></div>

<script>

const headers = {
"Content-Type": "application/json",
"client_id": "${CLIENT_ID}",
"client_secret": "${CLIENT_SECRET}"
};

async function searchPincode(){
const pincode=document.getElementById("pincode").value;
if(!pincode){ alert("Enter pincode"); return; }

try{
const response=await fetch("${BASE_URL}/pincode?pincode="+pincode,{ headers });

if(!response.ok){
throw new Error("HTTP Error " + response.status);
}

const data=await response.json();

const container=document.getElementById("results");
container.innerHTML="";

if(data.length===0){
container.innerHTML="<p>No hospitals found</p>";
return;
}

data.forEach(h=>{
container.innerHTML+=\`
<div class="card">
<h3>\${h.NAME || h.name}</h3>
<p>\${h.ADDRESS || h.address}</p>
<p>\${h.PHONENUMBER || h.phone}</p>
</div>
\`;
});

}catch(err){
alert("API Error: " + err.message);
}
}

async function getServices(){
const id=document.getElementById("hospitalId").value;
if(!id){ alert("Enter hospital ID"); return; }

try{
const response=await fetch("${BASE_URL}/hospitals/"+id+"/services",{ headers });

if(!response.ok){
throw new Error("HTTP Error " + response.status);
}

const data=await response.json();

const container=document.getElementById("results");
container.innerHTML="<h3>Services:</h3>";

data.forEach(s=>{
container.innerHTML+=\`
<div class="card">\${s.SERVICE_NAME || s}</div>
\`;
});

}catch(err){
alert("API Error: " + err.message);
}
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

try{
const response=await fetch("${BASE_URL}/patients",{
method:"POST",
headers,
body: JSON.stringify(payload)
});

if(!response.ok){
throw new Error("HTTP Error " + response.status);
}

const data=await response.json();
alert("Patient Created Successfully");

}catch(err){
alert("API Error: " + err.message);
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

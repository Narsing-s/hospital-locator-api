const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;
const BASE_URL = "https://hospital-locator-api-jik9pb.5sc6y6-3.usa-e2.cloudhub.io";

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

<h2>Search By Pincode</h2>
<input type="number" id="pincode" placeholder="Enter Pincode">
<button onclick="searchPincode()">Search</button>

<h2>Get Hospital Services</h2>
<input type="text" id="hospitalId" placeholder="Enter Hospital ID">
<button onclick="getServices()">Get Services</button>

<h2>Create Patient</h2>
<input type="text" id="patientName" placeholder="Patient Name">
<input type="number" id="patientAge" placeholder="Age">
<button onclick="createPatient()">Create</button>

<div id="results"></div>

<script>

async function searchPincode(){
const pincode=document.getElementById("pincode").value;
if(!pincode){ alert("Enter pincode"); return; }

try{
const response=await fetch("${BASE_URL}/pincode?pincode="+pincode);
const data=await response.json();

const container=document.getElementById("results");
container.innerHTML="";

data.forEach(h=>{
container.innerHTML+=\`
<div class="card">
<h3>\${h.name}</h3>
<p>\${h.address}</p>
<p>\${h.phone}</p>
</div>
\`;
});

}catch(err){
alert("API Error");
}
}

async function getServices(){
const id=document.getElementById("hospitalId").value;
if(!id){ alert("Enter hospital ID"); return; }

try{
const response=await fetch("${BASE_URL}/hospitals/"+id+"/services");
const data=await response.json();

const container=document.getElementById("results");
container.innerHTML="<h3>Services:</h3>";

data.forEach(s=>{
container.innerHTML+=\`
<div class="card">\${s}</div>
\`;
});

}catch(err){
alert("API Error");
}
}

async function createPatient(){
const name=document.getElementById("patientName").value;
const age=document.getElementById("patientAge").value;

if(!name || !age){
alert("Enter name & age");
return;
}

try{
const response=await fetch("${BASE_URL}/patients",{
method:"POST",
headers:{ "Content-Type":"application/json" },
body: JSON.stringify({
name:name,
age:age
})
});

const data=await response.json();
alert("Patient Created: "+JSON.stringify(data));

}catch(err){
alert("API Error");
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

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
margin:0;
font-family:Segoe UI;
background:linear-gradient(135deg,#1e3c72,#2a5298);
color:white;
text-align:center;
}
input{
padding:10px;
border-radius:8px;
border:none;
}
button{
padding:10px 15px;
border-radius:8px;
border:none;
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

<input type="text" id="city" placeholder="Enter City">
<button onclick="searchHospital()">Search</button>

<div id="results"></div>

<script>
async function searchHospital(){
const city=document.getElementById("city").value;
if(!city){
alert("Enter city");
return;
}

try{
const response=await fetch("${BASE_URL}/hospitals?city="+city);
const data=await response.json();
const container=document.getElementById("results");
container.innerHTML="";

if(!data || data.length===0){
container.innerHTML="<p>No hospitals found</p>";
return;
}

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
</script>

</body>
</html>
`);
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

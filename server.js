const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

// ✅ Your Real CloudHub Hospital API URL
const BASE_URL = "https://hospital-locator-api-jik9pb.5sc6y6-3.usa-e2.cloudhub.io";

app.get('/', (req, res) => {

res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Hospital Locator</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {
            margin: 0;
            font-family: 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #1e3c72, #2a5298);
            color: white;
            text-align: center;
        }

        h1 {
            padding: 20px;
        }

        .search-box {
            margin: 20px;
        }

        input {
            padding: 12px;
            width: 250px;
            border-radius: 10px;
            border: none;
            font-size: 16px;
            outline: none;
        }

        button {
            padding: 12px 20px;
            border-radius: 10px;
            border: none;
            font-size: 16px;
            cursor: pointer;
            background: #00c6ff;
            color: white;
            margin-left: 10px;
            transition: 0.3s;
        }

        button:hover {
            background: #0072ff;
            transform: scale(1.05);
        }

        .results {
            margin-top: 30px;
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
        }

        .card {
            background: rgba(255,255,255,0.15);
            padding: 20px;
            margin: 15px;
            width: 260px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.4);
            transition: 0.3s;
        }

        .card:hover {
            transform: translateY(-5px);
        }

        .card h3 {
            margin: 10px 0;
        }

        #message {
            margin-top: 20px;
            font-weight: bold;
        }
    </style>
</head>

<body>

    <h1>🏥 Hospital Locator</h1>

    <div class="search-box">
        <input type="text" id="city" placeholder="Enter City">
        <button onclick="searchHospital()">Search</button>
    </div>

    <div id="message"></div>
    <div class="results" id="results"></div>

    <script>
        async function searchHospital() {
            const city = document.getElementById("city").value;

            if(!city){
                document.getElementById("message").innerText = "Please enter city";
                return;
            }

            document.getElementById("message").innerText = "Searching...";

            try {
                const response = await fetch("${BASE_URL}/hospitals?city=" + city);
                const data = await response.json();

                const container = document.getElementById("results");
                container.innerHTML = "";
                document.getElementById("message").innerText = "";

                if(!data || data.length === 0){
                    container.innerHTML = "<p>No hospitals found</p>";
                    return;
                }

                data.forEach(hospital => {
                    container.innerHTML += \`
                        <div class="card">
                            <h3>\${hospital.name}</h3>
                            <p><b>Address:</b> \${hospital.address}</p>
                            <p><b>Phone:</b> \${hospital.phone}</p>
                        </div>
                    \`;
                });

            } catch (err) {
                document.getElementById("message").innerText = "Error connecting to API";
            }
        }
    </script>

</body>
</html>
`);
});

app.listen(PORT, () => {
    console.log(\`Server running on port \${PORT}\`);
});

// Serve static frontend
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

// Optional: if you want "/" to always serve SPA (in case of deep links)
app.get(['/', '/ui', '/app', '/home'], (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

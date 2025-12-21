const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api'); // Rotaları içeri aldık

const app = express();

// Middleware (Ara Katmanlar)
app.use(cors());
app.use(express.json());

// Statik Dosyalar
app.use(express.static(path.join(__dirname, 'public')));
app.use('/data', express.static(path.join(__dirname, 'csv_data')));

// Rotaları Tanımla
// Artık tüm rotalar '/api' ile başlayacak (Örn: /api/heatmap)
app.use('/api', apiRoutes);

// Ana Sayfa Rotası
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

module.exports = app;
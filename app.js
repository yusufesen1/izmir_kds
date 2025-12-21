const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// ----------------------------------------------------------------
// 1. MIDDLEWARE (ARA YAZILIMLAR)
// ----------------------------------------------------------------
app.use(cors()); // Güvenlik / Erişim izni
app.use(express.json()); // JSON veri okuma
app.use(express.static(path.join(__dirname, 'public'))); // Frontend dosyalarını sunma

// ----------------------------------------------------------------
// 2. API ROTALARI (BACKEND TRAFİĞİ) 👮‍♂️
// ----------------------------------------------------------------

// A) Ana Dashboard (Durum Paneli)
// (Eğer eski api.js dosyan duruyorsa burası çalışır)
app.use('/api', require('./routes/api')); 

// B) Erişim & Adalet Sayfası
app.use('/api/access', require('./routes/access_api')); 

// C) Gelecek Tahmini (DSS) Sayfası
app.use('/api/forecast', require('./routes/forecast_api'));

// D) Operasyon & Optimizasyon Sayfası (YENİ EKLENDİ)
app.use('/api/operation', require('./routes/operation_api'));
app.use('/api/scenario', require('./routes/scenario_api'));
// ----------------------------------------------------------------
// 3. SAYFA YÖNLENDİRMELERİ (FRONTEND) 🖥️
// ----------------------------------------------------------------

// Ana Sayfa
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Erişim Sayfası
app.get('/erisim', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'erisim.html'));
});

// Gelecek Tahmini Sayfası
app.get('/gelecek', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'gelecek.html'));
});

// Operasyon Sayfası
app.get('/operasyon', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'operasyon.html'));
});
app.get('/senaryo', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'senaryo.html'));
});

// ----------------------------------------------------------------
// 4. SUNUCUYU BAŞLAT 🚀
// ----------------------------------------------------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`\n--------------------------------------------------`);
    console.log(`🚀 Rota35 Sunucusu Başlatıldı! Port: ${PORT}`);
    console.log(`--------------------------------------------------`);
    console.log(`📊 Durum Paneli:     http://localhost:${PORT}`);
    console.log(`⚖️  Erişim & Adalet:  http://localhost:${PORT}/erisim`);
    console.log(`🔮 Gelecek Tahmini:  http://localhost:${PORT}/gelecek`);
    console.log(`⚙️  Operasyon:        http://localhost:${PORT}/operasyon`);
    console.log(`--------------------------------------------------\n`);
});
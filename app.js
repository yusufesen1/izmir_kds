const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ----------------------------------------------------------------
// 1. MIDDLEWARE
// ----------------------------------------------------------------
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ----------------------------------------------------------------
// 2. ROUTERS (Yönlendiriciler)
// ----------------------------------------------------------------
// Eski api.js (Dashboard) -> dashboardRouter
const dashboardRouter = require('./routers/dashboardRouter');
const accessRouter = require('./routers/accessRouter');
const forecastRouter = require('./routers/forecastRouter');
const operationRouter = require('./routers/operationRouter');
const scenarioRouter = require('./routers/scenarioRouter');

// URL Tanımlamaları
app.use('/api', dashboardRouter); // Dashboard verileri yine /api altında
app.use('/api/access', accessRouter);
app.use('/api/forecast', forecastRouter);
app.use('/api/operation', operationRouter);
app.use('/api/scenario', scenarioRouter);

// ----------------------------------------------------------------
// 3. SAYFA YÖNLENDİRMELERİ
// ----------------------------------------------------------------
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/erisim', (req, res) => res.sendFile(path.join(__dirname, 'public', 'erisim.html')));
app.get('/gelecek', (req, res) => res.sendFile(path.join(__dirname, 'public', 'gelecek.html')));
app.get('/operasyon', (req, res) => res.sendFile(path.join(__dirname, 'public', 'operasyon.html')));
app.get('/senaryo', (req, res) => res.sendFile(path.join(__dirname, 'public', 'senaryo.html')));

// ----------------------------------------------------------------
// 4. BAŞLAT
// ----------------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});
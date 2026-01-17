const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const dashboardRouter = require('./routers/dashboardRouter');
const accessRouter = require('./routers/accessRouter');
const forecastRouter = require('./routers/forecastRouter');
const operationRouter = require('./routers/operationRouter');
const scenarioRouter = require('./routers/scenarioRouter');
const adminRouter = require('./routers/adminRouter');

app.use('/api', dashboardRouter); 
app.use('/api/access', accessRouter);
app.use('/api/forecast', forecastRouter);
app.use('/api/operation', operationRouter);
app.use('/api/scenario', scenarioRouter);
app.use('/api/admin', adminRouter);

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/erisim', (req, res) => res.sendFile(path.join(__dirname, 'public', 'erisim.html')));
app.get('/gelecek', (req, res) => res.sendFile(path.join(__dirname, 'public', 'gelecek.html')));
app.get('/operasyon', (req, res) => res.sendFile(path.join(__dirname, 'public', 'operasyon.html')));
app.get('/senaryo', (req, res) => res.sendFile(path.join(__dirname, 'public', 'senaryo.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});
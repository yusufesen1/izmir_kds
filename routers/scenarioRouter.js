const express = require('express');
const router = express.Router();
const scenarioController = require('../controllers/scenarioController');

router.post('/analyze-route', scenarioController.analyzeRoute);

module.exports = router;
const express = require('express');
const router = express.Router();
const operationController = require('../controllers/operationController');

router.get('/base-metrics', operationController.getBaseMetrics);

module.exports = router;
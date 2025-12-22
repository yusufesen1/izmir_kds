const express = require('express');
const router = express.Router();
const forecastController = require('../controllers/forecastController');

router.get('/projection-data', forecastController.getProjectionData);
router.get('/district-growth', forecastController.getDistrictGrowth);

module.exports = router;
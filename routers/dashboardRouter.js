const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboardController');

router.get('/heatmap', dashboardController.getHeatmap);
router.get('/yillik-ozet', dashboardController.getYearlySummary);
router.get('/top-duraklar', dashboardController.getTopStops);
router.get('/top-liste', dashboardController.getTopList);

module.exports = router;
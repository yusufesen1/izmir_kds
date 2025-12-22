const express = require('express');
const router = express.Router();
const accessController = require('../controllers/accessController');

router.get('/scatter-data', accessController.getScatterData);
router.get('/map-data', accessController.getMapData);
router.get('/student-stops', accessController.getStudentStops);

module.exports = router;
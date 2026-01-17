const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// CRUD Rotaları
router.get('/tariffs', adminController.getAllTariffs);   
router.post('/tariffs', adminController.addTariff);
router.put('/tariffs/:id', adminController.updateTariff); 
router.delete('/tariffs/:id', adminController.deleteTariff); 

module.exports = router;
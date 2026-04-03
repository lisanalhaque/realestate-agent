const express = require('express');
const { getDeals, createDeal, getDealById, updateDeal, deleteDeal } = require('../controllers/deal.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.route('/')
  .get(protect, getDeals)
  .post(protect, createDeal);

router.route('/:id')
  .get(protect, getDealById)
  .put(protect, updateDeal)
  .delete(protect, deleteDeal);

module.exports = router;

const express = require('express');
const { getProperties, createProperty, getPropertyById, updateProperty, deleteProperty } = require('../controllers/property.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.route('/')
  .get(protect, getProperties)
  .post(protect, createProperty);

router.route('/:id')
  .get(protect, getPropertyById)
  .put(protect, updateProperty)
  .delete(protect, deleteProperty);

module.exports = router;

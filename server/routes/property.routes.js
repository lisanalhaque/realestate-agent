const express = require('express');
const { getProperties, createProperty, getPropertyById, updateProperty, deleteProperty } = require('../controllers/property.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

const { authorize } = require('../middleware/role.middleware');
const upload = require('../middleware/multer');

router.route('/')
  .get(protect, getProperties)
  .post(protect, authorize('broker', 'admin'), upload.array('images', 5), createProperty);

router.route('/:id')
  .get(protect, getPropertyById)
  .put(protect, updateProperty)
  .delete(protect, deleteProperty);

module.exports = router;

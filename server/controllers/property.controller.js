const Property = require('../models/Property');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// @desc    Get all properties
// @route   GET /api/properties
// @access  Private (Agent: own, Admin/Manager: all)
const getProperties = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'broker') {
      filter = { listedBy: req.user._id };
    } else if (req.user.role === 'admin' && req.query.agentId) {
      filter = { listedBy: req.query.agentId };
    } else if (req.user.role === 'user') {
      filter = { status: 'available' };
    }
    const properties = await Property.find(filter).populate('listedBy', 'name email phone');
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new property
// @route   POST /api/properties
// @access  Private
const createProperty = async (req, res) => {
  try {
    let { title, type, status, price, location, area, bedrooms, bathrooms, contactNumber } = req.body;
    if (typeof location === 'string') {
      try {
        location = JSON.parse(location);
      } catch (e) {
        console.warn('Failed to parse location:', location);
        location = { address: location }; // Fallback
      }
    }
    
    let uploadedImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'boomagent_properties'
          });
          uploadedImages.push(result.secure_url);
          // Ephemeral cleanup: Remove the temporary file from the Node server immediately.
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (uploadError) {
          console.error('Failed to upload image to Cloudinary:', uploadError);
        }
      }
    }

    const property = await Property.create({
      title, type, status, price, location, area, bedrooms, bathrooms, contactNumber,
      images: uploadedImages,
      listedBy: req.user._id
    });

    res.status(201).json(property);
  } catch (error) {
    console.error('Property Creation Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single property
// @route   GET /api/properties/:id
// @access  Private
const getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate('listedBy', 'name email phone');
    if (property) {
      if (req.user.role === 'broker' && property.listedBy._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this property' });
      }
      res.json(property);
    } else {
      res.status(404).json({ message: 'Property not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update property
// @route   PUT /api/properties/:id
// @access  Private
const updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    if (req.user.role === 'broker' && property.listedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this property' });
    }

    const updatedProperty = await Property.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedProperty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete property
// @route   DELETE /api/properties/:id
// @access  Private
const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    if (req.user.role === 'broker' && property.listedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this property' });
    }

    await property.deleteOne();
    res.json({ message: 'Property removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProperties, createProperty, getPropertyById, updateProperty, deleteProperty };

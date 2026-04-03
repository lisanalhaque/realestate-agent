const Property = require('../models/Property');

// @desc    Get all properties
// @route   GET /api/properties
// @access  Private (Agent: own, Admin/Manager: all)
const getProperties = async (req, res) => {
  try {
    const filter = req.user.role === 'agent' ? { listedBy: req.user._id } : {};
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
    const { title, type, status, price, location, area, bedrooms, bathrooms, images } = req.body;
    
    const property = await Property.create({
      title, type, status, price, location, area, bedrooms, bathrooms, images,
      listedBy: req.user._id
    });

    res.status(201).json(property);
  } catch (error) {
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
      if (req.user.role === 'agent' && property.listedBy._id.toString() !== req.user._id.toString()) {
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

    if (req.user.role === 'agent' && property.listedBy.toString() !== req.user._id.toString()) {
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

    if (req.user.role === 'agent' && property.listedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this property' });
    }

    await property.deleteOne();
    res.json({ message: 'Property removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProperties, createProperty, getPropertyById, updateProperty, deleteProperty };

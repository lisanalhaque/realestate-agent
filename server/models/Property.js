const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, required: true, enum: ['apartment', 'villa', 'plot', 'commercial', 'house'] },
  status: { type: String, enum: ['available', 'under_negotiation', 'sold', 'rented'], default: 'available' },
  price: { type: Number, required: true },
  location: {
    address: String,
    city: String,
    state: String,
    pincode: String
  },
  area: { type: Number },
  bedrooms: { type: Number },
  bathrooms: { type: Number },
  contactNumber: { type: String },
  images: [{ type: String }],
  listedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  soldAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Property', propertySchema);

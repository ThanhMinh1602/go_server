const mongoose = require('mongoose');
const locationSchema = require('./Location');

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  types: {
    type: [String],
    required: true,
    enum: ['food', 'coffee'],
  },
  imageUrls: {
    type: [String],
    default: [],
  },
  location: {
    type: locationSchema,
    default: null,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Method to convert to JSON
restaurantSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Restaurant', restaurantSchema);


const mongoose = require('mongoose');
const latLngSchema = require('./LatLng');

const locationSchema = new mongoose.Schema({
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
  latLng: {
    type: latLngSchema,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  area: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true, // Temporarily false for migration, set to true after migration
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Method to convert to JSON
locationSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Location', locationSchema);

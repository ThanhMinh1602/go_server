const mongoose = require('mongoose');

const latLngSchema = new mongoose.Schema({
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
}, {
  _id: false, // Don't create _id for subdocuments
});

module.exports = latLngSchema;


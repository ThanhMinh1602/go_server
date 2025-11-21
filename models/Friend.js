const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

// Index to ensure unique friend relationships
friendSchema.index({ requester: 1, recipient: 1 }, { unique: true });

// Prevent duplicate friend requests
friendSchema.pre('save', async function(next) {
  // Check if reverse relationship exists
  const reverse = await mongoose.model('Friend').findOne({
    requester: this.recipient,
    recipient: this.requester,
  });
  
  if (reverse && reverse.status === 'accepted') {
    return next(new Error('Already friends'));
  }
  
  next();
});

// Method to convert to JSON
friendSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Friend', friendSchema);


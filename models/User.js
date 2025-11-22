const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    select: false, // Don't return password by default
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    default: null,
  },
  avatar: {
    type: String,
    default: null,
  },
  fcmToken: {
    type: String,
    default: null,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to convert to JSON (exclude password)
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);


const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    businessName: { type: String, required: true, trim: true },
    businessDescription: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    logo: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['pending', 'active', 'suspended', 'rejected'], default: 'pending', index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vendor', vendorSchema);

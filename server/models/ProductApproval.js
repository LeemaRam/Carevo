const mongoose = require('mongoose');

const productApprovalSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    action: {
      type: String,
      enum: ['submitted', 'approved', 'rejected', 'changes_requested', 'resubmitted'],
      required: true,
      index: true,
    },
    comment: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProductApproval', productApprovalSchema);

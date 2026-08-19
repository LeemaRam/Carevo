const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    description: { type: String, trim: true, default: '' },
    sku: { type: String, trim: true, required: true, unique: true, index: true },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0, default: null },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected', 'changes_requested', 'inactive'],
      default: 'draft',
      index: true,
    },
    reviewComment: { type: String, trim: true, default: '' },
    lastSubmittedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);

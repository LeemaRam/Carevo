const ProductApproval = require('../models/ProductApproval');
const ProductChangeRequest = require('../models/ProductChangeRequest');
const Product = require('../models/Product');
const { applyApprovedChangeRequest } = require('./productService');

const approvePendingProduct = async ({ product, adminId, comment }) => {
  product.status = 'approved';
  product.reviewComment = '';
  await product.save();

  await ProductApproval.create({
    productId: product._id,
    vendorId: product.vendorId,
    adminId,
    action: 'approved',
    comment: comment ?? 'Product approved.',
  });

  return product;
};

const rejectPendingProduct = async ({ product, adminId, comment }) => {
  product.status = 'rejected';
  product.reviewComment = comment ?? '';
  await product.save();

  await ProductApproval.create({
    productId: product._id,
    vendorId: product.vendorId,
    adminId,
    action: 'rejected',
    comment: comment ?? '',
  });

  return product;
};

const requestChangesForProduct = async ({ product, adminId, comment }) => {
  product.status = 'changes_requested';
  product.reviewComment = comment ?? '';
  await product.save();

  await ProductApproval.create({
    productId: product._id,
    vendorId: product.vendorId,
    adminId,
    action: 'changes_requested',
    comment: comment ?? '',
  });

  return product;
};

const reviewChangeRequest = async ({ changeRequest, action, adminId, comment }) => {
  if (action === 'approve') {
    await applyApprovedChangeRequest({ changeRequest, adminId, comment });
    return;
  }

  changeRequest.status = 'rejected';
  changeRequest.reviewedBy = adminId;
  changeRequest.reviewedAt = new Date();
  changeRequest.reviewComment = comment ?? '';
  await changeRequest.save();

  await ProductApproval.create({
    productId: changeRequest.productId,
    vendorId: changeRequest.vendorId,
    adminId,
    action: 'rejected',
    comment: comment ?? 'Rejected product change request.',
  });
};

const getPendingReviewFeed = async () => {
  const [pendingProducts, pendingChanges] = await Promise.all([
    Product.find({ status: 'pending' })
      .populate({ path: 'vendorId', populate: { path: 'userId', select: 'name email' } })
      .populate('categoryId')
      .sort({ updatedAt: -1 }),
    ProductChangeRequest.find({ status: 'pending' })
      .populate({ path: 'vendorId', populate: { path: 'userId', select: 'name email' } })
      .populate('categoryId')
      .populate('productId', 'name status sku price stockQuantity')
      .sort({ updatedAt: -1 }),
  ]);

  return { pendingProducts, pendingChanges };
};

module.exports = {
  approvePendingProduct,
  rejectPendingProduct,
  requestChangesForProduct,
  reviewChangeRequest,
  getPendingReviewFeed,
};

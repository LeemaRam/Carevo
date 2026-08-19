const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const ProductImage = require('../models/ProductImage');
const ProductApproval = require('../models/ProductApproval');
const ProductChangeRequest = require('../models/ProductChangeRequest');
const { slugify } = require('../utils/productHelpers');

const buildProductPayload = (body) => ({
  name: body.name?.trim(),
  description: body.description?.trim() ?? '',
  categoryId: body.categoryId,
  sku: body.sku?.trim(),
  price: body.price,
  discountPrice: body.discountPrice ?? null,
  stockQuantity: body.stockQuantity,
});

const validateCategory = async (categoryId) => {
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    const error = new Error('Invalid category.');
    error.status = 400;
    throw error;
  }

  const category = await Category.findOne({ _id: categoryId, status: 'active' });
  if (!category) {
    const error = new Error('Invalid category.');
    error.status = 400;
    throw error;
  }
};

const assertSkuAvailable = async (sku, excludeProductId) => {
  if (!sku) return;
  if (!/^[A-Za-z0-9._-]+$/.test(sku)) {
    const error = new Error('SKU contains invalid characters.');
    error.status = 400;
    throw error;
  }

  const filter = { sku };
  if (excludeProductId) {
    filter._id = { $ne: excludeProductId };
  }
  const exists = await Product.findOne(filter).select('_id');
  if (exists) {
    const error = new Error('SKU already exists.');
    error.status = 409;
    throw error;
  }
};

const setProductImages = async (productId, imagePaths, session = null) => {
  const deleteQuery = ProductImage.deleteMany({ productId });
  if (session) deleteQuery.session(session);
  await deleteQuery;
  if (!imagePaths || imagePaths.length === 0) return;

  const docs = imagePaths.map((imagePath, index) => ({
    productId,
    imagePath,
    isPrimary: index === 0,
    sortOrder: index,
  }));

  await ProductImage.insertMany(docs, session ? { session } : undefined);
};

const createProduct = async ({ vendorId, body, imagePaths }) => {
  await validateCategory(body.categoryId);
  await assertSkuAvailable(body.sku);

  const payload = buildProductPayload(body);
  const product = await Product.create({
    vendorId,
    ...payload,
    slug: slugify(payload.name),
    status: 'draft',
  });

  await setProductImages(product._id, imagePaths);
  return product;
};

const updateDraftOrRejectedProduct = async ({ product, body, imagePaths }) => {
  await validateCategory(body.categoryId);
  await assertSkuAvailable(body.sku, product._id);

  const payload = buildProductPayload(body);
  Object.assign(product, {
    ...payload,
    slug: slugify(payload.name),
  });

  if (product.status === 'changes_requested') {
    product.status = 'draft';
  }

  await product.save();

  if (imagePaths && imagePaths.length) {
    await setProductImages(product._id, imagePaths);
  }

  return product;
};

const submitProduct = async ({ product, vendorId }) => {
  if (!['draft', 'rejected', 'changes_requested'].includes(product.status)) {
    const error = new Error('Only draft/rejected/changes requested products can be submitted.');
    error.status = 400;
    throw error;
  }

  const isResubmitted = product.status === 'changes_requested' || product.status === 'rejected';

  product.status = 'pending';
  product.reviewComment = '';
  product.lastSubmittedAt = new Date();
  await product.save();

  await ProductApproval.create({
    productId: product._id,
    vendorId,
    action: isResubmitted ? 'resubmitted' : 'submitted',
  });

  return product;
};

const createOrUpdateChangeRequest = async ({ product, vendorId, body, imagePaths }) => {
  await validateCategory(body.categoryId);
  await assertSkuAvailable(body.sku, product._id);

  const payload = buildProductPayload(body);

  const existingPending = await ProductChangeRequest.findOne({
    productId: product._id,
    vendorId,
    status: 'pending',
  });

  if (existingPending) {
    Object.assign(existingPending, {
      ...payload,
      imagePaths: imagePaths?.length ? imagePaths : existingPending.imagePaths,
      submittedAt: new Date(),
      reviewComment: '',
      reviewedAt: null,
      reviewedBy: null,
    });
    await existingPending.save();
    return existingPending;
  }

  return ProductChangeRequest.create({
    productId: product._id,
    vendorId,
    ...payload,
    imagePaths: imagePaths ?? [],
    status: 'pending',
    submittedAt: new Date(),
  });
};

const applyApprovedChangeRequest = async ({ changeRequest, adminId, comment }) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const product = await Product.findById(changeRequest.productId).session(session);
      if (!product) {
        throw new Error('Product not found for this change request.');
      }

      Object.assign(product, {
        name: changeRequest.name,
        slug: slugify(changeRequest.name),
        description: changeRequest.description,
        categoryId: changeRequest.categoryId,
        sku: changeRequest.sku,
        price: changeRequest.price,
        discountPrice: changeRequest.discountPrice,
        stockQuantity: changeRequest.stockQuantity,
        status: 'approved',
        reviewComment: '',
      });

      await product.save({ session });

      if (changeRequest.imagePaths?.length) {
        await setProductImages(product._id, changeRequest.imagePaths, session);
      }

      changeRequest.status = 'approved';
      changeRequest.reviewedBy = adminId;
      changeRequest.reviewedAt = new Date();
      changeRequest.reviewComment = comment ?? '';
      await changeRequest.save({ session });

      await ProductApproval.create(
        [
          {
            productId: product._id,
            vendorId: product.vendorId,
            adminId,
            action: 'approved',
            comment: comment ?? 'Approved change request.',
          },
        ],
        { session }
      );
    });
  } finally {
    session.endSession();
  }
};

module.exports = {
  createProduct,
  updateDraftOrRejectedProduct,
  submitProduct,
  createOrUpdateChangeRequest,
  applyApprovedChangeRequest,
  setProductImages,
};

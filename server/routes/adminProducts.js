const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const Product = require('../models/Product');
const ProductImage = require('../models/ProductImage');
const ProductApproval = require('../models/ProductApproval');
const ProductChangeRequest = require('../models/ProductChangeRequest');
const Vendor = require('../models/Vendor');
const productApprovalService = require('../services/productApprovalService');

const router = express.Router();
router.use(auth, requireRole('admin'));

const reviewValidation = [body('comment').optional().isString().withMessage('Comment must be text.')];

router.get('/products', async (req, res, next) => {
  try {
    const products = await Product.find({})
      .populate('categoryId', 'name slug')
      .populate({ path: 'vendorId', populate: { path: 'userId', select: 'name email' } })
      .sort({ updatedAt: -1 });

    res.json(products);
  } catch (err) {
    next(err);
  }
});

router.get('/products/pending', async (req, res, next) => {
  try {
    const feed = await productApprovalService.getPendingReviewFeed();
    res.json(feed);
  } catch (err) {
    next(err);
  }
});

router.get('/products/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID.' });
    }

    const product = await Product.findById(id)
      .populate('categoryId')
      .populate({ path: 'vendorId', populate: { path: 'userId', select: 'name email role' } });

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const [images, approvals, pendingChange] = await Promise.all([
      ProductImage.find({ productId: product._id }).sort({ sortOrder: 1 }),
      ProductApproval.find({ productId: product._id }).populate('adminId', 'name email').sort({ createdAt: -1 }),
      ProductChangeRequest.findOne({ productId: product._id, status: 'pending' }).populate('reviewedBy', 'name email'),
    ]);

    res.json({
      ...product.toObject(),
      images: images.map((img) => img.imagePath),
      approvals,
      pendingChangeRequest: pendingChange,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/products/:id/approve', reviewValidation, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID.' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    if (product.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending products can be approved.' });
    }

    const updated = await productApprovalService.approvePendingProduct({
      product,
      adminId: req.user.id,
      comment: req.body.comment,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.post('/products/:id/reject', reviewValidation, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID.' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    if (product.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending products can be rejected.' });
    }

    const updated = await productApprovalService.rejectPendingProduct({
      product,
      adminId: req.user.id,
      comment: req.body.comment,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.post('/products/:id/request-changes', reviewValidation, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID.' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    if (product.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending products can be marked for changes.' });
    }

    const updated = await productApprovalService.requestChangesForProduct({
      product,
      adminId: req.user.id,
      comment: req.body.comment,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.get('/products/:id/approvals', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID.' });
    }

    const approvals = await ProductApproval.find({ productId: id })
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 });

    res.json(approvals);
  } catch (err) {
    next(err);
  }
});

router.post('/change-requests/:id/approve', reviewValidation, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid change request ID.' });
    }

    const changeRequest = await ProductChangeRequest.findById(id);
    if (!changeRequest) {
      return res.status(404).json({ message: 'Change request not found.' });
    }

    if (changeRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending change requests can be approved.' });
    }

    await productApprovalService.reviewChangeRequest({
      changeRequest,
      action: 'approve',
      adminId: req.user.id,
      comment: req.body.comment,
    });

    res.json({ message: 'Change request approved and applied to live product.' });
  } catch (err) {
    next(err);
  }
});

router.post('/change-requests/:id/reject', reviewValidation, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid change request ID.' });
    }

    const changeRequest = await ProductChangeRequest.findById(id);
    if (!changeRequest) {
      return res.status(404).json({ message: 'Change request not found.' });
    }

    if (changeRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending change requests can be rejected.' });
    }

    await productApprovalService.reviewChangeRequest({
      changeRequest,
      action: 'reject',
      adminId: req.user.id,
      comment: req.body.comment,
    });

    res.json({ message: 'Change request rejected. Live product remains unchanged.' });
  } catch (err) {
    next(err);
  }
});

router.get('/vendors', async (req, res, next) => {
  try {
    const vendors = await Vendor.find({}).populate('userId', 'name email role').sort({ createdAt: -1 });
    res.json(vendors);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

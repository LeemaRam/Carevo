const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const upload = require('../middleware/uploadProductImages');
const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const ProductImage = require('../models/ProductImage');
const ProductApproval = require('../models/ProductApproval');
const ProductChangeRequest = require('../models/ProductChangeRequest');
const productService = require('../services/productService');

const router = express.Router();
router.use(auth, requireRole('vendor'));

const productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required.'),
  body('categoryId').notEmpty().withMessage('Category is required.'),
  body('sku').trim().notEmpty().withMessage('SKU is required.'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be 0 or greater.'),
  body('discountPrice')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Discount price must be 0 or greater.'),
  body('stockQuantity').isInt({ min: 0 }).withMessage('Stock quantity must be 0 or greater.'),
];

const resolveVendor = async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user.id });
  if (!vendor) {
    res.status(403).json({ message: 'Vendor profile not found.' });
    return null;
  }

  if (vendor.status === 'suspended' || vendor.status === 'rejected') {
    res.status(403).json({ message: 'Vendor account is not active.' });
    return null;
  }

  return vendor;
};

const parseProductPayload = (body) => ({
  ...body,
  price: Number(body.price),
  discountPrice: body.discountPrice === '' || body.discountPrice === undefined ? null : Number(body.discountPrice),
  stockQuantity: Number(body.stockQuantity),
});

router.get('/profile', async (req, res, next) => {
  try {
    const vendor = await resolveVendor(req, res);
    if (!vendor) return;
    res.json(vendor);
  } catch (err) {
    next(err);
  }
});

router.get('/products', async (req, res, next) => {
  try {
    const vendor = await resolveVendor(req, res);
    if (!vendor) return;

    const products = await Product.find({ vendorId: vendor._id }).populate('categoryId', 'name').sort({ updatedAt: -1 });
    const productIds = products.map((product) => product._id);
    const images = await ProductImage.find({ productId: { $in: productIds } }).sort({ sortOrder: 1 });
    const pendingChanges = await ProductChangeRequest.find({ vendorId: vendor._id, status: 'pending' });

    const imageMap = new Map();
    images.forEach((image) => {
      const key = image.productId.toString();
      if (!imageMap.has(key)) imageMap.set(key, []);
      imageMap.get(key).push(image.imagePath);
    });

    const pendingMap = new Map(pendingChanges.map((change) => [change.productId.toString(), change]));

    res.json(
      products.map((product) => ({
        ...product.toObject(),
        images: imageMap.get(product._id.toString()) ?? [],
        pendingChangeRequest: pendingMap.get(product._id.toString()) ?? null,
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.get('/products/:id', async (req, res, next) => {
  try {
    const vendor = await resolveVendor(req, res);
    if (!vendor) return;

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID.' });
    }

    const product = await Product.findOne({ _id: id, vendorId: vendor._id }).populate('categoryId', 'name slug');
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const [images, approvals, pendingChange] = await Promise.all([
      ProductImage.find({ productId: product._id }).sort({ sortOrder: 1 }),
      ProductApproval.find({ productId: product._id }).populate('adminId', 'name email').sort({ createdAt: -1 }),
      ProductChangeRequest.findOne({ productId: product._id, status: 'pending' }),
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

router.post('/products', upload.array('images', 6), productValidation, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const vendor = await resolveVendor(req, res);
    if (!vendor) return;

    const imagePaths = (req.files ?? []).map((file) => `/uploads/products/${file.filename}`);
    const product = await productService.createProduct({
      vendorId: vendor._id,
      body: parseProductPayload(req.body),
      imagePaths,
    });

    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

router.put('/products/:id', upload.array('images', 6), productValidation, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const vendor = await resolveVendor(req, res);
    if (!vendor) return;

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID.' });
    }

    const product = await Product.findOne({ _id: id, vendorId: vendor._id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const body = parseProductPayload(req.body);
    const imagePaths = (req.files ?? []).map((file) => `/uploads/products/${file.filename}`);

    if (product.status === 'approved') {
      const changeRequest = await productService.createOrUpdateChangeRequest({
        product,
        vendorId: vendor._id,
        body,
        imagePaths,
      });

      return res.json({
        message: 'Change request submitted for admin approval. Existing live product remains unchanged.',
        changeRequest,
      });
    }

    const updated = await productService.updateDraftOrRejectedProduct({
      product,
      body,
      imagePaths,
    });

    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/products/:id', async (req, res, next) => {
  try {
    const vendor = await resolveVendor(req, res);
    if (!vendor) return;

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID.' });
    }

    const product = await Product.findOne({ _id: id, vendorId: vendor._id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    if (product.status === 'approved') {
      return res.status(400).json({ message: 'Approved products cannot be deleted directly.' });
    }

    await Promise.all([
      ProductImage.deleteMany({ productId: product._id }),
      ProductChangeRequest.deleteMany({ productId: product._id }),
      ProductApproval.deleteMany({ productId: product._id }),
      product.deleteOne(),
    ]);

    res.json({ message: 'Product deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

router.post('/products/:id/submit', async (req, res, next) => {
  try {
    const vendor = await resolveVendor(req, res);
    if (!vendor) return;

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID.' });
    }

    const product = await Product.findOne({ _id: id, vendorId: vendor._id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const submitted = await productService.submitProduct({ product, vendorId: vendor._id });
    res.json(submitted);
  } catch (err) {
    next(err);
  }
});

router.get('/products/:id/approvals', async (req, res, next) => {
  try {
    const vendor = await resolveVendor(req, res);
    if (!vendor) return;

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID.' });
    }

    const product = await Product.findOne({ _id: id, vendorId: vendor._id }).select('_id');
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const approvals = await ProductApproval.find({ productId: product._id })
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 });
    res.json(approvals);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

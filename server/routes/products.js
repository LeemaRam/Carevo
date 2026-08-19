const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const ProductImage = require('../models/ProductImage');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { search, category } = req.query;
    const filter = { status: 'approved' };

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ name: regex }, { description: regex }, { sku: regex }];
    }

    if (category && mongoose.Types.ObjectId.isValid(category)) {
      filter.categoryId = category;
    }

    const products = await Product.find(filter)
      .populate('categoryId', 'name slug')
      .populate({ path: 'vendorId', populate: { path: 'userId', select: 'name' } })
      .sort({ createdAt: -1 });

    const productIds = products.map((product) => product._id);
    const images = await ProductImage.find({ productId: { $in: productIds } }).sort({ sortOrder: 1 });
    const imageMap = new Map();

    images.forEach((image) => {
      const key = image.productId.toString();
      if (!imageMap.has(key)) imageMap.set(key, []);
      imageMap.get(key).push(image.imagePath);
    });

    const response = products.map((product) => ({
      ...product.toObject(),
      images: imageMap.get(product._id.toString()) ?? [],
      primaryImage: imageMap.get(product._id.toString())?.[0] ?? '',
    }));

    res.json(response);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID.' });
    }

    const product = await Product.findOne({ _id: id, status: 'approved' })
      .populate('categoryId', 'name slug description')
      .populate({ path: 'vendorId', populate: { path: 'userId', select: 'name' } });

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const images = await ProductImage.find({ productId: product._id }).sort({ sortOrder: 1 });

    res.json({
      ...product.toObject(),
      images: images.map((img) => img.imagePath),
      primaryImage: images[0]?.imagePath ?? '',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

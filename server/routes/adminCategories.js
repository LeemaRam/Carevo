const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const Category = require('../models/Category');
const { slugify } = require('../utils/productHelpers');

const router = express.Router();
router.use(auth, requireRole('admin'));

const categoryValidation = [body('name').trim().notEmpty().withMessage('Category name is required.')];

router.get('/categories', async (req, res, next) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

router.post('/categories', categoryValidation, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description, image, status } = req.body;
    const slug = slugify(name);

    const existing = await Category.findOne({ slug });
    if (existing) {
      return res.status(409).json({ message: 'Category already exists.' });
    }

    const category = await Category.create({
      name,
      slug,
      description: description ?? '',
      image: image ?? '',
      status: status === 'inactive' ? 'inactive' : 'active',
    });

    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
});

router.put('/categories/:id', categoryValidation, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid category ID.' });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    const newSlug = slugify(req.body.name);
    if (newSlug !== category.slug) {
      const duplicate = await Category.findOne({ slug: newSlug, _id: { $ne: id } });
      if (duplicate) {
        return res.status(409).json({ message: 'Category slug already exists.' });
      }
    }

    category.name = req.body.name;
    category.slug = newSlug;
    category.description = req.body.description ?? '';
    category.image = req.body.image ?? '';
    category.status = req.body.status === 'inactive' ? 'inactive' : 'active';
    await category.save();

    res.json(category);
  } catch (err) {
    next(err);
  }
});

router.delete('/categories/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid category ID.' });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    await category.deleteOne();
    res.json({ message: 'Category deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

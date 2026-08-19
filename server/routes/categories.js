const express = require('express');
const Category = require('../models/Category');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const categories = await Category.find({ status: 'active' }).sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

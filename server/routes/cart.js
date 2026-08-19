const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const cartService = require('../services/cartService');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    const cart = await cartService.getCartDetails(req.user.id);
    res.json(cart);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/items',
  [
    body('productId').notEmpty().withMessage('Product ID is required.'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer.'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const cart = await cartService.addCartItem(req.user.id, req.body.productId, req.body.quantity);
      res.status(201).json(cart);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/items/:id',
  [body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer.')],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const cart = await cartService.updateCartItem(req.user.id, req.params.id, req.body.quantity);
      res.json(cart);
    } catch (err) {
      next(err);
    }
  }
);

router.delete('/items/:id', async (req, res, next) => {
  try {
    const cart = await cartService.removeCartItem(req.user.id, req.params.id);
    res.json(cart);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

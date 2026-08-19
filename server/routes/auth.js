const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Vendor = require('../models/Vendor');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET is not set. Using insecure development fallback secret.');
}

const signToken = (user) =>
  jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role')
      .optional()
      .isIn(['customer', 'vendor'])
      .withMessage('Role must be customer or vendor'),
    body('businessName')
      .optional()
      .isLength({ min: 2 })
      .withMessage('Business name must be at least 2 characters'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, password } = req.body;
      const role = req.body.role === 'vendor' ? 'vendor' : 'customer';

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ message: 'Email is already registered.' });
      }

      const user = await User.create({ name, email, password, role });
      if (role === 'vendor') {
        await Vendor.create({
          userId: user._id,
          businessName: req.body.businessName?.trim() || `${name}'s Store`,
          businessDescription: req.body.businessDescription?.trim() || '',
          phone: req.body.phone?.trim() || '',
          address: req.body.address?.trim() || '',
          status: 'pending',
        });
      }
      const token = signToken(user);

      res.status(201).json({
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      const match = await user.comparePassword(password);
      if (!match) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      const token = signToken(user);

      res.json({
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;

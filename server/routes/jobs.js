const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Job = require('../models/Job');

const router = express.Router();
router.use(auth);

// GET /api/jobs
router.get('/', async (req, res, next) => {
  try {
    const { status, search, sort } = req.query;
    const filter = { userId: req.user.id };

    if (status) {
      filter.status = status;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ company: regex }, { title: regex }];
    }

    const sortOrder = sort === 'date_asc' ? { applicationDate: 1 } : { applicationDate: -1 };

    const jobs = await Job.find(filter).sort(sortOrder);
    res.json(jobs);
  } catch (err) {
    next(err);
  }
});

// GET /api/jobs/stats
router.get('/stats', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [total, applied, interview, offer, rejected, monthlyRaw] = await Promise.all([
      Job.countDocuments({ userId }),
      Job.countDocuments({ userId, status: 'Applied' }),
      Job.countDocuments({ userId, status: 'Interview' }),
      Job.countDocuments({ userId, status: 'Offer' }),
      Job.countDocuments({ userId, status: 'Rejected' }),
      Job.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: {
              year: { $year: '$applicationDate' },
              month: { $month: '$applicationDate' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthly = monthlyRaw.map(d => ({
      month: `${MONTHS[d._id.month - 1]} ${d._id.year}`,
      count: d.count,
    }));

    res.json({ total, applied, interview, offer, rejected, monthly });
  } catch (err) {
    next(err);
  }
});

// POST /api/jobs
router.post(
  '/',
  [
    body('company').trim().notEmpty().withMessage('Company is required'),
    body('title').trim().notEmpty().withMessage('Job title is required'),
    body('status')
      .optional()
      .isIn(['Applied', 'Interview', 'Offer', 'Rejected'])
      .withMessage('Invalid status'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { company, title, status, applicationDate, notes, jobLink } = req.body;

      const job = await Job.create({
        userId: req.user.id,
        company,
        title,
        status,
        applicationDate,
        notes,
        jobLink,
      });

      res.status(201).json(job);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/jobs/:id
router.put(
  '/:id',
  [
    body('status')
      .optional()
      .isIn(['Applied', 'Interview', 'Offer', 'Rejected'])
      .withMessage('Invalid status'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid job ID.' });
      }

      const job = await Job.findById(id);
      if (!job) {
        return res.status(404).json({ message: 'Job not found.' });
      }

      if (job.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to update this job.' });
      }

      const allowedFields = ['company', 'title', 'status', 'applicationDate', 'notes', 'jobLink'];
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          job[field] = req.body[field];
        }
      });
      job.updatedAt = new Date();

      await job.save();
      res.json(job);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/jobs/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid job ID.' });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    if (job.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this job.' });
    }

    await job.deleteOne();
    res.json({ message: 'Job deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

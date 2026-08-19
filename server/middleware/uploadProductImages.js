const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', 'uploads', 'products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `product-${uniqueSuffix}${ext}`);
  },
});

const allowedMime = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);

const fileFilter = (_, file, cb) => {
  if (!allowedMime.has(file.mimetype)) {
    cb(new Error('Only JPEG, PNG, and WEBP images are allowed.'));
    return;
  }
  cb(null, true);
};

module.exports = multer({
  storage,
  limits: {
    files: 6,
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter,
});

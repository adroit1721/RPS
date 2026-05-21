const express = require('express');
const multer = require('multer');
const path = require('path');
const School = require('../models/School');
const auth = require('../middleware/auth');
const router = express.Router();

// Configure Multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only images are allowed!'));
  }
});

// Get School Settings (Public)
router.get('/', async (req, res) => {
  try {
    let school = await School.findOne();
    if (!school) {
      school = await School.create({ name: 'Default School Name' });
    }
    res.json(school);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// Update School Settings (Admin Only)
router.put('/', auth(['admin']), async (req, res) => {
  try {
    const { name, address, email } = req.body;
    const school = await School.findOneAndUpdate({}, { name, address, email }, { new: true, upsert: true });
    res.json(school);
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
});

// Upload Logo (Admin Only)
router.post('/upload-logo', auth(['admin']), upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });
    const logoUrl = `/uploads/${req.file.filename}`;
    const school = await School.findOneAndUpdate({}, { logoUrl }, { new: true, upsert: true });
    res.json(school);
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
});

// Upload Signature (Admin Only)
router.post('/upload-signature', auth(['admin']), upload.single('signature'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });
    const signatureUrl = `/uploads/${req.file.filename}`;
    const school = await School.findOneAndUpdate({}, { signatureUrl }, { new: true, upsert: true });
    res.json(school);
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
});

module.exports = router;

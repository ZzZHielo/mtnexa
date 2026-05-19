const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|svg|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar|mp4|mp3|wav)$/i;
    if (allowed.test(path.extname(file.originalname))) cb(null, true);
    else cb(new Error('Tipo de archivo no permitido'));
  },
});

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No se recibió ningún archivo' });
  const url = '/uploads/' + req.file.filename;
  res.json({
    success: true,
    url,
    nombre: req.file.originalname,
    tipo: req.file.mimetype,
    tamano: req.file.size,
  });
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ success: false, message: 'El archivo excede 10MB' });
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err) return res.status(400).json({ success: false, message: err.message });
  next();
});

module.exports = router;

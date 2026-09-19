import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure absolute paths for stability across environments
const rootDir = path.join(__dirname, '..');
const uploadDir = path.join(rootDir, 'uploads');
const chatUploadDir = path.join(uploadDir, 'chat');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(chatUploadDir)) {
  fs.mkdirSync(chatUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isChat = req.originalUrl.includes('/chat/');
    if (isChat) return cb(null, chatUploadDir);

    let subFolder = 'general';
    const user = req.user;

    if (user) {
      const role = user.role;
      const id = user.patientId || user.doctorId || user.adminId || user._id.toString();
      subFolder = path.join(role, id);
    } else if (req.originalUrl.includes('/register/doctor')) {
      // For doctor registration, use a temp or email-based folder since ID isn't generated yet
      const emailHint = (req.body.email || 'pending').replace(/[^a-z0-9]/gi, '_');
      subFolder = path.join('doctor', 'registration_' + emailHint);
    }

    const finalPath = path.join(uploadDir, subFolder);

    if (!fs.existsSync(finalPath)) {
      fs.mkdirSync(finalPath, { recursive: true });
    }

    cb(null, finalPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow common clinical imaging and document formats + webm for voice/video notes
  const allowedTypes = /jpeg|jpg|png|webp|pdf|webm|mp3|wav|ogg|mpeg/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype || extname) {
    return cb(null, true);
  } else {
    console.warn(`[UPLOAD_BLOCK] Unsupported format: ${file.mimetype} (${file.originalname})`);
    cb(new Error('Format not supported by institutional security node.'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

export default upload;

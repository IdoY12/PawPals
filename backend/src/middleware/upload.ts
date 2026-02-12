import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// File filter for images
const imageFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, png, gif, webp) are allowed'));
  }
};

// Create multer instance for single image upload
export const uploadSingle = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
}).single('image');

// Create multer instance for multiple image uploads
export const uploadMultiple = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 5, // Max 5 files
  },
}).array('images', 5);

// Create multer instance for profile picture
export const uploadProfilePicture = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max file size for profile pictures
  },
}).single('profilePicture');

// Create multer instance for dog photos
export const uploadDogPhoto = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 3 * 1024 * 1024, // 3MB max file size for dog photos
  },
}).single('dogPhoto');

/**
 * Get the URL for an uploaded file
 */
export const getFileUrl = (filename: string, baseUrl: string): string => {
  return `${baseUrl}/uploads/${filename}`;
};

/**
 * Delete uploaded file
 */
export const deleteFile = (filename: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const filepath = path.join(uploadsDir, filename);
    
    fs.unlink(filepath, (err) => {
      if (err && err.code !== 'ENOENT') {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

export default { uploadSingle, uploadMultiple, uploadProfilePicture, uploadDogPhoto };

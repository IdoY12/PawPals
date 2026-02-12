"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.getFileUrl = exports.uploadDogPhoto = exports.uploadProfilePicture = exports.uploadMultiple = exports.uploadSingle = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Ensure uploads directory exists
const uploadsDir = path_1.default.join(__dirname, '../../uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
// Configure multer storage
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});
// File filter for images
const imageFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Only image files (jpeg, png, gif, webp) are allowed'));
    }
};
// Create multer instance for single image upload
exports.uploadSingle = (0, multer_1.default)({
    storage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
    },
}).single('image');
// Create multer instance for multiple image uploads
exports.uploadMultiple = (0, multer_1.default)({
    storage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
        files: 5, // Max 5 files
    },
}).array('images', 5);
// Create multer instance for profile picture
exports.uploadProfilePicture = (0, multer_1.default)({
    storage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB max file size for profile pictures
    },
}).single('profilePicture');
// Create multer instance for dog photos
exports.uploadDogPhoto = (0, multer_1.default)({
    storage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 3 * 1024 * 1024, // 3MB max file size for dog photos
    },
}).single('dogPhoto');
/**
 * Get the URL for an uploaded file
 */
const getFileUrl = (filename, baseUrl) => {
    return `${baseUrl}/uploads/${filename}`;
};
exports.getFileUrl = getFileUrl;
/**
 * Delete uploaded file
 */
const deleteFile = (filename) => {
    return new Promise((resolve, reject) => {
        const filepath = path_1.default.join(uploadsDir, filename);
        fs_1.default.unlink(filepath, (err) => {
            if (err && err.code !== 'ENOENT') {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
};
exports.deleteFile = deleteFile;
exports.default = { uploadSingle: exports.uploadSingle, uploadMultiple: exports.uploadMultiple, uploadProfilePicture: exports.uploadProfilePicture, uploadDogPhoto: exports.uploadDogPhoto };
//# sourceMappingURL=upload.js.map
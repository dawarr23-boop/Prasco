import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Request } from 'express';

// Upload directories
export const UPLOAD_PATHS = {
  BASE: path.join(process.cwd(), 'uploads'),
  ORIGINALS: path.join(process.cwd(), 'uploads', 'originals'),
  THUMBNAILS: path.join(process.cwd(), 'uploads', 'thumbnails'),
  TEMP: path.join(process.cwd(), 'uploads', 'temp'),
};

// Ensure upload directories exist
Object.values(UPLOAD_PATHS).forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  IMAGE: 10 * 1024 * 1024, // 10 MB
  VIDEO: 100 * 1024 * 1024, // 100 MB
  DOCUMENT: 5 * 1024 * 1024, // 5 MB
  PRESENTATION: 50 * 1024 * 1024, // 50 MB für PowerPoint
};

// Allowed MIME types
export const ALLOWED_MIME_TYPES = {
  IMAGE: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  VIDEO: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  DOCUMENT: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  PRESENTATION: [
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.oasis.opendocument.presentation',
  ],
};

// Get all allowed MIME types
export const ALL_ALLOWED_MIME_TYPES = [
  ...ALLOWED_MIME_TYPES.IMAGE,
  ...ALLOWED_MIME_TYPES.VIDEO,
  ...ALLOWED_MIME_TYPES.DOCUMENT,
  ...ALLOWED_MIME_TYPES.PRESENTATION,
];

// Generate unique filename
const generateFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(originalName).toLowerCase();
  return `${timestamp}-${randomString}${ext}`;
};

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, UPLOAD_PATHS.TEMP);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const uniqueFilename = generateFileName(file.originalname);
    cb(null, uniqueFilename);
  },
});

// File filter function
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check MIME type
  if (!ALL_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error(`Dateityp nicht erlaubt: ${file.mimetype}`));
  }

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.svg',
    '.mp4',
    '.webm',
    '.ogg',
    '.mov',
    '.pdf',
    '.doc',
    '.docx',
    '.pptx',
    '.ppt',
    '.odp',
  ];

  if (!allowedExtensions.includes(ext)) {
    return cb(new Error(`Dateiendung nicht erlaubt: ${ext}`));
  }

  cb(null, true);
};

// Multer configuration for image uploads
export const uploadImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.IMAGE,
    files: 1,
  },
});

// Multer configuration for video uploads
export const uploadVideo = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.VIDEO,
    files: 1,
  },
});

// Multer configuration for document uploads
export const uploadDocument = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.DOCUMENT,
    files: 1,
  },
});

// Generic upload (auto-detect type)
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.VIDEO, // Use largest limit
    files: 1,
  },
});

// Multer configuration for multiple file uploads
export const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.IMAGE,
    files: 10, // Max 10 files
  },
});

// Helper to get file size limit based on MIME type
export const getFileSizeLimit = (mimeType: string): number => {
  if (ALLOWED_MIME_TYPES.IMAGE.includes(mimeType)) {
    return FILE_SIZE_LIMITS.IMAGE;
  }
  if (ALLOWED_MIME_TYPES.VIDEO.includes(mimeType)) {
    return FILE_SIZE_LIMITS.VIDEO;
  }
  if (ALLOWED_MIME_TYPES.DOCUMENT.includes(mimeType)) {
    return FILE_SIZE_LIMITS.DOCUMENT;
  }
  return FILE_SIZE_LIMITS.IMAGE;
};

// Helper to check if file is an image
export const isImage = (mimeType: string): boolean => {
  return ALLOWED_MIME_TYPES.IMAGE.includes(mimeType);
};

// Helper to check if file is a video
export const isVideo = (mimeType: string): boolean => {
  return ALLOWED_MIME_TYPES.VIDEO.includes(mimeType);
};

// Helper to check if file is a document
export const isDocument = (mimeType: string): boolean => {
  return ALLOWED_MIME_TYPES.DOCUMENT.includes(mimeType);
};

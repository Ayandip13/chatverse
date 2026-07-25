import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import fs from 'fs';
import path from 'path';

const isCloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'mock_cloud' &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_KEY !== 'mock_key';

let storage: multer.StorageEngine;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      return {
        folder: 'chatverse/avatars',
        format: 'jpeg',
        public_id: `${req.user?.userId}-${Date.now()}`,
        transformation: [{ width: 500, height: 500, crop: 'limit' }],
      };
    },
  });
} else {
  const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.jpg';
      cb(null, `${req.user?.userId || 'avatar'}-${Date.now()}${ext}`);
    },
  });
}

export const uploadAvatar = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image type. Only image files are allowed.'));
    }
  }
});

export const deleteFromCloudinary = async (avatarUrl: string) => {
  try {
    // Extract public_id from URL: e.g. https://res.cloudinary.com/.../upload/v1234/chatverse/avatars/user-id.jpg
    const parts = avatarUrl.split('/');
    const fileWithExt = parts.pop();
    if (!fileWithExt) return;
    const publicId = `chatverse/avatars/${fileWithExt.split('.')[0]}`;
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
};

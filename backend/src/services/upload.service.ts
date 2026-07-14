import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'mock_cloud',
  api_key: process.env.CLOUDINARY_API_KEY || 'mock_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'mock_secret',
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'chatverse/avatars',
      format: 'jpeg', // supports promises as well
      public_id: `${req.user?.userId}-${Date.now()}`,
      transformation: [{ width: 500, height: 500, crop: 'limit' }] // basic compression
    };
  },
});

export const uploadAvatar = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/webp') {
      cb(null, true);
    } else {
      cb(new Error('Invalid image type. Only JPEG, PNG, WEBP allowed.'));
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

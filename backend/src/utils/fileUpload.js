import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary with your credentials from the .env file
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Configure Multer to use Cloudinary for storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'user_profiles', // The folder name in your Cloudinary account
    allowed_formats: ['jpg', 'jpeg', 'png'],
    // Transform the image to a square 200x200 thumbnail
    transformation: [{ width: 200, height: 200, crop: 'fill' }],
  },
});

// Create the Multer upload middleware
const upload = multer({ storage: storage });

export default upload;
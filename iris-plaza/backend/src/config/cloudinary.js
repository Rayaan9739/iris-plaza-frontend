const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dtcp8qhoy',
  api_key: process.env.CLOUDINARY_API_KEY || '951614482151491',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'IPGYB_3WXHmNlzpaMAGb01tvCVc',
});

/**
 * Create Cloudinary storage configuration for multer
 * @param {string} folder - Cloudinary folder path (e.g., 'iris-plaza/rooms')
 * @param {string} resourceType - Resource type: 'image', 'video', 'raw', or 'auto'
 * @param {Array} allowedFormats - Allowed file formats
 * @returns {CloudinaryStorage}
 */
const createCloudinaryStorage = (folder, resourceType = 'image', allowedFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'mp4', 'mov', 'webm']) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: folder,
      resource_type: resourceType,
      allowed_formats: allowedFormats,
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    },
  });
};

// Pre-configured storage options for different upload types
const storageOptions = {
  // Room images and videos uploaded by admin
  rooms: createCloudinaryStorage('iris-plaza/rooms', 'auto', ['jpg', 'jpeg', 'png', 'webp', 'mp4']),
  
  // Tenant documents (ID verification, etc.)
  documents: createCloudinaryStorage('iris-plaza/documents', 'auto', ['jpg', 'jpeg', 'png', 'pdf']),
  
  // Payment screenshots uploaded by tenants
  payments: createCloudinaryStorage('iris-plaza/payments', 'image', ['jpg', 'jpeg', 'png']),
  
  // Agreements (PDF files)
  agreements: createCloudinaryStorage('iris-plaza/agreement', 'raw', ['pdf']),
};

/**
 * Create multer upload middleware
 * @param {string} storageType - Key from storageOptions
 * @param {number} fileSizeLimit - Max file size in bytes
 */
const upload = (storageType, fileSizeLimit = 10 * 1024 * 1024) => {
  const storage = storageOptions[storageType];
  if (!storage) {
    throw new Error(`Invalid storage type: ${storageType}`);
  }
  
  return multer({
    storage: storage,
    limits: {
      fileSize: fileSizeLimit,
    },
  });
};

// Export configurations and utilities
module.exports = {
  cloudinary,
  storageOptions,
  upload,
  createCloudinaryStorage,
};

// Export individual upload middlewares for convenience
module.exports.roomsUpload = upload('rooms', 50 * 1024 * 1024); // 50MB for images/videos
module.exports.documentsUpload = upload('documents', 10 * 1024 * 1024); // 10MB for documents
module.exports.paymentsUpload = upload('payments', 5 * 1024 * 1024); // 5MB for payment screenshots
module.exports.agreementsUpload = upload('agreements', 10 * 1024 * 1024); // 10MB for PDFs

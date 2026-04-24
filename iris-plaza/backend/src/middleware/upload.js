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
 * @param {string} folder - Cloudinary folder path (e.g., 'rental-platform/room-images')
 * @param {string} resourceType - Resource type: 'image', 'video', 'raw', or 'auto'
 * @returns {CloudinaryStorage}
 */
const createCloudinaryStorage = (folder, resourceType = 'image') => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: folder,
      resource_type: resourceType,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'mp4', 'mov', 'webm'],
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    },
  });
};

// Pre-configured storage options for different upload types
const storageOptions = {
  // Room images and videos uploaded by admin
  rooms: createCloudinaryStorage('iris-plaza/rooms', 'auto'),
  
  // Tenant documents (ID verification, etc.)
  documents: createCloudinaryStorage('iris-plaza/documents', 'auto'),
  
  // Payment screenshots uploaded by tenants
  payments: createCloudinaryStorage('iris-plaza/payments', 'image'),
  
  // Agreements (PDF files)
  agreements: createCloudinaryStorage('iris-plaza/agreement', 'raw'),
};

/**
 * Create multer upload middleware
 * @param {string} storageType - Key from storageOptions
 * @param {number} fileSizeLimit - Max file size in bytes
 */
const createUpload = (storageType, fileSizeLimit = 10 * 1024 * 1024) => {
  const storage = storageOptions[storageType];
  if (!storage) {
    throw new Error(`Invalid storage type: ${storageType}`);
  }
  
  return multer({
    storage: storage,
    limits: {
      fileSize: fileSizeLimit,
    },
    fileFilter: (req, file, cb) => {
      // Allow common image and document formats
      const allowedMimes = [
        'image/jpeg',
        'image/png', 
        'image/gif',
        'image/webp',
        'application/pdf',
        'video/mp4',
        'video/quicktime',
        'video/webm',
      ];
      
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: jpg, png, gif, webp, pdf, mp4, mov, webm`), false);
      }
    },
  });
};

// Pre-create upload middlewares for each type
const roomsUpload = createUpload('rooms', 50 * 1024 * 1024); // 50MB for images/videos
const documentsUpload = createUpload('documents', 10 * 1024 * 1024); // 10MB for documents
const paymentsUpload = createUpload('payments', 5 * 1024 * 1024); // 5MB for payment screenshots
const agreementsUpload = createUpload('agreements', 10 * 1024 * 1024); // 10MB for PDFs

/**
 * Helper function to get the Cloudinary URL from upload result
 * @param {Object} file - Multer file object with Cloudinary info
 * @returns {string} Cloudinary secure URL
 */
const getCloudinaryUrl = (file) => {
  if (!file) return null;
  
  // Check if file has Cloudinary path info
  if (file.path) {
    return file.path; // Cloudinary URL
  }
  
  // Fallback to original path
  return file.secure_url || file.url || file.path;
};

/**
 * Upload buffer directly to Cloudinary
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - Cloudinary folder path
 * @param {string} resourceType - Resource type: 'image', 'video', 'raw', 'auto'
 * @returns {Promise<string>} Cloudinary secure URL
 */
const uploadBufferToCloudinary = async (buffer, folder, resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result.secure_url);
      }
    );
    
    const stream = require('stream').Readable.from(buffer);
    stream.pipe(uploadStream);
  });
};

/**
 * Upload base64 data to Cloudinary
 * @param {string} base64Data - Base64 encoded data
 * @param {string} folder - Cloudinary folder path
 * @returns {Promise<string>} Cloudinary secure URL
 */
const uploadBase64ToCloudinary = async (base64Data, folder) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      base64Data,
      {
        folder: folder,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result.secure_url);
      }
    );
  });
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - Resource type: 'image', 'video', 'raw', 'auto'
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, { resource_type: resourceType }, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    });
  });
};

module.exports = {
  roomsUpload,
  documentsUpload,
  paymentsUpload,
  agreementsUpload,
  getCloudinaryUrl,
  uploadBufferToCloudinary,
  uploadBase64ToCloudinary,
  deleteFromCloudinary,
  cloudinary,
  storageOptions,
};

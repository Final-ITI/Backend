import multer from "multer";
import ApiError from "./apiError.js";

export const fileType = {
  IMAGE: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
  PDF: ["application/pdf"],
  VIDEO: ["video/mp4", "video/mpeg"],
};

export const createUploadMiddleware = (allowedTypes) => {
  const multerStorage = multer.memoryStorage();

  const fileFilter = (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError("File type not supported.", 400), false);
    }
  };

  return multer({ storage: multerStorage, fileFilter });
};

// Examlpe usage
// export const uploadImage = createUploadMiddleware(fileType.IMAGE).single('image');
// export const uploadPdf = createUploadMiddleware(fileType.PDF).single('document');

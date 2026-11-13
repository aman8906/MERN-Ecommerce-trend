import fs from "fs/promises";
import { v2 as cloudinary } from "cloudinary";

/** Uploads a multer file to Cloudinary and removes the temp file. Returns the secure URL. */
export const uploadImage = async (file, folder = "trendify") => {
  try {
    const res = await cloudinary.uploader.upload(file.path, { resource_type: "image", folder });
    return res.secure_url;
  } finally {
    fs.unlink(file.path).catch(() => {});
  }
};

import { filterableField } from './../constants/searchableField';
import multer from "multer";

const multerUpload = multer({


  storage: multer.memoryStorage(), // Store file in memory (buffer)
  limits: {
    fileSize: 5 * 1024 * 1024, // Optional: limit file size (50MB in this example)
  },
}




);

export { multerUpload };

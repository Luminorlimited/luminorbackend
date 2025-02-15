import { filterableField } from './../constants/searchableField';
import multer from "multer";

const multerUpload = multer({


  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, 
  },
}




);

export { multerUpload };

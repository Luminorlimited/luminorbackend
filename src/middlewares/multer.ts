import { filterableField } from "./../constants/searchableField";
import multer from "multer";

const multerUpload = multer({
  storage: multer.memoryStorage(),
});

export { multerUpload };

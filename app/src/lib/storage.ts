import multer from "multer";
import path from "path";
import { assertAuthenticated } from "./assertions";

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    const uploadDir = path.join(
      __dirname,
      "../../public/uploads/profile-images/",
    );
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    assertAuthenticated(req);
    const ext = path.extname(file.originalname);
    cb(null, `pfp-${req.user.id}${ext}`);
  },
});
export const upload = multer({ storage });

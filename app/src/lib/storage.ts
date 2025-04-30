import multer from "multer";
import path from "path";
import { assertAuthenticated } from "./assertions";
import { randomBytes } from "crypto";

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    const uploadDir =
      process.env.UPLOAD_PATH ||
      path.join(__dirname, "../../public/uploads/profile-images/");
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    assertAuthenticated(req);
    const ext = path.extname(file.originalname);
    const randomString = randomBytes(8).toString("hex");
    cb(null, `pfp-${req.user.id}-${randomString}${ext}`);
  },
});

export const upload = multer({ storage });

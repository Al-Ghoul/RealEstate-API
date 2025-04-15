import nodemailer from "nodemailer";
import path from "path";
import pug, { Options } from "pug";
import { env } from "../env";

const transporter = nodemailer.createTransport({
  service: "gmail",
  secure: true,
  auth: {
    user: env.GMAIL_USER,
    pass: env.GMAIL_PASSWORD,
  },
});

export const renderPugTemplate = (
  templateName: "EMAIL_VERIFICATION" | "PASSWORD_RESET",
  data: Options & { user: Partial<User>; code: string },
) => {
  const templatePath = path.join(
    __dirname,
    "..",
    "lib/templates",
    `${templateName}.pug`,
  );
  return pug.renderFile(templatePath, data);
};

export const sendEmail = async (
  user: Partial<User>,
  subject: string,
  html: string,
) => {
  try {
    await transporter.sendMail({
      from: "RealEstate App",
      to: user.email,
      subject,
      html,
    });
    return true;
  } catch {
    return false;
  }
};

import nodemailer from "nodemailer";
import { env } from "../config/env.config";

const transporter = nodemailer.createTransport({
  service: "gmail",
  secure: true,
  auth: {
    user: env.GMAIL_USER,
    pass: env.GMAIL_PASSWORD,
  },
});

export const sendEmail = async (
  user: Pick<User, "email"> & Pick<Profile, "firstName">,
  subject: string,
  html: string,
) => {
  try {
    await transporter.sendMail({
      from: "RealEstate App",
      to: user.email as string,
      subject,
      html,
    });
    return true;
  } catch {
    return false;
  }
};

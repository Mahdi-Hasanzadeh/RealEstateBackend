import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();
export const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false, // use TLS for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS, // app password
    },
  });

  // optional: check connection
  await transporter.verify();
  console.log("Sending Email");
  await transporter.sendMail({
    from: `"My App" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
};

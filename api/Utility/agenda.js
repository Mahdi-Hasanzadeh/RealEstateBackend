// agenda.js
import Agenda from "agenda";
import { sendEmail } from "./emailSender.js";
import dotenv from "dotenv";
import cloudinary from "./cloudinaryConfig.js";

dotenv.config();

export const agenda = new Agenda({
  db: { address: process.env.CONNECTION_STRING },
});

// Define the job for sending verification email
agenda.define("send verification email", async (job) => {
  const { to, username, token } = job.attrs.data;

  const verificationLink = `${process.env.FRONTEND_URL}/#/verify-email?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; text-align: center;">
      <h2 style="color: #333;">Hello ${username},</h2>
      <p style="font-size: 16px; color: #555;">
        Thank you for signing up! Please verify your email by clicking the button below:
      </p>
      <a href="${verificationLink}"
         style="display:inline-block; padding: 12px 24px; margin: 16px 0; background-color:#667eea; color:#fff; text-decoration:none; border-radius:6px; font-weight:bold;">
        Verify Email
      </a>
      <p style="font-size: 14px; color: #777;">
        If you did not create an account, you can safely ignore this email.
      </p>
      <hr style="margin: 20px 0;" />
      <p style="font-size: 12px; color: #aaa;">My App &copy; ${new Date().getFullYear()}</p>
    </div>
  `;

  await sendEmail({
    to,
    subject: "Verify your account",
    html,
  });

  console.log("Verification email sent to:", to);
});

agenda.define("delete cloudinary image", async (job, done) => {
  const { publicId } = job.attrs.data;

  if (publicId == null) {
    console.log("publicId is not provided");
    return;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);

    console.log(`Attempted to delete ${publicId}:`, result);

    if (result.result === "ok" || result.result === "not found") {
      // Successfully deleted
      console.log(`Image ${publicId} deleted successfully.`);
      done();
    } else {
      // Failed: reschedule the job to try again in 1 minute
      console.warn(`Failed to delete ${publicId}, retrying in 1 minute.`);
      await job.schedule("in 1 minute").save();
      done(new Error("Retry deletion"));
    }
  } catch (err) {
    console.error(`Error deleting ${publicId}:`, err);
    // Retry in 1 minute
    await job.schedule("in 1 minute").save();
    done(err);
  }
});

// Export a function to start agenda
export const startAgenda = async () => {
  await agenda.start();
  console.log("Agenda started!");
};

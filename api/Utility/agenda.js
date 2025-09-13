// agenda.js
import Agenda from "agenda";
import { sendEmail } from "./emailSender.js";
import dotenv from "dotenv";
dotenv.config();

// console.log(process.env.CONNECTION_STRING);

export const agenda = new Agenda({
  db: { address: process.env.CONNECTION_STRING },
});

// Define the job
agenda.define("send verification email", async (job) => {
  const { to, username, token } = job.attrs.data;
  await sendEmail({
    to,
    subject: "Verify your account",
    html: `<p>Hi ${username},</p>
           <p>Please verify your email by clicking below:</p>
           <a href="${process.env.FRONTEND_URL}/#/verify-email?token=${token}">Verify Email</a>`,
  });
});

// Export a function to start agenda
export const startAgenda = async () => {
  await agenda.start();
  console.log("Agenda started!");
};

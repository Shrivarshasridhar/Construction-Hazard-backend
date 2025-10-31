


import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config(); 


const { EMAIL_USER, EMAIL_PASS, ALERT_EMAIL } = process.env;

if (!EMAIL_USER || !EMAIL_PASS || !ALERT_EMAIL) {
  console.error(
    "[emailService] Missing EMAIL_USER, EMAIL_PASS, or ALERT_EMAIL in .env"
  );
}


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  authMethod: "LOGIN", 
});


transporter
  .verify()
  .then(() => console.log("[emailService] SMTP ready"))
  .catch((err) =>
    console.error("[emailService] SMTP verify failed:", err.message || err)
  );


export async function sendAlertEmail(subject, text) {
  if (!EMAIL_USER || !ALERT_EMAIL) {
    console.warn(
      "[emailService] EMAIL_USER or ALERT_EMAIL not set - skipping email"
    );
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Construction Monitor" <${EMAIL_USER}>`,
      to: ALERT_EMAIL,
      subject,
      text,
    });
    console.log("[emailService] Alert email sent:", info.messageId);
  } catch (err) {
    console.error(
      "[emailService] Error sending email:",
      err.message || err,
      "\nCheck if your App Password is correct and 2FA is enabled for Gmail."
    );
  }
}

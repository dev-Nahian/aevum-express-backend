import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  try {
    // Create a transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.mailtrap.io",
      port: parseInt(process.env.SMTP_PORT) || 2525,
      secure: process.env.SMTP_SECURE === "true" || parseInt(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
      },
    });

    // Define email options
    const mailOptions = {
      from: process.env.FROM_EMAIL || "Maison Aevum <noreply@aevum.com>",
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    // Attempt to send email if SMTP credentials exist
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail(mailOptions);
      console.log(`Email successfully sent to ${options.to}`);
      return true;
    } else {
      console.log("-----------------------------------------");
      console.log(`[EMAIL SIMULATOR] To: ${options.to}`);
      console.log(`[EMAIL SIMULATOR] Subject: ${options.subject}`);
      console.log(`[EMAIL SIMULATOR] Message:\n${options.text}`);
      console.log("-----------------------------------------");
      return false;
    }
  } catch (error) {
    console.error(`Email sending failed: ${error.message}`);
    // Log the message anyway so developer doesn't get blocked
    console.log("-----------------------------------------");
    console.log(`[EMAIL ERROR FALLBACK] To: ${options.to}`);
    console.log(`[EMAIL ERROR FALLBACK] Subject: ${options.subject}`);
    console.log(`[EMAIL ERROR FALLBACK] Message:\n${options.text}`);
    console.log("-----------------------------------------");
    return false;
  }
};

export default sendEmail;

const nodemailer = require("nodemailer");

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Test connection
transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP connection error:", error);
  } else {
    console.log("✅ SMTP server is ready to send messages");
  }
});

// Send email function
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "Your App"}" <${
        process.env.SMTP_USER
      }>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""), // Fallback plain text
    };

    const info = await transporter.sendMail(mailOptions);
    // console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    // console.error("❌ Email sending failed:", error);
    throw error;
  }
};

module.exports = { sendEmail };

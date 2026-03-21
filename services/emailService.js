const nodemailer = require('nodemailer');

/**
 * Email Service — sends transactional emails via SMTP (Nodemailer).
 */

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send a generic email.
 */
const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: `"Flatemate" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
};

/**
 * Send password reset email with a reset link.
 */
const sendPasswordResetEmail = async (email, resetToken) => {
  // In production, this URL should point to your frontend reset page
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  await sendEmail({
    to: email,
    subject: 'Flatemate — Password Reset Request',
    html: `
      <h2>Password Reset</h2>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a>
      <p>This link expires in 15 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  });
};

/**
 * Send masked-number enquiry notification to the listing owner.
 * When a listing has masked phone, the enquirer's phone is emailed to the owner.
 */
const sendMaskedEnquiryNotification = async ({
  ownerEmail,
  ownerName,
  enquirerName,
  enquirerPhone,
  listingTitle,
}) => {
  await sendEmail({
    to: ownerEmail,
    subject: `Flatemate — Someone wants to contact you about "${listingTitle}"`,
    html: `
      <h2>New Enquiry Received</h2>
      <p>Hi ${ownerName},</p>
      <p><strong>${enquirerName}</strong> is interested in your listing "<strong>${listingTitle}</strong>".</p>
      <p>Their contact number: <strong>${enquirerPhone}</strong></p>
      <p>They have paid the enquiry fee and are ready to connect. You can call them back or wait for their call/chat.</p>
      <br>
      <p>— Team Flatemate</p>
    `,
  });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendMaskedEnquiryNotification,
};

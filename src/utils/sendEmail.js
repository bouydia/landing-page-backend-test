const nodemailer = require('nodemailer')
require('dotenv').config()

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: process.env.MAILTRAP_PORT,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
})

// Send reset password email
const sendResetPasswordEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.URL}/auth/reset-password/?token=${resetToken}`

  const mailOptions = {
    from: 'younessbouydia@gmail.com',
    to: email,
    subject: 'Set New Password Request',
    html: `
      <p>You requested a new password </p>
      <p>Please click on the following link to create your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log('Password reset email sent')
  } catch (error) {
    console.error('Error sending password reset email:', error)
    throw new Error('Failed to send password reset email')
  }
}

//send email to leads
const sendEmailToLeads = async (emails, from, subject, html) => {
  const mailOptions = {
    from,
    to: emails,
    subject,
    html,
  }
  try {
    await transporter.sendMail(mailOptions)
  } catch (error) {
    console.error('Error sending password reset email:', error)
    throw new Error('Failed to send  email to lead')
  }
}

//send email to leads
const sendEmailToLeadAfterSubscribe = async (email,name) => {
  const mailOptions = {
    from: 'younessbouydia@gmail.com',
    to: email,
    subject: 'Thank You for Joining Our Waitlist!',
    html: `
    <p>Dear ${name},</p>
    <p>Thank you for joining our waitlist. We're excited to have you on board!</p>
    <p>We'll keep you updated with the latest news and let you know as soon as we launch.</p>
    <p>If you have any questions or need further assistance, feel free to reply to this email.</p>
    <p>Best regards,</p>
    <p>The Team</p>
  `,
  }

  try {
    await transporter.sendMail(mailOptions)
  } catch (error) {
    console.error('Error sending password reset email:', error)
    throw new Error('Failed to send  email to lead')
  }
}


module.exports = {
  sendResetPasswordEmail,
  transporter,
  sendEmailToLeads,
  sendEmailToLeadAfterSubscribe,
}

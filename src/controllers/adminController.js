const bcrypt = require('bcryptjs')
const asyncHandler = require('express-async-handler')
const {
  Admin,
  validateLoginAdmin,
  validateDeleteAdmin,
  validateCreateAdmin,
} = require('../models/admin')
const Joi = require('joi')

const { generateToken } = require('../utils/generateToken')
const {
  generateResetToken,
  validateNewPassword,
} = require('../utils/resetPassword')
const {
  sendResetPasswordEmail,
  transporter,
  sendEmailToLeads,
} = require('../utils/sendEmail')
const { response } = require('express')
require('dotenv').config()

/**-------------------------------
 * @desc login admin
 * @route /api/v1/admin/login
 * @method POST
 * @access public
 *---------------------------------*/
module.exports.loginAdmin = asyncHandler(async (req, res) => {
  const error = validateLoginAdmin(req.body)
  if (error) return res.status(400).json({ message: error.details[0].message })

  const admin = await Admin.findOne({ email: req.body.email })
  if (!admin) {
    return res
      .status(404)
      .json({ statusCode: 404, message: "this email dosen't exist" })
  }

  const isPasswordMatch = await bcrypt.compare(
    req.body.password,
    admin.password
  )
  if (!isPasswordMatch) {
    return res
      .status(400)
      .json({ statusCode: 400, message: 'incorrect password' })
  }

  const token = await generateToken(admin.id, admin.email, admin.role)
  console.log(admin.id, admin.email, admin.role)

  return res.status(201).json({
    statusCode: 201,
    response: {
      _id: admin._id,
      email: admin.email,
      token,
    },
    message: 'login succssefuly',
  })
})

/**-------------------------------
 * @desc create admin
 * @route /api/v1/admin/
 * @method POST
 * @access private
 *---------------------------------*/
module.exports.createAdmin = asyncHandler(async (req, res) => {
  const { email } = req.body

  const error = validateCreateAdmin(req.body)
  if (error)
    return res
      .status(400)
      .json({ statusCode: 400, message: error.details[0].message })

  const existingAdmin = await Admin.findOne({ email })
  if (existingAdmin) {
    return res.status(400).json({
      statusCode: 400,
      message: 'An admin with this email already exists',
    })
  }
  const password = bcrypt.hashSync(process.env.PASSWORD, 10)
  const newAdmin = new Admin({ email, password })

  const resetToken = generateResetToken()
  const resetTokenExpiry = Date.now() + 3600000 // Token valid for 1 hour

  newAdmin.resetToken = resetToken
  newAdmin.resetTokenExpiry = resetTokenExpiry

  const savedAdmin = await newAdmin.save()

  // Send email with link to set password
  await sendResetPasswordEmail(savedAdmin.email, resetToken)

  res.status(201).json({
    statusCode: 201,
    response: {
      _id: savedAdmin._id,
      email: savedAdmin.email,
    },
    message:
      'Admin created successfully. A set password link has been sent to their email.',
  })
})

/**-------------------------------
 * @desc delete admin
 * @route /api/v1/admin/
 * @method DELETE
 * @access private only superadmin
 *---------------------------------*/
module.exports.deleteAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params

  const currentAdminId = req.admin.id // Assuming req.user.id contains the ID of the authenticated admin
  if (!id) {
    return res
      .status(400)
      .json({ statusCode: 400, message: 'ID parameter is required' })
  }

  if (id === currentAdminId) {
    return res
      .status(403)
      .json({ statusCode: 403, message: 'You cannot delete your own account' })
  }

  let admin = await Admin.findById(id)

  if (!admin) {
    return res
      .status(400)
      .json({ statusCode: 400, message: "This admin doesn't exist" })
  }
  await Admin.findByIdAndDelete(admin.id)

  return res
    .status(200)
    .json({
      statusCode: 403,
      response: { _id: admin.id },
      message: 'Admin deleted successfully',
    })
})

/**-------------------------------
 * @desc Request password reset
 * @route /api/v1/admin/reset-password
 * @method POST
 * @access private
 *---------------------------------*/

module.exports.requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body

  const admin = await Admin.findOne({ email })
  if (!admin) {
    return res.status(404).json({ statusCode: 404, message: 'Admin not found' })
  }

  const resetToken = generateResetToken()
  const resetTokenExpiry = Date.now() + 3600000 // Token valid for 1 hour

  admin.resetToken = resetToken
  admin.resetTokenExpiry = resetTokenExpiry
  await admin.save()

  try {
    console.log(admin.email)
    await sendResetPasswordEmail(admin.email, resetToken)
    res
      .status(200)
      .json({ statusCode: 200, message: 'Password reset link sent to email' })
  } catch (error) {
    admin.resetToken = undefined
    admin.resetTokenExpiry = undefined
    await admin.save()
    res.status(500).json({ message: error.message })
  }
})

/**-------------------------------
 * @desc Reset password
 * @route /api/v1/admin/reset-password
 * @method POST
 * @access public
 *---------------------------------*/
module.exports.resetPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body
  const { token } = req.query

  const admin = await Admin.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() },
  })

  if (!admin) {
    return res
      .status(400)
      .json({ statusCode: 400, message: 'Invalid or expired reset token' })
  }

  const { error } = validateNewPassword({ password: newPassword })
  if (error) {
    return res
      .status(400)
      .json({ statusCode: 400, message: error.details[0].message })
  }

  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(newPassword, salt)

  admin.password = hashedPassword
  admin.resetToken = undefined
  admin.resetTokenExpiry = undefined
  await admin.save()

  res
    .status(200)
    .json({ statusCode: 200, message: 'Password has been reset successfully' })
})

/**-------------------------------
 * @desc email leads
 * @route /api/v1/admin/send email to the leads
 * @method POST
 * @access private
 *---------------------------------*/
module.exports.emailUsrers = asyncHandler(async (req, res) => {
  const schema = Joi.object({
    emails: Joi.array().items(Joi.string().email()).min(1).required(),
    from: Joi.string().email().required(),
    subject: Joi.string().required(),
    html: Joi.string().required(),
  })

  const { error, value } = schema.validate(req.body)

  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }
  const { emails, from, subject, html } = value
  await sendEmailToLeads(emails, from, subject, html)
  res.status(200).json({
    statusCode: 200,
    message: `Emails sent to ${emails.length} lead(s)`,
  })
})
/**-------------------------------
 * @desc get alla dmins
 * @route /api/v1/admin/
 * @method GET
 * @access private
 *---------------------------------*/
module.exports.getAllAdmins = asyncHandler(async (req, res) => {
  const admins = await Admin.find().select('-password')
  res.status(200).json(admins)
})

/**-------------------------------
 * @desc update password
 * @route /api/v1/admin/update-password
 * @method POST
 * @access private
 *---------------------------------*/
module.exports.updatePassword = asyncHandler(async (req, res) => {
  const { adminId, oldPassword, newPassword } = req.body

  const admin = await Admin.findById(adminId)
  if (!admin) {
    return res.status(404).json({ statusCode: 400, message: 'Admin not found' })
  }

  const isMatch = await bcrypt.compare(oldPassword, admin.password)
  if (!isMatch) {
    return res
      .status(400)
      .json({ statusCode: 400, message: 'Incorrect old password' })
  }

  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(newPassword, salt)

  admin.password = hashedPassword
  await admin.save()

  res
    .status(200)
    .json({ statusCode: 200, message: 'Password updated successfully' })
})
/**-------------------------------
 * @desc update admin role
 * @route /api/v1/admin/:id
 * @method POST
 * @access private
 *---------------------------------*/
module.exports.updateAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { role } = req.body
  if (!role) {
    res.status(400).json({ statusCode: 400, message: 'role is required' })
  }
  const update = { role: role }

  const updqtedAdmin = await Admin.findByIdAndUpdate(id, update)
  res
    .status(200)
    .json({
      statusCode: 200,
      response: { updqtedAdmin },
      message: 'Admin updated successfully',
    })
})

/**-------------------------------
 * @desc get admin detail
 * @route /api/v1/admin/:id
 * @method GET
 * @access private
 *---------------------------------*/
module.exports.getAdminDetails = asyncHandler(async (req, res) => {
  const { id } = req.params
  const admin = await Admin.findById(id).select('-password')
  if (!admin) {
    res
      .status(404)
      .json({ statusCode: 404, message: "Admin with this does'nt exist" })
  }
  res
    .status(201)
    .json({ statusCode: 200, response: admin, message: 'admin details' })
})

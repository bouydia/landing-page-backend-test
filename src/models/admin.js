const mongoose = require('mongoose')
const Joi = require('joi')
const { Schema } = mongoose

const AdminSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    password: {
      required: true,
      type: String,
      trim: true,
      minlength: 8,
    },
    resetToken: String,
    resetTokenExpiry: Date,
    role: {
      type: String,
      enum: ['moderator', 'superadmin'], // Only allow these two values
      required: true, // Make the role field required
      default: 'moderator', // Default value for role
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.id
      },
    },
    toObject: { virtuals: true },
    versionKey: false,
  }
)

const Admin = mongoose.model('Admin', AdminSchema)

function validateLoginAdmin(obj) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(100).required().email(),
    password: Joi.string().min(8).required(),
  })

    const { error } = schema.validate(obj)
    return error
}
function validateCreateAdmin(obj) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(100).required().email(),
    role: Joi.string().valid('moderator', 'superadmin').required(),
  })

  const { error } = schema.validate(obj)
  return error
}
function validateDeleteAdmin(obj) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(100).required().email(),
  })

    const { error } = schema.validate(obj)
    return error
}

module.exports = {
  Admin,
  validateLoginAdmin,
  validateDeleteAdmin,
  validateCreateAdmin,
}

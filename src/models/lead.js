const mongoose = require('mongoose')
const Joi = require('joi')
const { Schema } = mongoose

const LeadSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 30,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    problems: {
      type: String,
      required: false,
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

const Lead = mongoose.model('Lead', LeadSchema)

function validateLead(obj) {
  const schema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().min(5).max(50).required().email(),
    phoneNumber: Joi.string()
      .regex(/^\+?[0-9]{10,15}$/)
      .required(),
    problems: Joi.optional(),
  })

  return schema.validate(obj)
}

module.exports = {
  Lead,
  validateLead,
}

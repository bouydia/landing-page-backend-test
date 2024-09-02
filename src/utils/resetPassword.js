const crypto = require('crypto')
const Joi = require('joi')

// Generate reset token
const generateResetToken = () => {
  return crypto.randomBytes(20).toString('hex');
};

// Validate new password
function validateNewPassword(obj) {
  const schema = Joi.object({
    password: Joi.string().min(8).required()
  });

  return schema.validate(obj);
}

module.exports = {
  generateResetToken,
  validateNewPassword,
}
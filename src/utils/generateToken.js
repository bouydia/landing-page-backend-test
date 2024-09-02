const jwt = require('jsonwebtoken')

module.exports.generateToken = async (id, email, role) => {
  const token = jwt.sign(
    {
      id,
      email,
      role,
    },
    process.env.SECRET
  )
  return token
}

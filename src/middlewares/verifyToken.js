const jwt = require('jsonwebtoken')

function verifyToken(req, res, next) {
  const authToken = req.headers.authorization
  if (authToken) {
    const token = authToken.split(' ')[1]
    try {
      const decodedPayload = jwt.verify(token, process.env.SECRET)
      req.admin = decodedPayload
      next()
    } catch (error) {
      return res
        .status(401)
        .json({ statusCode: 401, message: 'invalide token,access denied' })
    }
  } else {
    // 401 Unautorize
    return res
      .status(401)
      .json({ statusCode: 400, message: 'no token provided,access denied' })
  }
}


function verifyTokenAndSuperAdmin(req, res, next) {
  verifyToken(req, res, () => {
    const { role } = req.admin
    if (role === "moderator") {
      // 403 forbidden
      return res
        .status(403)
        .json({ statusCode: 403, message: 'not allowed,only super admin' })
    }
    next()
  })
}


module.exports = {
  verifyToken,
  verifyTokenAndSuperAdmin,
}

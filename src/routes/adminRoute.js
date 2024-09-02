const express = require('express')
const {
  loginAdmin,
  resetPassword,
  requestPasswordReset,
  emailUsrers,
  createAdmin,
  deleteAdmin,
  getAdminPassword,
  updatePassword,
  getAllAdmins,
} = require('../controllers/adminController')
const { verifyToken, verifyTokenAndSuperAdmin } = require('../middlewares/verifyToken')
const router = express.Router()

router.route('/').post(verifyToken, verifyTokenAndSuperAdmin, createAdmin).get(verifyToken,getAllAdmins)
router.route('/:id').delete(verifyToken, verifyTokenAndSuperAdmin, deleteAdmin)

router.route('/login').post(loginAdmin)
router.post('/request-reset', requestPasswordReset)
router.post('/reset-password', resetPassword)
router.post('/send-email',verifyToken, emailUsrers)
router.post('/update-password', verifyToken,updatePassword )


module.exports = router

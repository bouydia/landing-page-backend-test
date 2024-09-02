const express = require('express')
const {
  subscribeLead,
  getAllLeads,
  downloadAllLeads,
  deleteLead,
} = require('../controllers/leadController')
const { verifyToken, verifyTokenAndSuperAdmin } = require('../middlewares/verifyToken')
const { validObjectId } = require('../middlewares/validateObjectId')

const router = express.Router()

router.route('/').post(subscribeLead).get(verifyToken, getAllLeads)


router.route('/:id').delete(validObjectId,verifyToken,verifyTokenAndSuperAdmin, deleteLead)
router
  .route('/download')
  .get(verifyToken, downloadAllLeads) 
module.exports = router

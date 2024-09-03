const asyncHandler = require('express-async-handler')
const { validateLead, Lead } = require('../models/lead')
const path = require('path')
const fs = require('fs')
const moment = require('moment')

const {
  generateCSV,
  generateExcel,
  filterData,
} = require('../utils/fileDownload')
const { sendToZohoCRM } = require('../utils/sendLeadsToZoho')
const { sendEmailToLeadAfterSubscribe } = require('../utils/sendEmail')
const { response } = require('express')

/**-------------------------------
 * @desc   add lead to waitlist
 * @route  /api/v1/leads/
 * @method POST
 * @access public
 *---------------------------------*/
module.exports.subscribeLead = asyncHandler(async (req, res) => {
  const { error } = validateLead(req.body)
  if (error)
    return res
      .status(400)
      .json({ statusCode: 400, message: error.details[0].message })

  let lead = await Lead.findOne({ email: req.body.email })
  if (lead)
    return res
      .status(400)
      .json({ statusCode: 400, message: 'lead already exist ' })

  const newLead = new Lead({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    phoneNumber: req.body.phoneNumber,
    problems: req.body.problems,
  })
  const zohoResponse = await sendToZohoCRM(newLead)
  console.log('Lead added to Zoho CRM:', zohoResponse.data)

  const savedLed = await newLead.save()

  await sendEmailToLeadAfterSubscribe(req.body.email, req.body.lastName)

  res
    .status(201)
    .json({
      statusCode: 200,
      response: savedLed,
      message: 'You have been successfully registered in the whitelist',
    })
})
/**-------------------------------
 * @desc   add lead to waitlist
 * @route  /api/v1/leads/:id
 * @method DELETE
 * @access private
 *---------------------------------*/
module.exports.deleteLead = asyncHandler(async (req, res) => {
  const { id } = req.params

  if (!id) {
    return res
      .status(400)
      .json({ statusCode: 400, message: 'ID parameter is required' })
  }

  let lead = await Lead.findById(id)

  if (!lead) {
    return res.status(404).json({ statusCode: 400, message: 'Lead not found' })
  }
  await Lead.findByIdAndDelete(id)
  console.log('Lead deleted:', lead)
  return res
    .status(200)
    .json({ statusCode: 200, response: { _id:id} ,message: 'Lead has been deleted' })
})
/**-------------------------------
 * @desc   get all leads and filter them
 * @route  /api/v1/leads/
 * @method POST
 * @access private
 *---------------------------------*/
module.exports.getAllLeads = asyncHandler(async (req, res) => {
  let leads
  const { firstName, lastName, email, phoneNumber } = req.query
  let query = {}

  if (firstName) query.firstName = { $regex: firstName, $options: 'i' }
  if (lastName) query.lastName = { $regex: lastName, $options: 'i' }
  if (email) query.email = { $regex: email, $options: 'i' }
  if (phoneNumber) query.phoneNumber = { $regex: phoneNumber, $options: 'i' }

  if (firstName || lastName || email || phoneNumber) {
    leads = await Lead.find(query)
  } else {
    leads = await Lead.find()
  }

  return res.json({ statusCode: 200 ,response:leads})
})

/**-------------------------------
 * @desc   download  lead list csv or xlsx format
 * @route  /api/v1/leads/download
 * @method GET
 * @access private only login admin
 *---------------------------------*/
module.exports.downloadAllLeads = asyncHandler(async (req, res) => {
  const { format = 'csv', fields, startDate, endDate } = req.query
  let fileName, filePath, contentType

  let dateFilter = {}

  if (startDate || endDate) {
    dateFilter.createdAt = {}

    if (startDate) {
      const start = moment(startDate).startOf('day')
      if (!start.isValid()) {
        return res.status(400).json({statusCode: 400, message: 'Invalid start date' })
      }
      dateFilter.createdAt.$gte = start.toDate()
    }

    if (endDate) {
      const end = moment(endDate).endOf('day')
      if (!end.isValid()) {
        return res
          .status(400)
          .json({ statusCode: 400, message: 'Invalid end date' })
      }
      dateFilter.createdAt.$lte = end.toDate()
    }
  }
  const data = await Lead.find(dateFilter).lean()
  const fieldsArr = fields ? fields.split(',') : Object.keys(data[0])

  if (format === 'csv') {
    const csv = generateCSV(filterData(data, fieldsArr), fieldsArr)
    fileName = 'data.csv'
    filePath = path.join(__dirname, fileName)
    fs.writeFileSync(filePath, csv)
    contentType = 'text/csv'
  } else if (format === 'excel') {
    const workbook = generateExcel(data, fieldsArr)
    fileName = 'data.xlsx'
    filePath = path.join(__dirname, fileName)
    await workbook.xlsx.writeFile(filePath)
    contentType =
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  } else {
    return res.status(400).json({ statusCode: 400, message:'Invalid format specified'})
  }

  res.setHeader('Content-Disposition', `attachment; filename=${fileName}`)
  res.setHeader('Content-Type', contentType)

  res.download(filePath, fileName, err => {
    fs.unlinkSync(filePath)
    if (err) {
      console.error('Error downloading file:', err)
    }
  })
})

const { Parser } = require('@json2csv/plainjs')
const excel = require('exceljs')

const filterData = (data, fields) => {
  return data.map(doc => {
    let obj = {}
    fields.forEach(field => {
      if (doc.hasOwnProperty(field)) {
        obj[field] = doc[field]
      }
    })
    return obj
  })
}

const generateCSV = (data, fields) => {
  const json2csvParser = new Parser({ fields })
  return json2csvParser.parse(data)
}

const generateExcel = (data, fields) => {
  const workbook = new excel.Workbook()
  const worksheet = workbook.addWorksheet('Data')

  worksheet.columns = fields.map(field => ({ header: field, key: field }))
  worksheet.addRows(filterData(data, fields))

  return workbook
}


module.exports = {
  filterData,
  generateCSV,
  generateExcel,
}
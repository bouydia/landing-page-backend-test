const mongoose = require('mongoose')

async function connectToDatabase() {
  try {
    mongoose.set('strictQuery', false)
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Database connected successfully')
  } catch (error) {
    console.error('Failed to connect to the database:', error.message)
    throw error // Re-throw the error for the caller to handle
  }
}

module.exports = connectToDatabase

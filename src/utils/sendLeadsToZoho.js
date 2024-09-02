const axios = require('axios')
require('dotenv').config()

let zohoAccessToken = null
let tokenExpirationTime = null

const generateZohoAccessToken = async () => {
  try {
    const refreshToken = process.env.ZOHO_REFRESH_TOKEN
    const clientId = process.env.ZOHO_CLIENT_ID
    const clientSecret = process.env.ZOHO_CLIENT_SECRET
    const accountsDomain =
      process.env.ZOHO_ACCOUNTS_DOMAIN || 'https://accounts.zoho.com'

    const response = await axios.post(
      `${accountsDomain}/oauth/v2/token`,
      null,
      {
        params: {
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
        },
      }
    )

    zohoAccessToken = response.data.access_token
    const expiresIn = response.data.expires_in * 1000 // Convert to ms
    tokenExpirationTime = Date.now() + expiresIn

    return zohoAccessToken
  } catch (error) {
    console.error('Error generating Zoho access token:', error.message)
    throw new Error('Failed to generate Zoho access token')
  }
}

const getZohoAccessToken = async () => {
  if (!zohoAccessToken || Date.now() >= tokenExpirationTime) {
    return generateZohoAccessToken()
  }
  return zohoAccessToken
}

const sendToZohoCRM = async lead => {
  try {
    const zohoAccessToken = await getZohoAccessToken()
    const zohoApiUrl = 'https://www.zohoapis.com/crm/v2/Leads'
    const data = {
      data: [
        {
          First_Name: lead.firstName,
          Last_Name: lead.lastName,
          Email: lead.email,
          Phone: lead.phoneNumber,
          Description: lead.problems, // Assuming 'problems' corresponds to a 'Description' field in Zoho CRM
        },
      ],
      trigger: ['approval', 'workflow', 'blueprint'],
    }

    // Send POST request to Zoho CRM
    const response = await axios.post(zohoApiUrl, data, {
      headers: {
        Authorization: `Zoho-oauthtoken ${zohoAccessToken}`,
        'Content-Type': 'application/json',
      },
    })

    return response
  } catch (error) {
    console.error(
      'Error adding lead to Zoho CRM:',
      error.response ? error.response.data : error.message
    )
    throw new Error('Failed to add lead to Zoho CRM')
  }
}

module.exports = { sendToZohoCRM }
